import { inflateRawSync } from 'node:zlib';
import CFB from 'cfb';
import { FillError, requireCondition } from '../errors.mjs';
import { hwpContainer, openHancom } from './hancom-runtime.mjs';
import { spliceText } from './hancom-utils.mjs';

const sectionPattern = /^BodyText\/Section(\d+)$/;
const lineSize = 36;
const lineBreakMask = 1 << 10;
const paragraphKey = (section, paragraph) => `${section}:${paragraph}`;
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes) {
  let checksum = 0xffffffff;
  for (const byte of bytes) checksum = crcTable[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  return (checksum ^ 0xffffffff) >>> 0;
}

export function decodeHwpDocInfo(streams) {
  const bytes = streams.get('DocInfo');
  requireCondition(bytes && bytes.length <= 32 * 1024 * 1024, 'E_PRESERVATION', 'HWP 공용 서식 스트림이 없거나 너무 큽니다.');
  if (!(streams.get('FileHeader').readUInt32LE(36) & 1)) return bytes;
  let inflated;
  try { inflated = inflateRawSync(bytes, { maxOutputLength: 32 * 1024 * 1024, info: true }); }
  catch { throw new FillError('E_PRESERVATION', 'HWP 공용 서식 압축이 손상되었거나 너무 큽니다.'); }
  const payload = inflated.buffer;
  const trailer = bytes.subarray(inflated.engine.bytesWritten);
  requireCondition(trailer.length === 0 || (trailer.length === 8 && trailer.readUInt32LE(0) === crc32(payload) && trailer.readUInt32LE(4) === payload.length), 'E_PRESERVATION', 'HWP 공용 서식 압축의 잔여 데이터·CRC·크기가 올바르지 않습니다.');
  return payload;
}

function layoutFailure(field, reason, message) {
  throw new FillError('E_LAYOUT', message, { field, region: 'body-paragraph', reason });
}

export function expectedParagraph(model, paragraph, values) {
  return spliceText(paragraph.text, model.occurrences.filter(field => field.paragraph === paragraph).map(field => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, '\n') })));
}

// Parse boundaries without interpreting or regenerating unrelated records.
export function parseHwpRecords(bytes) {
  const buffer = Buffer.from(bytes);
  requireCondition(buffer.length <= 32 * 1024 * 1024, 'E_INPUT', 'HWP 본문 스트림이 너무 큽니다.');
  const records = [];
  let offset = 0;
  let paragraph = -1;
  let previousLevel = -1;
  while (offset < buffer.length) {
    requireCondition(records.length < 100000 && offset + 4 <= buffer.length, 'E_INPUT', 'HWP 레코드 개수 또는 경계가 올바르지 않습니다.');
    const header = buffer.readUInt32LE(offset);
    const tag = header & 0x3ff;
    const level = (header >>> 10) & 0x3ff;
    let size = header >>> 20;
    let headerSize = 4;
    if (size === 0xfff) {
      requireCondition(offset + 8 <= buffer.length, 'E_INPUT', 'HWP 확장 레코드 길이가 없습니다.');
      size = buffer.readUInt32LE(offset + 4);
      headerSize = 8;
    }
    requireCondition(level <= 64 && level <= previousLevel + 1 && size <= buffer.length - offset - headerSize, 'E_INPUT', 'HWP 레코드 수준 또는 길이가 올바르지 않습니다.');
    if (level === 0) {
      requireCondition(tag === 66, 'E_UNSUPPORTED', '알 수 없는 최상위 HWP 본문 레코드입니다.');
      paragraph++;
    }
    requireCondition(paragraph >= 0, 'E_INPUT', 'HWP 문단 머리말이 없습니다.');
    records.push({ tag, level, paragraph, offset, headerSize, data: buffer.subarray(offset + headerSize, offset + headerSize + size), raw: buffer.subarray(offset, offset + headerSize + size) });
    previousLevel = level;
    offset += headerSize + size;
  }
  requireCondition(records.length > 0, 'E_INPUT', 'HWP 본문 레코드가 비어 있습니다.');
  return records;
}

