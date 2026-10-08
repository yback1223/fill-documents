import { requireCondition } from './errors.mjs';
import { isPlainObject } from './fields.mjs';

const hasText = value => typeof value === 'string' && value.trim().length > 0;
const states = ['filled', 'explicitly_excluded', 'not_applicable', 'blocked'];

function check(condition, reason, slotIndex) {
  // IDs, locations and evidence are caller text and may contain private data.
  requireCondition(condition, 'E_COVERAGE', '작성 대상 목록의 형식·근거·필드 대응을 확인하세요.', {
    reason, ...(slotIndex === undefined ? {} : { slotIndex }),
  });
}

function userInstruction(evidence, reason, slotIndex) {
  check(isPlainObject(evidence) && evidence.kind === 'user-instruction' && hasText(evidence.reference), reason, slotIndex);
  return { kind: 'user-instruction', reference: evidence.reference };
}

// Copy only the supported declaration. Extra flags cannot certify completion.
export function readCoverage(input, templateSha256) {
  if (input === undefined) return undefined;
  check(isPlainObject(input) && input.version === 1, 'invalid-version');
  check(typeof input.templateSha256 === 'string' && /^[a-f0-9]{64}$/.test(input.templateSha256), 'invalid-template-hash');
  const scope = input.scope === undefined ? 'full' : input.scope;
  check(['full', 'partial'].includes(scope), 'invalid-scope');
  const scopeEvidence = scope === 'partial' ? userInstruction(input.scopeEvidence, 'missing-scope-instruction') : undefined;
  check(Array.isArray(input.slots), 'invalid-slots');
  const ids = new Set();
  const slots = input.slots.map((slot, index) => {
    check(isPlainObject(slot) && hasText(slot.id), 'invalid-slot-id', index);
    check(!ids.has(slot.id), 'duplicate-slot-id', index);
    ids.add(slot.id);
    check(hasText(slot.location), 'missing-location', index);
    check(states.includes(slot.status), 'invalid-status', index);
    const copy = { id: slot.id, location: slot.location, status: slot.status };
    if (slot.status === 'blocked') {
      check(hasText(slot.reason) && hasText(slot.nextAction), 'missing-blocker-action', index);
      return { ...copy, reason: slot.reason, nextAction: slot.nextAction };
    }
    if (slot.status === 'explicitly_excluded') {
      return { ...copy, evidence: userInstruction(slot.evidence, 'missing-exclusion-instruction', index) };
    }
    const evidence = slot.evidence;
    check(isPlainObject(evidence), 'missing-evidence', index);
    if (slot.status === 'not_applicable') {
      check(evidence.kind === 'applicability' && hasText(evidence.condition) && hasText(evidence.reason), 'missing-applicability', index);
      return { ...copy, evidence: { kind: 'applicability', condition: evidence.condition, reason: evidence.reason } };
    }
    check(['fields', 'external-review'].includes(evidence.kind), 'invalid-filled-evidence', index);
    if (evidence.kind === 'external-review') {
      check(hasText(evidence.reference), 'missing-review-reference', index);
      return { ...copy, evidence: { kind: 'external-review', reference: evidence.reference } };
    }
    check(Array.isArray(evidence.fields) && evidence.fields.length > 0 && evidence.fields.every(hasText), 'invalid-evidence-fields', index);
    return { ...copy, evidence: { kind: 'fields', fields: [...evidence.fields] } };
  });
  requireCondition(input.templateSha256 === templateSha256, 'E_TEMPLATE_CHANGED', '작성 대상 목록의 준비본 해시와 현재 문서가 다릅니다.');
  return { version: 1, templateSha256, scope, ...(scopeEvidence ? { scopeEvidence } : {}), slots };
}

export function checkCoverageFields(coverage, fields) {
  if (!coverage) return;
  const found = new Set(fields.map(field => field.name)), linked = new Set();
  for (const [index, slot] of coverage.slots.entries()) {
    if (slot.evidence?.kind !== 'fields') continue;
    for (const name of slot.evidence.fields) {
      check(found.has(name), 'unknown-field', index);
      check(!linked.has(name), 'duplicate-field', index);
      linked.add(name);
    }
  }
  check(linked.size === found.size, 'unmapped-fields');
}

export function completionReport(coverage, { structureOnly = false } = {}) {
  const slots = coverage?.slots ?? [];
  const counts = {
    declaredSlots: slots.length,
    fieldLinkedSlots: slots.filter(slot => slot.evidence?.kind === 'fields').length,
    externallyDeclaredFilledSlots: slots.filter(slot => slot.evidence?.kind === 'external-review').length,
    explicitlyExcludedSlots: slots.filter(slot => slot.status === 'explicitly_excluded').length,
    notApplicableSlots: slots.filter(slot => slot.status === 'not_applicable').length,
    blockedSlots: slots.filter(slot => slot.status === 'blocked').length,
  };
  return {
    scope: coverage?.scope ?? 'full',
    status: !coverage || counts.blockedSlots ? 'incomplete' : 'requires-review',
    fullDocumentComplete: false,
    inventory: coverage ? 'declared' : 'not-provided',
    verificationScope: structureOnly ? 'structure-only' : coverage ? 'explicit-fields-and-manifest-consistency' : 'explicit-fields',
    reason: structureOnly ? '문서 구조만 검사했으며 전체 작성 대상과 최종 표시를 확인하지 않았습니다.'
      : !coverage ? '문서 전체 작성 대상과 최종 표시를 확인하지 않았습니다.'
        : counts.blockedSlots ? '작성 대상 목록에 미해결 항목이 있습니다. 전체 작성과 최종 표시 확인이 필요합니다.'
          : '작성 대상 목록의 선언은 일관되지만 원본 전체와 최종 파일을 대조한 검수가 필요합니다.',
    counts,
    fieldVerification: { source: 'not-performed', verifiedFields: 0 },
  };
}
