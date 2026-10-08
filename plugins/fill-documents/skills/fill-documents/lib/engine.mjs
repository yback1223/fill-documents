import fs from 'node:fs/promises';
import path from 'node:path';
import { FillError, requireCondition } from './errors.mjs';
import { readDocument, sha256, publishNewFile } from './io.mjs';
import { findTemplate } from './catalog.mjs';
import { isPlainObject, normalizeFields, checkValues, matchManifestFields } from './fields.mjs';
import { assertSafeZip } from './zip-safety.mjs';
import { readCoverage, checkCoverageFields, completionReport } from './coverage.mjs';

const loaders = {
  hwp: () => import('./adapters/hwp.mjs'),
  hwpx: () => import('./adapters/hwpx.mjs'),
  docx: () => import('./adapters/docx.mjs'),
  pdf: () => import('./adapters/pdf.mjs'),
};

export function formatFromPath(filePath) {
  const format = path.extname(filePath).slice(1).toLowerCase();
  requireCondition(Object.hasOwn(loaders, format), 'E_UNSUPPORTED', '지원 형식은 .hwp, .hwpx, .docx, .pdf입니다.');
  return format;
}

function validateSignature(bytes, format) {
  if (format === 'hwp') requireCondition(bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex')), 'E_INPUT', '확장자와 HWP 파일 서명이 다릅니다.');
  else if (format === 'pdf') requireCondition(bytes.subarray(0, 5).toString() === '%PDF-', 'E_INPUT', '확장자와 PDF 파일 서명이 다릅니다.');
  else assertSafeZip(bytes);
}

export async function inspectDocument(input, context) {
  const bytes = Buffer.from(input);
  const format = formatFromPath(context.filePath);
  validateSignature(bytes, format);
  const templateSha256 = sha256(bytes);
  const coverage = readCoverage(context.coverage, templateSha256);
  if (context.layoutProfile !== undefined) {
    const profile = context.layoutProfile;
    requireCondition(isPlainObject(profile) && profile.version === 1 && ['hwpx', 'pdf'].includes(profile.format) && typeof profile.templateSha256 === 'string' && /^[a-f0-9]{64}$/.test(profile.templateSha256), 'E_INPUT', '레이아웃 프로필의 형식이 올바르지 않습니다.');
    requireCondition(profile.format === format, 'E_UNSUPPORTED', '프로필과 문서의 형식이 다릅니다.');
    requireCondition(profile.templateSha256 === sha256(bytes), 'E_TEMPLATE_CHANGED', '프로필의 원본 해시와 현재 문서가 다릅니다.');
    requireCondition(!(context.manifest && format === 'hwpx'), 'E_UNSUPPORTED', 'HWPX 반복 행은 등록 ID 대신 파일 경로와 프로필을 지정하세요.');
  }
  const adapter = await loaders[format]();
  const info = await adapter.inspect(bytes, context);
  const fields = normalizeFields(info.fields);
  checkCoverageFields(coverage, fields);
  return { ...info, format, fields, sha256: templateSha256, warnings: info.warnings ?? [],
    fieldDiscovery: { scope: 'explicit-fields', fullDocumentInventory: false }, completion: completionReport(coverage) };
}

export async function inspectFile(filePath, skillRoot, options = {}) {
  return inspectDocument(await readDocument(filePath), { ...options, filePath: path.resolve(filePath), skillRoot });
}

export async function validateFile(filePath, skillRoot) {
  const bytes = await readDocument(filePath);
  const format = formatFromPath(filePath);
  validateSignature(bytes, format);
  const report = await (await loaders[format]()).validate(bytes, { filePath: path.resolve(filePath), skillRoot });
  requireCondition(!report.checks?.some(check => check.status === 'failed'), 'E_PRESERVATION', '문서 검증에 실패했습니다.');
  return { format, sha256: sha256(bytes), ...report, operation: 'structure-validation',
    completion: completionReport(undefined, { structureOnly: true }), visualValidation: 'not-performed' };
}

export async function fillDocument({ target, values, output, skillRoot, library, dryRun = false, overflow = 'preserve', layoutProfile, coverage }) {
  requireCondition(['preserve', 'flow'].includes(overflow), 'E_INPUT', 'overflow는 preserve 또는 flow여야 합니다.');
  requireCondition(layoutProfile === undefined || overflow === 'flow', 'E_INPUT', '레이아웃 프로필은 overflow=flow와 함께 사용하세요.');
  let item;
  try {
    const info = await fs.stat(target);
    requireCondition(info.isFile(), 'E_INPUT', '문서 파일 경로를 지정하세요.');
    item = { filePath: path.resolve(target), bytes: await readDocument(target) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    item = await findTemplate(target, skillRoot, library);
  }
  const context = { filePath: item.filePath, skillRoot, manifest: item.manifest, overflow, layoutProfile, coverage };
  const info = await inspectDocument(item.bytes, context);
  requireCondition(info.fields.length > 0, 'E_FIELDS', '명시적인 입력 필드가 없습니다. 서식 등록 안내를 확인하세요.');
  const fields = item.manifest ? matchManifestFields(info.fields, item.manifest.fields) : info.fields;
  const data = checkValues(values, fields);
  requireCondition(typeof output === 'string' && formatFromPath(output) === info.format, 'E_INPUT', '출력 확장자는 입력 문서와 같아야 합니다.');
  requireCondition(path.resolve(output) !== path.resolve(item.filePath), 'E_OUTPUT_EXISTS', '원본을 덮어쓸 수 없습니다. 새 출력 경로를 지정하세요.');
  const base = { operation: 'field-fill', format: info.format, templateSha256: info.sha256, fields: fields.map(field => field.name), visualValidation: 'not-performed' };
  const adapter = await loaders[info.format]();
  const result = await adapter.fill(item.bytes, data, context);
  const candidate = Buffer.from(result.bytes);
  validateSignature(candidate, info.format);
  const validation = await adapter.validate(candidate, context);
  const checks = [...(result.checks ?? []), ...(validation.checks ?? [])];
  requireCondition(!checks.some(check => check.status === 'failed'), 'E_PRESERVATION', '입력 결과의 검증에 실패했습니다.');
  requireCondition(sha256(await readDocument(item.filePath)) === info.sha256, 'E_TEMPLATE_CHANGED', '작업 중 원본이 변경됐습니다. 새 원본을 확인하세요.');
  const valuesReread = checks.some(check => ['field-values-reread', 'exact-field-values'].includes(check.name) && ['pass', 'passed'].includes(check.status));
  const report = { ...base, engine: result.engine ?? info.engine, checks,
    completion: { ...info.completion, fieldVerification: {
      source: valuesReread ? 'candidate-reread' : 'not-performed', verifiedFields: valuesReread ? fields.length : 0,
    } },
    layout: result.layout ?? { policy: overflow },
    warnings: [...(result.warnings ?? []), ...(validation.warnings ?? [])] };
  if (dryRun) return { ...report, dryRun: true, output: path.resolve(output), publication: 'not-attempted' };
  const published = await publishNewFile(output, candidate);
  return { ...report, output: published.path, outputSha256: sha256(candidate), warnings: [...report.warnings, ...published.warnings] };
}
