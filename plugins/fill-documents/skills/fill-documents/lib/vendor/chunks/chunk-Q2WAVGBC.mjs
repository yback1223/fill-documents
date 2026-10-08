import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);

// lib/errors.mjs
var FillError = class extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "FillError";
    this.code = code;
    if (details !== void 0) this.details = details;
  }
};
function requireCondition(condition, code, message, details) {
  if (!condition) throw new FillError(code, message, details);
}

export {
  FillError,
  requireCondition
};
