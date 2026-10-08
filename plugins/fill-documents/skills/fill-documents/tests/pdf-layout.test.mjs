import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PDFDocument, PDFDict, PDFName, PDFNull, PDFNumber, PDFArray, PDFSignature, PDFHexString, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdf from '../lib/adapters/pdf.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const fontBytes = await readFile(new URL('../assets/fonts/NanumGothic-Regular.ttf', import.meta.url));
const message = '가상 훈련 요청입니다. 대피소 담당자는 생수 600병과 담요 80장을 요청하며, 수령 후 수량과 인계 시각을 기록합니다.\r\n\r\n  운송 담당자는 북문으로 진입하고 통행로를 비워 두세요.  \n'.repeat(12) + '마지막 인계 기록입니다.\r\n';

async function template({ repeated = false } = {}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  page.drawText('GENERAL MESSAGE - EXERCISE', { x: 40, y: 730, size: 16 });
  page.drawRectangle({ x: 40, y: 360, width: 530, height: 250, borderWidth: 1, borderColor: rgb(0, 0, 0) });
  const body = doc.getForm().createTextField('7 Message');
  body.enableMultiline(); body.setMaxLength(10000);
  body.addToPage(page, { x: 41, y: 361, width: 528, height: 248, borderWidth: 0 });
  body.setFontSize(10);
  const incident = doc.getForm().createTextField('Incident');
  incident.addToPage(page, { x: 40, y: 650, width: 300, height: 24, borderWidth: 0 }); incident.setFontSize(10);
  const reply = doc.getForm().createTextField('Reply');
  reply.addToPage(page, { x: 40, y: 220, width: 530, height: 40, borderWidth: 0 }); reply.setFontSize(10);
  const signature = doc.getForm().createTextField('Signature');
  signature.addToPage(page, { x: 40, y: 140, width: 200, height: 30, borderWidth: 0 });
  signature.acroField.dict.set(PDFName.of('FT'), PDFName.of('Sig'));
  signature.acroField.dict.set(PDFName.of('V'), PDFNull);
  doc.getForm().acroForm.dict.set(PDFName.of('SigFlags'), PDFNumber.of(1));
  const instructions = doc.addPage([612, 792]);
  instructions.drawText('Instructions: retain the approved original message.', { x: 40, y: 730, size: 12 });
  if (repeated) body.addToPage(instructions, { x: 40, y: 400, width: 528, height: 248, borderWidth: 0 });
  return doc.save({ updateFieldAppearances: false });
}

async function request(input) {
  const info = await pdf.inspect(input);
  const body = info.fields.find(field => field.sourceName === '7 Message').name;
  return { body, values: { [body]: message, Incident: 'Riverside flood exercise', Reply: 'Confirmed for 17:00 delivery.' },
    context: { overflow: 'flow', layoutProfile: { version: 1, format: 'pdf', templateSha256: sha(input), continuations: [{
      field: body, sourcePage: 1, repeatFields: ['Incident'], label: 'Message continued',
      labelBox: { x: 40, y: 765, width: 530, height: 16 }, sourceFooterBox: { x: 40, y: 28, width: 530, height: 16 },
      footer: 'Approval and reply apply on original form page 1.', footerBox: { x: 40, y: 28, width: 530, height: 16 },
    }] } } };
}

test('PDF long message requires an explicit matching continuation profile', async () => {
  const input = await template();
  const { values } = await request(input);
  await assert.rejects(pdf.fill(input, values, { overflow: 'flow' }), error => error.code === 'E_LAYOUT' && error.details.reason === 'continuation-template-required');
});

function pageStreams(page) {
  const contents = page.node.Contents();
  return (contents instanceof PDFArray ? contents.asArray().map(ref => page.doc.context.lookup(ref)) : contents ? [contents] : []).map(stream => sha(stream.getContents()));
}

function signatures(doc) {
  return doc.getForm().getFields().filter(field => field instanceof PDFSignature).map(field => ({
    dict: field.acroField.dict.toString(), widgets: field.acroField.getWidgets().map(widget => ({
      dict: widget.dict.toString(), ap: sha(widget.getAppearances().normal.getContents()),
    })),
  }));
}

