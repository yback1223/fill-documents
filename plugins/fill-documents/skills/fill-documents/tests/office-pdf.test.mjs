import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import { DOMParser } from '@xmldom/xmldom';
import { PDFDocument, PDFName, PDFString, PDFDict, PDFArray, PDFStream, PDFTextField, decodePDFRawStream } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as docx from '../lib/adapters/docx.mjs';
import * as pdf from '../lib/adapters/pdf.mjs';
import { createDocxTemplate, createPdfTemplate, templateDefinitions } from '../scripts/generate-office-templates.mjs';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const fontBytes = await readFile(path.join(skillRoot, 'assets/fonts/NanumGothic-Regular.ttf'));
const context = { skillRoot };
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const oneField = { category: 'test', title: '시험 문서', fields: [{ name: 'body', label: '내용', maxLength: 1000, height: 180, multiline: true }] };
const rejected = (operation, code) => assert.rejects(operation, (error) => error.code === code);

test('embedded PDF glyph outlines match the original Korean font', async () => {
  const blank = await createPdfTemplate(oneField, fontBytes);
  const filled = await pdf.fill(blank, { body: '가나다 한글 문서 ABC l' }, context);
  const sourceFont = fontkit.create(fontBytes);
  for (const bytes of [blank, filled.bytes]) {
    const doc = await PDFDocument.load(bytes);
    const verified = new Set();
    for (const [, object] of doc.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFDict) || object.lookup(PDFName.of('Subtype'))?.toString() !== '/Type0') continue;
      const cmap = object.lookup(PDFName.of('ToUnicode'));
      const descendant = object.lookup(PDFName.of('DescendantFonts'))?.lookup(0);
      const stream = descendant?.lookup(PDFName.of('FontDescriptor'))?.lookup(PDFName.of('FontFile2'));
      if (!cmap || !stream) continue;
      const embedded = fontkit.create(Buffer.from(decodePDFRawStream(stream).decode()));
      const mappings = Buffer.from(decodePDFRawStream(cmap).decode()).toString();
      for (const match of mappings.matchAll(/<([0-9A-Fa-f]+)>\s+<([0-9A-Fa-f]+)>/g)) {
        const codepoint = parseInt(match[2], 16);
        if (!'가나문lA'.includes(String.fromCodePoint(Math.min(codepoint, 0x10ffff)))) continue;
        const glyph = embedded.getGlyph(parseInt(match[1], 16));
        assert.deepEqual(glyph.path.commands, sourceFont.glyphForCodePoint(codepoint).path.commands);
        verified.add(codepoint);
      }
    }
    assert(verified.size >= 3, 'The actual embedded CMap and font must expose Korean and Latin glyphs');
  }
});

function wordText(bytes) {
  const xml = new PizZip(bytes).file('word/document.xml').asText();
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  return Array.from(document.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 't')).map((item) => item.textContent).join('|');
}

async function rawPdf(fields = true) {
  const document = await PDFDocument.create();
  const page = document.addPage();
  if (fields) document.getForm().createTextField('body').addToPage(page, { x: 30, y: 30, width: 450, height: 100 });
  return document;
}

test('all eight blank templates match manifests and fill with their fictional examples', async (t) => {
  for (const definition of templateDefinitions) {
    for (const format of ['docx', 'pdf']) {
      await t.test(`${definition.category}-${format}`, async () => {
        const directory = path.join(skillRoot, 'assets/templates', `${definition.category}-${format}`);
        const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
        const values = JSON.parse(await readFile(path.join(directory, 'example-data.json'), 'utf8'));
        const input = await readFile(path.join(directory, manifest.file));
        const original = Buffer.from(input);
        const adapter = format === 'docx' ? docx : pdf;
        const observed = await adapter.inspect(input, { ...context, manifest });
        assert.equal(digest(input), manifest.sha256);
        assert.deepEqual(observed.fields.map(({ name, type, occurrences }) => ({ name, type, occurrences })), manifest.fields.map(({ name, type, occurrences }) => ({ name, type, occurrences })));
        if (format === 'pdf') {
          const blank = await PDFDocument.load(input);
          for (const field of blank.getForm().getFields()) {
            if (field instanceof PDFTextField) assert.equal(field.getText(), undefined);
            else assert.equal(field.isChecked(), false);
          }
        }
        const result = await adapter.fill(input, values, { ...context, manifest });
        assert.deepEqual(input, original);
        assert.notEqual(digest(result.bytes), digest(input));
        assert(result.checks.every((check) => check.status === 'pass'));
        assert((await adapter.validate(result.bytes, context)).checks.every((check) => check.status === 'pass'));
        if (format === 'docx') {
          assert(!wordText(result.bytes).includes('{{'));
          for (const value of Object.values(values)) {
            for (const line of value.split('\n').filter(Boolean)) assert(wordText(result.bytes).includes(line));
          }
          const outputZip = new PizZip(result.bytes);
          const inputZip = new PizZip(input);
          for (const [name, entry] of Object.entries(inputZip.files)) {
            if (name !== 'word/document.xml' && !entry.dir) assert.deepEqual(outputZip.file(name).asUint8Array(), entry.asUint8Array());
          }
        } else {
          const saved = await PDFDocument.load(result.bytes);
          for (const field of saved.getForm().getFields()) {
            assert.equal(field instanceof PDFTextField ? field.getText() : field.isChecked(), values[field.getName()]);
          }
        }
      });
    }
  }
});

