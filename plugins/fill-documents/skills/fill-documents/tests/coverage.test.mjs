import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import PizZip from 'pizzip';
import { inspectDocument, inspectFile, fillDocument, validateFile } from '../lib/engine.mjs';
import { sha256 } from '../lib/io.mjs';
import { createDocxTemplate } from '../scripts/generate-office-templates.mjs';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const blankCell = '<w:tc><w:tcPr><w:tcW w:w="7000" w:type="dxa"/></w:tcPr><w:p/></w:tc>';

async function documentFixture(t, { marked = true } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fill-coverage-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const zip = new PizZip(createDocxTemplate({ title: '가상 협약 신청서', fields: [{ name: 'body', label: '사업 개요', height: 120, maxLength: 1000 }] }));
  let xml = zip.file('word/document.xml').asText();
  if (!marked) xml = xml.replace('{{body}}', '고정 안내문');
  xml = xml.replace('<w:sectPr>', `<w:tbl xmlns:w="${namespace}"><w:tblPr/><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="7000"/></w:tblGrid><w:tr><w:tc><w:p><w:r><w:t>대표자 성명</w:t></w:r></w:p></w:tc>${blankCell}</w:tr></w:tbl><w:sectPr>`);
  zip.file('word/document.xml', xml);
  const bytes = zip.generate({ type: 'nodebuffer' });
  assert(zip.file('word/document.xml').asText().includes(blankCell));
  const target = path.join(root, 'source.docx'), output = path.join(root, 'result.docx');
  await fs.writeFile(target, bytes);
  return { root, target, output, bytes, args: { target, output, skillRoot, values: { body: '가상 청년 직무교육 사업을 운영합니다.' } } };
}

const fieldSlot = () => ({ id: 'business.overview', location: '1쪽 / 사업 개요', status: 'filled', evidence: { kind: 'fields', fields: ['body'] } });
const outsideSlot = () => ({ id: 'representative.name', location: '1쪽 / 대표자 성명', status: 'filled', evidence: { kind: 'external-review', reference: '최종 셀 값 및 화면 대조 기록' } });
const coverageFor = (bytes, slots = [fieldSlot()]) => ({ version: 1, templateSha256: sha256(bytes), slots });

test('unmarked required DOCX cells remain visible as incomplete after a successful field fill', async t => {
  const fixture = await documentFixture(t);
  const inspected = await inspectFile(fixture.target, skillRoot);
  assert.deepEqual(inspected.fields.map(field => field.name), ['body']);
  assert.deepEqual(inspected.fieldDiscovery, { scope: 'explicit-fields', fullDocumentInventory: false });
  assert.equal(inspected.completion.fullDocumentComplete, false);
  const report = await fillDocument(fixture.args);
  const xml = new PizZip(await fs.readFile(fixture.output)).file('word/document.xml').asText();
  assert(xml.includes(fixture.args.values.body));
  assert(xml.includes(blankCell), 'The actual unmarked empty cell must still exist in the saved DOCX.');
  assert(!xml.includes('{{body}}'));
  assert.equal(report.operation, 'field-fill');
  assert.equal(report.completion.scope, 'full');
  assert.equal(report.completion.status, 'incomplete');
  assert.equal(report.completion.fullDocumentComplete, false);
  assert.equal(report.completion.inventory, 'not-provided');
  assert.equal(report.completion.verificationScope, 'explicit-fields');
  const saved = await inspectFile(fixture.output, skillRoot);
  assert.equal(saved.fields.length, 0);
  assert.equal(saved.completion.status, 'incomplete');
  const validation = await validateFile(fixture.output, skillRoot);
  assert.equal(validation.operation, 'structure-validation');
  assert.equal(validation.completion.fullDocumentComplete, false);
  assert.equal(validation.completion.verificationScope, 'structure-only');
  assert.equal(sha256(await fs.readFile(fixture.target)), sha256(fixture.bytes));
});