function sectionRecords(streams, path) {
  let bytes = streams.get(path);
  requireCondition(bytes, 'E_PRESERVATION', 'HWP 본문 스트림이 누락되었습니다.');
  if (streams.get('FileHeader').readUInt32LE(36) & 1) {
    try { bytes = inflateRawSync(bytes, { maxOutputLength: 32 * 1024 * 1024 }); }
    catch { throw new FillError('E_INPUT', 'HWP 본문 압축을 해제할 수 없습니다.'); }
  }
  return parseHwpRecords(bytes);
}

function targetsByKey(model) {
  return new Map([...model.targets].map(paragraph => [paragraphKey(paragraph.section, paragraph.paragraph), paragraph]));
}

function targetRecords(records, paragraph) {
  return records.filter(record => record.paragraph === paragraph.paragraph);
}

export function verifyHwpFlowTargets(streams, model, values) {
  decodeHwpDocInfo(streams);
  for (const paragraph of model.targets) {
    const field = model.occurrences.find(item => item.paragraph === paragraph).name;
    const records = targetRecords(sectionRecords(streams, `BodyText/Section${paragraph.section}`), paragraph);
    if (records.length !== 4 || records.some((record, index) => record.tag !== [66, 67, 68, 69][index] || record.level !== (index === 0 ? 0 : 1))) layoutFailure(field, 'unsupported-anchor', 'HWP 흐름 편집은 제어 개체가 없는 최상위 본문 문단만 지원합니다.');
    if (!records[1].data.equals(Buffer.from(`${paragraph.text}\r`, 'utf16le'))) layoutFailure(field, 'unsupported-anchor', 'HWP 본문에 단순 텍스트 외의 인라인 제어 정보가 있습니다.');
    const properties = JSON.parse(paragraph.paragraphStyle);
    if (properties.singleLine || properties.keepLines || properties.keepWithNext) layoutFailure(field, 'fixed-container', '문단의 한 줄·묶음 보호 설정을 유지하며 HWP 본문을 확장할 수 없습니다.');
    if (values && expectedParagraph(model, paragraph, values).includes('\t')) layoutFailure(field, 'unsupported-character', 'HWP 흐름 편집의 탭 제어 문자는 지원하지 않습니다.');
    requireCondition(records[0].data.length >= 22 && records[2].data.length >= 8 && records[2].data.length % 8 === 0 && records[2].data.readUInt32LE(0) === 0 && records[3].data.length > 0 && records[3].data.length % lineSize === 0, 'E_UNSUPPORTED', '지원하지 않는 HWP 문단 머리말·글자서식·줄 레코드입니다.');
    const firstField = Math.min(...model.occurrences.filter(item => item.paragraph === paragraph).map(item => item.start));
    let previous = -1;
    for (let offset = 0; offset < records[2].data.length; offset += 8) {
      const start = records[2].data.readUInt32LE(offset);
      if (start <= previous || start > firstField) layoutFailure(field, 'mixed-character-styles', 'HWP 표식 뒤에 다른 글자 서식이 있어 원래 서식을 유지하며 채울 수 없습니다.');
      previous = start;
    }
  }
}

function verifyTargetHeader(before, after, text, lineCount) {
  requireCondition(before.length === after.length && before.length >= 22, 'E_PRESERVATION', 'HWP 문단 머리말 크기가 달라졌습니다.');
  const expected = Buffer.from(before);
  expected.writeUInt32LE(((before.readUInt32LE(0) & 0x80000000) | (text.length + 1)) >>> 0, 0);
  expected.writeUInt32LE(((before.readUInt32LE(4) & ~lineBreakMask) | (text.includes('\n') ? lineBreakMask : 0)) >>> 0, 4);
  requireCondition(Number.isSafeInteger(lineCount) && lineCount > 0 && lineCount <= 0xffff, 'E_LAYOUT', 'HWP 문단의 줄 개수 제한을 초과했습니다.', { region: 'body-paragraph', reason: 'no-progress' });
  expected.writeUInt16LE(lineCount, 16);
  requireCondition(expected.equals(after), 'E_PRESERVATION', 'HWP 대상 문단의 허용되지 않은 속성이 달라졌습니다.');
}