test('DOCX joins split runs, counts repeated names and preserves styles and unrelated binary parts', async () => {
  const inputZip = new PizZip(createDocxTemplate(oneField));
  let xml = inputZip.file('word/document.xml').asText();
  xml = xml.replace('<w:r><w:t xml:space="preserve">{{body}}</w:t></w:r>', '<w:r><w:rPr><w:b/></w:rPr><w:t>{{bo</w:t></w:r><w:r><w:t>dy}}</w:t></w:r><w:r><w:t> / {{body}}</w:t></w:r>');
  inputZip.file('word/document.xml', xml);
  const imageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jYt0AAAAASUVORK5CYII=', 'base64');
  inputZip.file('word/media/pixel.png', imageBytes);
  const input = inputZip.generate({ type: 'uint8array' });
  assert.deepEqual((await docx.inspect(input)).fields, [{ name: 'body', type: 'text', occurrences: 2 }]);
  const body = '한글 & <확인> "인용"\n다음 줄 {{literal}}';
  const result = await docx.fill(input, { body });
  const outputZip = new PizZip(result.bytes);
  const outputXml = outputZip.file('word/document.xml').asText();
  assert(outputXml.includes('<w:b/>'));
  assert.equal((outputXml.match(/<w:br\s*\/>/g) ?? []).length, 2);
  assert.equal(wordText(result.bytes).split('한글 & <확인> "인용"').length - 1, 2);
  assert.deepEqual(outputZip.file('word/media/pixel.png').asUint8Array(), new Uint8Array(imageBytes));
  assert.equal(outputZip.file('word/styles.xml').asText(), inputZip.file('word/styles.xml').asText());
});

test('DOCX rejects expression, loop, raw XML, delimiter changes and cross-paragraph fields during inspect', async () => {
  for (const marker of ['{{body.toUpperCase()}}', '{{#body}}x{{/body}}', '{{@body}}', '{{=<< >>=}}', '{{body + 1}}', '{{body']) {
    const inputZip = new PizZip(createDocxTemplate(oneField));
    inputZip.file('word/document.xml', inputZip.file('word/document.xml').asText().replace('{{body}}', marker.replaceAll('<', '&lt;').replaceAll('>', '&gt;')));
    await assert.rejects(() => docx.inspect(inputZip.generate({ type: 'uint8array' })), (error) => ['E_UNSUPPORTED', 'E_FIELDS'].includes(error.code));
  }
  const inputZip = new PizZip(createDocxTemplate(oneField));
  inputZip.file('word/document.xml', inputZip.file('word/document.xml').asText().replace('{{body}}', '{{bo</w:t></w:r></w:p><w:p><w:r><w:t>dy}}'));
  await rejected(() => docx.inspect(inputZip.generate({ type: 'uint8array' })), 'E_FIELDS');
});

test('DOCX rejects missing, extra and non-text values without mutating input', async () => {
  const input = createDocxTemplate(oneField);
  const before = digest(input);
  for (const values of [{}, { body: '정상', unexpected: '값' }, { body: true }, { body: '\u0000' }]) {
    await rejected(() => docx.fill(input, values), 'E_FIELDS');
    assert.equal(digest(input), before);
  }
});

test('DOCX rejects non-DOCX, malformed XML, macro content type and metadata fields', async () => {
  await rejected(() => docx.inspect(Buffer.from('not a document')), 'E_INPUT');
  const inputZip = new PizZip(createDocxTemplate(oneField));
  inputZip.file('word/document.xml', inputZip.file('word/document.xml').asText().replace('</w:body>', '</w:wrong>'));
  await rejected(() => docx.validate(inputZip.generate({ type: 'uint8array' })), 'E_INPUT');
  const macroZip = new PizZip(createDocxTemplate(oneField));
  macroZip.file('[Content_Types].xml', macroZip.file('[Content_Types].xml').asText().replace('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml', 'application/vnd.ms-word.document.macroEnabled.main+xml'));
  await rejected(() => docx.inspect(macroZip.generate({ type: 'uint8array' })), 'E_UNSUPPORTED');
  const metadataZip = new PizZip(createDocxTemplate(oneField));
  metadataZip.file('docProps/core.xml', metadataZip.file('docProps/core.xml').asText().replace('<dc:title>시험 문서</dc:title>', '<dc:title>{{metadata}}</dc:title>'));
  await rejected(() => docx.inspect(metadataZip.generate({ type: 'uint8array' })), 'E_UNSUPPORTED');
});

