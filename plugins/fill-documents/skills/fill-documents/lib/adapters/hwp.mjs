import { randomUUID } from 'node:crypto';
import { blocksToMarkdown, parse, patchHwp } from 'kordoc';
import { FillError, requireCondition } from '../errors.mjs';
import { checkedValues, fieldList, fieldNamePattern, placeholders, spliceText, visualWarning } from './hancom-utils.mjs';
import { characterStyles, hwpContainer, openHancom, paragraphSnapshot, verifyExportLoss } from './hancom-runtime.mjs';

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

function templateModel(document, parsed) {
  const paragraphs = paragraphSnapshot(document);
  const occurrences = paragraphs.flatMap(paragraph => placeholders(paragraph.text).map(tag => ({ ...tag, paragraph })));
  const fields = fieldList(occurrences);
  requireCondition(fields.every(field => field.occurrences === 1), 'E_PRESERVATION', 'HWP는 한 번씩 나타나는 고유 표식만 지원합니다.');
  const discovered = fieldList(markdownFields(parsed.markdown));
  requireCondition(JSON.stringify(discovered.map(field => [field.name, field.occurrences]).sort()) === JSON.stringify(fields.map(field => [field.name, field.occurrences]).sort()), 'E_PRESERVATION', 'HWP 본문 밖 또는 지원하지 않는 영역에 필드가 있습니다.');
  const targets = new Set(occurrences.map(field => field.paragraph));
  for (const paragraph of targets) {
    const matching = parsed.blocks.filter(block => ['paragraph', 'heading'].includes(block.type) && block.text === paragraph.text);
    requireCondition(matching.length === 1, 'E_PRESERVATION', 'HWP 필드와 본문 문단을 명확하게 대응할 수 없습니다.');
    const styles = characterStyles(document, paragraph);
    requireCondition(styles.length > 0 && styles.every(style => style === styles[0]), 'E_PRESERVATION', '필드가 있는 HWP 문단의 글자 서식이 혼합되어 있습니다. HWPX 또는 균일한 서식의 문단을 사용하세요.');
    paragraph.characterStyle = styles[0];
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
  const { document, parsed } = await open(bytes, context);
  try {
    const { fields } = templateModel(document, parsed);
    return { format: 'hwp', fields, engine: ENGINE, warnings: [visualWarning, 'HWP는 고유 표식과 균일한 글자 서식의 본문 문단만 채웁니다.'] };
  } finally { document.free(); }
}

export async function fill(bytes, values, context = {}) {
  const original = Buffer.from(bytes);
  const { document, parsed, streams } = await open(bytes, context);
  let candidate;
  try {
    const model = templateModel(document, parsed);
    requireCondition(model.fields.length > 0, 'E_FIELDS', '채울 수 있는 명시적 HWP 필드가 없습니다.');
    checkedValues(model.fields, values, context);
    const markdown = editedMarkdown(parsed, model, values);
    let patched;
    try { patched = await patchHwp(new Uint8Array(bytes), markdown, { verify: true }); } catch { throw new FillError('E_PRESERVATION', 'HWP 패치를 안전하게 완료할 수 없습니다.'); }
    requireCondition(patched.success && patched.data && patched.applied === model.targets.size && Array.isArray(patched.skipped) && patched.skipped.length === 0 && patched.verification && patched.verification.diffs.length === 0, 'E_PRESERVATION', 'HWP 변경이 일부 생략되었거나 남은 차이가 있어 출력을 저장하지 않습니다.');
    candidate = await open(patched.data, context);
    const after = paragraphSnapshot(candidate.document);
    requireCondition(after.length === model.paragraphs.length, 'E_PRESERVATION', 'HWP 문단 개수가 달라졌습니다.');
    for (let index = 0; index < after.length; index++) {
      const beforeParagraph = model.paragraphs[index];
      const afterParagraph = after[index];
      const expected = spliceText(beforeParagraph.text, model.occurrences.filter(field => field.paragraph === beforeParagraph).map(field => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, '\n') })));
      requireCondition(afterParagraph.text === expected && beforeParagraph.paragraphStyle === afterParagraph.paragraphStyle, 'E_PRESERVATION', 'HWP 텍스트 또는 문단 서식의 보존을 확인할 수 없습니다.');
      if (model.targets.has(beforeParagraph)) requireCondition(characterStyles(candidate.document, afterParagraph).every(style => style === beforeParagraph.characterStyle), 'E_PRESERVATION', 'HWP 글자 서식이 달라졌습니다.');
      else requireCondition(JSON.stringify(characterStyles(document, beforeParagraph)) === JSON.stringify(characterStyles(candidate.document, afterParagraph)), 'E_PRESERVATION', '비대상 HWP 글자 서식이 달라졌습니다.');
    }
    requireCondition(candidate.streams.size === streams.size, 'E_PRESERVATION', 'HWP 스트림 개수가 달라졌습니다.');
    for (const [path, content] of streams) if (!/^BodyText\/Section\d+$/.test(path)) requireCondition(content.equals(candidate.streams.get(path)), 'E_PRESERVATION', 'HWP 비대상 스트림이 달라졌습니다.');
    verifyExportLoss(candidate.document);
    requireCondition(Buffer.from(bytes).equals(original), 'E_PRESERVATION', 'HWP 원본 버퍼가 변경되었습니다.');
    return { bytes: patched.data, engine: ENGINE, checks: [{ name: 'hwp-reopen', status: 'passed' }, { name: 'exact-field-values', status: 'passed' }, { name: 'character-and-paragraph-styles', status: 'passed' }, { name: 'untouched-streams', status: 'passed' }, { name: 'engine-skips-and-residuals', status: 'passed' }], warnings: [visualWarning, '기존 미리보기 스트림은 보존되므로 문서 본문을 열어 결과를 확인하세요.'] };
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