test('declared and externally reviewed slots never certify overall document completion', async t => {
  const fixture = await documentFixture(t);
  const coverage = coverageFor(fixture.bytes, [fieldSlot(), outsideSlot()]);
  coverage.verified = true;
  coverage.fullDocumentComplete = true;
  const inspected = await inspectFile(fixture.target, skillRoot, { coverage });
  assert.equal(inspected.completion.status, 'requires-review');
  assert.equal(inspected.completion.fieldVerification.verifiedFields, 0);
  const result = await fillDocument({ ...fixture.args, coverage });
  assert.equal(result.completion.status, 'requires-review');
  assert.equal(result.completion.fullDocumentComplete, false);
  assert.equal(result.completion.inventory, 'declared');
  assert.equal(result.completion.verificationScope, 'explicit-fields-and-manifest-consistency');
  assert.equal(result.completion.counts.externallyDeclaredFilledSlots, 1);
  assert.equal(result.completion.counts.fieldLinkedSlots, 1);
  assert.deepEqual(result.completion.fieldVerification, { source: 'candidate-reread', verifiedFields: 1 });
  assert.equal(result.outputSha256, sha256(await fs.readFile(fixture.output)));
  assert(!JSON.stringify(result.completion).includes('최종 셀 값'));
});

test('blocked slots and dry runs stay incomplete without losing the supported fill', async t => {
  const fixture = await documentFixture(t);
  const coverage = coverageFor(fixture.bytes, [fieldSlot(), { id: 'representative.name', location: '1쪽 / 대표자', status: 'blocked', reason: '성명 미확인', nextAction: '사용자에게 성명을 확인한다.' }]);
  const result = await fillDocument({ ...fixture.args, coverage, dryRun: true });
  assert.equal(result.completion.status, 'incomplete');
  assert.equal(result.completion.counts.blockedSlots, 1);
  assert.equal(result.completion.fullDocumentComplete, false);
  assert.equal(result.completion.fieldVerification.source, 'candidate-reread');
  assert.equal(result.publication, 'not-attempted');
  assert.equal(result.outputSha256, undefined);
  await assert.rejects(fs.access(fixture.output), { code: 'ENOENT' });
});

test('partial scope requires a user instruction and remains partial in the response', async t => {
  const fixture = await documentFixture(t);
  const excluded = { id: 'representative.name', location: '1쪽 / 대표자', status: 'explicitly_excluded', evidence: { kind: 'user-instruction', reference: '사용자의 대표자란 제외 요청' } };
  const coverage = { ...coverageFor(fixture.bytes, [fieldSlot(), excluded]), scope: 'partial' };
  await assert.rejects(fillDocument({ ...fixture.args, coverage }), { code: 'E_COVERAGE' });
  coverage.scopeEvidence = { kind: 'user-instruction', reference: '사업 개요만 작성하라는 요청' };
  const result = await fillDocument({ ...fixture.args, coverage });
  assert.equal(result.completion.scope, 'partial');
  assert.equal(result.completion.status, 'requires-review');
  assert.equal(result.completion.fullDocumentComplete, false);
  assert.equal(result.completion.counts.explicitlyExcludedSlots, 1);
});

test('not-applicable declarations require conditions and do not become automatic verification', async t => {
  const fixture = await documentFixture(t, { marked: false });
  const coverage = coverageFor(fixture.bytes, [{ id: 'representative.name', location: '1쪽 / 대표자', status: 'not_applicable', evidence: { kind: 'applicability', condition: '개인 참가자는 대표자 별도 작성 대상이 아님', reason: '가상 사례는 개인 참가자임' } }]);
  const result = await inspectFile(fixture.target, skillRoot, { coverage });
  assert.equal(result.completion.status, 'requires-review');
  assert.equal(result.completion.fullDocumentComplete, false);
  assert.equal(result.completion.counts.notApplicableSlots, 1);
  assert.equal(result.completion.fieldVerification.verifiedFields, 0);
});