test('DOCX without explicit fields is inspectable but cannot be reported as filled', async () => {
  const inputZip = new PizZip(createDocxTemplate(oneField));
  inputZip.file('word/document.xml', inputZip.file('word/document.xml').asText().replace('{{body}}', '일반 본문'));
  const input = inputZip.generate({ type: 'uint8array' });
  assert.deepEqual((await docx.inspect(input)).fields, []);
  await rejected(() => docx.fill(input, {}), 'E_FIELDS');
});

test('PDF rereads Korean and line breaks and embeds Unicode font in actual appearance streams', async () => {
  const input = await createPdfTemplate(oneField, fontBytes);
  const original = digest(input);
  const body = '한글 & <확인>\n두 번째 줄';
  const result = await pdf.fill(input, { body }, context);
  assert.equal(digest(input), original);
  const document = await PDFDocument.load(result.bytes);
  const field = document.getForm().getTextField('body');
  assert.equal(field.getText(), body);
  assert(field.isMultiline());
  const appearance = field.acroField.getWidgets()[0].getAppearances().normal;
  assert(appearance instanceof PDFStream);
  const operations = Buffer.from(decodePDFRawStream(appearance).decode()).toString('ascii');
  assert((operations.match(/ Tj/g) ?? []).length >= 2);
  const fonts = appearance.dict.lookup(PDFName.of('Resources'), PDFDict).lookup(PDFName.of('Font'), PDFDict);
  const font = fonts.lookup(fonts.keys()[0], PDFDict);
  const toUnicode = font.lookup(PDFName.of('ToUnicode'));
  const cmap = Buffer.from(decodePDFRawStream(toUnicode).decode()).toString('ascii');
  assert.match(cmap.toLowerCase(), /d55c/);
  assert.match(cmap.toLowerCase(), /ae00/);
  const descendant = font.lookup(PDFName.of('DescendantFonts'), PDFArray).lookup(0, PDFDict);
  const embedded = descendant.lookup(PDFName.of('FontDescriptor'), PDFDict).lookup(PDFName.of('FontFile2'));
  assert(embedded.getContents().length > 100);
});

test('PDF preserves page content streams when filling fields', async () => {
  const input = await createPdfTemplate(oneField, fontBytes);
  const original = await PDFDocument.load(input);
  const result = await pdf.fill(input, { body: '새로운 내용' }, context);
  const saved = await PDFDocument.load(result.bytes);
  const streams = (document) => {
    const contents = document.getPage(0).node.Contents();
    if (contents instanceof PDFArray) return Array.from({ length: contents.size() }, (_, index) => Buffer.from(contents.lookup(index).getContents()).toString('base64'));
    return [Buffer.from(contents.getContents()).toString('base64')];
  };
  assert.deepEqual(streams(saved), streams(original));
});

test('PDF checkbox true and false survive reload with matching appearance states', async () => {
  const definition = { ...oneField, category: 'application' };
  const input = await createPdfTemplate(definition, fontBytes);
  for (const confirmed of [true, false]) {
    const result = await pdf.fill(input, { body: '확인 예시', confirmed }, context);
    const saved = await PDFDocument.load(result.bytes);
    const checkbox = saved.getForm().getCheckBox('confirmed');
    assert.equal(checkbox.isChecked(), confirmed);
    const widget = checkbox.acroField.getWidgets()[0];
    assert(widget.getAppearances().normal.lookup(widget.getAppearanceState()) instanceof PDFStream);
  }
});

test('PDF rejects missing, unknown and wrong-type values and unsupported glyphs', async () => {
  const input = await createPdfTemplate(oneField, fontBytes);
  for (const values of [{}, { body: true }, { body: '값', extra: '값' }, { body: '\u0000' }]) {
    await rejected(() => pdf.fill(input, values, context), 'E_FIELDS');
  }
  await rejected(() => pdf.fill(input, { body: '시험 🦄' }, context), 'E_UNSUPPORTED');
});