function verifyTargetLines(before, after, text) {
  requireCondition(before.length > 0 && before.length % lineSize === 0 && after.length > 0 && after.length % lineSize === 0, 'E_PRESERVATION', 'HWP 줄 배치 레코드의 크기가 올바르지 않습니다.');
  let previous = -1;
  for (let offset = 0; offset < after.length; offset += lineSize) {
    const start = after.readUInt32LE(offset);
    requireCondition(start > previous && start <= text.length && (offset > 0 || start === 0) && after.readInt32LE(offset + 8) > 0 && after.readInt32LE(offset + 12) > 0 && after.readInt32LE(offset + 28) > 0, 'E_PRESERVATION', 'HWP 줄 범위·글자 높이·가로 영역이 올바르지 않습니다.');
    previous = start;
  }
}

// Any unrecognized record change rejects the entire candidate before grafting.
export function verifyHwpFlowChanges(original, exported, model, values) {
  requireCondition(original.get('FileHeader')?.equals(exported.get('FileHeader')), 'E_PRESERVATION', 'HWP 파일 머리말이 달라졌습니다.');
  requireCondition(decodeHwpDocInfo(original).equals(decodeHwpDocInfo(exported)), 'E_PRESERVATION', 'HWP 공용 서식의 전체 압축 해제 바이트가 달라졌습니다.');
  const sourceNames = [...original.keys()].filter(path => sectionPattern.test(path)).sort();
  const exportedNames = [...exported.keys()].filter(path => sectionPattern.test(path)).sort();
  requireCondition(JSON.stringify(sourceNames) === JSON.stringify(exportedNames), 'E_PRESERVATION', 'HWP 본문 구역 집합이 달라졌습니다.');
  const targets = targetsByKey(model);
  const changedSections = [];
  for (const path of sourceNames) {
    const section = Number(sectionPattern.exec(path)[1]);
    const before = sectionRecords(original, path);
    const after = sectionRecords(exported, path);
    requireCondition(before.length === after.length, 'E_PRESERVATION', 'HWP 본문 레코드 개수가 달라졌습니다.');
    const sectionTargets = [...model.targets].filter(paragraph => paragraph.section === section);
    const firstTarget = Math.min(...sectionTargets.map(paragraph => paragraph.paragraph));
    const lineCounts = new Map(sectionTargets.map(paragraph => [paragraph.paragraph, targetRecords(after, paragraph).find(record => record.tag === 69 && record.level === 1)?.data.length / lineSize]));
    for (let index = 0; index < before.length; index++) {
      const a = before[index];
      const b = after[index];
      requireCondition(a.tag === b.tag && a.level === b.level && a.paragraph === b.paragraph, 'E_PRESERVATION', 'HWP 본문 레코드 구조가 달라졌습니다.');
      const target = targets.get(paragraphKey(section, a.paragraph));
      if (target && a.level <= 1 && [66, 67, 69].includes(a.tag)) {
        const text = expectedParagraph(model, target, values);
        if (a.tag === 66) verifyTargetHeader(a.data, b.data, text, lineCounts.get(a.paragraph));
        else if (a.tag === 67) requireCondition(b.data.equals(Buffer.from(`${text}\r`, 'utf16le')), 'E_PRESERVATION', 'HWP 대상 텍스트의 원시 레코드가 입력값과 다릅니다.');
        else verifyTargetLines(a.data, b.data, text);
      } else if (a.tag === 69 && a.level === 1 && a.paragraph > firstTarget) {
        requireCondition(a.raw.length === b.raw.length && a.data.length % lineSize === 0, 'E_PRESERVATION', '후속 HWP 문단의 줄 구조가 달라졌습니다.');
        const verticalOnly = Buffer.from(a.raw);
        for (let offset = 0; offset < a.data.length; offset += lineSize) b.data.copy(verticalOnly, a.headerSize + offset + 4, offset + 4, offset + 8);
        requireCondition(verticalOnly.equals(b.raw), 'E_PRESERVATION', '후속 HWP 문단의 세로 위치 외의 레코드가 달라졌습니다.');
      } else requireCondition(a.raw.equals(b.raw), 'E_PRESERVATION', '비대상 HWP 본문 레코드가 달라졌습니다.');
    }
    if (sectionTargets.length) changedSections.push(path);
  }
  return changedSections;
}