test('PDF keeps the original prefix, form background and signatures with one editable body per added page', async () => {
  const input = await template(), { body, values, context } = await request(input);
  const before = await PDFDocument.load(input);
  const result = await pdf.fill(input, values, context);
  const entry = result.layout.continuations[0], saved = await PDFDocument.load(result.bytes);
  assert.equal(saved.catalog.lookup(PDFName.of('FillDocumentsFlow')).lookup(PDFName.of('Version')).asNumber(), 3);
  assert(entry.prefixLength > 100);
  const names = ['7 Message', ...entry.chunkFields];
  const chunks = names.map(name => saved.getForm().getTextField(name).getText());
  assert.equal(chunks.join(''), values[body]);
  assert.equal(chunks[0].length, entry.prefixLength);
  assert.equal(entry.chunkFields.length, saved.getPageCount() - 2);
  assert.deepEqual(entry.originalPages, [1]);
  assert.equal(entry.addedPages[0], 3);
  assert.deepEqual(signatures(saved), signatures(before));
  assert.equal(saved.context.enumerateIndirectObjects().filter(([, object]) => object instanceof PDFDict && object.lookup(PDFName.of('FT'))?.toString() === '/Sig').length, 1);
  assert.deepEqual(pageStreams(saved.getPage(1)), pageStreams(before.getPage(1)));
  assert.deepEqual(pageStreams(saved.getPage(0)).slice(1, -2), pageStreams(before.getPage(0)));
  for (const pageNumber of entry.addedPages) {
    const page = saved.getPage(pageNumber - 1);
    assert.deepEqual(page.getMediaBox(), before.getPage(0).getMediaBox());
    assert.equal(page.node.Annots().size(), 1);
    assert.equal(page.node.Resources().lookup(PDFName.of('XObject')).keys().length, 2);
  }
  assert.equal((await pdf.inspect(result.bytes)).fields.length, 3);
  assert((await pdf.validate(result.bytes, context)).checks.every(check => check.status === 'pass'));
  await assert.rejects(pdf.fill(result.bytes, values, context), { code: 'E_UNSUPPORTED' });
  let offset = 0;
  const boundaries = new Set([...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(message)].map(part => part.index));
  for (const chunk of chunks) { assert(boundaries.has(offset)); offset += chunk.length; }
  saved.registerFontkit(fontkit);
  const font = await saved.embedFont(fontBytes, { subset: false });
  // Regenerate both the raw body chunks and the original repeated context.
  for (const name of [...names, 'Incident']) saved.getForm().getTextField(name).updateAppearances(font);
  const regenerated = await saved.save({ updateFieldAppearances: false });
  assert((await pdf.validate(regenerated, context)).checks.every(check => check.status === 'pass'));
  assert.deepEqual(signatures(await PDFDocument.load(regenerated)), signatures(before));
});

test('PDF rejects unbreakable runs, invalid profiles, overlap and unsupported source geometry', async t => {
  const input = await template(), args = await request(input);
  await t.test('unbreakable input is not split into tiny page fields', async () => {
    await assert.rejects(pdf.fill(input, { ...args.values, [args.body]: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(100) }, args.context),
      error => error.code === 'E_LAYOUT' && error.details.reason === 'unbreakable-run');
  });
  for (const [label, mutate, code] of [
    ['wrong template', p => { p.templateSha256 = '0'.repeat(64); }, 'E_TEMPLATE_CHANGED'],
    ['unknown option', p => { p.autoShrink = true; }, 'E_LAYOUT'],
    ['unknown field', p => { p.continuations[0].field = 'unknown'; }, 'E_LAYOUT'],
    ['signature repeat', p => { p.continuations[0].repeatFields = ['Signature']; }, 'E_LAYOUT'],
    ['self repeat', p => { p.continuations[0].repeatFields = [args.body]; }, 'E_LAYOUT'],
    ['duplicate entry', p => { p.continuations.push({ ...p.continuations[0] }); }, 'E_LAYOUT'],
    ['signature overlap', p => { p.continuations[0].sourceFooterBox = { x: 40, y: 140, width: 200, height: 16 }; }, 'E_LAYOUT'],
    ['label outside crop', p => { p.continuations[0].labelBox.y = 790; }, 'E_LAYOUT'],
    ['label too wide', p => { p.continuations[0].labelBox.width = 40; }, 'E_LAYOUT'],
  ]) await t.test(label, async () => {
    const context = structuredClone(args.context); mutate(context.layoutProfile);
    await assert.rejects(pdf.fill(input, args.values, context), { code });
  });
  await t.test('shared field on several pages', async () => {
    const repeated = await template({ repeated: true }), requestArgs = await request(repeated);
    await assert.rejects(pdf.fill(repeated, requestArgs.values, requestArgs.context), { code: 'E_LAYOUT' });
  });
  for (const [label, mutate] of [
    ['rotated page', doc => doc.getPage(0).setRotation(degrees(90))],
    ['nonzero origin', doc => doc.getPage(0).setMediaBox(10, 0, 612, 792)],
  ]) await t.test(label, async () => {
    const doc = await PDFDocument.load(input); mutate(doc);
    const changed = await doc.save({ updateFieldAppearances: false }), changedArgs = await request(changed);
    await assert.rejects(pdf.fill(changed, changedArgs.values, changedArgs.context), { code: 'E_LAYOUT' });
  });
  await t.test('short content still works without a profile', async () => {
    for (const overflow of ['preserve', 'flow']) {
      const result = await pdf.fill(input, { ...args.values, [args.body]: '가상 훈련의 짧은 요청입니다.' }, { overflow });
      assert.equal(result.layout.pagination.after, 2);
    }
  });
  await t.test('whole-value MaxLen cannot be bypassed by pages', async () => {
    await assert.rejects(pdf.fill(input, { ...args.values, [args.body]: '가 '.repeat(5001) }, args.context), { code: 'E_FIELDS' });
  });
});