test('invalid coverage structure, evidence and field mappings fail before publication', async t => {
  const fixture = await documentFixture(t);
  const mutate = operation => { const item = coverageFor(fixture.bytes); operation(item); return item; };
  const invalid = [
    null, [], {},
    mutate(item => { item.version = 2; }),
    mutate(item => { item.scope = 'all'; }),
    mutate(item => { item.templateSha256 = 'not-a-hash'; }),
    mutate(item => { item.slots = {}; }),
    mutate(item => { item.slots.push(fieldSlot()); }),
    mutate(item => { item.slots[0].id = ' '; }),
    mutate(item => { item.slots[0].location = ' '; }),
    mutate(item => { item.slots[0].status = 'complete'; }),
    mutate(item => { delete item.slots[0].evidence; }),
    mutate(item => { item.slots[0].evidence.fields = []; }),
    mutate(item => { item.slots[0].evidence.fields = ['body', 'body']; }),
    mutate(item => { item.slots[0].evidence.fields = ['unknown']; }),
    mutate(item => { item.slots = [outsideSlot()]; }),
    mutate(item => { item.slots.push({ ...fieldSlot(), id: 'another.location' }); }),
    mutate(item => { item.slots.push({ ...outsideSlot(), evidence: { kind: 'external-review', reference: ' ' } }); }),
    mutate(item => { item.slots.push({ ...outsideSlot(), status: 'explicitly_excluded' }); }),
    mutate(item => { item.slots.push({ ...outsideSlot(), status: 'not_applicable', evidence: { kind: 'applicability', reason: '편의상 생략' } }); }),
    mutate(item => { item.slots.push({ id: 'pending', location: '1쪽', status: 'blocked', reason: '사실 미확인' }); }),
  ];
  for (const coverage of invalid) {
    await assert.rejects(fillDocument({ ...fixture.args, coverage }), { code: 'E_COVERAGE' });
    await assert.rejects(fs.access(fixture.output), { code: 'ENOENT' });
  }
  assert.equal(sha256(await fs.readFile(fixture.target)), sha256(fixture.bytes));
});

test('coverage structure and hash are checked before parsing the document adapter', async () => {
  const bytes = Buffer.from('%PDF-not-a-valid-document');
  await assert.rejects(inspectDocument(bytes, { filePath: 'source.pdf', coverage: { version: 2 } }), { code: 'E_COVERAGE' });
  await assert.rejects(inspectDocument(bytes, { filePath: 'source.pdf', coverage: { ...coverageFor(bytes), templateSha256: '0'.repeat(64) } }), { code: 'E_TEMPLATE_CHANGED' });
});

test('inspection keeps the validated coverage snapshot while the caller changes its object', async t => {
  const fixture = await documentFixture(t);
  const coverage = coverageFor(fixture.bytes, [fieldSlot(), outsideSlot()]);
  const pending = inspectDocument(fixture.bytes, { filePath: fixture.target, skillRoot, coverage });
  coverage.scope = 'partial';
  coverage.slots[0].evidence.fields.push('unmapped-after-inspection-started');
  coverage.slots[1].status = 'blocked';
  const result = await pending;
  assert.equal(result.completion.scope, 'full');
  assert.equal(result.completion.status, 'requires-review');
  assert.equal(result.completion.counts.externallyDeclaredFilledSlots, 1);
});

test('coverage failures do not echo private evidence, locations, IDs or unknown field names', async t => {
  const fixture = await documentFixture(t);
  const secret = 'private-person-identifying-data';
  const coverage = coverageFor(fixture.bytes, [{ ...fieldSlot(), id: secret, location: secret, evidence: { kind: 'fields', fields: [secret] } }]);
  await assert.rejects(fillDocument({ ...fixture.args, coverage }), error => {
    assert.equal(error.code, 'E_COVERAGE');
    assert(!`${error.message}${JSON.stringify(error.details)}`.includes(secret));
    assert.equal(error.details.reason, 'unknown-field');
    return true;
  });
});

