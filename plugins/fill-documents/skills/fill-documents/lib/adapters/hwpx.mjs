import PizZip from 'pizzip';
import { validateHwpx } from 'kordoc';
import { FillError, requireCondition } from '../errors.mjs';
import { assertSafeZip } from '../zip-safety.mjs';
import { ancestor, checkedValues, fieldList, placeholders, scanXml, spliceText, visualWarning, xmlEscape } from './hancom-utils.mjs';

const HP = 'http://www.hancom.co.kr/hwpml/2011/paragraph';
const ENGINE = 'fill-documents XML patch + kordoc@4.19.2 validation';
const isParagraph = node => node.local === 'p' && node.namespace === HP;
const isText = node => node.local === 't' && node.namespace === HP;

function textContent(node) {
  let text = '';
  let safe = true;
  for (const child of Array.from(node.element.childNodes)) {
    if (child.nodeType === 3 || child.nodeType === 4) text += child.data;
    else if (child.nodeType === 1 && child.namespaceURI === HP && child.localName === 'lineBreak') text += '\n';
    else if (child.nodeType === 1 && child.namespaceURI === HP && child.localName === 'tab') text += '\t';
    else if (child.nodeType !== 8) { safe = false; text += '\uFFFC'; }
  }
  return { text, safe };
}

function model(xml) {
  const nodes = scanXml(xml);
  const groups = nodes.filter(isParagraph).map(paragraph => ({ paragraph, textNodes: [], fields: [] }));
  const byParagraph = new Map(groups.map(group => [group.paragraph, group]));
  for (const node of nodes.filter(isText)) byParagraph.get(ancestor(node, isParagraph))?.textNodes.push({ ...node, ...textContent(node) });
  for (const group of groups) {
    let offset = 0;
    for (const node of group.textNodes) { node.textStart = offset; offset += node.text.length; node.textEnd = offset; }
    group.text = group.textNodes.map(node => node.text).join('');
  }
  const explicit = [];
  for (const begin of nodes.filter(node => node.namespace === HP && node.local === 'fieldBegin' && node.attrs.type?.toUpperCase() === 'CLICK_HERE')) {
    const group = byParagraph.get(ancestor(begin, isParagraph));
    const ends = nodes.filter(node => node.namespace === HP && node.local === 'fieldEnd' && node.attrs.beginIDRef === begin.attrs.id && node.start > begin.end);
    requireCondition(begin.attrs.id && ends.length === 1 && group && ancestor(ends[0], isParagraph) === group.paragraph, 'E_PRESERVATION', '누름틀의 시작과 끝이 한 문단 안에서 명확하게 대응해야 합니다.');
    const end = ends[0];
    requireCondition(!nodes.some(node => node.local === 'fieldBegin' && node.start > begin.start && node.start < end.start), 'E_PRESERVATION', '중첩 누름틀은 지원하지 않습니다.');
    const selected = group.textNodes.filter(node => node.start >= begin.end && node.end <= end.start);
    requireCondition(selected.length > 0 && selected.every(node => node.safe), 'E_PRESERVATION', '누름틀 안에 보존 가능한 텍스트 영역이 필요합니다.');
    const entry = { name: begin.attrs.name ?? '', start: selected[0].textStart, end: selected.at(-1).textEnd, group, begin, selected };
    requireCondition(!explicit.some(field => field.group === group && field.end > entry.start && field.start < entry.end), 'E_PRESERVATION', '누름틀 범위가 겹칩니다.');
    explicit.push(entry);
    group.fields.push(entry);
  }
  for (const group of groups) {
    const masked = [...group.fields].sort((a, b) => b.start - a.start).reduce((text, field) => text.slice(0, field.start) + ' '.repeat(field.end - field.start) + text.slice(field.end), group.text);
    for (const tag of placeholders(masked)) {
      const selected = group.textNodes.filter(node => node.textEnd > tag.start && node.textStart < tag.end);
      requireCondition(selected.length > 0 && selected.every(node => node.safe), 'E_PRESERVATION', '표식을 포함한 텍스트 영역을 안전하게 읽을 수 없습니다.');
      requireCondition(!nodes.some(node => node.start > selected[0].start && node.end < selected.at(-1).end && ['ctrl', 'tbl', 'pic', 'fieldBegin', 'fieldEnd'].includes(node.local)), 'E_PRESERVATION', '표식이 개체 또는 누름틀 경계를 가로지릅니다.');
      group.fields.push({ ...tag, group, selected });
    }
  }
  const occurrences = groups.flatMap(group => group.fields);
  fieldList(occurrences); // Reject invalid explicit field names before exposing them.
  return { nodes, groups, occurrences };
}

