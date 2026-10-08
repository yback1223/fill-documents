import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);
import {
  requireCondition
} from "./chunk-Q2WAVGBC.mjs";

// lib/fields.mjs
var isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
var validName = (name) => typeof name === "string" && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) && !["constructor", "prototype", "__proto__"].includes(name);
function normalizeFields(fields) {
  requireCondition(Array.isArray(fields), "E_FIELDS", "\uD544\uB4DC \uBAA9\uB85D\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const seen = /* @__PURE__ */ new Set();
  return fields.map((field) => {
    requireCondition(isPlainObject(field) && validName(field.name) && !seen.has(field.name) && ["text", "checkbox", "rows"].includes(field.type), "E_FIELDS", "\uD544\uB4DC \uC774\uB984\uC774\uB098 \uD615\uC2DD\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    seen.add(field.name);
    const occurrences = field.occurrences ?? 1;
    if (field.type === "rows") {
      requireCondition(occurrences === 1 && Number.isInteger(field.maxRows) && field.maxRows >= 1 && field.maxRows <= 100 && Array.isArray(field.columns) && field.columns.length >= 1 && field.columns.length <= 30, "E_FIELDS", "\uBC18\uBCF5 \uD589 \uB610\uB294 \uC5F4\uC758 \uAC1C\uC218 \uC81C\uD55C\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      requireCondition(field.columns.every((column) => isPlainObject(column) && column.type === "text" && (column.occurrences ?? 1) === 1 && Number.isInteger(column.maxLength) && column.maxLength >= 1 && column.maxLength <= 1e4), "E_FIELDS", "\uBC18\uBCF5 \uC5F4\uC740 \uAE38\uC774 \uC81C\uD55C\uC774 \uC788\uB294 \uB2E8\uC77C \uBB38\uC790\uC5F4\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
      return { ...field, required: true, occurrences, columns: normalizeFields(field.columns) };
    }
    const maxLength = field.maxLength ?? 1e4;
    requireCondition(Number.isInteger(occurrences) && occurrences > 0 && Number.isInteger(maxLength) && maxLength > 0 && maxLength <= 1e4, "E_FIELDS", "\uD544\uB4DC \uAC1C\uC218 \uB610\uB294 \uAE38\uC774 \uC81C\uD55C\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    return { ...field, required: true, occurrences, maxLength };
  });
}
function checkValues(input, fields) {
  requireCondition(isPlainObject(input), "E_FIELDS", "\uD544\uB4DC \uC785\uB825\uC740 JSON \uAC1D\uCCB4\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  const byName = new Map(fields.map((field) => [field.name, field]));
  const unknown = Object.keys(input).filter((key) => !byName.has(key));
  requireCondition(unknown.length === 0, "E_FIELDS", "\uC11C\uC2DD\uC5D0 \uC5C6\uB294 \uC785\uB825 \uD544\uB4DC\uAC00 \uC788\uC2B5\uB2C8\uB2E4.", { fields: unknown });
  const result = /* @__PURE__ */ Object.create(null);
  let repeatedCharacters = 0;
  for (const field of fields) {
    requireCondition(Object.hasOwn(input, field.name), "E_FIELDS", "\uD544\uC218 \uC785\uB825\uC774 \uB204\uB77D\uB410\uC2B5\uB2C8\uB2E4.", { field: field.name });
    const value = input[field.name];
    if (field.type === "rows") {
      requireCondition(Array.isArray(value) && value.length >= 1 && value.length <= field.maxRows, "E_FIELDS", "\uBC18\uBCF5 \uD589\uC758 \uAC1C\uC218\uB97C \uD655\uC778\uD558\uC138\uC694.", { field: field.name, maxRows: field.maxRows });
      result[field.name] = value.map((row) => {
        const checked = checkValues(row, field.columns);
        repeatedCharacters += Object.values(checked).reduce((sum, text) => sum + Array.from(text).length, 0);
        requireCondition(repeatedCharacters <= 5e5, "E_FIELDS", "\uBC18\uBCF5 \uC601\uC5ED\uC758 \uC804\uCCB4 \uBB38\uC790\uC5F4\uC740 500,000\uC790 \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
        return checked;
      });
      continue;
    } else if (field.type === "checkbox") {
      requireCondition(typeof value === "boolean", "E_FIELDS", "\uCCB4\uD06C\uBC15\uC2A4\uB294 true \uB610\uB294 false\uC5EC\uC57C \uD569\uB2C8\uB2E4.", { field: field.name });
    } else {
      requireCondition(typeof value === "string" && value.trim().length > 0 && Array.from(value).length <= field.maxLength && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value), "E_FIELDS", "\uBB38\uC790\uC5F4\uC758 \uD615\uC2DD\xB7\uACF5\uB780\xB7\uAE38\uC774\uB97C \uD655\uC778\uD558\uC138\uC694.", { field: field.name, maxLength: field.maxLength });
    }
    result[field.name] = value;
  }
  return result;
}
function matchManifestFields(found, declared) {
  const expected = normalizeFields(declared);
  requireCondition(found.length === expected.length && expected.every((field) => found.some((item) => item.name === field.name && item.type === field.type && item.occurrences === field.occurrences && (field.type !== "rows" || item.maxRows === field.maxRows && item.columns.length === field.columns.length && item.columns.every((column, index) => column.name === field.columns[index].name && column.type === field.columns[index].type && column.maxLength === field.columns[index].maxLength)))), "E_TEMPLATE_CHANGED", "\uD15C\uD50C\uB9BF \uD544\uB4DC\uAC00 \uB4F1\uB85D \uC815\uBCF4\uC640 \uB2E4\uB985\uB2C8\uB2E4. \uB2E4\uC2DC \uBD84\uC11D\uD558\uACE0 \uB4F1\uB85D\uD558\uC138\uC694.");
  return expected;
}

export {
  isPlainObject,
  normalizeFields,
  checkValues,
  matchManifestFields
};
