import { createHash } from 'node:crypto';
import { FillError, requireCondition } from '../errors.mjs';
import { isPlainObject, normalizeFields, checkValues } from '../fields.mjs';
import { ancestor, scanXml, spliceText, xmlEscape, checkedValues } from './hancom-utils.mjs';
import { openHancom } from './hancom-runtime.mjs';

const HP = 'http://www.hancom.co.kr/hwpml/2011/paragraph';
const HH = 'http://www.hancom.co.kr/hwpml/2011/head';
const HS = 'http://www.hancom.co.kr/hwpml/2011/section';
const is = name => node => node?.namespace === HP && node.local === name;
const kids = (node, name) => (node?.children ?? []).filter(is(name));
const below = node => [node, ...node.children.flatMap(below)];
const integer = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
const fail = (field, reason, recordIndex) => { throw new FillError('E_LAYOUT', 'HWPX 반복 영역을 원래 서식으로 안전하게 확장할 수 없습니다.', { field, region: 'table-rows', ...(recordIndex === undefined ? {} : { recordIndex }), reason }); };
const exactKeys = (value, names) => isPlainObject(value) && Object.keys(value).every(key => names.includes(key)) && names.every(key => Object.hasOwn(value, key));
const only = (node, name, field) => { const list = kids(node, name); if (list.length !== 1) fail(field, 'unsupported-row-shape'); return list[0]; };
const raw = (xml, node) => xml.slice(node.start, node.end);

function setOpening(xml, node, updates) {
  let source = xml.slice(node.start, node.openEnd);
  for (const [key, value] of Object.entries(updates)) {
    const pattern = new RegExp(`(\\s${key}\\s*=\\s*)(["'])[^"']*\\2`);
    source = pattern.test(source) ? source.replace(pattern, `$1"${value}"`) : source.replace(/(\/?>)$/, ` ${key}="${value}"$1`);
  }
  return { start: node.start, end: node.openEnd, replacement: source };
}

function signature(node, skipBottom = false) {
  return JSON.stringify([node.namespace, node.local, Object.entries(node.attrs).filter(([key]) => key !== 'id').sort(), node.children.filter(child => !skipBottom || child.local !== 'bottomBorder').map(child => signature(child))]);
}

