import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import { markdownToHwpx } from 'kordoc';
import * as docx from '../lib/adapters/docx.mjs';
import * as hwpx from '../lib/adapters/hwpx.mjs';
import { ancestor, scanXml } from '../lib/adapters/hancom-utils.mjs';
import { createDocxTemplate } from '../scripts/generate-office-templates.mjs';

const definition = { category: 'test', title: '흐름 검사', fields: [{ name: 'body', label: '보존할 라벨', height: 100 }] };
const flow = { overflow: 'flow' };
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = (xml, node) => xml.slice(node.start, node.end);
const xmlOf = (bytes, path = 'word/document.xml') => new PizZip(bytes).file(path).asText();
const rejectLayout = error => { assert.equal(error.code, 'E_LAYOUT'); assert.equal(error.details.field, 'body'); assert.ok(error.details.reason); return true; };

function modify(bytes, path, transform) {
  const zip = new PizZip(bytes);
  zip.file(path, transform(zip.file(path).asText()));
  return zip.generate({ type: 'uint8array' });
}

function wordFixture(transform = value => value) {
  return modify(createDocxTemplate(definition), 'word/document.xml', transform);
}

function wordParagraphs(xml) {
  const nodes = scanXml(xml);
  return nodes.filter(node => node.local === 'p').map(paragraph => nodes.filter(node => ancestor(node, item => item.local === 'p') === paragraph && node.parent?.namespace === W && node.parent.local === 'r').map(node => node.local === 't' ? node.element.textContent : ['br', 'cr'].includes(node.local) ? '\n' : node.local === 'tab' ? '\t' : '').join(''));
}

function assertOtherParts(before, after, changed) {
  const original = new PizZip(before);
  const result = new PizZip(after);
  assert.deepEqual(Object.keys(result.files).sort(), Object.keys(original.files).sort());
  for (const [path, entry] of Object.entries(original.files)) if (!entry.dir && !changed.includes(path)) assert.deepEqual(result.file(path).asUint8Array(), entry.asUint8Array(), path);
}

