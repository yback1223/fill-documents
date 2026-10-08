import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import CFB from 'cfb';
import PizZip from 'pizzip';
import { markdownToHwpx, parse, patchHwp } from 'kordoc';
import * as hwp from '../lib/adapters/hwp.mjs';
import * as hwpx from '../lib/adapters/hwpx.mjs';
import { characterStyles, hwpContainer, openHancom, paragraphSnapshot } from '../lib/adapters/hancom-runtime.mjs';
import { scanXml } from '../lib/adapters/hancom-utils.mjs';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const context = { skillRoot };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rejectCode = code => error => { assert.equal(error.code, code); return true; };

async function fixture(format, name = 'application') {
  const dir = join(skillRoot, 'assets/templates', `${name}-${format}`);
  return { bytes: await readFile(join(dir, `template.${format}`)), values: JSON.parse(await readFile(join(dir, 'example-data.json'), 'utf8')), manifest: JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) };
}

async function generatedHwpx(markdown) {
  return new Uint8Array(await markdownToHwpx(markdown));
}

function modifyXml(bytes, transform) {
  const zip = new PizZip(bytes);
  zip.file('Contents/section0.xml', transform(zip.file('Contents/section0.xml').asText()));
  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
}

function removeSeedStreams(bytes) {
  const doc = CFB.read(Buffer.from(bytes), { type: 'buffer' });
  const paths = doc.FullPaths.filter(path => /\/(?:Scripts|DocOptions)(?:\/|$)|\/(?:PrvText|PrvImage|\u0005?HwpSummaryInformation)$/.test(path)).sort((a, b) => b.length - a.length);
  for (const path of paths) CFB.utils.cfb_del(doc, path);
  CFB.utils.cfb_gc(doc);
  return new Uint8Array(CFB.write(doc, { type: 'buffer' }));
}

async function generatedHwp(markdown) {
  const doc = await openHancom(await generatedHwpx(markdown), context);
  let exported;
  try {
    exported = doc.exportHwpWithReport();
    assert.equal(JSON.parse(exported.contentLoss()).count, 0);
    return removeSeedStreams(exported.takeBytes());
  } finally { exported?.free(); doc.free(); }
}

async function textOf(bytes) {
  const document = await openHancom(bytes, context);
  try { return paragraphSnapshot(document).map(paragraph => paragraph.text).join('\n\n'); } finally { document.free(); }
}