export function inspectHwpxRepeat(bytes, zip, models, context) {
  const profile = context.layoutProfile;
  requireCondition(exactKeys(profile, ['version', 'format', 'templateSha256', 'repeatRegions']) && profile.version === 1 && profile.format === 'hwpx' && /^[a-f0-9]{64}$/.test(profile.templateSha256), 'E_INPUT', 'HWPX 반복 프로필의 형식이 올바르지 않습니다.');
  requireCondition(createHash('sha256').update(bytes).digest('hex') === profile.templateSha256, 'E_TEMPLATE_CHANGED', '프로필의 원본 해시와 현재 문서가 다릅니다.');
  requireCondition(!context.manifest, 'E_UNSUPPORTED', 'HWPX 반복 행은 파일 경로와 프로필을 사용하세요.');
  requireCondition(Array.isArray(profile.repeatRegions) && profile.repeatRegions.length === 1, 'E_INPUT', 'HWPX 반복 영역은 정확히 하나여야 합니다.');
  let region = profile.repeatRegions[0];
  requireCondition(exactKeys(region, ['name', 'part', 'tableId', 'headerRows', 'bodyRows', 'prototypeRow', 'insertBeforeRow', 'maxRows', 'columns']) && exactKeys(region.bodyRows, ['start', 'end']), 'E_INPUT', 'HWPX 반복 영역 설정에 누락되거나 알 수 없는 키가 있습니다.');
  requireCondition(typeof region.part === 'string' && /^Contents\/section\d+\.xml$/.test(region.part) && typeof region.tableId === 'string' && region.tableId.length > 0 && Array.isArray(region.columns) && region.columns.every(column => exactKeys(column, ['name', 'column', 'maxLength'])), 'E_INPUT', 'HWPX 반복 영역의 위치와 열을 확인하세요.');
  region = { ...region, columns: [...region.columns].sort((a, b) => a.column - b.column) };
  const [field] = normalizeFields([{ name: region.name, type: 'rows', occurrences: 1, maxRows: region.maxRows, columns: region.columns.map(column => ({ name: column.name, type: 'text', occurrences: 1, maxLength: column.maxLength })) }]);
  const part = models.find(item => item.path === region.part);
  if (!part) fail(region.name, 'missing-table');
  const tables = part.nodes.filter(node => is('tbl')(node) && node.attrs.id === region.tableId);
  if (tables.length !== 1) fail(region.name, 'ambiguous-table');
  const table = tables[0];
  const rows = kids(table, 'tr');
  const columns = integer(table.attrs.colCnt);
  const { start, end } = region.bodyRows;
  if (![start, end, region.prototypeRow, region.insertBeforeRow].every(Number.isInteger) || start < 1 || end >= rows.length || end - start < 2 || !(start < region.prototypeRow && region.prototypeRow < end) || region.insertBeforeRow !== end || !Array.isArray(region.headerRows) || region.headerRows.length !== start || region.headerRows.some((value, index) => value !== index) || integer(table.attrs.rowCnt) !== rows.length || columns !== region.columns.length || region.columns.some((column, index) => column.column !== index)) fail(region.name, 'invalid-row-range');
  const anchor = ancestor(table, is('p'));
  if (!anchor || anchor.parent?.namespace !== HS || anchor.parent?.local !== 'sec' || ancestor(table, is('tbl')) || below(table).some(node => node !== table && is('tbl')(node))) fail(region.name, 'unsupported-anchor');
  if (part.nodes.filter(is('secPr')).some(node => node.attrs.textDirection !== 'HORIZONTAL')) fail(region.name, 'vertical-text');
  const position = only(table, 'pos', region.name);
  const size = only(table, 'sz', region.name);
  const pattern = { flowWithText: '1', allowOverlap: '0', holdAnchorAndSO: '0', vertRelTo: 'PARA', horzRelTo: 'COLUMN', vertAlign: 'TOP', horzAlign: 'LEFT', vertOffset: '0', horzOffset: '0' };
  if (table.attrs.textWrap !== 'TOP_AND_BOTTOM' || table.attrs.pageBreak !== 'CELL' || table.attrs.noAdjust !== '0' || !['0', '1'].includes(position.attrs.treatAsChar) || !Object.entries(pattern).every(([key, value]) => position.attrs[key] === value) || size.attrs.widthRelTo !== 'ABSOLUTE' || size.attrs.heightRelTo !== 'ABSOLUTE' || size.attrs.protect !== '0') fail(region.name, 'unsupported-anchor');
  const headerNodes = scanXml(zip.file('Contents/header.xml').asText());
  const definitions = (kind, id) => headerNodes.filter(node => node.namespace === HH && node.local === kind && node.attrs.id === id);
  const cellInfo = [];
  const heights = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = kids(rows[rowIndex], 'tc');
    if (cells.length !== rows[rowIndex].children.length) fail(region.name, 'unsupported-row-shape');
    let width = 0;
    let column = 0;
    let height = 0;
    const info = [];
    for (const cell of cells) {
      if (cell.children.some(node => node.namespace !== HP || !['subList', 'cellAddr', 'cellSpan', 'cellSz', 'cellMargin'].includes(node.local))) fail(region.name, 'unsupported-row-shape');
      const address = only(cell, 'cellAddr', region.name);
      const span = only(cell, 'cellSpan', region.name);
      const dimensions = only(cell, 'cellSz', region.name);
      if (integer(address.attrs.rowAddr) !== rowIndex || integer(address.attrs.colAddr) !== column || span.attrs.rowSpan !== '1' || !integer(span.attrs.colSpan) || !integer(dimensions.attrs.width) || !integer(dimensions.attrs.height)) fail(region.name, 'unsupported-row-shape');
      width += Number(dimensions.attrs.width);
      column += Number(span.attrs.colSpan);
      height = Math.max(height, Number(dimensions.attrs.height));
      if (definitions('borderFill', cell.attrs.borderFillIDRef).length !== 1) fail(region.name, 'ambiguous-style');
      const list = only(cell, 'subList', region.name);
      if (cell.attrs.protect !== '0' || list.attrs.textDirection !== 'HORIZONTAL' || list.attrs.lineWrap !== 'BREAK' || ['linkListIDRef', 'linkListNextIDRef', 'hasTextRef', 'hasNumRef'].some(key => list.attrs[key] !== '0')) fail(region.name, 'unsupported-row-shape');
      if (rowIndex >= start && rowIndex <= end) {
        const paragraph = only(list, 'p', region.name);
        const run = only(paragraph, 'run', region.name);
        const texts = kids(run, 't');
        const text = texts[0];
        if (span.attrs.colSpan !== '1' || list.children.length !== 1 || paragraph.children.some(node => node.namespace !== HP || !['run', 'linesegarray'].includes(node.local)) || texts.length > 1 || run.children.length !== texts.length || text?.children.length || below(cell).some(node => ['ctrl', 'tbl', 'pic', 'fieldBegin', 'fieldEnd'].includes(node.local))) fail(region.name, 'unsupported-row-shape');
        if (definitions('paraPr', paragraph.attrs.paraPrIDRef).length !== 1 || definitions('charPr', run.attrs.charPrIDRef).length !== 1) fail(region.name, 'ambiguous-style');
        const value = text?.element.textContent ?? '';
        if (value !== (rowIndex === start ? `{{${region.columns[info.length].name}}}` : '')) fail(region.name, 'nonempty-repeat-row');
        info.push({ cell, address, dimensions, paragraph, run, text });
      }
    }
    if (width !== integer(size.attrs.width) || column !== columns) fail(region.name, 'inconsistent-column-width');
    heights.push(height);
    cellInfo.push(info);
  }
  if (heights.reduce((sum, height) => sum + height, 0) !== integer(size.attrs.height)) fail(region.name, 'inconsistent-table-height');
  const isBodyField = (model, item) => model === part && rows.slice(start, end + 1).includes(ancestor(item.group.paragraph, is('tr')));
  const outsideModels = models.map(model => ({ ...model, groups: model.groups.map(group => ({ ...group, fields: group.fields.filter(item => !isBodyField(model, item)) })), occurrences: model.occurrences.filter(item => !isBodyField(model, item)) }));
  if (outsideModels.flatMap(model => model.occurrences).some(item => item.name === field.name) || part.groups.find(group => group.paragraph === anchor)?.fields.length) fail(region.name, 'ambiguous-field');
  return { field, region, part, table, rows, size, position, anchor, cellInfo, heights, outsideModels, definitions };
}