test('DOCX flow keeps original fixed horizontal properties, relaxes exact height, and preserves every character', async () => {
  const input = wordFixture(xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblLayout w:type="fixed"/><w:tblInd w:w="24" w:type="dxa"/>').replace('w:hRule="atLeast"', 'w:hRule="exact"'));
  const originalHash = hash(input);
  const value = `${'가나다라마바사'.repeat(350)}\r\n${'abcdefghij'.repeat(350)}\t마지막 표식`;
  const result = await docx.fill(input, { body: value }, flow);
  const before = xmlOf(input);
  const after = xmlOf(result.bytes);
  const beforeNodes = scanXml(before);
  const afterNodes = scanXml(after);
  for (const kind of ['tblPr', 'tblGrid', 'tcPr']) assert.deepEqual(afterNodes.filter(node => node.local === kind).map(node => raw(after, node)), beforeNodes.filter(node => node.local === kind).map(node => raw(before, node)));
  assert.match(after, /w:hRule="atLeast"/);
  assert.match(after, /<w:cantSplit w:val="0"\/>/);
  assert.match(after, /<w:keepNext w:val="0"\/>/);
  assert.match(after, /<w:keepLines w:val="0"\/>/);
  assert.deepEqual(wordParagraphs(after), wordParagraphs(before).flatMap(text => text.replace('{{body}}', value.replaceAll('\r\n', '\n')).split('\n')));
  assertOtherParts(input, result.bytes, ['word/document.xml']);
  assert.equal(hash(input), originalHash);
  assert.equal(result.layout.pagination.status, 'not-performed');
  assert.equal(result.visualValidation, 'not-performed');
  assert.ok(!result.layout.changedContainers[0].changes.includes('fix-declared-grid-width'));
});

test('DOCX preserve keeps exact heights and existing compression settings', async () => {
  const input = wordFixture(xml => xml.replace('w:hRule="atLeast"', 'w:hRule="exact"').replace('<w:tcPr>', '<w:tcPr><w:tcFitText/>'));
  const result = await docx.fill(input, { body: '가'.repeat(3000) });
  assert.match(xmlOf(result.bytes), /w:hRule="exact"/);
  assert.match(xmlOf(result.bytes), /<w:tcFitText\/>/);
  assert.equal(result.layout, undefined);
});

test('DOCX flow fixes only a consistent AutoFit declared grid', async () => {
  const input = wordFixture();
  const result = await docx.fill(input, { body: '무공백'.repeat(500) }, flow);
  assert.match(xmlOf(result.bytes), /<w:tblLayout w:type="fixed"\/>/);
  assert.match(xmlOf(result.bytes), /<w:tblW w:w="9320" w:type="dxa"\/>/);
  assert.ok(result.layout.changedContainers[0].changes.includes('fix-declared-grid-width'));
  assertOtherParts(input, result.bytes, ['word/document.xml']);
});

test('DOCX flow overrides existing keepLines and exact row height in schema order', async () => {
  const input = wordFixture(xml => xml.replace('<w:pStyle w:val="Normal"/>', '<w:pStyle w:val="Normal"/><w:keepLines/>').replace('<w:cantSplit/>', '').replace('w:hRule="atLeast"', 'w:hRule="exact"'));
  const result = await docx.fill(input, { body: '첫째\n둘째' }, flow);
  const xml = xmlOf(result.bytes);
  assert.match(xml, /<w:keepNext w:val="0"\/><w:keepLines w:val="0"\/>/);
  assert.match(xml, /<w:cantSplit w:val="0"\/><w:trHeight w:val="1400" w:hRule="atLeast"\/>/);
  assert.ok(wordParagraphs(xml).join('\n').includes('첫째\n둘째'));
});

test('DOCX flow reads Word attributes by namespace and preserves aliases when changing them', async () => {
  let input = wordFixture(xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblLayout w:type="fixed"/><w:tblInd w:w="24" w:type="dxa"/>').replace('w:hRule="atLeast"', 'w:hRule="exact"').replace('<w:cantSplit/>', '<w:cantSplit w:val="1"/>').replace('<w:pStyle w:val="Normal"/>', '<w:pStyle w:val="Normal"/><w:keepLines w:val="1"/>'));
  const alias = xml => xml.replace(/(<w:(?:document|styles)) /, `$1 xmlns:x="${W}" `).replace(/(\s)w:([\w]+)=/g, '$1x:$2=');
  input = modify(modify(input, 'word/document.xml', alias), 'word/styles.xml', alias);
  const result = await docx.fill(input, { body: '첫째\n둘째' }, flow);
  const xml = xmlOf(result.bytes);
  assert.match(xml, /<w:tblLayout x:type="fixed"\/>/);
  assert.match(xml, /<w:trHeight x:val="1400" x:hRule="atLeast"\/>/);
  assert.match(xml, /<w:cantSplit x:val="0"\/>/);
  assert.match(xml, /<w:keepLines x:val="0"\/>/);
  assert.ok(!result.layout.changedContainers[0].changes.includes('fix-declared-grid-width'));
  assertOtherParts(input, result.bytes, ['word/document.xml']);
  assert.ok(wordParagraphs(xml).join('\n').includes('첫째\n둘째'));
});

test('DOCX flow rejects aliased style references and defaults that reach compression', async t => {
  for (const prefix of ['w', 'x']) await t.test(`run style ${prefix}`, async () => {
    let input = wordFixture(xml => xml.replace('<w:document ', `<w:document xmlns:x="${W}" `).replace('<w:r><w:t xml:space="preserve">{{body}}', `<w:r><w:rPr><w:rStyle ${prefix}:val="Risk"/></w:rPr><w:t xml:space="preserve">{{body}}`));
    input = modify(input, 'word/styles.xml', xml => xml.replace('<w:styles ', `<w:styles xmlns:x="${W}" `).replace('</w:styles>', '<w:style x:type="character" x:styleId="Risk"><w:basedOn x:val="RiskBase"/></w:style><w:style x:type="character" x:styleId="RiskBase"><w:rPr><w:fitText x:val="100"/></w:rPr></w:style></w:styles>'));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), error => rejectLayout(error) && error.details.reason === 'text-compression');
  });
  await t.test('aliased default', async () => {
    const input = modify(wordFixture(), 'word/styles.xml', xml => xml.replace('<w:styles ', `<w:styles xmlns:x="${W}" `).replace('</w:styles>', '<w:style x:type="character" x:default="1" x:styleId="Risk"><w:rPr><w:fitText x:val="100"/></w:rPr></w:style></w:styles>'));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), error => rejectLayout(error) && error.details.reason === 'text-compression');
  });
  await t.test('foreign attribute is not a Word reference', async () => {
    const input = wordFixture(xml => xml.replace('<w:r><w:t xml:space="preserve">{{body}}', '<w:r><w:rPr><w:rStyle xmlns:x="urn:unrelated" x:val="Risk"/></w:rPr><w:t xml:space="preserve">{{body}}'));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), error => rejectLayout(error) && error.details.reason === 'ambiguous-style');
  });
});

