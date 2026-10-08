import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import PizZip from 'pizzip';
import { normalizeFields, checkValues } from '../lib/fields.mjs';
import { publishNewFile, sha256, readJson } from '../lib/io.mjs';
import { registerTemplate, findTemplate, listTemplates } from '../lib/catalog.mjs';
import { assertSafeZip } from '../lib/zip-safety.mjs';
import { inspectDocument, fillDocument } from '../lib/engine.mjs';

const fields = normalizeFields([{ name: 'title', type: 'text', maxLength: 3 }, { name: 'approved', type: 'checkbox' }]);
async function workspace(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fill-documents test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
test('required fields reject omission, whitespace, unknown values, and prototype names', () => {
  for (const values of [{ title: '제목' }, { title: '  ', approved: false }, { title: '제목', approved: false, extra: 'x' }, { title: '제목', approved: 'false' }]) {
    assert.throws(() => checkValues(values, fields), { code: 'E_FIELDS' });
  }
  assert.throws(() => normalizeFields([{ name: 'constructor', type: 'text' }]), { code: 'E_FIELDS' });
  assert.equal(checkValues({ title: '한😀글', approved: false }, fields).approved, false);
  assert.throws(() => checkValues({ title: '한😀글자', approved: false }, fields), { code: 'E_FIELDS' });
});

test('repeat rows validate every required column and copy input without losing Unicode', () => {
  const schema = normalizeFields([{ name: 'activities', type: 'rows', maxRows: 2, columns: [
    { name: 'month', type: 'text', maxLength: 3 }, { name: 'description', type: 'text', maxLength: 4 },
  ] }]);
  const input = { activities: [{ month: '1월', description: '한😀글' }] };
  const checked = checkValues(input, schema);
  assert.equal(checked.activities[0].description, '한😀글');
  assert.equal(Object.getPrototypeOf(checked.activities[0]), null);
  checked.activities[0].month = '2월';
  assert.equal(input.activities[0].month, '1월');
  for (const rows of [[], [null], ['text'], [{ month: '1월' }], [{ month: '1월', description: ' ' }], [{ month: '1월', description: '길이초과다' }], [{ month: '1월', description: 'a\u0000' }], [{ month: '1월', description: 'ok', extra: 'x' }], Array(3).fill(input.activities[0])]) {
    assert.throws(() => checkValues({ activities: rows }, schema), { code: 'E_FIELDS' });
  }
  for (const extra of [{ maxRows: 101 }, { columns: [] }, { columns: [{ name: 'constructor', type: 'text', maxLength: 2 }] }, { columns: [{ name: 'nested', type: 'rows', maxRows: 2, columns: [] }] }]) {
    assert.throws(() => normalizeFields([{ ...schema[0], ...extra }]), { code: 'E_FIELDS' });
  }
  const large = normalizeFields([{ name: 'rows', type: 'rows', maxRows: 100, columns: [{ name: 'text', type: 'text', maxLength: 10000 }] }]);
  assert.throws(() => checkValues({ rows: Array(51).fill({ text: 'x'.repeat(10000) }) }, large), { code: 'E_FIELDS' });
});

test('layout profiles reject wrong version, format, source hash and registered HWPX before adapter execution', async () => {
  const bytes = Buffer.from('%PDF-fake source');
  const profile = { version: 1, format: 'pdf', templateSha256: sha256(bytes) };
  const context = { filePath: 'example.pdf' };
  await assert.rejects(inspectDocument(bytes, { ...context, layoutProfile: { ...profile, version: 2 } }), { code: 'E_INPUT' });
  await assert.rejects(inspectDocument(bytes, { ...context, layoutProfile: { ...profile, format: 'hwpx' } }), { code: 'E_UNSUPPORTED' });
  await assert.rejects(inspectDocument(bytes, { ...context, layoutProfile: { ...profile, templateSha256: '0'.repeat(64) } }), { code: 'E_TEMPLATE_CHANGED' });
  await assert.rejects(fillDocument({ target: 'never-read.pdf', layoutProfile: profile }), { code: 'E_INPUT' });
  const zip = new PizZip().file('content.xml', '<root/>').generate({ type: 'nodebuffer' });
  await assert.rejects(inspectDocument(zip, { filePath: 'example.hwpx', manifest: {}, layoutProfile: { ...profile, format: 'hwpx', templateSha256: sha256(zip) } }), { code: 'E_UNSUPPORTED' });
});
test('concurrent outputs publish exactly once and never replace an existing file', async t => {
  const root = await workspace(t);
  const output = path.join(root, '결과.docx');
  const results = await Promise.allSettled([publishNewFile(output, Buffer.from('first')), publishNewFile(output, Buffer.from('second'))]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(results.find(item => item.status === 'rejected').reason.code, 'E_OUTPUT_EXISTS');
  const hash = sha256(await fs.readFile(output));
  await assert.rejects(publishNewFile(output, Buffer.from('replacement')), { code: 'E_OUTPUT_EXISTS' });
  assert.equal(sha256(await fs.readFile(output)), hash);
  assert.deepEqual(await fs.readdir(root), ['결과.docx']);
});
test('output failure cleans its temporary file while post-commit cleanup failure is a warning', async t => {
  const root = await workspace(t);
  const output = path.join(root, 'result.pdf');
  await assert.rejects(publishNewFile(output, Buffer.from('x'), { ...fs, link: async () => { throw Object.assign(new Error(), { code: 'ENOSPC' }); } }), { code: 'E_IO' });
  assert.deepEqual(await fs.readdir(root), []);
  const result = await publishNewFile(output, Buffer.from('published'), { ...fs, unlink: async () => { throw Object.assign(new Error(), { code: 'EACCES' }); } });
  assert.equal(await fs.readFile(output, 'utf8'), 'published');
  assert.equal(result.warnings[0].code, 'W_TEMP_CLEANUP');
});
test('symlink and hardlink outputs cannot overwrite originals', async t => {
  const root = await workspace(t);
  const original = path.join(root, 'original');
  await fs.writeFile(original, 'private source');
  for (const kind of ['link', 'symlink']) {
    const output = path.join(root, kind);
    await fs[kind](original, output);
    await assert.rejects(publishNewFile(output, Buffer.from('changed')), { code: 'E_OUTPUT_EXISTS' });
  }
  assert.equal(await fs.readFile(original, 'utf8'), 'private source');
});
async function registration(t) {
  const root = await workspace(t);
  const filePath = path.join(root, 'source.docx');
  await fs.writeFile(filePath, 'mock source');
  return { filePath, id: 'my-template', title: '내 서식', skillRoot: root, library: path.join(root, 'library'), inspectDocument: async () => ({ format: 'docx', fields: [{ name: 'title', type: 'text' }] }) };
}
test('concurrent registration keeps one complete template and detects later source changes', async t => {
  const input = await registration(t);
  const results = await Promise.allSettled([registerTemplate(input), registerTemplate(input)]);
  assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(results.find(item => item.status === 'rejected').reason.code, 'E_OUTPUT_EXISTS');
  const catalog = await listTemplates(input.skillRoot, input.library);
  assert.equal(catalog.entries.length, 1);
  assert.equal(catalog.warnings.length, 0);
  const item = await findTemplate(input.id, input.skillRoot, input.library);
  assert.equal(item.bytes.toString(), 'mock source');
  await fs.writeFile(item.filePath, 'tampered');
  await assert.rejects(findTemplate(input.id, input.skillRoot, input.library), { code: 'E_TEMPLATE_CHANGED' });
});
test('registration write failure is invisible, stale reservations are not stolen', async t => {
  const input = await registration(t);
  await assert.rejects(registerTemplate({ ...input, operations: { ...fs, open: async (...args) => {
    const handle = await fs.open(...args);
    return { stat: () => handle.stat(), close: () => handle.close(), writeFile: async () => { throw new Error('disk full'); } };
  } } }), { code: 'E_IO' });
  assert.equal((await listTemplates(input.skillRoot, input.library)).entries.length, 0);
  await fs.mkdir(path.join(input.library, '.my-template.lock'));
  await assert.rejects(registerTemplate(input), { code: 'E_OUTPUT_EXISTS' });
  assert.equal((await listTemplates(input.skillRoot, input.library)).entries.length, 0);
});
test('registration commit survives cleanup failure', async t => {
  const input = await registration(t);
  const result = await registerTemplate({ ...input, operations: { ...fs, rmdir: async () => { throw new Error('busy'); } } });
  assert.equal(result.warnings[0].code, 'W_TEMP_CLEANUP');
  assert.equal((await findTemplate(input.id, input.skillRoot, input.library)).bytes.toString(), 'mock source');
});

test('registration never replaces an empty directory created at the commit boundary', async t => {
  const input = await registration(t);
  const destination = path.join(input.library, input.id);
  let externalIdentity;
  const operations = { ...fs, mkdir: async (directory, ...args) => {
    if (path.basename(directory) === input.id) {
      await fs.mkdir(directory);
      externalIdentity = await fs.lstat(directory);
    }
    return fs.mkdir(directory, ...args);
  } };
  await assert.rejects(registerTemplate({ ...input, operations }), { code: 'E_OUTPUT_EXISTS' });
  assert(externalIdentity, 'The concurrent-directory injection must actually run');
  assert.equal((await fs.lstat(destination)).ino, externalIdentity.ino);
  assert.deepEqual(await fs.readdir(destination), []);
});

test('a replaced output parent is detected before publication', async t => {
  const root = await workspace(t);
  const parent = path.join(root, 'parent');
  const other = path.join(root, 'other');
  await fs.mkdir(parent); await fs.mkdir(other);
  const operations = { ...fs, open: async (...args) => {
    await fs.rename(parent, path.join(root, 'moved-parent'));
    await fs.symlink(other, parent);
    return fs.open(...args);
  } };
  await assert.rejects(publishNewFile(path.join(parent, 'result'), Buffer.from('x'), operations), { code: 'E_IO' });
  assert.deepEqual(await fs.readdir(other), []);
});

test('pre-commit cleanup failure reports potentially remaining candidate paths', async t => {
  const root = await workspace(t);
  await assert.rejects(publishNewFile(path.join(root, 'result'), Buffer.from('x'), {
    ...fs, link: async () => { throw new Error('disk failure'); }, unlink: async () => { throw new Error('busy'); },
  }), error => error.code === 'E_IO' && error.details.warnings[0].code === 'W_TEMP_CLEANUP');
});

test('registration cleanup preserves external files before and after commit', async t => {
  for (const fail of [true, false]) {
    const input = await registration(t);
    const sentinel = path.join(input.library, `.${input.id}.lock/staging/keep`);
    let injected = false;
    const operations = { ...fs, link: async (...args) => {
      if (!injected) { await fs.writeFile(sentinel, 'external'); injected = true; }
      if (fail) throw new Error('simulated failure');
      return fs.link(...args);
    } };
    if (fail) await assert.rejects(registerTemplate({ ...input, operations }), error => error.code === 'E_IO' && error.details.warnings.length > 0);
    else assert((await registerTemplate({ ...input, operations })).warnings.length > 0);
    assert.equal(await fs.readFile(sentinel, 'utf8'), 'external');
    await assert.rejects(registerTemplate(input), { code: 'E_OUTPUT_EXISTS' });
  }
});

test('registration can retry the same ID after a completely cleaned failure', async t => {
  const input = await registration(t);
  await assert.rejects(registerTemplate({ ...input, operations: { ...fs, link: async () => { throw new Error('disk failure'); } } }), { code: 'E_IO' });
  assert.deepEqual(await fs.readdir(input.library), []);
  assert.equal((await registerTemplate(input)).id, input.id);
});

test('JSON input rejects invalid UTF-8 instead of replacing user characters', async t => {
  const root = await workspace(t);
  const input = path.join(root, 'values.json');
  await fs.writeFile(input, Buffer.concat([Buffer.from('{"body":"'), Buffer.from([0xc0, 0xaf]), Buffer.from('"}')]));
  await assert.rejects(readJson(input), { code: 'E_INPUT' });
});
test('ZIP rejects traversal, external entities, active content, duplicate names and damaged CRC', () => {
  const archive = files => {
    const zip = new PizZip();
    for (const [name, body] of files) zip.file(name, body);
    return zip.generate({ type: 'nodebuffer', compression: 'STORE' });
  };
  assert.doesNotThrow(() => assertSafeZip(archive([['safe.xml', '<root/>']])));
  for (const files of [[['../escape.xml', '<root/>']], [['safe.xml', '<!DOCTYPE root><root/>']], [['word/vbaProject.bin', 'macro']]]) {
    assert.throws(() => assertSafeZip(archive(files)));
  }
  const duplicate = archive([['one.xml', 'safe'], ['two.xml', 'safe']]);
  for (let start = duplicate.indexOf('two.xml'); start !== -1; start = duplicate.indexOf('two.xml', start + 7)) duplicate.write('one.xml', start);
  assert.throws(() => assertSafeZip(duplicate), { code: 'E_INPUT' });
  const damaged = archive([['safe.xml', '<root/>']]);
  damaged[damaged.indexOf('<root/>')] ^= 1;
  assert.throws(() => assertSafeZip(damaged), { code: 'E_INPUT' });
  const forged = new PizZip().file('huge.xml', 'x'.repeat(33 * 1024 * 1024)).generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const central = forged.indexOf(Buffer.from('504b0102', 'hex'));
  forged.writeUInt32LE(1, central + 24);
  forged.writeUInt32LE(1, 22);
  assert.throws(() => assertSafeZip(forged), { code: 'E_INPUT' });
});