test('coverage cannot bypass existing required values, unknown values, or source hashes', async t => {
  const fixture = await documentFixture(t);
  const coverage = coverageFor(fixture.bytes);
  for (const values of [{}, { body: ' ' }, { body: '본문', extra: '값' }]) {
    await assert.rejects(fillDocument({ ...fixture.args, coverage, values }), { code: 'E_FIELDS' });
  }
  const changed = { ...coverage, templateSha256: '0'.repeat(64) };
  await assert.rejects(fillDocument({ ...fixture.args, coverage: changed }), { code: 'E_TEMPLATE_CHANGED' });
  await assert.rejects(fs.access(fixture.output), { code: 'ENOENT' });
});

async function sourceCli(root) {
  const isolated = path.join(root, 'source-runtime');
  await fs.mkdir(isolated);
  await fs.cp(path.join(skillRoot, 'bin'), path.join(isolated, 'bin'), { recursive: true });
  await fs.cp(path.join(skillRoot, 'lib'), path.join(isolated, 'lib'), { recursive: true, filter: source => path.basename(source) !== 'vendor' });
  await fs.symlink(path.join(skillRoot, 'node_modules'), path.join(isolated, 'node_modules'), 'dir');
  return (...args) => {
    const result = spawnSync(process.execPath, [path.join(isolated, 'bin/fill-documents.mjs'), ...args], { encoding: 'utf8', timeout: 30000 });
    assert.ifError(result.error);
    return { ...result, json: JSON.parse(result.status === 0 ? result.stdout : result.stderr) };
  };
}

test('source CLI reports successful field operations without claiming full document completion', async t => {
  const fixture = await documentFixture(t), cli = await sourceCli(fixture.root);
  const values = path.join(fixture.root, 'values.json');
  await fs.writeFile(values, JSON.stringify(fixture.args.values));
  const filled = cli('fill', fixture.target, '--data', values, '--output', fixture.output);
  assert.equal(filled.status, 0);
  assert.equal(filled.json.ok, true);
  assert.equal(filled.json.operation, 'field-fill');
  assert.equal(filled.json.completion.fullDocumentComplete, false);
  assert.equal(filled.json.completion.status, 'incomplete');
  const inspected = cli('inspect', fixture.output);
  assert.equal(inspected.status, 0);
  assert.equal(inspected.json.fieldDiscovery.fullDocumentInventory, false);
  assert.equal(inspected.json.completion.fullDocumentComplete, false);
  const validated = cli('validate', fixture.output);
  assert.equal(validated.status, 0);
  assert.equal(validated.json.completion.verificationScope, 'structure-only');
});

test('source CLI accepts coverage and exposes safe coverage errors', async t => {
  const fixture = await documentFixture(t), cli = await sourceCli(fixture.root);
  const values = path.join(fixture.root, 'values.json'), coveragePath = path.join(fixture.root, 'coverage.json');
  const coverage = coverageFor(fixture.bytes, [fieldSlot(), outsideSlot()]);
  await fs.writeFile(values, JSON.stringify(fixture.args.values));
  await fs.writeFile(coveragePath, JSON.stringify(coverage));
  const inspected = cli('inspect', fixture.target, '--coverage', coveragePath);
  assert.equal(inspected.status, 0);
  assert.equal(inspected.json.completion.status, 'requires-review');
  const filled = cli('fill', fixture.target, '--data', values, '--output', fixture.output, '--coverage', coveragePath);
  assert.equal(filled.status, 0);
  assert.equal(filled.json.completion.fullDocumentComplete, false);
  assert.equal(filled.json.completion.counts.externallyDeclaredFilledSlots, 1);
  coverage.slots[0].evidence.fields = ['private-person-identifying-data'];
  await fs.writeFile(coveragePath, JSON.stringify(coverage));
  const rejected = cli('fill', fixture.target, '--data', values, '--output', path.join(fixture.root, 'invalid.docx'), '--coverage', coveragePath);
  assert.equal(rejected.status, 1);
  assert.equal(rejected.json.error.code, 'E_COVERAGE');
  assert(!rejected.stderr.includes('private-person-identifying-data'));
  const wrongCommand = cli('validate', fixture.output, '--coverage', coveragePath);
  assert.equal(wrongCommand.json.error.code, 'E_INPUT');
});