test('DOCX flow reads aliased AutoFit grid and section dimensions', async () => {
  const input = wordFixture(xml => xml.replace('<w:document ', `<w:document xmlns:x="${W}" `).replace(/(\s)w:([\w]+)=/g, '$1x:$2='));
  const result = await docx.fill(input, { body: '긴 값' }, flow);
  const xml = xmlOf(result.bytes);
  assert.match(xml, /<w:tblLayout w:type="fixed"\/>/);
  assert.match(xml, /<w:tblW x:w="9320" x:type="dxa"\/>/);
  assert.ok(result.layout.changedContainers[0].changes.includes('fix-declared-grid-width'));
});

test('DOCX flow rejects layout and width row exceptions even when tblPr is fixed', async t => {
  for (const exception of ['<w:tblLayout w:type="autofit"/>', '<w:tblLayout/>', '<w:tblLayout w:type="fixed"/>', '<w:tblW w:w="5000" w:type="pct"/>', '<w:tblPrExChange w:id="1"/>']) await t.test(exception, async () => {
    const input = wordFixture(xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblLayout w:type="fixed"/>').replace('<w:tr>', `<w:tr><w:tblPrEx>${exception}</w:tblPrEx>`));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), error => rejectLayout(error) && error.details.reason === 'unsupported-row-exception');
  });
});

test('DOCX flow inserts trPr after an appearance-only tblPrEx and preserves that exception', async t => {
  for (const fixed of [false, true]) await t.test(fixed ? 'fixed' : 'AutoFit', async () => {
    const exception = '<w:tblPrEx><w:shd w:fill="EEEEEE"/></w:tblPrEx>';
    const input = wordFixture(xml => xml.replace('<w:tblPr>', fixed ? '<w:tblPr><w:tblLayout w:type="fixed"/>' : '<w:tblPr>').replace(/<w:trPr>[\s\S]*?<\/w:trPr>/, '').replace('<w:tr>', `<w:tr>${exception}`));
    const result = await docx.fill(input, { body: '긴 값' }, flow);
    const xml = xmlOf(result.bytes);
    const row = scanXml(xml).find(node => node.local === 'tr');
    assert.deepEqual(row.children.map(node => node.local), ['tblPrEx', 'trPr', 'tc', 'tc']);
    assert.equal(raw(xml, row.children[0]), exception);
    assertOtherParts(input, result.bytes, ['word/document.xml']);
  });
});

test('DOCX flow rejects vertical direction values including the Office 2010 lr value', async t => {
  for (const direction of ['lr', 'btLr', 'tbRl', 'rl', 'lrTbV', 'tbV']) await t.test(direction, async () => {
    const input = wordFixture(xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblLayout w:type="fixed"/>').replace('<w:tcW w:w="7720"', `<w:textDirection w:val="${direction}"/><w:tcW w:w="7720"`));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), error => rejectLayout(error) && error.details.reason === 'vertical-text');
  });
  for (const direction of ['lrTb', 'tb']) await t.test(`horizontal ${direction}`, async () => {
    const input = wordFixture(xml => xml.replace('<w:tcW w:w="7720"', `<w:textDirection w:val="${direction}"/><w:tcW w:w="7720"`));
    const result = await docx.fill(input, { body: '긴 값' }, flow);
    assert.ok(wordParagraphs(xmlOf(result.bytes)).includes('긴 값'));
  });
});

test('DOCX flow checks the selected body or fixed table section direction, including a paragraph-owned sectPr', async t => {
  for (const container of ['body', 'table', 'paragraph section']) await t.test(container, async () => {
    const input = wordFixture(xml => {
      if (container === 'table') return xml.replace('<w:tblPr>', '<w:tblPr><w:tblLayout w:type="fixed"/>').replace('</w:sectPr>', '<w:textDirection w:val="tbRl"/></w:sectPr>');
      const paragraph = container === 'paragraph section' ? '<w:p><w:pPr><w:sectPr><w:textDirection w:val="tbRl"/></w:sectPr></w:pPr><w:r><w:t>{{body}}</w:t></w:r></w:p>' : '<w:p><w:r><w:t>{{body}}</w:t></w:r></w:p>';
      const result = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/, paragraph);
      return container === 'body' ? result.replace('</w:sectPr>', '<w:textDirection w:val="tbRl"/></w:sectPr>') : result;
    });
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), error => rejectLayout(error) && error.details.reason === 'vertical-text');
  });
  await t.test('vertical later section does not reject this section', async () => {
    const input = wordFixture(xml => xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/, '<w:p><w:pPr><w:sectPr><w:textDirection w:val="lrTb"/></w:sectPr></w:pPr><w:r><w:t>{{body}}</w:t></w:r></w:p>').replace('<w:pgSz', '<w:textDirection w:val="tbRl"/><w:pgSz'));
    const result = await docx.fill(input, { body: '긴 값' }, flow);
    assert.ok(wordParagraphs(xmlOf(result.bytes)).includes('긴 값'));
  });
});