export function writeHwpContainer(container, originalStreams) {
  const output = Buffer.from(CFB.write(container, { type: 'buffer' }));
  const seedName = '\u0001Sh33tJ5';
  if (!originalStreams.has(seedName)) {
    // cfb@1.2.2 always inserts its own four-byte marker when writing. Its output
    // directory is contiguous with right-linked siblings. Remove only this new
    // marker; never delete a stream that belonged to the source document.
    const index = container.FileIndex.findIndex(entry => entry.name === seedName);
    const entry = container.FileIndex[index];
    requireCondition(index > 0 && entry?.type === 2 && entry.L === -1 && entry.C === -1 && entry.R !== index && Buffer.from(entry.content).equals(Buffer.from([55, 50, 54, 50])) && output.readUInt16LE(26) === 3 && output.readUInt16LE(30) === 9, 'E_PRESERVATION', 'CFB 작성기의 보조 스트림을 안전하게 제외할 수 없습니다.');
    const directoryStart = (output.readUInt32LE(48) + 1) * 512;
    for (let position = 0; position < container.FileIndex.length; position++) {
      const start = directoryStart + position * 128;
      requireCondition(start + 128 <= output.length, 'E_PRESERVATION', 'CFB 디렉터리 범위가 올바르지 않습니다.');
      const current = container.FileIndex[position];
      requireCondition(output[start + 66] === current.type && [68, 72, 76].every((offset, key) => output.readInt32LE(start + offset) === current[['L', 'R', 'C'][key]]), 'E_PRESERVATION', 'CFB 작성기의 디렉터리 구조가 달라졌습니다.');
      for (const offset of [68, 72, 76]) if (output.readInt32LE(start + offset) === index) output.writeInt32LE(entry.R, start + offset);
    }
    const start = directoryStart + index * 128;
    output.fill(0, start, start + 128);
    for (const offset of [68, 72, 76]) output.writeInt32LE(-1, start + offset);
  }
  const actual = hwpContainer(output);
  requireCondition(actual.size === originalStreams.size && [...originalStreams.keys()].every(name => actual.has(name)), 'E_PRESERVATION', 'HWP 원본 스트림 집합이 달라졌습니다.');
  return new Uint8Array(output);
}

export async function createHwpFlowCandidate(bytes, streams, model, values, context) {
  verifyHwpFlowTargets(streams, model, values);
  const working = await openHancom(bytes, context);
  let exported;
  try {
    for (const field of model.fields) {
      let result;
      try { result = JSON.parse(working.replaceAll(`{{${field.name}}}`, values[field.name].replace(/\r\n?/g, '\n'), true)); }
      catch { throw new FillError('E_PRESERVATION', 'HWP 본문 직접 치환을 완료할 수 없습니다.'); }
      requireCondition(result.ok === true && result.count === field.occurrences, 'E_PRESERVATION', 'HWP 직접 치환 개수가 일치하지 않습니다.', { field: field.name });
    }
    exported = working.exportHwpWithReport();
    const loss = JSON.parse(exported.contentLoss());
    requireCondition(loss.count === 0 && Array.isArray(loss.losses) && loss.losses.length === 0, 'E_PRESERVATION', 'HWP 직접 치환에서 내용 손실이 발견되었습니다.');
    const exportedStreams = hwpContainer(exported.takeBytes());
    const changedSections = verifyHwpFlowChanges(streams, exportedStreams, model, values);
    const container = CFB.read(Buffer.from(bytes), { type: 'buffer' });
    for (const path of changedSections) CFB.utils.cfb_add(container, `/${path}`, exportedStreams.get(path));
    return writeHwpContainer(container, streams);
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_PRESERVATION', 'HWP 흐름 편집 결과의 보존을 확인할 수 없습니다.');
  } finally { exported?.free(); working.free(); }
}

