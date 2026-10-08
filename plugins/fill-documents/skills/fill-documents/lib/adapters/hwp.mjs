import { randomUUID } from 'node:crypto';
import { blocksToMarkdown, parse, patchHwp } from 'kordoc';
import { FillError, requireCondition } from '../errors.mjs';
import { checkedValues, fieldList, fieldNamePattern, placeholders, spliceText, visualWarning } from './hancom-utils.mjs';
import { characterStyles, hwpContainer, openHancom, paragraphSnapshot, verifyExportLoss } from './hancom-runtime.mjs';
import { createHwpFlowCandidate, expectedParagraph, verifyHwpFlowLayout, verifyHwpFlowTargets } from './hwp-flow.mjs';

const ENGINE = 'kordoc@4.19.2 + @rhwp/core@0.8.7';

async function open(bytes, context) {
  const streams = hwpContainer(bytes);
  let parsed;
  try { parsed = await parse(new Uint8Array(bytes), { layoutTables: 'keep' }); } catch { throw new FillError('E_INPUT', 'HWP 본문을 읽을 수 없습니다.'); }
  requireCondition(parsed.success && parsed.fileType === 'hwp', 'E_INPUT', 'HWP 본문이 올바르지 않습니다.');
  const document = await openHancom(bytes, context);
  return { streams, parsed, document };
}

function markdownFields(markdown) {
  return [...markdown.matchAll(/\{\{([\s\S]*?)\}\}/g)].map(match => {
    const name = match[1].replace(/\\_/g, '_');
    requireCondition(fieldNamePattern.test(name), 'E_FIELDS', '지원하지 않는 HWP 필드 문법입니다.');
    return { name, start: match.index, end: match.index + match[0].length };
  });
}

function templateModel(document, parsed, overflow = 'preserve') {
  const paragraphs = paragraphSnapshot(document);
  const occurrences = paragraphs.flatMap(paragraph => placeholders(paragraph.text).map(tag => ({ ...tag, paragraph })));
  const fields = fieldList(occurrences);
  const unsupported = (condition, message, reason, field) => requireCondition(condition, overflow === 'flow' ? 'E_LAYOUT' : 'E_PRESERVATION', message, overflow === 'flow' ? { field, region: 'body-paragraph', reason } : undefined);
  unsupported(fields.every(field => field.occurrences === 1), 'HWP는 한 번씩 나타나는 고유 표식만 지원합니다.', 'ambiguous-field');
  const discovered = fieldList(markdownFields(parsed.markdown));
  unsupported(JSON.stringify(discovered.map(field => [field.name, field.occurrences]).sort()) === JSON.stringify(fields.map(field => [field.name, field.occurrences]).sort()), 'HWP 본문 밖 또는 지원하지 않는 영역에 필드가 있습니다.', 'unsupported-anchor');
  const targets = new Set(occurrences.map(field => field.paragraph));
  for (const paragraph of targets) {
    const matching = parsed.blocks.filter(block => ['paragraph', 'heading'].includes(block.type) && block.text === paragraph.text);
    const field = occurrences.find(item => item.paragraph === paragraph).name;
    // Native flow maps the section/paragraph to exact raw records instead. Kordoc
    // can classify an otherwise plain top-level paragraph as a Markdown list.
    if (overflow !== 'flow') unsupported(matching.length === 1, 'HWP 필드와 본문 문단을 명확하게 대응할 수 없습니다.', 'ambiguous-field', field);
    const styles = characterStyles(document, paragraph);
    const firstField = Math.min(...occurrences.filter(item => item.paragraph === paragraph).map(item => item.start));
    const tailStart = overflow === 'flow' ? Array.from(paragraph.text.slice(0, firstField)).length : 0;
    const tailStyle = styles[tailStart];
    unsupported(styles.length > tailStart && styles.slice(tailStart).every(style => style === tailStyle), 'HWP 표식과 그 뒤 본문의 글자 서식이 혼합되어 있습니다. 표식 뒤는 같은 글자 서식으로 준비하세요.', 'mixed-character-styles', field);
    paragraph.characterStyle = tailStyle;
    paragraph.prefixStyles = styles.slice(0, tailStart);
  }
  verifyExportLoss(document);
  return { paragraphs, occurrences, fields, targets };
}

function editedMarkdown(parsed, model, values) {
  const lineBreak = `FILLDOCUMENTSLINEBREAK${randomUUID().replaceAll('-', '')}`;
  const targets = new Map([...model.targets].map(paragraph => [paragraph.text, paragraph]));
  const blocks = parsed.blocks.map(block => {
    const paragraph = targets.get(block.text);
    if (!paragraph) return block;
    const text = spliceText(paragraph.text, model.occurrences.filter(field => field.paragraph === paragraph).map(field => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, '\n') })));
    return { ...block, text: text.replaceAll('\n', lineBreak), spans: undefined };
  });
  return blocksToMarkdown(blocks).replace(/(?<!\\)\$/g, '\\$').replaceAll(lineBreak, '<br>');
}

export async function inspect(bytes, context = {}) {
  const { document, parsed, streams } = await open(bytes, context);
  try {
    let model;
    let requiresFlow = false;
    try { model = templateModel(document, parsed, context.overflow ?? 'preserve'); }
    catch (error) {
      if (context.overflow === 'flow' || error.code !== 'E_PRESERVATION') throw error;
      try {
        model = templateModel(document, parsed, 'flow');
        verifyHwpFlowTargets(streams, model);
      } catch { throw error; }
      requiresFlow = true;
    }
    if (context.overflow === 'flow') verifyHwpFlowTargets(streams, model);
    const warnings = [visualWarning, 'HWP는 고유 표식의 최상위 본문만 채웁니다. flow는 기존 접두부 서식을 유지하고 표식 이후가 균일한 문단을 지원합니다.'];
    if (requiresFlow) warnings.push('이 HWP의 필드는 --overflow flow가 필요합니다. 기본 preserve 채우기는 지원하지 않으며 실제 채우기에서 보존·배치를 추가 검사합니다.');
    return { format: 'hwp', fields: model.fields, engine: ENGINE, ...(requiresFlow ? { requiredOverflow: 'flow' } : {}), warnings };
  } finally { document.free(); }
}

