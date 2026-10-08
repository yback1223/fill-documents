export class FillError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'FillError';
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export function requireCondition(condition, code, message, details) {
  if (!condition) throw new FillError(code, message, details);
}