test('DOCX flow rejects ambiguous AutoFit grids and horizontal space without changing the input', async t => {
  const mutations = {
    'missing grid': xml => xml.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/, ''),
    'zero grid': xml => xml.replace('<w:gridCol w:w="1600"/>', '<w:gridCol w:w="0"/>'),
    'grid change': xml => xml.replace('</w:tblGrid>', '<w:tblGridChange w:id="1"/></w:tblGrid>'),
    'mismatched cell': xml => xml.replace('<w:tcW w:w="1600"', '<w:tcW w:w="1601"'),
    'percent width': xml => xml.replace('<w:tblW w:w="9320" w:type="dxa"/>', '<w:tblW w:w="5000" w:type="pct"/>'),
    'different width': xml => xml.replace('<w:tblW w:w="9320"', '<w:tblW w:w="9400"'),
    'nonzero auto width': xml => xml.replace('<w:tblW w:w="9320" w:type="dxa"/>', '<w:tblW w:w="1" w:type="auto"/>'),
    'outside body': xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblInd w:w="1" w:type="dxa"/>'),
    'two columns': xml => xml.replace('<w:sectPr>', '<w:sectPr><w:cols w:num="2"/>'),
    'row spacing': xml => xml.replace('<w:trPr>', '<w:trPr><w:tblCellSpacing w:w="20" w:type="dxa"/>'),
    'row grid before': xml => xml.replace('<w:trPr>', '<w:trPr><w:gridBefore w:val="1"/>'),
  };
  for (const [name, transform] of Object.entries(mutations)) await t.test(name, async () => {
    const input = wordFixture(transform);
    const before = hash(input);
    await assert.rejects(docx.fill(input, { body: '가'.repeat(3000) }, flow), rejectLayout);
    assert.equal(hash(input), before);
  });
});

test('DOCX flow rejects compression, no-wrap, merge, floating and vertical target containers', async t => {
  const mutations = {
    'cell fit': xml => xml.replace('<w:tcW w:w="7720"', '<w:tcFitText/><w:tcW w:w="7720"'),
    'cell no wrap': xml => xml.replace('<w:tcW w:w="7720"', '<w:noWrap/><w:tcW w:w="7720"'),
    'run fit zero is still a width': xml => xml.replace('<w:r><w:t xml:space="preserve">{{body}}', '<w:r><w:rPr><w:fitText w:val="0"/></w:rPr><w:t xml:space="preserve">{{body}}'),
    'vertical cell': xml => xml.replace('<w:tcW w:w="7720"', '<w:textDirection w:val="tbRl"/><w:tcW w:w="7720"'),
    'vertical merge': xml => xml.replace('<w:tcW w:w="7720"', '<w:vMerge w:val="restart"/><w:tcW w:w="7720"'),
    'floating table': xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblpPr w:tblpX="0"/>'),
    'fixed paragraph': xml => xml.replace('<w:pStyle w:val="Normal"/>', '<w:pStyle w:val="Normal"/><w:framePr w:h="200"/>'),
    'nested table': xml => xml.replace('<w:p><w:pPr><w:pStyle w:val="Normal"/>', '<w:tbl><w:tr><w:tc><w:p><w:pPr><w:pStyle w:val="Normal"/>').replace('{{body}}</w:t></w:r></w:p>', '{{body}}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'),
  };
  for (const [name, transform] of Object.entries(mutations)) await t.test(name, async () => {
    const input = wordFixture(xml => transform(xml.replace('<w:tblPr>', '<w:tblPr><w:tblLayout w:type="fixed"/>')));
    await assert.rejects(docx.fill(input, { body: '가'.repeat(3000) }, flow), rejectLayout);
  });
});