test('compressed engine rejects corruption and excessive expansion, then retries with valid bytes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fill-engine-'));
  const filename = join(directory, 'lib/vendor/rhwp_bg.wasm.gz');
  const { initHancom } = await import('../lib/adapters/hancom-runtime.mjs?compressed-engine-regression');
  try {
    await mkdir(dirname(filename), { recursive: true });
    await writeFile(filename, 'not a gzip engine');
    await assert.rejects(initHancom({ skillRoot: directory }), rejectCode('E_ENGINE'));
    await writeFile(filename, gzipSync(Buffer.alloc(17 * 1024 * 1024)));
    await assert.rejects(initHancom({ skillRoot: directory }), rejectCode('E_ENGINE'));
    const original = await readFile(new URL('rhwp_bg.wasm', import.meta.resolve('@rhwp/core')));
    await writeFile(filename, gzipSync(original));
    await initHancom({ skillRoot: directory });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

for (const [format, adapter] of [['hwp', hwp], ['hwpx', hwpx]]) {
  for (const name of ['official-letter', 'report', 'meeting-minutes', 'application']) {
    test(`${format}: ${name} template, manifest, real fill, re-open and original immutability`, async () => {
      const { bytes, values, manifest } = await fixture(format, name);
      const before = hash(bytes);
      assert.equal(before, manifest.sha256);
      assert.ok(manifest.fields.every(field => field.required && field.maxLength > 0));
      const inspected = await adapter.inspect(bytes, { ...context, manifest });
      assert.deepEqual(inspected.fields.map(field => field.name).sort(), Object.keys(values).sort());
      const output = await adapter.fill(bytes, values, { ...context, manifest });
      if (format === 'hwpx') assert.equal(Buffer.from(output.bytes).readUInt16LE(8), 0, 'mimetype must use STORE');
      assert.ok(output.checks.every(check => check.status === 'passed'));
      assert.ok((await adapter.validate(output.bytes, context)).checks.every(check => check.status === 'passed'));
      const text = await textOf(output.bytes);
      for (const value of Object.values(values)) assert.ok(text.includes(value), `Exact example text absent in ${name}-${format}`);
      assert.ok(!text.includes('{{'));
      assert.equal(hash(bytes), before);
      if (format === 'hwp') assert.ok([...hwpContainer(bytes).keys()].every(path => !/(Scripts|DocOptions|PrvText|PrvImage|SummaryInformation)/.test(path)));
    });
  }

  test(`${format}: exact Korean, newline, XML punctuation, literal markdown and emoji`, async () => {
    const { bytes, values, manifest } = await fixture(format);
    const value = '한글 & <표> "인용" \'작은\' 😀\n**강조 아님** _밑줄_ `코드` $3';
    const output = await adapter.fill(bytes, { ...values, request: value }, { ...context, manifest });
    assert.ok((await textOf(output.bytes)).includes(value));
  });

  test(`${format}: missing, unknown, empty, wrong-type, overlong and unsafe values are rejected`, async () => {
    const { bytes, values, manifest } = await fixture(format);
    const before = hash(bytes);
    const missing = { ...values }; delete missing.request;
    for (const invalid of [missing, { ...values, extra: '값' }, { ...values, request: '' }, { ...values, request: ' \n ' }, { ...values, request: false }, { ...values, request: '가'.repeat(3001) }, { ...values, request: '\u0000' }, { ...values, request: '\uD800' }, { ...values, request: '{{nested}}' }]) {
      await assert.rejects(adapter.fill(bytes, invalid, { ...context, manifest }), rejectCode('E_FIELDS'));
    }
    assert.equal(hash(bytes), before);
  });

  test(`${format}: broken data and wrong format are rejected`, async () => {
    await assert.rejects(adapter.inspect(new Uint8Array([1, 2, 3]), context), rejectCode('E_INPUT'));
    const wrong = await fixture(format === 'hwp' ? 'hwpx' : 'hwp');
    await assert.rejects(adapter.inspect(wrong.bytes, context), rejectCode('E_INPUT'));
  });
}

test('HWPX: split run placeholder retains styled neighbours, table, binary bytes and unrelated XML', async () => {
  const original = await generatedHwpx('**보존할 굵은 문구** {{value}}\n\n| 항목 | 내용 |\n| --- | --- |\n| 고정 | 표 내용 |');
  let bytes = modifyXml(original, xml => xml.replace('{{value}}', '{{va</hp:t></hp:run><hp:run charPrIDRef="0"><hp:t>lue}}'));
  const zip = new PizZip(bytes);
  zip.file('BinData/unchanged.bin', new Uint8Array([0, 12, 255, 128]));
  bytes = zip.generate({ type: 'uint8array' });
  const output = await hwpx.fill(bytes, { value: '새 값 & <기호>\n다음 줄' }, context);
  const before = new PizZip(bytes);
  const after = new PizZip(output.bytes);
  const oldXml = before.file('Contents/section0.xml').asText();
  const newXml = after.file('Contents/section0.xml').asText();
  const fixedText = scanXml(oldXml).find(node => node.local === 't' && node.element.textContent === '보존할 굵은 문구');
  assert.ok(fixedText);
  assert.equal(fixedText.parent.local, 'run');
  const fixedRun = oldXml.slice(fixedText.parent.start, fixedText.parent.end);
  assert.ok(newXml.includes(fixedRun));
  const tableBefore = scanXml(oldXml).find(node => node.local === 'tbl');
  assert.ok(newXml.includes(oldXml.slice(tableBefore.start, tableBefore.end)));
  for (const [path, entry] of Object.entries(before.files)) if (!entry.dir && path !== 'Contents/section0.xml') assert.deepEqual(after.file(path).asUint8Array(), entry.asUint8Array(), path);
  assert.ok((await textOf(output.bytes)).includes('새 값 & <기호>\n다음 줄'));
});

test('HWPX: repeated fields and neighbouring fields in one text run are filled independently', async () => {
  const bytes = await generatedHwpx('{{one}} / {{two}} / {{one}}');
  assert.deepEqual((await hwpx.inspect(bytes, context)).fields, [{ name: 'one', type: 'text', occurrences: 2 }, { name: 'two', type: 'text', occurrences: 1 }]);
  const output = await hwpx.fill(bytes, { one: '첫째', two: '둘째' }, context);
  assert.equal((await textOf(output.bytes)).trim(), '첫째 / 둘째 / 첫째');
});

for (const empty of [false, true]) {
  test(`HWPX: named click-here field supports ${empty ? 'empty' : 'existing'} text and preserves the controls`, async () => {
    const original = await generatedHwpx('FIELD');
    const content = `<hp:ctrl><hp:fieldBegin id="900" type="CLICK_HERE" name="value" editable="1" dirty="0"/></hp:ctrl>${empty ? '<hp:t/>' : '<hp:t>안내문</hp:t>'}<hp:ctrl><hp:fieldEnd beginIDRef="900"/></hp:ctrl>`;
    const bytes = modifyXml(original, xml => xml.replace('<hp:t>FIELD</hp:t>', content));
    assert.deepEqual((await hwpx.inspect(bytes, context)).fields, [{ name: 'value', type: 'text', occurrences: 1 }]);
    const output = await hwpx.fill(bytes, { value: '누름틀 값\n다음 줄' }, context);
    const xml = new PizZip(output.bytes).file('Contents/section0.xml').asText();
    assert.ok(xml.includes('dirty="1"'));
    assert.ok(xml.includes('beginIDRef="900"'));
    assert.ok((await textOf(output.bytes)).includes('누름틀 값\n다음 줄'));
  });
}

test('HWPX: malformed fields, executable content and external entity declarations are rejected', async () => {
  const bytes = await generatedHwpx('{{value}}');
  for (const invalid of ['{{bad-name}}', '{{value', '{{#loop}}']) await assert.rejects(hwpx.inspect(modifyXml(bytes, xml => xml.replace('{{value}}', invalid)), context), rejectCode('E_FIELDS'));
  await assert.rejects(hwpx.inspect(modifyXml(bytes, xml => xml.replace('<hs:sec ', '<!DOCTYPE x [<!ENTITY secret SYSTEM "file:///not-read">]><hs:sec ')), context), rejectCode('E_UNSUPPORTED'));
  const scripts = new PizZip(bytes); scripts.file('Scripts/code.js', 'throw new Error("must not execute")');
  await assert.rejects(hwpx.inspect(scripts.generate({ type: 'uint8array' }), context), rejectCode('E_UNSUPPORTED'));
});

test('HWP: fixed mixed-style prefix requires flow and preserve still rejects before the lossy patch can run', async () => {
  const bytes = await generatedHwp('고정 제목\n\n앞문구 **굵게** {{value}}');
  const doc = await openHancom(bytes, context);
  try {
    const target = paragraphSnapshot(doc).find(paragraph => paragraph.text.includes('{{value}}'));
    assert.ok(new Set(characterStyles(doc, target)).size > 1);
  } finally { doc.free(); }
  const before = hash(bytes);
  assert.equal((await hwp.inspect(bytes, context)).requiredOverflow, 'flow');
  await assert.rejects(hwp.fill(bytes, { value: '새 값' }, context), rejectCode('E_PRESERVATION'));
  assert.equal(hash(bytes), before);
});

test('HWP: engine residual differences and whitespace loss never produce success', async () => {
  const bytes = await generatedHwp('고정 제목\n\n{{value}}');
  const parsed = await parse(bytes);
  const unsafe = await patchHwp(bytes, parsed.markdown.replace('{{value}}', '행1<br><br>행3'), { verify: true });
  assert.ok(!unsafe.success || unsafe.skipped.length > 0 || unsafe.verification.diffs.length > 0);
  const before = hash(bytes);
  for (const value of ['행1\n\n행3', '연속  공백', '앞<br>뒤']) await assert.rejects(hwp.fill(bytes, { value }, context), rejectCode('E_PRESERVATION'));
  assert.equal(hash(bytes), before);
});

test('HWP: partially applied patches with an engine skip are rejected', async () => {
  const bytes = await generatedHwp('고정 제목\n\n{{first}}\n\n{{second}}');
  const parsed = await parse(bytes);
  const partial = await patchHwp(bytes, parsed.markdown.replace('{{first}}', '적용 값').replace('{{second}}', '앞\t뒤'), { verify: true });
  assert.equal(partial.success, true);
  assert.ok(partial.applied > 0);
  assert.ok(partial.skipped.length > 0);
  const before = hash(bytes);
  await assert.rejects(hwp.fill(bytes, { first: '적용 값', second: '앞\t뒤' }, context), rejectCode('E_PRESERVATION'));
  assert.equal(hash(bytes), before);
});

test('HWP: duplicate placeholders and scripts fail closed', async () => {
  await assert.rejects(hwp.inspect(await generatedHwp('{{value}}\n\n{{value}}'), context), rejectCode('E_PRESERVATION'));
  const { bytes } = await fixture('hwp');
  const doc = CFB.read(bytes, { type: 'buffer' });
  CFB.utils.cfb_add(doc, '/Scripts/DefaultJScript', Buffer.from('must not run'));
  await assert.rejects(hwp.inspect(new Uint8Array(CFB.write(doc, { type: 'buffer' })), context), rejectCode('E_UNSUPPORTED'));
});