export function checkedRepeatValues(values, fields, context) {
  const normalized = checkValues(values, normalizeFields(fields));
  for (const field of fields) {
    if (field.type === 'rows') for (const row of normalized[field.name]) checkedValues(field.columns, row, {});
    else checkedValues([field], { [field.name]: normalized[field.name] }, context);
  }
  return normalized;
}

export function planHwpxRepeat(plan, records, paragraphPlan, scalarEdits = []) {
  const { region, part, table, rows, position, size, anchor, cellInfo, heights } = plan;
  const { start, end } = region.bodyRows;
  const count = records.length;
  const selected = count === 1 ? [start] : [start, ...Array.from({ length: count - 2 }, (_, index) => start + index + 1 < end ? start + index + 1 : region.prototypeRow), end];
  const used = new Set(selected);
  const pieces = [];
  let totalHeight = 0;
  let outputRow = 0;
  const emit = (sourceIndex, recordIndex) => {
    const row = rows[sourceIndex];
    const changes = [];
    if (recordIndex === undefined) {
      changes.push(...scalarEdits.filter(edit => edit.start >= row.start && edit.end <= row.end));
      for (const group of part.groups.filter(group => ancestor(group.paragraph, is('tr')) === row && group.fields.length)) paragraphPlan.paragraph(group.paragraph, region.name, 'table-rows', part.xml, changes);
    }
    totalHeight += heights[sourceIndex];
    for (const cell of kids(row, 'tc')) {
      const address = only(cell, 'cellAddr', region.name);
      changes.push(setOpening(part.xml, address, { rowAddr: String(outputRow) }));
      if (sourceIndex < start) changes.push(setOpening(part.xml, cell, { header: '1' }));
    }
    if (recordIndex !== undefined) for (let column = 0; column < region.columns.length; column++) {
      const info = cellInfo[sourceIndex][column];
      const value = records[recordIndex][region.columns[column].name].replace(/\r\n?/g, '\n');
      const prefix = info.run.name.includes(':') ? info.run.name.split(':')[0] + ':' : '';
      const text = xmlEscape(value).replaceAll('\n', `<${prefix}lineBreak/>`).replaceAll('\t', `<${prefix}tab/>`);
      if (info.text) changes.push({ start: info.text.start, end: info.text.end, replacement: part.xml.slice(info.text.start, info.text.openEnd).replace(/\/\s*>$/, '>') + text + `</${info.text.name}>` });
      else changes.push({ start: info.run.start, end: info.run.end, replacement: part.xml.slice(info.run.start, info.run.openEnd).replace(/\/\s*>$/, '>') + `<${prefix}t>${text}</${prefix}t></${info.run.name}>` });
      paragraphPlan.paragraph(info.paragraph, region.name, 'table-rows', part.xml, changes);
      for (const cache of kids(info.paragraph, 'linesegarray')) changes.push({ start: cache.start, end: cache.end, replacement: '' });
      if (count === 1) {
        const last = cellInfo[end][column].cell;
        const firstBorder = plan.definitions('borderFill', info.cell.attrs.borderFillIDRef)[0];
        const lastBorder = plan.definitions('borderFill', last.attrs.borderFillIDRef)[0];
        if (signature(firstBorder, true) !== signature(lastBorder, true)) fail(region.name, 'incompatible-single-row-border');
        changes.push(setOpening(part.xml, info.cell, { borderFillIDRef: last.attrs.borderFillIDRef }));
      }
    }
    pieces.push(spliceText(raw(part.xml, row), changes.map(change => ({ ...change, start: change.start - row.start, end: change.end - row.start }))));
    outputRow++;
  };
  for (let index = 0; index < start; index++) emit(index);
  selected.forEach((sourceIndex, recordIndex) => emit(sourceIndex, recordIndex));
  for (let index = end + 1; index < rows.length; index++) emit(index);
  const changes = [setOpening(part.xml, table, { rowCnt: String(outputRow), pageBreak: 'TABLE', repeatHeader: '1' }), setOpening(part.xml, position, { treatAsChar: '0' }), setOpening(part.xml, size, { height: String(totalHeight) }), { start: rows[0].start, end: rows.at(-1).end, replacement: pieces.join('') }];
  const tableXml = spliceText(raw(part.xml, table), changes.map(change => ({ ...change, start: change.start - table.start, end: change.end - table.start })));
  const edits = [{ start: table.start, end: table.end, replacement: tableXml }, ...kids(anchor, 'linesegarray').map(node => ({ start: node.start, end: node.end, replacement: '' }))];
  return { edits, tableId: region.tableId, part: part.path, start, count, headerRows: region.headerRows, field: region.name, changes: { field: region.name, region: 'table-rows', strategy: 'repeat-original-rows', records: count, reusedRows: used.size, clonedRows: selected.length - used.size, removedRows: end - start + 1 - used.size, headerRows: region.headerRows } };
}

