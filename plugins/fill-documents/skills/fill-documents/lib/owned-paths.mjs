import { FillError } from './errors.mjs';

export const sameIdentity = (a, b) => a.dev === b.dev && a.ino === b.ino;

export async function assertDirectory(directory, identity, operations) {
  let current;
  try { current = await operations.lstat(directory); } catch { /* handled below */ }
  if (!current?.isDirectory() || !sameIdentity(current, identity)) {
    throw new FillError('E_IO', '작업 중 폴더 경로가 변경됐습니다. 안정된 폴더에서 다시 실행하세요.', { path: directory });
  }
}

export async function createOwnedDirectory(directory, owned, operations, scope = 'temporary') {
  await operations.mkdir(directory, { mode: 0o700 });
  const identity = await operations.lstat(directory);
  owned.push({ path: directory, identity, directory: true, scope });
  return identity;
}

export async function createOwnedFile(filePath, bytes, owned, operations) {
  const handle = await operations.open(filePath, 'wx', 0o600);
  try {
    const identity = await handle.stat();
    owned.push({ path: filePath, identity, directory: false, scope: 'temporary' });
    await handle.writeFile(bytes);
    await handle.sync();
    return identity;
  } finally { await handle.close(); }
}

// Never recursively remove a work directory: it may now contain someone else's file.
export async function cleanupOwned(owned, operations, committed = false) {
  const warnings = [];
  for (const item of [...owned].reverse()) {
    if (committed && item.scope === 'published') continue;
    try {
      const current = await operations.lstat(item.path);
      if (!sameIdentity(current, item.identity) || current.isDirectory() !== item.directory) throw new Error('identity-changed');
      if (item.directory) await operations.rmdir(item.path);
      else await operations.unlink(item.path);
    } catch (error) {
      warnings.push({ code: 'W_TEMP_CLEANUP', path: item.path, reason: error.code ?? 'identity-changed', location: 'path-at-creation' });
    }
  }
  return warnings;
}