export async function fill(bytes, values, context = {}) {
  const overflow = context.overflow ?? 'preserve';
  requireCondition(['preserve', 'flow'].includes(overflow), 'E_INPUT', 'HWP overflow 정책이 올바르지 않습니다.');
  const original = Buffer.from(bytes);
  const { document, parsed, streams } = await open(bytes, context);
  let candidate;
  try {
    const model = templateModel(document, parsed, overflow);
    requireCondition(model.fields.length > 0, 'E_FIELDS', '채울 수 있는 명시적 HWP 필드가 없습니다.');
    checkedValues(model.fields, values, context);
    let output;
    if (overflow === 'flow') output = await createHwpFlowCandidate(bytes, streams, model, values, context);
    else {
      const markdown = editedMarkdown(parsed, model, values);
      let patched;
      try { patched = await patchHwp(new Uint8Array(bytes), markdown, { verify: true }); } catch { throw new FillError('E_PRESERVATION', 'HWP 패치를 안전하게 완료할 수 없습니다.'); }
      requireCondition(patched.success && patched.data && patched.applied === model.targets.size && Array.isArray(patched.skipped) && patched.skipped.length === 0 && patched.verification && patched.verification.diffs.length === 0, 'E_PRESERVATION', 'HWP 변경이 일부 생략되었거나 남은 차이가 있어 출력을 저장하지 않습니다.');
      output = patched.data;
    }
    candidate = await open(output, context);
    const after = paragraphSnapshot(candidate.document);
    requireCondition(after.length === model.paragraphs.length, 'E_PRESERVATION', 'HWP 문단 개수가 달라졌습니다.');
    for (let index = 0; index < after.length; index++) {
      const beforeParagraph = model.paragraphs[index];
      const afterParagraph = after[index];
      const expected = expectedParagraph(model, beforeParagraph, values);
      requireCondition(afterParagraph.text === expected && beforeParagraph.paragraphStyle === afterParagraph.paragraphStyle, 'E_PRESERVATION', 'HWP 텍스트 또는 문단 서식의 보존을 확인할 수 없습니다.');
      if (model.targets.has(beforeParagraph)) {
        const styles = characterStyles(candidate.document, afterParagraph);
        const prefix = beforeParagraph.prefixStyles;
        requireCondition(styles.every((style, offset) => style === (offset < prefix.length ? prefix[offset] : beforeParagraph.characterStyle)), 'E_PRESERVATION', 'HWP 고정 접두부 또는 입력 본문의 글자 서식이 달라졌습니다.');
      }
      else requireCondition(JSON.stringify(characterStyles(document, beforeParagraph)) === JSON.stringify(characterStyles(candidate.document, afterParagraph)), 'E_PRESERVATION', '비대상 HWP 글자 서식이 달라졌습니다.');
    }
    requireCondition(candidate.streams.size === streams.size, 'E_PRESERVATION', 'HWP 스트림 개수가 달라졌습니다.');
    for (const [path, content] of streams) if (!/^BodyText\/Section\d+$/.test(path)) requireCondition(candidate.streams.has(path) && content.equals(candidate.streams.get(path)), 'E_PRESERVATION', 'HWP 비대상 스트림이 달라졌습니다.');
    verifyExportLoss(candidate.document);
    requireCondition(Buffer.from(bytes).equals(original), 'E_PRESERVATION', 'HWP 원본 버퍼가 변경되었습니다.');
    let layout = { policy: 'preserve', strategy: 'existing-layout' };
    if (overflow === 'flow') {
      try { layout = verifyHwpFlowLayout(candidate.document, model, values, document.pageCount()); }
      catch (error) {
        if (error instanceof FillError) throw error;
        throw new FillError('E_LAYOUT', 'HWP 엔진의 페이지 배치 결과를 확인할 수 없습니다.', { region: 'document', reason: 'no-progress' });
      }
    }
    const flowChecks = overflow === 'flow' ? [{ name: 'body-record-allowlist', status: 'passed' }, { name: 'page-text-bounds-and-coverage', status: 'passed' }] : [{ name: 'engine-skips-and-residuals', status: 'passed' }];
    return { bytes: output, engine: ENGINE, layout, visualValidation: 'not-performed', checks: [{ name: 'hwp-reopen', status: 'passed' }, { name: 'exact-field-values', status: 'passed' }, { name: 'character-and-paragraph-styles', status: 'passed' }, { name: 'untouched-streams', status: 'passed' }, ...flowChecks], warnings: [visualWarning, '기존 미리보기 스트림은 보존되므로 문서 본문을 열어 결과를 확인하세요.'] };
  } finally { document.free(); candidate?.document.free(); }
}

export async function validate(bytes, context = {}) {
  const { document } = await open(bytes, context);
  try {
    paragraphSnapshot(document);
    verifyExportLoss(document);
    return { engine: ENGINE, checks: [{ name: 'hwp-reopen', status: 'passed' }, { name: 'engine-content-loss', status: 'passed' }], warnings: [visualWarning] };
  } finally { document.free(); }
}