async function open(bytes) {
  assertSafeZip(bytes);
  let zip;
  try { zip = new PizZip(bytes); } catch { throw new FillError('E_INPUT', 'HWPX ZIP을 읽을 수 없습니다.'); }
  requireCondition(zip.file('mimetype')?.asText() === 'application/hwp+zip', 'E_INPUT', 'HWPX 문서 형식이 아닙니다.');
  requireCondition(!Object.keys(zip.files).some(path => /(?:^|\/)(?:signatures?|_xmlsignatures|encrypted-package)(?:\/|\.)/i.test(path)), 'E_UNSUPPORTED', '암호화 또는 서명된 HWPX는 지원하지 않습니다.');
  for (const entry of Object.values(zip.files)) {
    if (!entry.dir && /\.(?:xml|hpf|rdf)$/i.test(entry.name)) {
      const nodes = scanXml(entry.asText());
      requireCondition(!nodes.some(node => ['script', 'ole', 'encryption-data', 'Signature'].includes(node.local)), 'E_UNSUPPORTED', '스크립트·실행 개체·암호화·서명이 있는 HWPX는 지원하지 않습니다.');
    }
  }
  let result;
  try { result = await validateHwpx(new Uint8Array(bytes)); } catch { throw new FillError('E_INPUT', 'HWPX 구조 검사를 실행할 수 없습니다.'); }
  requireCondition(result.ok, 'E_INPUT', 'HWPX 문서 구조가 올바르지 않습니다.');
  const parts = Object.keys(zip.files).filter(path => /^Contents\/section\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])).map(path => ({ path, xml: zip.file(path).asText() }));
  requireCondition(parts.length > 0, 'E_INPUT', 'HWPX 본문이 없습니다.');
  return { zip, parts };
}

function encodedText(text, node) {
  const prefix = node.name.includes(':') ? node.name.slice(0, node.name.indexOf(':') + 1) : '';
  return xmlEscape(text).replaceAll('\n', `<${prefix}lineBreak/>`).replaceAll('\t', `<${prefix}tab/>`);
}

function replaceGroup(group, values, xml, allNodes) {
  const edits = [];
  const textEdits = new Map();
  for (const field of group.fields) {
    const value = values[field.name].replace(/\r\n?/g, '\n');
    for (let index = 0; index < field.selected.length; index++) {
      const node = field.selected[index];
      const replacements = textEdits.get(node) ?? [];
      replacements.push({ start: Math.max(field.start - node.textStart, 0), end: Math.min(field.end - node.textStart, node.text.length), replacement: index === 0 ? value : '' });
      textEdits.set(node, replacements);
    }
    if (field.begin) {
      const raw = xml.slice(field.begin.start, field.begin.openEnd);
      const updated = /\sdirty\s*=/.test(raw) ? raw.replace(/(\sdirty\s*=\s*)(["'])[^"']*\2/, '$1"1"') : raw.replace(/(\/?>)$/, ' dirty="1"$1');
      edits.push({ start: field.begin.start, end: field.begin.openEnd, replacement: updated });
    }
  }
  for (const [node, replacements] of textEdits) {
    const text = encodedText(spliceText(node.text, replacements), node);
    if (node.selfClosing) edits.push({ start: node.start, end: node.end, replacement: xml.slice(node.start, node.end).replace(/\/\s*>$/, '>') + text + `</${node.name}>` });
    else edits.push({ start: node.openEnd, end: node.closeStart, replacement: text });
  }
  if (group.fields.length) {
    for (const node of allNodes.filter(node => node.local === 'linesegarray' && ancestor(node, isParagraph) === group.paragraph)) edits.push({ start: node.start, end: node.end, replacement: '' });
  }
  return edits;
}

export async function inspect(bytes, context = {}) {
  const { parts } = await open(bytes);
  const fields = fieldList(parts.flatMap(part => model(part.xml).occurrences));
  return { format: 'hwpx', fields, engine: ENGINE, warnings: [visualWarning] };
}

export async function fill(bytes, values, context = {}) {
  const { zip, parts } = await open(bytes);
  const models = parts.map(part => ({ ...part, ...model(part.xml) }));
  const fields = fieldList(models.flatMap(part => part.occurrences));
  requireCondition(fields.length > 0, 'E_FIELDS', '채울 수 있는 명시적 HWPX 필드가 없습니다.');
  checkedValues(fields, values, context);
  const changed = new Set();
  for (const part of models) {
    const edits = part.groups.flatMap(group => replaceGroup(group, values, part.xml, part.nodes));
    if (!edits.length) continue;
    const updated = spliceText(part.xml, edits);
    const after = model(updated);
    requireCondition(after.groups.length === part.groups.length, 'E_PRESERVATION', '치환 후 문단 개수가 달라졌습니다.');
    for (let index = 0; index < part.groups.length; index++) {
      const group = part.groups[index];
      const expected = spliceText(group.text, group.fields.map(field => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, '\n') })));
      requireCondition(after.groups[index].text === expected, 'E_PRESERVATION', 'HWPX 입력값의 완전한 적용을 확인할 수 없습니다.');
    }
    zip.file(part.path, updated);
    changed.add(part.path);
  }
  zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE' });
  const output = zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
  const reopened = await open(output);
  const original = new PizZip(bytes);
  requireCondition(Object.keys(reopened.zip.files).length === Object.keys(original.files).length, 'E_PRESERVATION', 'HWPX ZIP 항목 개수가 달라졌습니다.');
  for (const [path, entry] of Object.entries(original.files)) {
    if (!entry.dir && !changed.has(path)) requireCondition(Buffer.from(entry.asUint8Array()).equals(Buffer.from(reopened.zip.file(path).asUint8Array())), 'E_PRESERVATION', 'HWPX 비대상 데이터가 달라졌습니다.');
  }
  return { bytes: output, engine: ENGINE, checks: [{ name: 'hwpx-structure', status: 'passed' }, { name: 'exact-field-values', status: 'passed' }, { name: 'untouched-entries', status: 'passed' }], warnings: [visualWarning, '기존 미리보기 데이터는 보존되므로 문서 본문을 열어 결과를 확인하세요.'] };
}

export async function validate(bytes, context = {}) {
  await open(bytes);
  return { engine: ENGINE, checks: [{ name: 'hwpx-structure', status: 'passed' }], warnings: [visualWarning] };
}
