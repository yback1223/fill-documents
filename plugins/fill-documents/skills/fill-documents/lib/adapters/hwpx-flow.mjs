import { FillError, requireCondition } from '../errors.mjs';
import { ancestor, scanXml, spliceText } from './hancom-utils.mjs';

const HP = 'http://www.hancom.co.kr/hwpml/2011/paragraph';
const HH = 'http://www.hancom.co.kr/hwpml/2011/head';
const HS = 'http://www.hancom.co.kr/hwpml/2011/section';
const is = local => node => node.namespace === HP && node.local === local;
const anchorPattern = { flowWithText: '1', allowOverlap: '0', holdAnchorAndSO: '0', vertRelTo: 'PARA', horzRelTo: 'COLUMN', vertAlign: 'TOP', horzAlign: 'LEFT', vertOffset: '0', horzOffset: '0' };

function fail(field, region, reason) {
  throw new FillError('E_LAYOUT', '선택한 HWPX 영역의 페이지 흐름을 안전하게 확장할 수 없습니다.', { field, region, reason });
}

function only(node, local, field, region) {
  const found = (node?.children ?? []).filter(is(local));
  if (found.length !== 1) fail(field, region, 'ambiguous-property');
  return found[0];
}

function opening(xml, node, changes) {
  let value = xml.slice(node.start, node.openEnd);
  for (const [name, replacement] of Object.entries(changes)) {
    const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(["'])[^"']*\\2`);
    requireCondition(pattern.test(value), 'E_PRESERVATION', 'HWPX 흐름 속성의 원래 위치를 찾을 수 없습니다.');
    value = value.replace(pattern, `$1"${replacement}"`);
  }
  return value;
}

export function createParagraphFlowPlan(zip) {
  const xml = zip.file('Contents/header.xml')?.asText();
  requireCondition(xml, 'E_LAYOUT', 'HWPX 문단 속성을 읽을 수 없습니다.', { region: 'body', reason: 'ambiguous-style' });
  const nodes = scanXml(xml);
  const containers = nodes.filter(node => node.namespace === HH && node.local === 'paraProperties');
  requireCondition(containers.length === 1, 'E_LAYOUT', 'HWPX 문단 속성 정의가 명확하지 않습니다.', { region: 'body', reason: 'ambiguous-style' });
  const container = containers[0];
  const styles = container.children.filter(node => node.namespace === HH && node.local === 'paraPr');
  const ids = styles.map(node => node.attrs.id);
  requireCondition(ids.every(id => /^\d+$/.test(id)) && new Set(ids).size === ids.length && Number(container.attrs.itemCnt) === styles.length, 'E_LAYOUT', 'HWPX 문단 속성 ID를 확인할 수 없습니다.', { region: 'body', reason: 'ambiguous-style' });
  const copies = new Map();
  let next = Math.max(...ids.map(Number)) + 1;
  return {
    paragraph(paragraph, field, region, source, edits) {
      const style = styles.find(node => node.attrs.id === paragraph.attrs.paraPrIDRef);
      if (!style) fail(field, region, 'ambiguous-style');
      const settings = style.children.filter(node => node.namespace === HH && node.local === 'breakSetting');
      if (settings.length !== 1) fail(field, region, 'ambiguous-style');
      const setting = settings[0];
      if (!['0', '1'].includes(setting.attrs.keepLines) || !['0', '1'].includes(setting.attrs.keepWithNext)) fail(field, region, 'ambiguous-style');
      if (setting.attrs.lineWrap !== 'BREAK' || (style.attrs.textDir !== undefined && !['AUTO', 'HORIZONTAL'].includes(style.attrs.textDir))) fail(field, region, 'vertical-text');
      if (setting.attrs.keepLines === '0' && setting.attrs.keepWithNext === '0') return false;
      let copy = copies.get(style.attrs.id);
      if (!copy) {
        if (!Number.isSafeInteger(next)) fail(field, region, 'ambiguous-style');
        const id = String(next++);
        const patched = spliceText(xml.slice(style.start, style.end), [
          { start: 0, end: style.openEnd - style.start, replacement: opening(xml, style, { id }) },
          { start: setting.start - style.start, end: setting.openEnd - style.start, replacement: opening(xml, setting, { keepLines: '0', keepWithNext: '0' }) },
        ]);
        copy = { id, xml: patched };
        copies.set(style.attrs.id, copy);
      }
      edits.push({ start: paragraph.start, end: paragraph.openEnd, replacement: opening(source, paragraph, { paraPrIDRef: copy.id }) });
      return true;
    },
    finish() {
      if (!copies.size) return undefined;
      return spliceText(xml, [
        { start: container.start, end: container.openEnd, replacement: opening(xml, container, { itemCnt: String(styles.length + copies.size) }) },
        { start: container.closeStart, end: container.closeStart, replacement: [...copies.values()].map(copy => copy.xml).join('') },
      ]);
    },
  };
}

// Return narrowly scoped edits; the caller combines them with its existing text patches.
export function planHwpxFlow(zip, models, header = createParagraphFlowPlan(zip)) {
  const changedContainers = [];
  const partEdits = new Map();
  for (const part of models) {
    const edits = [];
    const changedTables = new Set();
    const changedParagraphs = new Set();
    const cacheParagraphs = new Set();
    for (const field of part.occurrences) {
      const paragraph = field.group.paragraph;
      const cell = ancestor(paragraph, is('tc'));
      const table = ancestor(paragraph, is('tbl'));
      const region = cell ? 'table-cell' : 'body';
      const changes = ['refresh-line-layout'];
      if (table) {
        if (!cell || ancestor(table, is('tbl')) || part.nodes.some(node => is('tbl')(node) && ancestor(node, is('tc')) === cell)) fail(field.name, region, 'nested-table');
        const list = only(cell, 'subList', field.name, region);
        const span = only(cell, 'cellSpan', field.name, region);
        if (paragraph.parent !== list || span.attrs.rowSpan !== '1') fail(field.name, region, 'merged-cell');
        if (list.attrs.textDirection !== 'HORIZONTAL' || list.attrs.lineWrap !== 'BREAK') fail(field.name, region, 'vertical-text');
        if (cell.attrs.protect !== '0') fail(field.name, region, 'fixed-container');
        const size = only(table, 'sz', field.name, region);
        const position = only(table, 'pos', field.name, region);
        if (table.attrs.textWrap !== 'TOP_AND_BOTTOM' || table.attrs.pageBreak !== 'CELL' || table.attrs.noAdjust !== '0' || size.attrs.widthRelTo !== 'ABSOLUTE' || size.attrs.heightRelTo !== 'ABSOLUTE' || size.attrs.protect !== '0') fail(field.name, region, 'fixed-container');
        if (!Object.entries(anchorPattern).every(([name, expected]) => position.attrs[name] === expected) || !['0', '1'].includes(position.attrs.treatAsChar)) fail(field.name, region, 'unsupported-anchor');
        const anchor = ancestor(table, is('p'));
        if (!anchor || anchor.parent?.namespace !== HS || anchor.parent?.local !== 'sec') fail(field.name, region, 'unsupported-anchor');
        if (!changedTables.has(table)) {
          if (position.attrs.treatAsChar === '1') edits.push({ start: position.start, end: position.openEnd, replacement: opening(part.xml, position, { treatAsChar: '0' }) });
          cacheParagraphs.add(anchor);
          changedTables.add(table);
        }
        changes.push(position.attrs.treatAsChar === '1' ? 'inline-table-to-flow' : 'existing-flow-table');
      } else if (paragraph.parent?.namespace !== HS || paragraph.parent?.local !== 'sec') fail(field.name, region, 'fixed-container');
      const sections = part.nodes.filter(is('secPr'));
      if (sections.some(section => section.attrs.textDirection !== 'HORIZONTAL')) fail(field.name, region, 'vertical-text');
      if (!changedParagraphs.has(paragraph)) {
        if (header.paragraph(paragraph, field.name, region, part.xml, edits)) changes.push('clone-paragraph-flow-style');
        changedParagraphs.add(paragraph);
      }
      changedContainers.push({ field: field.name, region, changes });
    }
    // replaceGroup already removes edited paragraphs' caches. Only add anchor caches here.
    for (const node of part.nodes.filter(is('linesegarray'))) {
      const paragraph = ancestor(node, is('p'));
      if (cacheParagraphs.has(paragraph) && !changedParagraphs.has(paragraph)) edits.push({ start: node.start, end: node.end, replacement: '' });
    }
    partEdits.set(part.path, edits);
  }
  return { partEdits, headerXml: header.finish(), layout: { policy: 'flow', strategy: 'native', changedContainers, pagination: { status: 'not-performed' } } };
}

export function checkHwpxFlowReferences(zip, models) {
  const nodes = scanXml(zip.file('Contents/header.xml').asText());
  const ids = nodes.filter(node => node.namespace === HH && node.local === 'paraPr').map(node => node.attrs.id);
  requireCondition(new Set(ids).size === ids.length, 'E_PRESERVATION', 'HWPX 문단 속성 ID가 중복되었습니다.');
  for (const part of models) {
    for (const paragraph of scanXml(part.xml).filter(is('p'))) requireCondition(ids.includes(paragraph.attrs.paraPrIDRef), 'E_PRESERVATION', 'HWPX 문단 속성 참조가 끊어졌습니다.');
  }
}