export function tableLayoutTarget(part, table, field, rows, repeated = false, headerRows = []) {
  const anchor = ancestor(table, is('p'));
  const anchors = part.nodes.filter(node => is('p')(node) && node.parent?.namespace === HS);
  const objects = below(anchor).filter(node => ['tbl', 'pic', 'ole', 'equation', 'container', 'rect', 'line', 'ellipse', 'arc', 'polygon', 'curve', 'connectLine', 'textart', 'video'].includes(node.local) && ancestor(node, is('p')) === anchor);
  const control = objects.indexOf(table);
  if (control < 0 || anchors.indexOf(anchor) < 0) fail(field, 'unmapped-table');
  const cells = kids(table, 'tr').flatMap(row => kids(row, 'tc'));
  return { field, rows, repeated, headerRows, section: Number(part.path.match(/section(\d+)/)[1]), paragraph: anchors.indexOf(anchor), control, cells: cells.map((cell, index) => ({ index, row: Number(only(cell, 'cellAddr', field).attrs.rowAddr), col: Number(only(cell, 'cellAddr', field).attrs.colAddr), text: below(cell).filter(is('t')).map(node => node.element.textContent).join('') })) };
}

export async function validateHwpxTableLayout(bytes, targets, context) {
  if (!targets.length) return { source: 'rhwp', status: 'not-performed' };
  const document = await openHancom(bytes, context);
  const rowPages = targets.map(() => new Map());
  const issues = [];
  try {
    const pages = document.pageCount();
    if (!Number.isInteger(pages) || pages < 1) fail(targets[0].field, 'unavailable-row-layout');
    for (let page = 0; page < pages; page++) {
      const controls = JSON.parse(document.getPageControlLayout(page)).controls;
      const runs = JSON.parse(document.getPageTextLayout(page)).runs;
      const pageInfo = JSON.parse(document.getPageInfo(page));
      if (!Array.isArray(controls) || !Array.isArray(runs) || ![pageInfo.width, pageInfo.height].every(value => Number.isFinite(value) && value > 0)) fail(targets[0].field, 'unavailable-row-layout');
      for (let index = 0; index < targets.length; index++) {
        const target = targets[index];
        const tables = controls.filter(item => item.type === 'table' && item.secIdx === target.section && item.paraIdx === target.paragraph && item.controlIdx === target.control);
        if (tables.length > 1) fail(target.field, 'unmapped-table');
        if (!tables.length) continue;
        const cells = tables[0].cells;
        for (const row of target.rows) if (cells.some(cell => cell.row === row)) {
          const seen = rowPages[index].get(row) ?? new Set(); seen.add(page); rowPages[index].set(row, seen);
        }
        if (!target.repeated || !cells.some(cell => target.rows.includes(cell.row))) continue;
        for (const row of target.headerRows) if (!cells.some(cell => cell.row === row)) fail(target.field, 'missing-repeated-header');
        for (const expected of target.cells.filter(cell => target.rows.includes(cell.row) || target.headerRows.includes(cell.row))) {
          const rectangle = cells.find(cell => cell.row === expected.row && cell.col === expected.col);
          if (!rectangle) {
            if (cells.some(cell => cell.row === expected.row)) issues.push({ field: target.field, reason: 'missing-cell-layout' });
            continue;
          }
          // Both layout APIs round to 0.1 px; 0.2 px bounds only cover that rounding.
          const within = (item, box) => [item.x, item.y, item.w, item.h].every(Number.isFinite) && item.x >= box.x - 0.2 && item.y >= box.y - 0.2 && item.x + item.w <= box.x + box.w + 0.2 && item.y + item.h <= box.y + box.h + 0.2;
          if (!within(rectangle, { x: 0, y: 0, w: pageInfo.width, h: pageInfo.height })) issues.push({ field: target.field, reason: 'table-outside-page' });
          const textRuns = runs.filter(run => run.secIdx === target.section && run.parentParaIdx === target.paragraph && run.controlIdx === target.control && run.cellIdx === expected.index).sort((a, b) => a.cellParaIdx - b.cellParaIdx || a.charStart - b.charStart);
          if (textRuns.some(run => run.text.trim() && !within(run, rectangle))) issues.push({ field: target.field, reason: 'text-outside-cell' });
          const visible = textRuns.map(run => run.text).join('').replace(/\s/g, '');
          if (visible !== expected.text.replace(/\s/g, '')) issues.push({ field: target.field, reason: 'missing-cell-text' });
        }
      }
    }
    for (let index = 0; index < targets.length; index++) for (const [recordIndex, row] of targets[index].rows.entries()) {
      const target = targets[index];
      if (rowPages[index].get(row)?.size !== 1) fail(target.field, target.repeated ? 'record-requires-continuation' : 'repeat-profile-required', target.repeated ? recordIndex : undefined);
    }
    if (issues.length) fail(issues[0].field, issues[0].reason);
    return { source: 'rhwp', status: 'engine-checked', after: pages, tables: targets.map((target, index) => ({ field: target.field, rows: target.rows.map(row => ({ row, pages: [...rowPages[index].get(row)].map(page => page + 1) })), headerRows: target.headerRows })) };
  } catch (error) {
    if (error instanceof FillError) throw error;
    fail(targets[0].field, 'unavailable-row-layout');
  } finally { document.free(); }
}
