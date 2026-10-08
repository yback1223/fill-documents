import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FillError, requireCondition } from './errors.mjs';
import { readDocument, readJson, sha256 } from './io.mjs';
import { normalizeFields } from './fields.mjs';
import { assertDirectory, createOwnedDirectory, createOwnedFile, cleanupOwned } from './owned-paths.mjs';

export const defaultLibrary = () => path.join(os.homedir(), '.local', 'share', 'fill-documents', 'templates');
const validId = id => typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id.length <= 64;

export function validateManifest(data) {
  requireCondition(data?.schemaVersion === 1 && validId(data.id) && typeof data.title === 'string' && data.title.trim() && ['hwp', 'hwpx', 'docx', 'pdf'].includes(data.format), 'E_INPUT', '템플릿 manifest의 필수 정보가 유효하지 않습니다.');
  requireCondition(data.file === `template.${data.format}` && /^[a-f0-9]{64}$/.test(data.sha256), 'E_INPUT', '템플릿 파일명 또는 해시가 유효하지 않습니다.');
  const fields = normalizeFields(data.fields);
  requireCondition(fields.length > 0, 'E_FIELDS', '명시적인 입력 필드가 없는 서식입니다.');
  return { ...data, fields };
}

async function readEntry(directory, origin) {
  const manifest = validateManifest(await readJson(path.join(directory, 'manifest.json')));
  const filePath = path.join(directory, manifest.file);
  return { manifest, filePath, origin };
}

export async function listTemplates(skillRoot, library = defaultLibrary()) {
  const entries = [];
  const warnings = [];
  for (const [directory, origin] of [[path.join(skillRoot, 'assets', 'templates'), 'bundled'], [library, 'user']]) {
    let children;
    try { children = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      if (child.name.startsWith('.') || !child.isDirectory()) continue;
      try {
        try { await fs.lstat(path.join(directory, child.name, 'manifest.json')); }
        catch (error) { if (error.code === 'ENOENT') continue; throw error; }
        const entry = await readEntry(path.join(directory, child.name), origin);
        requireCondition(entry.manifest.id === child.name, 'E_INPUT', '템플릿 폴더명과 ID가 다릅니다.');
        requireCondition(!entries.some(item => item.manifest.id === entry.manifest.id), 'E_INPUT', '중복 템플릿 ID가 있습니다.');
        entries.push(entry);
      } catch (error) {
        warnings.push({ code: 'W_INVALID_TEMPLATE', id: child.name, reason: error.code ?? 'E_IO' });
      }
    }
  }
  return { entries, warnings };
}

export async function findTemplate(id, skillRoot, library) {
  requireCondition(validId(id), 'E_INPUT', '올바른 템플릿 ID 또는 문서 경로를 지정하세요.');
  const { entries } = await listTemplates(skillRoot, library);
  const item = entries.find(entry => entry.manifest.id === id);
  requireCondition(item, 'E_INPUT', '템플릿을 찾지 못했습니다.', { id });
  const bytes = await readDocument(item.filePath);
  requireCondition(sha256(bytes) === item.manifest.sha256, 'E_TEMPLATE_CHANGED', '등록 후 템플릿 파일이 변경됐습니다. 다시 등록하세요.', { id });
  return { ...item, bytes };
}

export async function registerTemplate({ filePath, id, title, skillRoot, library = defaultLibrary(), inspectDocument, operations = fs }) {
  requireCondition(validId(id) && typeof title === 'string' && title.trim().length > 0 && title.length <= 200, 'E_INPUT', '템플릿 ID와 제목을 확인하세요.');
  const { entries } = await listTemplates(skillRoot, library);
  requireCondition(!entries.some(entry => entry.manifest.id === id), 'E_OUTPUT_EXISTS', '같은 ID의 템플릿이 이미 있습니다.', { id });
  const bytes = await readDocument(filePath);
  const info = await inspectDocument(bytes, { skillRoot, filePath });
  const fields = normalizeFields(info.fields);
  requireCondition(fields.length > 0, 'E_FIELDS', '입력 필드가 없는 문서는 자동 채우기 템플릿으로 등록할 수 없습니다.');
  const manifest = validateManifest({ schemaVersion: 1, id, title: title.trim(), category: 'custom', version: '1.0.0', format: info.format, file: `template.${info.format}`, sha256: sha256(bytes), source: 'user', license: 'user-supplied', fields });
  await operations.mkdir(library, { recursive: true });
  const parent = await operations.realpath(library);
  const reservation = path.join(parent, `.${id}.lock`);
  const destination = path.join(parent, id);
  const parentIdentity = await operations.lstat(parent);
  const owned = [];
  let committed = false;
  let failure;
  const warnings = [];
  try {
    await assertDirectory(parent, parentIdentity, operations);
    const reservationIdentity = await createOwnedDirectory(reservation, owned, operations);
    const staging = path.join(reservation, 'staging');
    const stagingIdentity = await createOwnedDirectory(staging, owned, operations);
    const fileIdentity = await createOwnedFile(path.join(staging, manifest.file), bytes, owned, operations);
    const manifestIdentity = await createOwnedFile(path.join(staging, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, owned, operations);
    const written = await operations.readFile(path.join(staging, manifest.file));
    requireCondition(sha256(written) === manifest.sha256, 'E_IO', '등록 파일의 해시 검증에 실패했습니다.');
    validateManifest(JSON.parse(await operations.readFile(path.join(staging, 'manifest.json'), 'utf8')));
    await assertDirectory(parent, parentIdentity, operations);
    await assertDirectory(reservation, reservationIdentity, operations);
    await assertDirectory(staging, stagingIdentity, operations);
    const destinationIdentity = await createOwnedDirectory(destination, owned, operations, 'published');
    await assertDirectory(destination, destinationIdentity, operations);
    await operations.link(path.join(staging, manifest.file), path.join(destination, manifest.file));
    owned.push({ path: path.join(destination, manifest.file), identity: fileIdentity, directory: false, scope: 'published' });
    await assertDirectory(destination, destinationIdentity, operations);
    await operations.link(path.join(staging, 'manifest.json'), path.join(destination, 'manifest.json'));
    owned.push({ path: path.join(destination, 'manifest.json'), identity: manifestIdentity, directory: false, scope: 'published' });
    committed = true;
  } catch (error) {
    failure = error instanceof FillError ? error : error.code === 'EEXIST'
      ? new FillError('E_OUTPUT_EXISTS', '템플릿 ID가 사용 중입니다. 중단된 등록의 잠금은 확인 후 수동 정리하세요.', { id, reservation })
      : new FillError('E_IO', '템플릿을 등록하지 못했습니다. 기존 라이브러리는 교체하지 않았습니다.');
  } finally {
    warnings.push(...await cleanupOwned(owned, operations, committed));
  }
  if (failure) { if (warnings.length) failure.details = { ...failure.details, warnings }; throw failure; }
  return { id, path: destination, manifest, warnings };
}