test('DOCX flow follows reachable style chains, defaults, conditional table styles and all split-field runs', async t => {
  const tests = [
    ['paragraph style', '<w:style w:type="paragraph" w:styleId="Risk"><w:basedOn w:val="Normal"/><w:rPr><w:fitText w:val="0"/></w:rPr></w:style>', xml => xml.replace('<w:pStyle w:val="Normal"/>', '<w:pStyle w:val="Risk"/>')],
    ['character style', '<w:style w:type="character" w:styleId="Risk"><w:rPr><w:fitText w:val="50"/></w:rPr></w:style>', xml => xml.replace('<w:r><w:t xml:space="preserve">{{body}}', '<w:r><w:rPr><w:rStyle w:val="Risk"/></w:rPr><w:t xml:space="preserve">{{body}}')],
    ['conditional table style', '<w:style w:type="table" w:styleId="Risk"><w:tblStylePr w:type="firstRow"><w:tcPr><w:tcFitText/></w:tcPr></w:tblStylePr></w:style>', xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblStyle w:val="Risk"/>')],
    ['missing reference', '', xml => xml.replace('<w:pStyle w:val="Normal"/>', '<w:pStyle w:val="Missing"/>')],
    ['cyclic chain', '<w:style w:type="paragraph" w:styleId="Risk"><w:basedOn w:val="Risk"/></w:style>', xml => xml.replace('<w:pStyle w:val="Normal"/>', '<w:pStyle w:val="Risk"/>')],
  ];
  for (const [name, style, transform] of tests) await t.test(name, async () => {
    const input = modify(wordFixture(transform), 'word/styles.xml', xml => xml.replace('</w:styles>', `${style}</w:styles>`));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), rejectLayout);
  });
  await t.test('docDefaults', async () => {
    const input = modify(wordFixture(), 'word/styles.xml', xml => xml.replace('<w:rPr>', '<w:rPr><w:fitText w:val="0"/>'));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), rejectLayout);
  });
  await t.test('later split run', async () => {
    const input = wordFixture(xml => xml.replace('{{body}}</w:t>', '{{bo</w:t></w:r><w:r><w:rPr><w:fitText w:val="100"/></w:rPr><w:t>dy}}</w:t>'));
    await assert.rejects(docx.fill(input, { body: '긴 값' }, flow), rejectLayout);
  });
});

test('DOCX flow ignores unrelated dangerous styles and cells, and handles repeated split placeholders', async () => {
  let input = wordFixture(xml => xml.replace('<w:tcPr>', '<w:tcPr><w:noWrap/>').replace('{{body}}', '{{bo</w:t></w:r><w:r><w:t>dy}} / {{body}}'));
  input = modify(input, 'word/styles.xml', xml => xml.replace('</w:styles>', '<w:style w:type="paragraph" w:styleId="Unused"><w:rPr><w:fitText w:val="0"/></w:rPr></w:style></w:styles>'));
  const result = await docx.fill(input, { body: '새 내용\n둘째 줄' }, flow);
  assert.ok(wordParagraphs(xmlOf(result.bytes)).join('\n').includes('새 내용\n둘째 줄 / 새 내용\n둘째 줄'));
  assertOtherParts(input, result.bytes, ['word/document.xml']);
});

const tableSeed = new Uint8Array(await markdownToHwpx('| 항목 | 내용 |\n| --- | --- |\n| 라벨 | {{body}} |\n\n후속 보존 문단'));
const bodySeed = new Uint8Array(await markdownToHwpx('{{body}}\n\n후속 보존 문단'));
const sectionPath = 'Contents/section0.xml';

function hwpxTable() {
  return modify(tableSeed, sectionPath, xml => xml.replace('noShading="0"', 'noShading="0" noAdjust="0"').replace('treatAsChar="0"', 'treatAsChar="1"'));
}

