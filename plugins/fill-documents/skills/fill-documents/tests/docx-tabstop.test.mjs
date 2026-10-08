import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';
import { DOMParser } from '@xmldom/xmldom';
import { fillDocument, inspectFile } from '../lib/engine.mjs';
import { createDocxTemplate } from '../scripts/generate-office-templates.mjs';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const stops = '<w:tabs><w:tab w:val="left" w:pos="360"/><w:tab w:val="right" w:pos="720"/></w:tabs>';
const sourceParagraph = '<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:t xml:space="preserve">{{body}}</w:t></w:r></w:p>';

async function fixture(t, contents) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fill-tabstop-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const zip = new PizZip(createDocxTemplate({ title: '탭 정지점 회귀', fields: [{ name: 'body', label: '답변', height: 100 }] }));
  const original = zip.file('word/document.xml').asText();
  assert(original.includes(sourceParagraph));
  zip.file('word/document.xml', original.replace(sourceParagraph,
    `<w:p><w:pPr><w:pStyle w:val="Normal"/>${stops}</w:pPr>${contents}</w:p>`));
  const target = path.join(root, 'source.docx');
  const bytes = zip.generate({ type: 'nodebuffer' });
  await fs.writeFile(target, bytes);
  return { bytes, target, output: path.join(root, 'filled.docx') };
}

function readXml(bytes) {
  return new DOMParser().parseFromString(new PizZip(bytes).file('word/document.xml').asText(), 'application/xml');
}

for (const withRealTabs of [false, true]) {
  test(`DOCX flow preserves tab stops without counting them as text (${withRealTabs ? 'real tabs retained' : 'no text tabs'})`, async t => {
    const f = await fixture(t, `<w:r>${withRealTabs ? '<w:tab/>' : ''}<w:t>{{body}}</w:t></w:r>`);
    const value = withRealTabs ? '첫 문단\n둘째\t문단' : '첫 문단\n둘째 문단';
    const report = await fillDocument({ ...f, skillRoot, values: { body: value }, overflow: 'flow' });
    assert(report.checks.some(check => check.name === 'field-values-reread' && check.status === 'pass'));
    const saved = readXml(await fs.readFile(f.output));
    const tabs = Array.from(saved.getElementsByTagNameNS(W, 'tab'));
    const settings = tabs.filter(node => node.parentNode.localName === 'tabs');
    assert.equal(settings.length, 4, 'Both paragraphs retain both original tab stops.');
    assert.deepEqual(settings.map(node => [node.getAttributeNS(W, 'val'), node.getAttributeNS(W, 'pos')]),
      [['left', '360'], ['right', '720'], ['left', '360'], ['right', '720']]);
    assert.equal(tabs.filter(node => node.parentNode.localName === 'r').length, withRealTabs ? 2 : 0);
    const answers = Array.from(saved.getElementsByTagNameNS(W, 'p')).filter(node => node.getElementsByTagNameNS(W, 'tabs').length === 1);
    const answerText = answers.map(paragraph => Array.from(paragraph.getElementsByTagNameNS(W, 'r')).map(run =>
      Array.from(run.childNodes).map(node => node.localName === 't' ? node.textContent : node.localName === 'tab' ? '\t' : ['br', 'cr'].includes(node.localName) ? '\n' : '').join('')).join(''));
    assert.deepEqual(answerText, withRealTabs ? ['\t첫 문단', '둘째\t문단'] : ['첫 문단', '둘째 문단']);
    assert(!saved.documentElement.textContent.includes('{{body}}'));
    assert(saved.documentElement.textContent.includes('첫 문단'));
    assert(saved.documentElement.textContent.includes('둘째'));
    assert.deepEqual(await fs.readFile(f.target), f.bytes, 'The original file is unchanged.');
    const output = new PizZip(await fs.readFile(f.output));
    const before = new PizZip(f.bytes);
    for (const [name, entry] of Object.entries(before.files)) {
      if (!entry.dir && name !== 'word/document.xml') assert.deepEqual(output.file(name).asNodeBuffer(), entry.asNodeBuffer(), name);
    }
  });
}

test('DOCX keeps reading field text in real runs under an inline wrapper', async t => {
  const f = await fixture(t, '<w:hyperlink w:anchor="details"><w:r><w:t>{{bo</w:t></w:r><w:r><w:t>dy}}</w:t></w:r></w:hyperlink>');
  assert.deepEqual((await inspectFile(f.target, skillRoot)).fields.map(field => field.name), ['body']);
  await fillDocument({ ...f, skillRoot, values: { body: '확정 응답' } });
  const xml = readXml(await fs.readFile(f.output));
  const wrapper = xml.getElementsByTagNameNS(W, 'hyperlink')[0];
  assert.equal(wrapper.textContent, '확정 응답');
  assert.equal(xml.getElementsByTagNameNS(W, 'tabs').length, 1);
});