test('PDF rejects text overflow and newlines in single-line fields', async () => {
  const definition = { ...oneField, fields: [{ ...oneField.fields[0], height: 24, multiline: false }] };
  const input = await createPdfTemplate(definition, fontBytes);
  await rejected(() => pdf.fill(input, { body: '첫 줄\n둘째 줄' }, context), 'E_FIELDS');
  await rejected(() => pdf.fill(input, { body: '가'.repeat(100) }, context), 'E_FIELDS');
  const multiline = await createPdfTemplate(oneField, fontBytes);
  await rejected(() => pdf.fill(multiline, { body: Array.from({ length: 35 }, () => '한 줄').join('\n') }, context), 'E_FIELDS');
});

test('PDF refuses XFA, actual signatures, actions and encryption declarations', async () => {
  const xfa = await rawPdf();
  xfa.getForm().acroForm.dict.set(PDFName.of('XFA'), PDFString.of('<xfa/>'));
  await rejected(() => xfa.save({ updateFieldAppearances: false }).then((bytes) => pdf.inspect(bytes)), 'E_UNSUPPORTED');
  const signed = await rawPdf();
  signed.getForm().getTextField('body').acroField.dict.set(PDFName.of('FT'), PDFName.of('Sig'));
  signed.getForm().getField('body').acroField.dict.set(PDFName.of('V'), signed.context.obj({ Type: 'Sig', ByteRange: [0, 10, 20, 30] }));
  await rejected(() => signed.save({ updateFieldAppearances: false }).then((bytes) => pdf.inspect(bytes)), 'E_UNSUPPORTED');
  const active = await rawPdf();
  active.addJavaScript('test', 'void 0');
  await rejected(() => active.save().then((bytes) => pdf.inspect(bytes)), 'E_UNSUPPORTED');
  const encrypted = await rawPdf();
  encrypted.context.trailerInfo.Encrypt = encrypted.context.register(encrypted.context.obj({ Filter: 'Standard', V: 1, R: 2, P: -4 }));
  await rejected(() => encrypted.save().then((bytes) => pdf.inspect(bytes)), 'E_UNSUPPORTED');
});

test('PDF rejects non-PDF, truncated files, absent fields and unsupported field types', async () => {
  await rejected(() => pdf.inspect(Buffer.from('not pdf')), 'E_INPUT');
  const input = await createPdfTemplate(oneField, fontBytes);
  await rejected(() => pdf.inspect(input.subarray(0, input.length - 20)), 'E_INPUT');
  const noFields = await rawPdf(false);
  const blankBytes = await noFields.save();
  assert.deepEqual((await pdf.inspect(blankBytes)).fields, []);
  await rejected(() => pdf.fill(blankBytes, {}, context), 'E_FIELDS');
  const dropdown = await rawPdf(false);
  const field = dropdown.getForm().createDropdown('choice');
  field.addOptions(['one', 'two']);
  field.addToPage(dropdown.getPage(0), { x: 20, y: 20, width: 200, height: 30 });
  await rejected(() => dropdown.save().then((bytes) => pdf.inspect(bytes)), 'E_UNSUPPORTED');
});

test('PDF validation detects missing appearance after value storage', async () => {
  const input = await createPdfTemplate(oneField, fontBytes);
  const result = await pdf.fill(input, { body: '한글 값' }, context);
  const document = await PDFDocument.load(result.bytes);
  document.getForm().getTextField('body').acroField.getWidgets()[0].dict.delete(PDFName.of('AP'));
  const broken = await document.save({ updateFieldAppearances: false });
  await rejected(() => pdf.validate(broken), 'E_PRESERVATION');
});

test('PDF refuses duplicate logical fields and fields not displayed on a page', async () => {
  const duplicated = await rawPdf();
  const second = duplicated.getForm().createTextField('other');
  second.addToPage(duplicated.getPage(0), { x: 30, y: 160, width: 300, height: 40 });
  second.acroField.dict.set(PDFName.of('T'), PDFString.of('body'));
  await rejected(() => duplicated.save().then((bytes) => pdf.inspect(bytes)), 'E_FIELDS');
  const orphan = await rawPdf(false);
  orphan.getForm().createTextField('orphan');
  await rejected(() => orphan.save().then((bytes) => pdf.inspect(bytes)), 'E_UNSUPPORTED');
});

test('redistributed font and license match recorded hashes', async () => {
  const source = JSON.parse(await readFile(path.join(skillRoot, 'assets/fonts/SOURCES.json'), 'utf8'));
  const license = await readFile(path.join(skillRoot, 'licenses/NanumGothic-OFL.txt'));
  assert.equal(digest(fontBytes), source.sha256);
  assert.equal(digest(license), source.licenseSha256);
  assert.match(license.toString('utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
});