test('HWPX flow changes only the verified inline anchor and line caches while preserving widths and cells', async () => {
  let input = hwpxTable();
  input = modify(input, sectionPath, xml => {
    const nodes = scanXml(xml);
    const table = nodes.find(node => node.local === 'tbl');
    const anchor = ancestor(table, node => node.local === 'p');
    return xml.slice(0, anchor.closeStart) + '<hp:linesegarray><hp:lineseg textpos="0" vertpos="0"/></hp:linesegarray>' + xml.slice(anchor.closeStart);
  });
  const oldHash = hash(input);
  const value = '참여자를 확인하고 교육 결과를 정리합니다.\n끝 표식';
  const result = await hwpx.fill(input, { body: value }, flow);
  const before = xmlOf(input, sectionPath);
  const after = xmlOf(result.bytes, sectionPath);
  assert.match(after, /treatAsChar="0"/);
  assert.ok(after.includes('끝 표식'));
  assert.ok(!after.includes('<hp:linesegarray>'));
  for (const kind of ['sz', 'cellSz', 'cellSpan']) assert.deepEqual(scanXml(after).filter(node => node.local === kind).map(node => raw(after, node)), scanXml(before).filter(node => node.local === kind).map(node => raw(before, node)));
  assertOtherParts(input, result.bytes, [sectionPath]);
  assert.equal(hash(input), oldHash);
  assert.equal(result.layout.changedContainers[0].changes.includes('inline-table-to-flow'), true);
});

test('HWPX existing block keeps its anchor and preserve keeps an inline anchor', async () => {
  const input = hwpxTable();
  const preserved = await hwpx.fill(input, { body: '가'.repeat(3000) });
  assert.match(xmlOf(preserved.bytes, sectionPath), /treatAsChar="1"/);
  const block = modify(input, sectionPath, xml => xml.replace('treatAsChar="1"', 'treatAsChar="0"'));
  const result = await hwpx.fill(block, { body: '교육 결과를 정리합니다.' }, flow);
  assert.equal(result.layout.changedContainers[0].changes.includes('existing-flow-table'), true);
  assert.match(xmlOf(result.bytes, sectionPath), /treatAsChar="0"/);
});

test('HWPX flow rejects each unsupported anchor or fixed/vertical/merged container', async t => {
  const changes = {
    flowWithText: ['1', '0'], allowOverlap: ['0', '1'], holdAnchorAndSO: ['0', '1'],
    vertRelTo: ['PARA', 'PAGE'], horzRelTo: ['COLUMN', 'PAGE'], vertAlign: ['TOP', 'BOTTOM'], horzAlign: ['LEFT', 'RIGHT'],
    vertOffset: ['0', '1'], horzOffset: ['0', '1'], textWrap: ['TOP_AND_BOTTOM', 'SQUARE'],
    pageBreak: ['CELL', 'NONE'], noAdjust: ['0', '1'], heightRelTo: ['ABSOLUTE', 'PAGE'],
  };
  for (const [attribute, [before, after]] of Object.entries(changes)) await t.test(attribute, async () => {
    const input = modify(hwpxTable(), sectionPath, xml => xml.replace(`${attribute}="${before}"`, `${attribute}="${after}"`));
    await assert.rejects(hwpx.fill(input, { body: '장문' }, flow), rejectLayout);
  });
  for (const [name, transform] of [
    ['missing property', xml => xml.replace(' flowWithText="1"', '')],
    ['missing noAdjust', xml => xml.replace(' noAdjust="0"', '')],
    ['size protected', xml => xml.replace('heightRelTo="ABSOLUTE" protect="0"', 'heightRelTo="ABSOLUTE" protect="1"')],
    ['target vertical', xml => xml.replaceAll('textDirection="HORIZONTAL"', 'textDirection="VERTICAL"')],
    ['merged target', xml => xml.replaceAll('rowSpan="1"', 'rowSpan="2"')],
  ]) await t.test(name, async () => await assert.rejects(hwpx.fill(modify(hwpxTable(), sectionPath, transform), { body: '장문' }, flow), rejectLayout));
});