export function verifyHwpFlowLayout(document, model, values, beforePages) {
  const pageCount = document.pageCount();
  requireCondition(Number.isSafeInteger(pageCount) && pageCount > 0 && pageCount <= 10000, 'E_LAYOUT', 'HWP 페이지 범위를 확인할 수 없습니다.', { region: 'document', reason: 'no-progress' });
  const targets = new Map([...model.targets].map(paragraph => {
    const text = Array.from(expectedParagraph(model, paragraph, values));
    return [paragraphKey(paragraph.section, paragraph.paragraph), { paragraph, text, covered: new Uint8Array(text.length), positions: new Map() }];
  }));
  for (let page = 0; page < pageCount; page++) {
    const info = JSON.parse(document.getPageInfo(page));
    const layout = JSON.parse(document.getPageTextLayout(page));
    requireCondition(Number.isFinite(info.width) && Number.isFinite(info.height) && Array.isArray(layout.runs), 'E_LAYOUT', 'HWP 페이지 좌표를 확인할 수 없습니다.', { region: 'document', reason: 'no-progress' });
    for (const run of layout.runs) {
      if (run.text?.trim() && (![run.x, run.y, run.w, run.h].every(Number.isFinite) || run.x < -0.2 || run.y < -0.2 || run.w < 0 || run.h <= 0 || run.x + run.w > info.width + 0.2 || run.y + run.h > info.height + 0.2)) {
        throw new FillError('E_LAYOUT', 'HWP 본문 또는 후속 항목이 페이지 영역을 벗어났습니다.', { region: 'document', reason: 'page-overflow', page: page + 1, section: run.secIdx, paragraph: run.paraIdx });
      }
      // Cell/header paragraphs have their own paraIdx sequence. They must not
      // satisfy the coverage check for a same-numbered top-level paragraph.
      if (run.parentParaIdx != null || run.controlIdx != null || run.cellIdx != null) continue;
      const target = targets.get(paragraphKey(run.secIdx, run.paraIdx));
      if (!target) continue;
      const field = model.occurrences.find(item => item.paragraph === target.paragraph).name;
      if (![run.x, run.y, run.w, run.h].every(Number.isFinite) || run.x < -0.2 || run.y < -0.2 || run.w < 0 || run.h <= 0 || run.x + run.w > info.width + 0.2 || run.y + run.h > info.height + 0.2) layoutFailure(field, 'page-overflow', 'HWP 대상 텍스트가 페이지 영역을 벗어났습니다.');
      const characters = Array.from(run.text);
      requireCondition(Number.isSafeInteger(run.charStart) && run.charStart >= 0 && run.charStart + characters.length <= target.text.length && Array.isArray(run.charX) && run.charX.length === characters.length + 1 && run.charX.every(Number.isFinite), 'E_LAYOUT', 'HWP 텍스트와 표시 좌표의 대응을 확인할 수 없습니다.', { field, region: 'body-paragraph', reason: 'ambiguous-field' });
      for (let index = 0; index < characters.length; index++) {
        const offset = run.charStart + index;
        requireCondition(target.text[offset] === characters[index] && target.covered[offset] === 0 && run.charX[index] >= -0.2 && run.charX[index + 1] >= run.charX[index] && run.x + run.charX[index + 1] <= info.width + 0.2, 'E_LAYOUT', 'HWP 입력값의 모든 글자가 페이지 안에 한 번씩 배치되는지 확인할 수 없습니다.', { field, region: 'body-paragraph', reason: 'ambiguous-field' });
        target.covered[offset] = 1;
        target.positions.set(offset, { page: page + 1, x: run.x + run.charX[index], y: run.y });
      }
    }
  }
  const lastCharacters = [];
  for (const target of targets.values()) {
    const fields = model.occurrences.filter(field => field.paragraph === target.paragraph).sort((a, b) => a.start - b.start);
    requireCondition(target.text.every((character, index) => character === '\n' || target.covered[index] === 1), 'E_LAYOUT', 'HWP 대상 텍스트의 일부가 페이지 배치에서 누락되었습니다.', { field: fields[0].name, region: 'body-paragraph', reason: 'no-progress' });
    let shift = 0;
    for (const field of fields) {
      const replacement = Array.from(values[field.name].replace(/\r\n?/g, '\n'));
      const start = Array.from(target.paragraph.text.slice(0, field.start)).length + shift;
      const lastOffset = replacement.findLastIndex(character => character !== '\n');
      lastCharacters.push({ field: field.name, ...target.positions.get(start + lastOffset) });
      shift += replacement.length - Array.from(target.paragraph.text.slice(field.start, field.end)).length;
    }
  }
  return { policy: 'flow', strategy: 'native', changedContainers: model.occurrences.map(field => ({ field: field.name, region: 'body-paragraph', changes: ['reflow-lines'] })), pagination: { source: 'rhwp', before: beforePages, after: pageCount, status: 'engine-checked' }, lastCharacters };
}
