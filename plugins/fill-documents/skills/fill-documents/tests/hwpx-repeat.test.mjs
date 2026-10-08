import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import { markdownToHwpx } from 'kordoc';
import * as hwpx from '../lib/adapters/hwpx.mjs';
import { ancestor, scanXml, spliceText } from '../lib/adapters/hancom-utils.mjs';
import { tableLayoutTarget, validateHwpxTableLayout } from '../lib/adapters/hwpx-repeat.mjs';

const part = 'Contents/section0.xml';
const header = 'Contents/header.xml';
const raw = (xml, node) => xml.slice(node.start, node.end);
const xmlOf = (bytes, path = part) => new PizZip(bytes).file(path).asText();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const children = (node, name) => node.children.filter(child => child.local === name);
const tableOf = xml => scanXml(xml).find(node => node.local === 'tbl');
const textOf = node => node.element.textContent;
const flow = { overflow: 'flow' };
const seed = new Uint8Array(await markdownToHwpx('| 기간 | 수행 내용 |\n| --- | --- |\n| 기관 | {{organization}} |\n| {{period}} | {{activities}} |\n|  |  |\n|  |  |\n|  |  |\n| 꼬리 | 보존값 |\n\n비대상 후속 문단'));

function modify(bytes, path, transform) {
  const zip = new PizZip(bytes);
  zip.file(path, transform(zip.file(path).asText()));
  return zip.generate({ type: 'uint8array' });
}