test('HWPX flow clones a shared keep-style only for the selected paragraph', async () => {
  const input = modify(bodySeed, 'Contents/header.xml', xml => xml.replace('keepWithNext="0" keepLines="0"', 'keepWithNext="1" keepLines="1"'));
  const beforeXml = xmlOf(input, sectionPath);
  const beforeHeader = xmlOf(input, 'Contents/header.xml');
  const beforeStyles = scanXml(beforeHeader).filter(node => node.local === 'paraPr');
  const result = await hwpx.fill(input, { body: '긴 본문\n'.repeat(50) }, flow);
  const afterXml = xmlOf(result.bytes, sectionPath);
  const afterHeader = xmlOf(result.bytes, 'Contents/header.xml');
  const afterStyles = scanXml(afterHeader).filter(node => node.local === 'paraPr');
  assert.equal(afterStyles.length, beforeStyles.length + 1);
  for (const style of beforeStyles) assert.ok(afterHeader.includes(raw(beforeHeader, style)));
  const oldParagraphs = scanXml(beforeXml).filter(node => node.local === 'p');
  const newParagraphs = scanXml(afterXml).filter(node => node.local === 'p');
  assert.notEqual(newParagraphs[0].attrs.paraPrIDRef, oldParagraphs[0].attrs.paraPrIDRef);
  assert.equal(newParagraphs[1].attrs.paraPrIDRef, oldParagraphs[1].attrs.paraPrIDRef);
  assert.equal(raw(afterXml, newParagraphs[1]), raw(beforeXml, oldParagraphs[1]));
  assertOtherParts(input, result.bytes, [sectionPath, 'Contents/header.xml']);
  assert.ok(result.layout.changedContainers[0].changes.includes('clone-paragraph-flow-style'));
});

test('DOCX flow expands only input newlines and keeps run formatting, paragraph spacing, IDs, prefix and suffix', async () => {
  const input = wordFixture(xml => {
    xml = xml.replace('<w:document ', '<w:document xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" ');
    const target = scanXml(xml).find(node => node.local === 'p' && node.element.textContent.includes('{{body}}'));
    const replacement = '<w:p w14:paraId="12345678" w14:textId="87654321"><w:pPr><w:pageBreakBefore/><w:spacing w:before="120" w:after="120"/><w:jc w:val="both"/></w:pPr>' +
      '<w:r><w:rPr><w:i/></w:rPr><w:t>머리</w:t><w:br/><w:t>앞</w:t></w:r>' +
      '<w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:lastRenderedPageBreak/><w:t>{{bo</w:t></w:r>' +
      '<w:r><w:rPr><w:i/></w:rPr><w:t>dy}} / {{other}}</w:t></w:r>' +
      '<w:r><w:rPr><w:color w:val="123456"/></w:rPr><w:t> 꼬리</w:t><w:cr/><w:tab/></w:r></w:p>';
    return xml.slice(0, target.start) + replacement + xml.slice(target.end);
  });
  const before = xmlOf(input);
  const original = scanXml(before).filter(node => node.local === 'p');
  const sourceIndex = original.findIndex(node => node.element.textContent.includes('{{bo'));
  const result = await docx.fill(input, { body: '\n가나다\tEnglish\r\n\r\n끝\n', other: '보조1\n보조2' }, flow);
  const after = xmlOf(result.bytes);
  const output = scanXml(after).filter(node => node.local === 'p');
  const inserted = output.slice(sourceIndex, sourceIndex + 6);
  assert.deepEqual(wordParagraphs(after).slice(sourceIndex, sourceIndex + 6), ['머리\n앞', '가나다\tEnglish', '', '끝', ' / 보조1', '보조2 꼬리\n\t']);
  assert.equal(output.length, original.length + 5);
  assert.match(raw(after, inserted[0]), /w14:paraId="12345678"/);
  assert.match(raw(after, inserted[0]), /<w:pageBreakBefore\/>/);
  for (const paragraph of inserted) {
    const value = raw(after, paragraph);
    assert.match(value, /<w:spacing w:before="120" w:after="120"\/>/);
    assert.match(value, /<w:jc w:val="both"\/>/);
    assert.match(value, /<w:keepNext w:val="0"\/>/);
    assert.match(value, /<w:keepLines w:val="0"\/>/);
    assert.ok(!value.includes('lastRenderedPageBreak'));
  }
  for (const paragraph of inserted.slice(1)) {
    assert.match(raw(after, paragraph), /<w:pageBreakBefore w:val="0"\/>/);
    assert.ok(!raw(after, paragraph).includes('w14:paraId'));
    assert.ok(!raw(after, paragraph).includes('w14:textId'));
  }
  assert.match(raw(after, inserted[1]), /<w:rPr><w:b\/><w:sz w:val="18"\/><\/w:rPr>/);
  assert.match(raw(after, inserted.at(-1)), /<w:rPr><w:color w:val="123456"\/><\/w:rPr>/);
  assert.deepEqual(output.filter((_, index) => index < sourceIndex || index >= sourceIndex + 6).map(node => raw(after, node)), original.filter((_, index) => index !== sourceIndex).map(node => raw(before, node)));
  assertOtherParts(input, result.bytes, ['word/document.xml']);
});

