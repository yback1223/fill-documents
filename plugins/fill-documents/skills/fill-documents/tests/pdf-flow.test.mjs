import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, PDFName, PDFNull, PDFNumber, PDFString, PDFHexString } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdf from '../lib/adapters/pdf.mjs';
import { verifyContinuationBounds, paginateText } from '../lib/adapters/pdf-flow.mjs';
import { fillDocument, inspectDocument } from '../lib/engine.mjs';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const fontBytes = await readFile(path.join(skillRoot, 'assets/fonts/NanumGothic-Regular.ttf'));
const context = { skillRoot, overflow: 'flow' };
const hash = value => createHash('sha256').update(value).digest('hex');

async function source({ name = 'body', signature = false } = {}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  page.drawText('EXERCISE MESSAGE', { x: 40, y: 720, size: 16 });
  const field = doc.getForm().createTextField(name);
  field.enableMultiline(); field.setMaxLength(10000);
  field.addToPage(page, { x: 40, y: 600, width: 400, height: 70 }); field.setFontSize(11);
  if (signature) {
    const blank = doc.getForm().createTextField('Blank signature');
    blank.addToPage(page, { x: 40, y: 100, width: 100, height: 30 });
    blank.acroField.dict.set(PDFName.of('FT'), PDFName.of('Sig'));
    blank.acroField.dict.set(PDFName.of('V'), PDFNull);
    doc.getForm().acroForm.dict.set(PDFName.of('SigFlags'), PDFNumber.of(1));
  }
  return doc.save({ updateFieldAppearances: false });
}

function profile(bytes, fields = ['body']) {
  return { version: 1, format: 'pdf', templateSha256: hash(bytes), continuations: fields.map((field, index) => ({
    field, sourcePage: 1, repeatFields: [], label: 'Message continued',
    labelBox: { x: 40, y: 790, width: 515, height: 18 }, sourceFooterBox: { x: 40, y: 20 + index * 20, width: 515, height: 18 },
  })) };
}

test('continuation inspect describes generated pages without certifying a complete PDF', async () => {
  const input = await source({ signature: true });
  const filled = await pdf.fill(input, { body: '가상 재난 훈련에서 대피소의 물품 수령과 운송 인계를 확인합니다. '.repeat(30) }, { ...context, layoutProfile: profile(input) });
  const saved = await PDFDocument.load(filled.bytes);
  assert(saved.getPageCount() > 1);
  assert(saved.getForm().getFields().some(field => field.getName() === 'Blank signature'));
  const inspected = await inspectDocument(filled.bytes, { filePath: 'continuation.pdf', skillRoot });
  assert.equal(inspected.completion.status, 'incomplete');
  assert.equal(inspected.completion.fullDocumentComplete, false);
  assert(inspected.continuations.length > 0);
  assert(inspected.warnings.some(warning => warning.includes('별지가 생성된 PDF')));
  assert(inspected.warnings.every(warning => !/완성|작성 완료|fully complete/i.test(warning)));
});

test('version 2 reference-and-line-field documents remain readable, validated and protected from refill', async () => {
  const input = await source({ signature: true }), doc = await PDFDocument.load(input);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontBytes, { subset: false });
  const value = '기존 v2 문서의 원문을 보존합니다.\r\n';
  const name = `continuation_${hash('body').slice(0, 24)}_1`;
  const original = doc.getForm().getTextField('body');
  original.setText('별지 2쪽 참조'); original.updateAppearances(font);
  const page = doc.addPage([595.28, 841.89]), chunk = doc.getForm().createTextField(name);
  chunk.enableMultiline(); chunk.addToPage(page, { x: 48, y: 700, width: 499.28, height: 32, borderWidth: 0, font });
  chunk.setFontSize(11); chunk.setText(value); chunk.updateAppearances(font);
  const entries = [{ origin: 'body', sourceName: 'body', originalPages: [1], chunkFields: [name], chunkPages: [2],
    addedPages: [2], fontSize: 11, length: value.length, sha256: hash(value), reference: '별지 2쪽 참조' }];
  doc.catalog.set(PDFName.of('FillDocumentsFlow'), doc.context.obj({ Version: 2, OriginalPages: 1,
    Entries: PDFHexString.fromText(JSON.stringify(entries)) }));
  const bytes = await doc.save({ updateFieldAppearances: false });
  assert.equal((await pdf.inspect(bytes)).fields.length, 1);
  assert((await pdf.validate(bytes)).checks.every(check => check.status === 'pass'));
  await assert.rejects(pdf.fill(bytes, { body: '다시' }, context), { code: 'E_UNSUPPORTED' });
  chunk.setText('변경');
  await assert.rejects(pdf.validate(await doc.save({ updateFieldAppearances: false })), { code: 'E_PRESERVATION' });
});

test('PDF aliases avoid existing identifiers and empty signature support does not accept signing data', async () => {
  const input = await source({ name: '1 field', signature: true });
  const alias = (await pdf.inspect(input)).fields[0].name;
  const doc = await PDFDocument.load(input);
  doc.getForm().createTextField(alias).addToPage(doc.getPage(0), { x: 40, y: 300, width: 400, height: 50 });
  const fields = (await pdf.inspect(await doc.save({ updateFieldAppearances: false }))).fields;
  assert.equal(fields[1].name, alias); assert.notEqual(fields[0].name, alias);
  doc.getForm().getFields().find(field => field.getName() === 'Blank signature').acroField.dict.set(PDFName.of('V'), PDFString.of('signed'));
  await assert.rejects(pdf.inspect(await doc.save({ updateFieldAppearances: false })), { code: 'E_UNSUPPORTED' });
});