function fixture() {
  let result = modify(seed, header, xml => {
    const border = scanXml(xml).find(node => node.local === 'borderFill' && node.attrs.id === '2');
    const base = raw(xml, border);
    const copies = [3, 4, 5].map(id => base.replace('id="2"', `id="${id}"`).replace(/(<hh:bottomBorder [^>]*width=")0.12 mm/, (_match, prefix) => prefix + (id === 5 ? '0.5 mm' : '0.12 mm')));
    return xml.replace('borderFills itemCnt="2"', 'borderFills itemCnt="5"').replace('</hh:borderFills>', copies.join('') + '</hh:borderFills>');
  });
  result = modify(result, part, xml => {
    const rows = children(tableOf(xml), 'tr');
    const patches = rows.slice(2, 6).map((row, index) => ({ start: row.start, end: row.end, replacement: raw(xml, row).replaceAll('borderFillIDRef="2"', `borderFillIDRef="${index === 0 ? 3 : index === 3 ? 5 : 4}"`).replaceAll('<hp:t></hp:t>', '').replaceAll('</hp:p>', '<hp:linesegarray><hp:lineseg textpos="0" vertpos="0"/></hp:linesegarray></hp:p>') }));
    return spliceText(xml, patches).replace('noShading="0"', 'noShading="0" noAdjust="0"').replace('treatAsChar="0"', 'treatAsChar="1"');
  });
  return result;
}

function profile(bytes) {
  return { version: 1, format: 'hwpx', templateSha256: hash(bytes), repeatRegions: [{ name: 'activity_rows', part, tableId: '1001', headerRows: [0, 1], bodyRows: { start: 2, end: 5 }, prototypeRow: 3, insertBeforeRow: 5, maxRows: 100, columns: [{ name: 'period', column: 0, maxLength: 10000 }, { name: 'activities', column: 1, maxLength: 10000 }] }] };
}

const records = count => Array.from({ length: count }, (_, index) => ({ period: `${index + 1}월`, activities: `${index + 1}월 교육의 참여자를 확인합니다.\n교육 결과와 후속 조치를 기록합니다.` }));
const values = count => ({ organization: '지역 교육센터', activity_rows: records(count) });
const reject = (code, reason) => error => { assert.equal(error.code, code); if (reason) assert.equal(error.details.reason, reason); return true; };

test('HWPX profile inspection replaces body markers with rows and keeps the header scalar', async () => {
  const input = fixture();
  const layoutProfile = profile(input);
  const inspection = await hwpx.inspect(input, { layoutProfile });
  assert.deepEqual(inspection.fields.map(field => [field.name, field.type]), [['organization', 'text'], ['activity_rows', 'rows']]);
  assert.deepEqual(inspection.fields[1].columns.map(column => column.name), ['period', 'activities']);
  layoutProfile.repeatRegions[0].columns.reverse();
  const reversed = await hwpx.inspect(input, { layoutProfile });
  assert.deepEqual(reversed.fields, inspection.fields);
  assert.equal(hash(input), layoutProfile.templateSha256);
});

test('HWPX repeats exactly the requested rows while preserving header, edge borders, styles, widths and trailing content', async t => {
  for (const count of [1, 3, 4, 6, 100]) await t.test(`${count} records`, async () => {
    const input = fixture();
    const before = xmlOf(input);
    const inputRows = children(tableOf(before), 'tr');
    const result = await hwpx.fill(input, values(count), { ...flow, layoutProfile: profile(input) });
    const after = xmlOf(result.bytes);
    const table = tableOf(after);
    const rows = children(table, 'tr');
    assert.equal(rows.length, count + 3);
    assert.equal(table.attrs.rowCnt, String(count + 3));
    assert.equal(table.attrs.pageBreak, 'TABLE');
    assert.equal(table.attrs.repeatHeader, '1');
    assert.equal(children(table, 'sz')[0].attrs.height, String((count + 3) * 1500));
    assert.equal(children(table, 'pos')[0].attrs.treatAsChar, '0');
    const body = rows.slice(2, 2 + count);
    for (const [index, row] of body.entries()) {
      assert.deepEqual(children(row, 'tc').map(cell => textOf(cell).trim()), [values(count).activity_rows[index].period, values(count).activity_rows[index].activities.replace('\n', '')]);
      assert.deepEqual(children(row, 'tc').map(cell => children(cell, 'cellAddr')[0].attrs), [{ colAddr: '0', rowAddr: String(index + 2) }, { colAddr: '1', rowAddr: String(index + 2) }]);
      const expectedBorder = index === count - 1 ? '5' : index === 0 ? '3' : '4';
      assert.ok(children(row, 'tc').every(cell => cell.attrs.borderFillIDRef === expectedBorder));
      assert.ok(!raw(after, row).includes('linesegarray'));
      assert.deepEqual(children(row, 'tc').map(cell => children(cell, 'cellSz')[0].attrs.width), children(inputRows[2], 'tc').map(cell => children(cell, 'cellSz')[0].attrs.width));
      assert.ok(raw(after, row).includes('paraPrIDRef="0"'));
      assert.ok(raw(after, row).includes('charPrIDRef="0"'));
    }
    assert.equal(raw(after, rows[0]), raw(before, inputRows[0]));
    assert.ok(children(rows[1], 'tc').every(cell => cell.attrs.header === '1'));
    assert.ok(textOf(rows[1]).includes('지역 교육센터'));
    assert.equal(raw(after, rows.at(-1)), raw(before, inputRows.at(-1)).replaceAll('rowAddr="6"', `rowAddr="${count + 2}"`));
    assert.ok(after.includes('비대상 후속 문단'));
    const beforeZip = new PizZip(input), afterZip = new PizZip(result.bytes);
    for (const [path, entry] of Object.entries(beforeZip.files)) if (!entry.dir && path !== part) assert.deepEqual(afterZip.file(path).asUint8Array(), entry.asUint8Array(), path);
    const change = result.layout.changedContainers.find(item => item.field === 'activity_rows');
    assert.equal(change.records, count);
    assert.equal(change.reusedRows, Math.min(count, 4));
    assert.equal(change.clonedRows, Math.max(0, count - 4));
    assert.equal(change.removedRows, Math.max(0, 4 - count));
    assert.equal(result.layout.pagination.source, 'rhwp');
    assert.equal(result.layout.pagination.status, 'engine-checked');
    assert.equal(result.layout.pagination.tables[0].rows.length, count);
    assert.ok(result.layout.pagination.tables[0].rows.every(row => row.pages.length === 1));
    assert.deepEqual(result.layout.pagination.tables[0].headerRows, [0, 1]);
  });
});

test('HWPX repeat validation rejects profile mismatches, unsafe shapes and existing body data', async t => {
  const input = fixture();
  await assert.rejects(hwpx.inspect(input, { layoutProfile: { ...profile(input), templateSha256: '0'.repeat(64) } }), reject('E_TEMPLATE_CHANGED'));
  await assert.rejects(hwpx.fill(input, values(3), { layoutProfile: profile(input) }), reject('E_INPUT'));
  await assert.rejects(hwpx.inspect(input, { layoutProfile: profile(input), manifest: {} }), reject('E_UNSUPPORTED'));
  const badProfiles = {
    unknown: value => { value.unknown = true; },
    version: value => { value.version = 2; },
    format: value => { value.format = 'docx'; },
    prefix: value => { value.repeatRegions[0].headerRows = [1]; },
    prototype: value => { value.repeatRegions[0].prototypeRow = 2; },
    columns: value => { value.repeatRegions[0].columns[1].column = 0; },
    insertion: value => { value.repeatRegions[0].insertBeforeRow = 4; },
  };
  for (const [name, mutation] of Object.entries(badProfiles)) await t.test(name, async () => {
    const layoutProfile = profile(input); mutation(layoutProfile);
    await assert.rejects(hwpx.inspect(input, { layoutProfile }), error => ['E_INPUT', 'E_LAYOUT'].includes(error.code));
  });
  const badShapes = {
    missingTable: xml => xml.replace('id="1001"', 'id="other"'),
    duplicateTable: xml => { const table = tableOf(xml); return xml.slice(0, table.end) + raw(xml, table) + xml.slice(table.end); },
    verticalSection: xml => xml.replace('textDirection="HORIZONTAL"', 'textDirection="VERTICAL"'),
    height: xml => xml.replace('height="10500"', 'height="10501"'),
    protectedCell: xml => xml.replace('protect="0" editable="1"', 'protect="1" editable="1"'),
    linkedList: xml => xml.replace('linkListIDRef="0"', 'linkListIDRef="1"'),
    verticalMerge: xml => xml.replace('rowSpan="1"', 'rowSpan="2"'),
    bodyData: xml => xml.replace('<hp:run charPrIDRef="0"></hp:run>', '<hp:run charPrIDRef="0"><hp:t>이미 입력된 자료</hp:t></hp:run>'),
    extraRun: xml => xml.replace('{{period}}</hp:t></hp:run>', '{{period}}</hp:t></hp:run><hp:run charPrIDRef="0"/>'),
  };
  for (const [name, transform] of Object.entries(badShapes)) await t.test(name, async () => {
    const changed = modify(input, part, transform);
    assert.notEqual(hash(changed), hash(input));
    await assert.rejects(hwpx.inspect(changed, { layoutProfile: profile(changed) }), reject('E_LAYOUT'));
  });
});

test('HWPX repeat enforces structured records and refuses incompatible single-row borders', async t => {
  const input = fixture();
  const failures = [[], [null], [{}], [{ period: '1월', activities: 7 }], [{ period: '1월', activities: '자료', extra: '허용 안 됨' }], [{ period: '1월', activities: '{{new_field}}' }], [{ period: '1월', activities: '가'.repeat(10001) }], records(101)];
  for (const [index, activity_rows] of failures.entries()) await t.test(`invalid records ${index}`, async () => {
    await assert.rejects(hwpx.fill(input, { organization: '교육센터', activity_rows }, { ...flow, layoutProfile: profile(input) }), reject('E_FIELDS'));
  });
  const incompatible = modify(input, header, xml => xml.replace('id="5" threeD="0"', 'id="5" threeD="1"'));
  await assert.rejects(hwpx.fill(incompatible, values(1), { ...flow, layoutProfile: profile(incompatible) }), reject('E_LAYOUT', 'incompatible-single-row-border'));
});

test('HWPX repeat rejects a giant record by actual page mapping and does not include record text in the error', async () => {
  const input = fixture();
  const supplied = values(3);
  supplied.activity_rows[1].activities = Array.from({ length: 90 }, (_, index) => `민감한교육값 ${index + 1}: 참여자의 교육 결과와 후속 활동을 길게 기록합니다.`).join('\n');
  await assert.rejects(hwpx.fill(input, supplied, { ...flow, layoutProfile: profile(input) }), error => {
    assert.equal(error.code, 'E_LAYOUT');
    assert.equal(error.details.reason, 'record-requires-continuation');
    assert.equal(error.details.recordIndex, 1);
    assert.ok(!JSON.stringify(error).includes('민감한교육값'));
    return true;
  });
});

test('HWPX repeat clones a shared keep style once without changing header and unrelated paragraph styles', async () => {
  let input = fixture();
  input = modify(input, header, xml => xml.replace('keepWithNext="0" keepLines="0"', 'keepWithNext="1" keepLines="1"'));
  const before = xmlOf(input, header);
  assert.match(before, /keepLines="1"/);
  const result = await hwpx.fill(input, values(6), { ...flow, layoutProfile: profile(input) });
  const output = xmlOf(result.bytes);
  const newHeader = xmlOf(result.bytes, header);
  const oldStyles = scanXml(before).filter(node => node.local === 'paraPr');
  const newStyles = scanXml(newHeader).filter(node => node.local === 'paraPr');
  assert.equal(newStyles.length, oldStyles.length + 1);
  for (const style of oldStyles) assert.ok(newHeader.includes(raw(before, style)));
  const paragraphs = scanXml(output).filter(node => node.local === 'p');
  const body = paragraphs.filter(node => ancestor(node, item => item.local === 'tc') && textOf(node).includes('월 교육'));
  assert.equal(body.length, 6);
  assert.ok(body.every(node => node.attrs.paraPrIDRef !== '0'));
  const unchanged = paragraphs.find(node => textOf(node) === '비대상 후속 문단');
  assert.equal(unchanged.attrs.paraPrIDRef, '0');
});

test('HWPX scalar fields after a repeated region keep their row mapping and still reject page splitting', async () => {
  const input = modify(fixture(), part, xml => xml.replace('보존값', '{{footer}}'));
  const layoutProfile = profile(input);
  const short = await hwpx.fill(input, { ...values(3), footer: '후속 일정 확인' }, { ...flow, layoutProfile });
  const footer = short.layout.pagination.tables.find(table => table.field === 'footer');
  assert.deepEqual(footer.rows.map(row => row.row), [5]);
  await assert.rejects(hwpx.fill(input, { ...values(3), footer: '후속 일정을 점검하고 담당자별 이행 여부를 확인합니다.\n'.repeat(80) }, { ...flow, layoutProfile }), reject('E_LAYOUT', 'repeat-profile-required'));
});

test('HWPX horizontally merged header remains merged above individually mapped records', async () => {
  const input = modify(fixture(), part, xml => {
    const row = children(tableOf(xml), 'tr')[0];
    const cells = children(row, 'tc');
    const width = children(tableOf(xml), 'sz')[0].attrs.width;
    const first = raw(xml, cells[0]).replace('colSpan="1"', 'colSpan="2"').replace(/(<hp:cellSz width=")[^"]+/, `$1${width}`).replace('기간', '지역 교육 계획');
    return spliceText(xml, [{ start: cells[0].start, end: cells.at(-1).end, replacement: first }]);
  });
  const result = await hwpx.fill(input, values(3), { ...flow, layoutProfile: profile(input) });
  const beforeRow = children(tableOf(xmlOf(input)), 'tr')[0];
  const afterRow = children(tableOf(xmlOf(result.bytes)), 'tr')[0];
  assert.equal(raw(xmlOf(result.bytes), afterRow), raw(xmlOf(input), beforeRow));
  assert.ok(result.layout.pagination.tables[0].rows.every(row => row.pages.length === 1));
});

test('HWPX row validator detects actual CELL splitting in an otherwise complete repeat result', async () => {
  const input = fixture();
  const supplied = values(80);
  supplied.activity_rows.forEach((record, index) => { record.activities = Array.from({ length: 7 + index % 5 }, (_, line) => `${index + 1}차 교육의 ${line + 1}단계: 실습 결과를 확인하고 개선 계획을 기록합니다.`).join('\n'); });
  const result = await hwpx.fill(input, supplied, { ...flow, layoutProfile: profile(input) });
  const changed = modify(result.bytes, part, xml => xml.replace('pageBreak="TABLE"', 'pageBreak="CELL"'));
  const xml = xmlOf(changed);
  const model = { path: part, xml, nodes: scanXml(xml) };
  const target = tableLayoutTarget(model, model.nodes.find(node => node.local === 'tbl'), 'activity_rows', Array.from({ length: 80 }, (_, index) => index + 2), true, [0, 1]);
  await assert.rejects(validateHwpxTableLayout(changed, [target], {}), reject('E_LAYOUT', 'record-requires-continuation'));
});