test('DOCX multiline expansion rejects semantic boundaries while single-line numbered input stays supported', async t => {
  const changeTarget = transform => wordFixture(xml => {
    const target = scanXml(xml).find(node => node.local === 'p' && node.element.textContent.includes('{{body}}'));
    return xml.slice(0, target.start) + transform(raw(xml, target)) + xml.slice(target.end);
  });
  const cases = {
    numbering: text => text.replace('<w:pPr>', '<w:pPr><w:numPr><w:numId w:val="1"/></w:numPr>'),
    outline: text => text.replace('<w:pPr>', '<w:pPr><w:outlineLvl w:val="0"/>'),
    section: text => text.replace('<w:pPr>', '<w:pPr><w:sectPr/>'),
    bookmark: text => text.replace('<w:r>', '<w:bookmarkStart w:id="1" w:name="target"/><w:r>'),
    comment: text => text.replace('<w:r>', '<w:commentRangeStart w:id="1"/><w:r>'),
    hyperlink: text => text.replace('<w:r>', '<w:hyperlink w:anchor="local"><w:r>').replace('</w:r>', '</w:r></w:hyperlink>'),
    trackedProperties: text => text.replace('<w:r>', '<w:r><w:rPr><w:rPrChange w:id="1"><w:rPr/></w:rPrChange></w:rPr>'),
    complexField: text => text.replace('<w:r>', '<w:r><w:fldChar w:fldCharType="begin"/>'),
    sdt: text => text.replace('<w:r>', '<w:sdt><w:sdtContent><w:r>').replace('</w:r>', '</w:r></w:sdtContent></w:sdt>'),
  };
  for (const [name, transform] of Object.entries(cases)) await t.test(name, async () => {
    const input = changeTarget(transform);
    await assert.rejects(docx.fill(input, { body: '첫 문단\n둘째 문단' }, flow), error => rejectLayout(error) && error.details.reason === 'unsupported-paragraph-expansion');
  });
  const single = await docx.fill(changeTarget(cases.numbering), { body: '목록의 한 문장' }, flow);
  assert.match(xmlOf(single.bytes), /<w:numId w:val="1"\/>/);
  for (const kind of ['paragraph', 'table']) await t.test(`inherited ${kind} numbering`, async () => {
    let input = kind === 'table' ? wordFixture(xml => xml.replace('<w:tblPr>', '<w:tblPr><w:tblStyle w:val="Numbered"/>')) : changeTarget(text => text.replace(/<w:pStyle[^>]*\/>/, '<w:pStyle w:val="Numbered"/>'));
    input = modify(input, 'word/styles.xml', xml => xml.replace('</w:styles>', `<w:style w:type="${kind}" w:styleId="Numbered"><w:pPr><w:numPr><w:numId w:val="1"/></w:numPr></w:pPr></w:style></w:styles>`));
    await assert.rejects(docx.fill(input, { body: '첫 문단\n둘째 문단' }, flow), error => rejectLayout(error) && error.details.reason === 'unsupported-paragraph-expansion');
  });
});

test('HWPX scalar multi-column row rejects actual page splitting but preserve and one-column flow retain their policies', async () => {
  const value = Array.from({ length: 80 }, (_, index) => `${index + 1}번째 교육에서 참여자를 확인하고 교육 결과와 후속 조치를 기록합니다.`).join('\n');
  const input = hwpxTable();
  const before = hash(input);
  await assert.rejects(hwpx.fill(input, { body: value }, flow), error => rejectLayout(error) && error.details.reason === 'repeat-profile-required');
  assert.equal(hash(input), before);
  const preserved = await hwpx.fill(input, { body: value });
  assert.match(xmlOf(preserved.bytes, sectionPath), /treatAsChar="1"/);
  let single = new Uint8Array(await markdownToHwpx('| 교육 결과 |\n| --- |\n| {{body}} |'));
  single = modify(single, sectionPath, xml => xml.replace('noShading="0"', 'noShading="0" noAdjust="0"'));
  const flowed = await hwpx.fill(single, { body: value }, flow);
  assert.match(xmlOf(flowed.bytes, sectionPath), /80번째 교육/);
  assert.equal(flowed.layout.pagination.status, 'not-performed');
});