test('PDF v3 detects value, geometry, page, mapping and stale static context changes', async t => {
  const input = await template(), { values, context } = await request(input);
  const result = await pdf.fill(input, values, context), entry = result.layout.continuations[0];
  for (const [label, mutate] of [
    ['prefix edited', doc => doc.getForm().getTextField(entry.sourceName).setText('변경된 첫 문단')],
    ['continuation edited', doc => doc.getForm().getTextField(entry.chunkFields[0]).setText('변경된 후속 문단')],
    ['source context edited', doc => doc.getForm().getTextField('Incident').setText('Different incident')],
    ['body box resized', doc => {
      const widget = doc.getForm().getTextField(entry.chunkFields[0]).acroField.getWidgets()[0];
      widget.setRectangle({ ...widget.getRectangle(), width: 50 });
    }],
    ['body font resized', doc => doc.getForm().getTextField(entry.chunkFields[0]).acroField.getWidgets()[0].setDefaultAppearance('0 g /Helvetica 5 Tf')],
    ['body points to original page', doc => doc.getForm().getTextField(entry.chunkFields[0]).acroField.getWidgets()[0].setP(doc.getPage(0).ref)],
    ['extra widget on added page', doc => {
      const page = doc.getPage(entry.addedPages[0] - 1); page.node.addAnnot(page.node.Annots().get(0));
    }],
    ['static AP edited', doc => {
      const binding = entry.repeatContexts[0].bindings[0];
      const objects = doc.getPage(binding.page - 1).node.Resources().lookup(PDFName.of('XObject'));
      const ref = objects.get(PDFName.of(binding.key));
      doc.context.assign(ref, doc.context.flateStream('q Q'));
    }],
    ['static AP rebound', doc => {
      const binding = entry.repeatContexts[0].bindings[0];
      const objects = doc.getPage(binding.page - 1).node.Resources().lookup(PDFName.of('XObject'));
      objects.set(PDFName.of(binding.key), doc.context.register(doc.context.flateStream('q Q')));
    }],
    ['mapping pages reversed', doc => {
      const dictionary = doc.catalog.lookup(PDFName.of('FillDocumentsFlow'));
      const entries = JSON.parse(dictionary.lookup(PDFName.of('Entries')).decodeText());
      entries[0].addedPages.reverse();
      dictionary.set(PDFName.of('Entries'), PDFHexString.fromText(JSON.stringify(entries)));
    }],
    ['mapping source changed', doc => {
      const dictionary = doc.catalog.lookup(PDFName.of('FillDocumentsFlow'));
      const entries = JSON.parse(dictionary.lookup(PDFName.of('Entries')).decodeText());
      entries[0].sourceName = 'Incident';
      dictionary.set(PDFName.of('Entries'), PDFHexString.fromText(JSON.stringify(entries)));
    }],
  ]) await t.test(label, async () => {
    const changed = await PDFDocument.load(result.bytes); mutate(changed);
    await assert.rejects(pdf.validate(await changed.save({ updateFieldAppearances: false }), context), { code: 'E_PRESERVATION' });
  });
});