test('SigFlags zero without signature fields is an ordinary unsigned form', async () => {
  const doc = await PDFDocument.load(await source());
  doc.getForm().acroForm.dict.set(PDFName.of('SigFlags'), PDFNumber.of(0));
  const input = await doc.save({ updateFieldAppearances: false });
  assert.equal((await pdf.inspect(input)).fields.length, 1);
  assert((await pdf.fill(input, { body: '짧은 예시' }, context)).checks.every(check => check.status === 'pass'));
});

test('multiple overflowing fields have separate ordered page groups and cannot repeat each other', async () => {
  const doc = await PDFDocument.load(await source());
  const second = doc.getForm().createTextField('second');
  second.enableMultiline(); second.addToPage(doc.getPage(0), { x: 40, y: 400, width: 400, height: 50 }); second.setFontSize(11);
  const bytes = await doc.save({ updateFieldAppearances: false });
  const values = { body: '가상 훈련의 현장 물품 요청과 운송 인계 내용을 기록합니다. '.repeat(30), second: '가상 인계 기록\r\n\r\n'.repeat(15) };
  const layoutProfile = profile(bytes, ['body', 'second']);
  const result = await pdf.fill(bytes, values, { ...context, layoutProfile });
  const [first, last] = result.layout.continuations;
  assert.equal(result.layout.continuations.length, 2);
  assert(last.addedPages[0] > first.addedPages.at(-1));
  const saved = await PDFDocument.load(result.bytes); saved.registerFontkit(fontkit);
  const font = await saved.embedFont(fontBytes, { subset: false });
  for (const entry of result.layout.continuations) {
    const names = [entry.sourceName, ...entry.chunkFields];
    assert.equal(names.map(name => saved.getForm().getTextField(name).getText()).join(''), values[entry.origin]);
    for (const name of names) {
      const field = saved.getForm().getTextField(name); field.updateAppearances(font); verifyContinuationBounds(field, font, entry.fontSize);
    }
  }
  assert((await pdf.validate(await saved.save({ updateFieldAppearances: false }), context)).checks.every(check => check.status === 'pass'));
  const changed = structuredClone(layoutProfile); changed.continuations[0].repeatFields = ['second'];
  await assert.rejects(pdf.fill(bytes, values, { ...context, layoutProfile: changed }), error => error.code === 'E_LAYOUT' && error.details.reason === 'overflowing-repeat-field');
});

test('raw segmentation respects graphemes and CRLF without substituting display values', async () => {
  const doc = await PDFDocument.load(await source()), field = doc.getForm().getTextField('body');
  field.acroField.getWidgets()[0].setRectangle({ x: 40, y: 40, width: 14, height: 9 });
  const fakeFont = { widthOfTextAtSize: text => [...new Intl.Segmenter().segment(text)].length,
    heightAtSize: (_size, options) => options?.descender === false ? 0.8 : 1, encodeText: text => PDFHexString.fromText(text) };
  const value = 'e\u0301 👩‍👩‍👧‍👧 AB\r\n\r\n CD  \n'.repeat(15);
  const chunks = paginateText(value, field, fakeFont, 1);
  assert(chunks.length > 1); assert.equal(chunks.join(''), value);
  const boundaries = new Set([...new Intl.Segmenter().segment(value)].map(part => part.index));
  let offset = 0;
  for (const chunk of chunks) { assert(boundaries.has(offset)); offset += chunk.length; }
  field.acroField.getWidgets()[0].setRectangle({ x: 40, y: 40, width: 5, height: 4 });
  assert.throws(() => paginateText('A', field, fakeFont, 1), { code: 'E_LAYOUT' });
});

test('dry-run validates the same profiled overflow while failed or dry runs preserve files', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'fill-flow-'));
  const target = path.join(dir, 'template.pdf'), output = path.join(dir, 'output.pdf'), bytes = await source();
  await writeFile(target, bytes);
  const args = { target, output, skillRoot, values: { body: '가상 훈련의 물품 수량과 인계 시각을 확인합니다. '.repeat(30) } };
  for (const dryRun of [true, false]) {
    await assert.rejects(fillDocument({ ...args, dryRun }), { code: 'E_FIELDS' });
    await assert.rejects(fillDocument({ ...args, overflow: 'flow', dryRun }), { code: 'E_LAYOUT' });
  }
  const dry = await fillDocument({ ...args, overflow: 'flow', layoutProfile: profile(bytes), dryRun: true });
  assert.equal(dry.publication, 'not-attempted'); assert(dry.layout.pagination.after > 1);
  await assert.rejects(access(output));
  assert.equal(hash(await readFile(target)), hash(bytes));
  await writeFile(output, 'existing output');
  await assert.rejects(fillDocument({ ...args, overflow: 'flow' }), { code: 'E_LAYOUT' });
  assert.equal(await readFile(output, 'utf8'), 'existing output');
  await assert.rejects(fillDocument({ ...args, overflow: 'invalid' }), { code: 'E_INPUT' });
});
