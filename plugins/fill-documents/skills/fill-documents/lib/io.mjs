import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { FillError, requireCondition } from './errors.mjs';
import { assertDirectory, createOwnedFile, cleanupOwned } from './owned-paths.mjs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export async function readDocument(filePath) {
  let handle;
  try {
    handle = await fs.open(filePath, 'r');
    const info = await handle.stat();
    requireCondition(info.isFile() && info.size > 0 && info.size <= 50 * 1024 * 1024, 'E_INPUT', '문서는 50 MiB 이하의 일반 파일이어야 합니다.');
    const bytes = await handle.readFile();
    requireCondition(bytes.length <= 50 * 1024 * 1024, 'E_INPUT', '문서 크기 제한을 초과했습니다.');
    return bytes;
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_IO', '문서 파일을 읽을 수 없습니다.', { path: path.resolve(filePath) });
  } finally {
    await handle?.close();
  }
}

export async function readJson(filePath) {
  const bytes = await readDocument(filePath);
  requireCondition(bytes.length <= 2 * 1024 * 1024, 'E_INPUT', 'JSON 입력은 2 MiB 이하여야 합니다.');
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '')); }
  catch { throw new FillError('E_INPUT', '올바른 UTF-8 JSON 파일이 아닙니다.'); }
}

// The hard-link operation is the commit point. It never replaces an existing file.
export async function publishNewFile(output, bytes, operations = fs) {
  let parent;
  try { parent = await operations.realpath(path.dirname(path.resolve(output))); }
  catch { throw new FillError('E_IO', '출력 폴더가 존재하고 접근 가능한지 확인하세요.'); }
  const destination = path.join(parent, path.basename(output));
  const temporary = path.join(parent, `.fill-documents-${randomUUID()}.tmp`);
  const identity = await operations.lstat(parent);
  let committed = false;
  let failure;
  const owned = [];
  const warnings = [];
  try {
    await assertDirectory(parent, identity, operations);
    await createOwnedFile(temporary, bytes, owned, operations);
    await assertDirectory(parent, identity, operations);
    await operations.link(temporary, destination);
    committed = true;
    try { await assertDirectory(parent, identity, operations); }
    catch { warnings.push({ code: 'W_OUTPUT_LOCATION_CHANGED', path: destination, location: 'path-at-creation' }); }
  } catch (error) {
    failure = error instanceof FillError ? error : error.code === 'EEXIST'
      ? new FillError('E_OUTPUT_EXISTS', '결과 파일이 이미 있습니다. 다른 이름을 지정하세요.', { path: destination })
      : new FillError('E_IO', '새 결과 파일을 안전하게 게시하지 못했습니다. 기존 파일은 교체하지 않았습니다.');
  } finally {
    warnings.push(...await cleanupOwned(owned, operations, committed));
  }
  if (failure) { if (warnings.length) failure.details = { ...failure.details, warnings }; throw failure; }
  return { path: destination, warnings };
}