test('source graphics validation respects streams and PDF string tokens, and refuses unsafe state', async t => {
  const input = await template();
  for (const [label, operations, accepted] of [
    ['unclosed save', ['q\n'], false],
    ['restore without save', ['Q\n'], false],
    ['state shared between streams', ['q\n', 'Q\n'], true],
    ['literal, hex, names and comments do not change state', ['q\n% Q Q q\n/Span << /ActualText (Q \\( q \\) (Q)) >> BDC\n/Nameq /Q\n<71512051>\nEMC\nQ\n'], true],
    ['inline image has opaque operator-like bytes', ['q\nBI /W 1 /H 1 /BPC 8 /CS /G ID\nQ\nEI\nQ\n'], false],
    ['blank static background', [], true],
  ]) await t.test(label, async () => {
    const doc = await PDFDocument.load(input);
    doc.getPage(0).node.set(PDFName.of('Contents'), doc.context.obj(operations.map(operation => doc.context.register(doc.context.flateStream(operation)))));
    const bytes = await doc.save({ updateFieldAppearances: false }), { values, context } = await request(bytes);
    if (accepted) assert((await pdf.fill(bytes, values, context)).checks.every(check => check.status === 'pass'));
    else await assert.rejects(pdf.fill(bytes, values, context), error => error.code === 'E_LAYOUT' && ['unbalanced-source-graphics', 'unsupported-source-graphics'].includes(error.details.reason));
  });
  await t.test('ordinary image XObjects remain supported', async () => {
    const doc = await PDFDocument.load(input);
    const image = await doc.embedPng(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'));
    doc.getPage(0).drawImage(image, { x: 10, y: 10, width: 5, height: 5 });
    const bytes = await doc.save({ updateFieldAppearances: false }), { values, context } = await request(bytes);
    assert((await pdf.fill(bytes, values, context)).checks.every(check => check.status === 'pass'));
  });
});

test('continuation preserves source font size, color, alignment and border in the same rectangle', async () => {
  const original = await PDFDocument.load(await template());
  const body = original.getForm().getTextField('7 Message'), widget = body.acroField.getWidgets()[0];
  body.setAlignment(2); widget.getOrCreateBorderStyle().setWidth(2);
  widget.setDefaultAppearance('0.1 0.2 0.3 rg\n/Original 12 Tf');
  const input = await original.save({ updateFieldAppearances: false }), { values, context } = await request(input);
  const result = await pdf.fill(input, values, context), saved = await PDFDocument.load(result.bytes);
  for (const name of ['7 Message', ...result.layout.continuations[0].chunkFields]) {
    const field = saved.getForm().getTextField(name), next = field.acroField.getWidgets()[0];
    assert.equal(field.getAlignment(), 2); assert.equal(next.getBorderStyle().getWidth(), 2);
    assert.deepEqual(next.getRectangle(), widget.getRectangle());
    assert.match(next.getDefaultAppearance(), /0\.1 0\.2 0\.3 rg/); assert.match(next.getDefaultAppearance(), /12 Tf/);
  }
});

test('shared source-page resources are isolated before adding the continuation note', async () => {
  const original = await PDFDocument.load(await template());
  original.getPage(1).node.set(PDFName.of('Resources'), original.getPage(0).node.get(PDFName.of('Resources')));
  original.getPage(1).node.set(PDFName.of('Contents'), original.getPage(0).node.get(PDFName.of('Contents')));
  const input = await original.save({ updateFieldAppearances: false }), { values, context } = await request(input);
  const source = await PDFDocument.load(input), result = await pdf.fill(input, values, context), saved = await PDFDocument.load(result.bytes);
  assert.equal(saved.getPage(1).node.Resources().toString(), source.getPage(1).node.Resources().toString());
  assert.deepEqual(pageStreams(saved.getPage(1)), pageStreams(source.getPage(1)));
  assert(!saved.getPage(1).node.Resources().lookup(PDFName.of('Font')).keys().some(key => key.decodeText().startsWith('ContinuationNote')));
});

test('a box with no visible line capacity and more than 256 continuations fail before publication', async t => {
  for (const [label, height, value, reason] of [
    ['no progress', 5, 'A\nA\nA', 'no-progress'],
    ['page cap', 17, '가\n'.repeat(300), 'unrepresentable-layout'],
  ]) await t.test(label, async () => {
    const original = await PDFDocument.load(await template());
    const widget = original.getForm().getTextField('7 Message').acroField.getWidgets()[0];
    widget.setRectangle({ ...widget.getRectangle(), height });
    const input = await original.save({ updateFieldAppearances: false }), { body, values, context } = await request(input);
    await assert.rejects(pdf.fill(input, { ...values, [body]: value }, context), error => error.code === 'E_LAYOUT' && error.details.reason === reason);
  });
});

test('ordinary filling keeps valid merged terminal widgets with a parent field group', async () => {
  const doc = await PDFDocument.create(), page = doc.addPage([612, 792]);
  const field = doc.getForm().createTextField('group.body');
  field.addToPage(page, { x: 40, y: 600, width: 400, height: 40 }); field.setFontSize(11);
  const widget = field.acroField.getWidgets()[0];
  for (const [key, value] of widget.dict.entries()) if (key.decodeText() !== 'Parent') field.acroField.dict.set(key, value);
  field.acroField.dict.delete(PDFName.of('Kids'));
  page.node.set(PDFName.of('Annots'), doc.context.obj([field.ref]));
  const input = await doc.save({ updateFieldAppearances: false }), info = await pdf.inspect(input);
  const result = await pdf.fill(input, { [info.fields[0].name]: '한 칸의 짧은 가상 기록' });
  assert.equal((await PDFDocument.load(result.bytes)).getPageCount(), 1);
});
