import { requireCondition } from './errors.mjs';

export const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const validName = name => typeof name === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) && !['constructor', 'prototype', '__proto__'].includes(name);

export function normalizeFields(fields) {
  requireCondition(Array.isArray(fields), 'E_FIELDS', '필드 목록이 올바르지 않습니다.');
  const seen = new Set();
  return fields.map(field => {
    requireCondition(isPlainObject(field) && validName(field.name) && !seen.has(field.name) && ['text', 'checkbox'].includes(field.type), 'E_FIELDS', '필드 이름이나 형식이 유효하지 않습니다.');
    seen.add(field.name);
    const occurrences = field.occurrences ?? 1;
    const maxLength = field.maxLength ?? 10000;
    requireCondition(Number.isInteger(occurrences) && occurrences > 0 && Number.isInteger(maxLength) && maxLength > 0 && maxLength <= 10000, 'E_FIELDS', '필드 개수 또는 길이 제한이 유효하지 않습니다.');
    return { ...field, required: true, occurrences, maxLength };
  });
}

export function checkValues(input, fields) {
  requireCondition(isPlainObject(input), 'E_FIELDS', '필드 입력은 JSON 객체여야 합니다.');
  const byName = new Map(fields.map(field => [field.name, field]));
  const unknown = Object.keys(input).filter(key => !byName.has(key));
  requireCondition(unknown.length === 0, 'E_FIELDS', '서식에 없는 입력 필드가 있습니다.', { fields: unknown });
  const result = Object.create(null);
  for (const field of fields) {
    requireCondition(Object.hasOwn(input, field.name), 'E_FIELDS', '필수 입력이 누락됐습니다.', { field: field.name });
    const value = input[field.name];
    if (field.type === 'checkbox') {
      requireCondition(typeof value === 'boolean', 'E_FIELDS', '체크박스는 true 또는 false여야 합니다.', { field: field.name });
    } else {
      requireCondition(typeof value === 'string' && value.trim().length > 0 && Array.from(value).length <= field.maxLength && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), 'E_FIELDS', '문자열의 형식·공란·길이를 확인하세요.', { field: field.name, maxLength: field.maxLength });
    }
    result[field.name] = value;
  }
  return result;
}

export function matchManifestFields(found, declared) {
  const expected = normalizeFields(declared);
  requireCondition(found.length === expected.length && expected.every(field => found.some(item => item.name === field.name && item.type === field.type && item.occurrences === field.occurrences)), 'E_TEMPLATE_CHANGED', '템플릿 필드가 등록 정보와 다릅니다. 다시 분석하고 등록하세요.');
  return expected;
}
