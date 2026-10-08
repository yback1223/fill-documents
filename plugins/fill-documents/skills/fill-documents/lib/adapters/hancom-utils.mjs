import { DOMParser } from '@xmldom/xmldom';
import { FillError, requireCondition } from '../errors.mjs';

export const visualWarning = '문서 구조와 텍스트를 검사했습니다. 한컴 앱의 페이지 배치·출력 모양은 확인하지 않았습니다.';
export const fieldNamePattern = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const validFieldName = name => fieldNamePattern.test(name) && !['constructor', 'prototype', '__proto__'].includes(name);

export function placeholders(text) {
  const matches = [];
  for (const match of text.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
    requireCondition(validFieldName(match[1]), 'E_FIELDS', '지원하지 않는 필드 이름 또는 템플릿 문법입니다.');
    matches.push({ name: match[1], start: match.index, end: match.index + match[0].length });
  }
  const remainder = text.replace(/\{\{[\s\S]*?\}\}/g, '');
  requireCondition(!remainder.includes('{{') && !remainder.includes('}}'), 'E_FIELDS', '닫히지 않은 필드 표식이 있습니다.');
  return matches;
}

export function fieldList(occurrences) {
  const fields = new Map();
  for (const { name } of occurrences) {
    requireCondition(validFieldName(name), 'E_FIELDS', '지원하지 않는 필드 이름입니다.');
    const entry = fields.get(name) ?? { name, type: 'text', occurrences: 0 };
    entry.occurrences++;
    fields.set(name, entry);
  }
  return [...fields.values()];
}

// Adapters also guard direct API use; the common engine applies the same contract.
export function checkedValues(fields, values, context = {}) {
  requireCondition(values && typeof values === 'object' && !Array.isArray(values), 'E_FIELDS', '입력값은 객체여야 합니다.');
  const known = new Set(fields.map(field => field.name));
  requireCondition(Object.keys(values).every(name => known.has(name)), 'E_FIELDS', '문서에 없는 입력 필드가 있습니다.');
  for (const field of fields) {
    const value = values[field.name];
    const configured = context.manifest?.fields?.find(item => item.name === field.name)?.maxLength;
    const limit = Math.min(Number.isSafeInteger(configured) && configured > 0 ? configured : 10000, 10000);
    requireCondition(Object.hasOwn(values, field.name) && typeof value === 'string' && value.trim().length > 0, 'E_FIELDS', '필수 텍스트 입력값이 없거나 비어 있습니다.', { field: field.name });
    requireCondition([...value].length <= limit, 'E_FIELDS', '입력값의 최대 길이를 초과했습니다.', { field: field.name, maxLength: limit });
    requireCondition(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(value) && !/[\uD800-\uDFFF]/u.test(value), 'E_FIELDS', '지원하지 않는 제어 문자 또는 잘못된 Unicode 문자가 있습니다.', { field: field.name });
    requireCondition(!value.includes('{{') && !value.includes('}}'), 'E_FIELDS', '입력값에 템플릿 표식을 넣을 수 없습니다.', { field: field.name });
  }
  return values;
}

export function xmlEscape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function spliceText(source, edits) {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  const chunks = [];
  let end = 0;
  for (const edit of sorted) {
    requireCondition(edit.start >= end && edit.end >= edit.start && edit.end <= source.length, 'E_PRESERVATION', '문서의 수정 범위가 겹치거나 올바르지 않습니다.');
    chunks.push(source.slice(end, edit.start), edit.replacement);
    end = edit.end;
  }
  return chunks.join('') + source.slice(end);
}

// A validated XML tree with source offsets keeps untouched tags and attributes byte-for-byte.
export function scanXml(xml) {
  requireCondition(!/<!DOCTYPE|<!ENTITY/i.test(xml), 'E_UNSUPPORTED', 'DTD와 외부 엔티티가 있는 문서는 지원하지 않습니다.');
  let invalid = false;
  let dom;
  try {
    dom = new DOMParser({ onError: () => { invalid = true; } }).parseFromString(xml, 'application/xml');
  } catch {
    throw new FillError('E_INPUT', '문서 XML이 올바르지 않습니다.');
  }
  requireCondition(!invalid && dom.documentElement, 'E_INPUT', '문서 XML이 올바르지 않습니다.');
  const nodes = [];
  const stack = [];
  const domNodes = [...Array.from(dom.getElementsByTagName('*'))];
  let domIndex = 0;
  const token = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<(?:"[^"]*"|'[^']*'|[^'">])*>/g;
  for (const match of xml.matchAll(token)) {
    const raw = match[0];
    if (/^<(!|\?)/.test(raw)) continue;
    if (raw.startsWith('</')) {
      const node = stack.pop();
      requireCondition(node && raw.slice(2, -1).trim() === node.name, 'E_INPUT', 'XML 요소의 닫힘이 일치하지 않습니다.');
      node.closeStart = match.index;
      node.end = match.index + raw.length;
      continue;
    }
    const name = raw.match(/^<([^\s/>]+)/)?.[1];
    const element = domNodes[domIndex++];
    requireCondition(element?.nodeName === name, 'E_INPUT', 'XML 요소의 위치를 확인할 수 없습니다.');
    const node = { name, local: element.localName, namespace: element.namespaceURI, attrs: Object.fromEntries(Array.from(element.attributes).map(attribute => [attribute.name, attribute.value])), start: match.index, openEnd: match.index + raw.length, closeStart: match.index + raw.length, end: match.index + raw.length, selfClosing: /\/\s*>$/.test(raw), parent: stack.at(-1), children: [], element };
    node.parent?.children.push(node);
    nodes.push(node);
    if (!node.selfClosing) stack.push(node);
  }
  requireCondition(stack.length === 0 && domIndex === domNodes.length, 'E_INPUT', 'XML 요소의 위치를 확인할 수 없습니다.');
  return nodes;
}

export function ancestor(node, predicate) {
  for (let parent = node.parent; parent; parent = parent.parent) if (predicate(parent)) return parent;
  return undefined;
}
