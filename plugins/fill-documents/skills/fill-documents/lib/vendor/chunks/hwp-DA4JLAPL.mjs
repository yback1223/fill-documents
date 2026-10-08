import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);
import {
  blocksToMarkdown,
  characterStyles,
  hwpContainer,
  openHancom,
  paragraphSnapshot,
  parse,
  patchHwp,
  require_cfb,
  verifyExportLoss
} from "./chunk-JYYDJ5XF.mjs";
import "./chunk-7E4DDKWS.mjs";
import {
  checkedValues,
  fieldList,
  fieldNamePattern,
  placeholders,
  spliceText,
  visualWarning
} from "./chunk-4D6IQWXV.mjs";
import "./chunk-THFP5JW5.mjs";
import {
  FillError,
  requireCondition
} from "./chunk-Q2WAVGBC.mjs";
import {
  __toESM
} from "./chunk-WNYIIIUP.mjs";

// lib/adapters/hwp.mjs
import { randomUUID } from "node:crypto";

// lib/adapters/hwp-flow.mjs
var import_cfb = __toESM(require_cfb(), 1);
import { inflateRawSync } from "node:zlib";
var sectionPattern = /^BodyText\/Section(\d+)$/;
var lineSize = 36;
var lineBreakMask = 1 << 10;
var paragraphKey = (section, paragraph) => `${section}:${paragraph}`;
var crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let checksum = 4294967295;
  for (const byte of bytes) checksum = crcTable[(checksum ^ byte) & 255] ^ checksum >>> 8;
  return (checksum ^ 4294967295) >>> 0;
}
function decodeHwpDocInfo(streams) {
  const bytes = streams.get("DocInfo");
  requireCondition(bytes && bytes.length <= 32 * 1024 * 1024, "E_PRESERVATION", "HWP \uACF5\uC6A9 \uC11C\uC2DD \uC2A4\uD2B8\uB9BC\uC774 \uC5C6\uAC70\uB098 \uB108\uBB34 \uD07D\uB2C8\uB2E4.");
  if (!(streams.get("FileHeader").readUInt32LE(36) & 1)) return bytes;
  let inflated;
  try {
    inflated = inflateRawSync(bytes, { maxOutputLength: 32 * 1024 * 1024, info: true });
  } catch {
    throw new FillError("E_PRESERVATION", "HWP \uACF5\uC6A9 \uC11C\uC2DD \uC555\uCD95\uC774 \uC190\uC0C1\uB418\uC5C8\uAC70\uB098 \uB108\uBB34 \uD07D\uB2C8\uB2E4.");
  }
  const payload = inflated.buffer;
  const trailer = bytes.subarray(inflated.engine.bytesWritten);
  requireCondition(trailer.length === 0 || trailer.length === 8 && trailer.readUInt32LE(0) === crc32(payload) && trailer.readUInt32LE(4) === payload.length, "E_PRESERVATION", "HWP \uACF5\uC6A9 \uC11C\uC2DD \uC555\uCD95\uC758 \uC794\uC5EC \uB370\uC774\uD130\xB7CRC\xB7\uD06C\uAE30\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  return payload;
}
function layoutFailure(field, reason, message) {
  throw new FillError("E_LAYOUT", message, { field, region: "body-paragraph", reason });
}
function expectedParagraph(model, paragraph, values) {
  return spliceText(paragraph.text, model.occurrences.filter((field) => field.paragraph === paragraph).map((field) => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, "\n") })));
}
function parseHwpRecords(bytes) {
  const buffer = Buffer.from(bytes);
  requireCondition(buffer.length <= 32 * 1024 * 1024, "E_INPUT", "HWP \uBCF8\uBB38 \uC2A4\uD2B8\uB9BC\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4.");
  const records = [];
  let offset = 0;
  let paragraph = -1;
  let previousLevel = -1;
  while (offset < buffer.length) {
    requireCondition(records.length < 1e5 && offset + 4 <= buffer.length, "E_INPUT", "HWP \uB808\uCF54\uB4DC \uAC1C\uC218 \uB610\uB294 \uACBD\uACC4\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    const header = buffer.readUInt32LE(offset);
    const tag = header & 1023;
    const level = header >>> 10 & 1023;
    let size = header >>> 20;
    let headerSize = 4;
    if (size === 4095) {
      requireCondition(offset + 8 <= buffer.length, "E_INPUT", "HWP \uD655\uC7A5 \uB808\uCF54\uB4DC \uAE38\uC774\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      size = buffer.readUInt32LE(offset + 4);
      headerSize = 8;
    }
    requireCondition(level <= 64 && level <= previousLevel + 1 && size <= buffer.length - offset - headerSize, "E_INPUT", "HWP \uB808\uCF54\uB4DC \uC218\uC900 \uB610\uB294 \uAE38\uC774\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    if (level === 0) {
      requireCondition(tag === 66, "E_UNSUPPORTED", "\uC54C \uC218 \uC5C6\uB294 \uCD5C\uC0C1\uC704 HWP \uBCF8\uBB38 \uB808\uCF54\uB4DC\uC785\uB2C8\uB2E4.");
      paragraph++;
    }
    requireCondition(paragraph >= 0, "E_INPUT", "HWP \uBB38\uB2E8 \uBA38\uB9AC\uB9D0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    records.push({ tag, level, paragraph, offset, headerSize, data: buffer.subarray(offset + headerSize, offset + headerSize + size), raw: buffer.subarray(offset, offset + headerSize + size) });
    previousLevel = level;
    offset += headerSize + size;
  }
  requireCondition(records.length > 0, "E_INPUT", "HWP \uBCF8\uBB38 \uB808\uCF54\uB4DC\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.");
  return records;
}
function sectionRecords(streams, path) {
  let bytes = streams.get(path);
  requireCondition(bytes, "E_PRESERVATION", "HWP \uBCF8\uBB38 \uC2A4\uD2B8\uB9BC\uC774 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  if (streams.get("FileHeader").readUInt32LE(36) & 1) {
    try {
      bytes = inflateRawSync(bytes, { maxOutputLength: 32 * 1024 * 1024 });
    } catch {
      throw new FillError("E_INPUT", "HWP \uBCF8\uBB38 \uC555\uCD95\uC744 \uD574\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    }
  }
  return parseHwpRecords(bytes);
}
function targetsByKey(model) {
  return new Map([...model.targets].map((paragraph) => [paragraphKey(paragraph.section, paragraph.paragraph), paragraph]));
}
function targetRecords(records, paragraph) {
  return records.filter((record) => record.paragraph === paragraph.paragraph);
}
function verifyHwpFlowTargets(streams, model, values) {
  decodeHwpDocInfo(streams);
  for (const paragraph of model.targets) {
    const field = model.occurrences.find((item) => item.paragraph === paragraph).name;
    const records = targetRecords(sectionRecords(streams, `BodyText/Section${paragraph.section}`), paragraph);
    if (records.length !== 4 || records.some((record, index) => record.tag !== [66, 67, 68, 69][index] || record.level !== (index === 0 ? 0 : 1))) layoutFailure(field, "unsupported-anchor", "HWP \uD750\uB984 \uD3B8\uC9D1\uC740 \uC81C\uC5B4 \uAC1C\uCCB4\uAC00 \uC5C6\uB294 \uCD5C\uC0C1\uC704 \uBCF8\uBB38 \uBB38\uB2E8\uB9CC \uC9C0\uC6D0\uD569\uB2C8\uB2E4.");
    if (!records[1].data.equals(Buffer.from(`${paragraph.text}\r`, "utf16le"))) layoutFailure(field, "unsupported-anchor", "HWP \uBCF8\uBB38\uC5D0 \uB2E8\uC21C \uD14D\uC2A4\uD2B8 \uC678\uC758 \uC778\uB77C\uC778 \uC81C\uC5B4 \uC815\uBCF4\uAC00 \uC788\uC2B5\uB2C8\uB2E4.");
    const properties = JSON.parse(paragraph.paragraphStyle);
    if (properties.singleLine || properties.keepLines || properties.keepWithNext) layoutFailure(field, "fixed-container", "\uBB38\uB2E8\uC758 \uD55C \uC904\xB7\uBB36\uC74C \uBCF4\uD638 \uC124\uC815\uC744 \uC720\uC9C0\uD558\uBA70 HWP \uBCF8\uBB38\uC744 \uD655\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    if (values && expectedParagraph(model, paragraph, values).includes("	")) layoutFailure(field, "unsupported-character", "HWP \uD750\uB984 \uD3B8\uC9D1\uC758 \uD0ED \uC81C\uC5B4 \uBB38\uC790\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    requireCondition(records[0].data.length >= 22 && records[2].data.length >= 8 && records[2].data.length % 8 === 0 && records[2].data.readUInt32LE(0) === 0 && records[3].data.length > 0 && records[3].data.length % lineSize === 0, "E_UNSUPPORTED", "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 HWP \uBB38\uB2E8 \uBA38\uB9AC\uB9D0\xB7\uAE00\uC790\uC11C\uC2DD\xB7\uC904 \uB808\uCF54\uB4DC\uC785\uB2C8\uB2E4.");
    const firstField = Math.min(...model.occurrences.filter((item) => item.paragraph === paragraph).map((item) => item.start));
    let previous = -1;
    for (let offset = 0; offset < records[2].data.length; offset += 8) {
      const start = records[2].data.readUInt32LE(offset);
      if (start <= previous || start > firstField) layoutFailure(field, "mixed-character-styles", "HWP \uD45C\uC2DD \uB4A4\uC5D0 \uB2E4\uB978 \uAE00\uC790 \uC11C\uC2DD\uC774 \uC788\uC5B4 \uC6D0\uB798 \uC11C\uC2DD\uC744 \uC720\uC9C0\uD558\uBA70 \uCC44\uC6B8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      previous = start;
    }
  }
}
function verifyTargetHeader(before, after, text, lineCount) {
  requireCondition(before.length === after.length && before.length >= 22, "E_PRESERVATION", "HWP \uBB38\uB2E8 \uBA38\uB9AC\uB9D0 \uD06C\uAE30\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  const expected = Buffer.from(before);
  expected.writeUInt32LE((before.readUInt32LE(0) & 2147483648 | text.length + 1) >>> 0, 0);
  expected.writeUInt32LE((before.readUInt32LE(4) & ~lineBreakMask | (text.includes("\n") ? lineBreakMask : 0)) >>> 0, 4);
  requireCondition(Number.isSafeInteger(lineCount) && lineCount > 0 && lineCount <= 65535, "E_LAYOUT", "HWP \uBB38\uB2E8\uC758 \uC904 \uAC1C\uC218 \uC81C\uD55C\uC744 \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.", { region: "body-paragraph", reason: "no-progress" });
  expected.writeUInt16LE(lineCount, 16);
  requireCondition(expected.equals(after), "E_PRESERVATION", "HWP \uB300\uC0C1 \uBB38\uB2E8\uC758 \uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uC18D\uC131\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
}
function verifyTargetLines(before, after, text) {
  requireCondition(before.length > 0 && before.length % lineSize === 0 && after.length > 0 && after.length % lineSize === 0, "E_PRESERVATION", "HWP \uC904 \uBC30\uCE58 \uB808\uCF54\uB4DC\uC758 \uD06C\uAE30\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  let previous = -1;
  for (let offset = 0; offset < after.length; offset += lineSize) {
    const start = after.readUInt32LE(offset);
    requireCondition(start > previous && start <= text.length && (offset > 0 || start === 0) && after.readInt32LE(offset + 8) > 0 && after.readInt32LE(offset + 12) > 0 && after.readInt32LE(offset + 28) > 0, "E_PRESERVATION", "HWP \uC904 \uBC94\uC704\xB7\uAE00\uC790 \uB192\uC774\xB7\uAC00\uB85C \uC601\uC5ED\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    previous = start;
  }
}
function verifyHwpFlowChanges(original, exported, model, values) {
  requireCondition(original.get("FileHeader")?.equals(exported.get("FileHeader")), "E_PRESERVATION", "HWP \uD30C\uC77C \uBA38\uB9AC\uB9D0\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  requireCondition(decodeHwpDocInfo(original).equals(decodeHwpDocInfo(exported)), "E_PRESERVATION", "HWP \uACF5\uC6A9 \uC11C\uC2DD\uC758 \uC804\uCCB4 \uC555\uCD95 \uD574\uC81C \uBC14\uC774\uD2B8\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  const sourceNames = [...original.keys()].filter((path) => sectionPattern.test(path)).sort();
  const exportedNames = [...exported.keys()].filter((path) => sectionPattern.test(path)).sort();
  requireCondition(JSON.stringify(sourceNames) === JSON.stringify(exportedNames), "E_PRESERVATION", "HWP \uBCF8\uBB38 \uAD6C\uC5ED \uC9D1\uD569\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  const targets = targetsByKey(model);
  const changedSections = [];
  for (const path of sourceNames) {
    const section = Number(sectionPattern.exec(path)[1]);
    const before = sectionRecords(original, path);
    const after = sectionRecords(exported, path);
    requireCondition(before.length === after.length, "E_PRESERVATION", "HWP \uBCF8\uBB38 \uB808\uCF54\uB4DC \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    const sectionTargets = [...model.targets].filter((paragraph) => paragraph.section === section);
    const firstTarget = Math.min(...sectionTargets.map((paragraph) => paragraph.paragraph));
    const lineCounts = new Map(sectionTargets.map((paragraph) => [paragraph.paragraph, targetRecords(after, paragraph).find((record) => record.tag === 69 && record.level === 1)?.data.length / lineSize]));
    for (let index = 0; index < before.length; index++) {
      const a = before[index];
      const b = after[index];
      requireCondition(a.tag === b.tag && a.level === b.level && a.paragraph === b.paragraph, "E_PRESERVATION", "HWP \uBCF8\uBB38 \uB808\uCF54\uB4DC \uAD6C\uC870\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
      const target = targets.get(paragraphKey(section, a.paragraph));
      if (target && a.level <= 1 && [66, 67, 69].includes(a.tag)) {
        const text = expectedParagraph(model, target, values);
        if (a.tag === 66) verifyTargetHeader(a.data, b.data, text, lineCounts.get(a.paragraph));
        else if (a.tag === 67) requireCondition(b.data.equals(Buffer.from(`${text}\r`, "utf16le")), "E_PRESERVATION", "HWP \uB300\uC0C1 \uD14D\uC2A4\uD2B8\uC758 \uC6D0\uC2DC \uB808\uCF54\uB4DC\uAC00 \uC785\uB825\uAC12\uACFC \uB2E4\uB985\uB2C8\uB2E4.");
        else verifyTargetLines(a.data, b.data, text);
      } else if (a.tag === 69 && a.level === 1 && a.paragraph > firstTarget) {
        requireCondition(a.raw.length === b.raw.length && a.data.length % lineSize === 0, "E_PRESERVATION", "\uD6C4\uC18D HWP \uBB38\uB2E8\uC758 \uC904 \uAD6C\uC870\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
        const verticalOnly = Buffer.from(a.raw);
        for (let offset = 0; offset < a.data.length; offset += lineSize) b.data.copy(verticalOnly, a.headerSize + offset + 4, offset + 4, offset + 8);
        requireCondition(verticalOnly.equals(b.raw), "E_PRESERVATION", "\uD6C4\uC18D HWP \uBB38\uB2E8\uC758 \uC138\uB85C \uC704\uCE58 \uC678\uC758 \uB808\uCF54\uB4DC\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
      } else requireCondition(a.raw.equals(b.raw), "E_PRESERVATION", "\uBE44\uB300\uC0C1 HWP \uBCF8\uBB38 \uB808\uCF54\uB4DC\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    }
    if (sectionTargets.length) changedSections.push(path);
  }
  return changedSections;
}
function writeHwpContainer(container, originalStreams) {
  const output = Buffer.from(import_cfb.default.write(container, { type: "buffer" }));
  const seedName = "Sh33tJ5";
  if (!originalStreams.has(seedName)) {
    const index = container.FileIndex.findIndex((entry2) => entry2.name === seedName);
    const entry = container.FileIndex[index];
    requireCondition(index > 0 && entry?.type === 2 && entry.L === -1 && entry.C === -1 && entry.R !== index && Buffer.from(entry.content).equals(Buffer.from([55, 50, 54, 50])) && output.readUInt16LE(26) === 3 && output.readUInt16LE(30) === 9, "E_PRESERVATION", "CFB \uC791\uC131\uAE30\uC758 \uBCF4\uC870 \uC2A4\uD2B8\uB9BC\uC744 \uC548\uC804\uD558\uAC8C \uC81C\uC678\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    const directoryStart = (output.readUInt32LE(48) + 1) * 512;
    for (let position = 0; position < container.FileIndex.length; position++) {
      const start2 = directoryStart + position * 128;
      requireCondition(start2 + 128 <= output.length, "E_PRESERVATION", "CFB \uB514\uB809\uD130\uB9AC \uBC94\uC704\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      const current = container.FileIndex[position];
      requireCondition(output[start2 + 66] === current.type && [68, 72, 76].every((offset, key) => output.readInt32LE(start2 + offset) === current[["L", "R", "C"][key]]), "E_PRESERVATION", "CFB \uC791\uC131\uAE30\uC758 \uB514\uB809\uD130\uB9AC \uAD6C\uC870\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
      for (const offset of [68, 72, 76]) if (output.readInt32LE(start2 + offset) === index) output.writeInt32LE(entry.R, start2 + offset);
    }
    const start = directoryStart + index * 128;
    output.fill(0, start, start + 128);
    for (const offset of [68, 72, 76]) output.writeInt32LE(-1, start + offset);
  }
  const actual = hwpContainer(output);
  requireCondition(actual.size === originalStreams.size && [...originalStreams.keys()].every((name) => actual.has(name)), "E_PRESERVATION", "HWP \uC6D0\uBCF8 \uC2A4\uD2B8\uB9BC \uC9D1\uD569\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  return new Uint8Array(output);
}
async function createHwpFlowCandidate(bytes, streams, model, values, context) {
  verifyHwpFlowTargets(streams, model, values);
  const working = await openHancom(bytes, context);
  let exported;
  try {
    for (const field of model.fields) {
      let result;
      try {
        result = JSON.parse(working.replaceAll(`{{${field.name}}}`, values[field.name].replace(/\r\n?/g, "\n"), true));
      } catch {
        throw new FillError("E_PRESERVATION", "HWP \uBCF8\uBB38 \uC9C1\uC811 \uCE58\uD658\uC744 \uC644\uB8CC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      requireCondition(result.ok === true && result.count === field.occurrences, "E_PRESERVATION", "HWP \uC9C1\uC811 \uCE58\uD658 \uAC1C\uC218\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", { field: field.name });
    }
    exported = working.exportHwpWithReport();
    const loss = JSON.parse(exported.contentLoss());
    requireCondition(loss.count === 0 && Array.isArray(loss.losses) && loss.losses.length === 0, "E_PRESERVATION", "HWP \uC9C1\uC811 \uCE58\uD658\uC5D0\uC11C \uB0B4\uC6A9 \uC190\uC2E4\uC774 \uBC1C\uACAC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    const exportedStreams = hwpContainer(exported.takeBytes());
    const changedSections = verifyHwpFlowChanges(streams, exportedStreams, model, values);
    const container = import_cfb.default.read(Buffer.from(bytes), { type: "buffer" });
    for (const path of changedSections) import_cfb.default.utils.cfb_add(container, `/${path}`, exportedStreams.get(path));
    return writeHwpContainer(container, streams);
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError("E_PRESERVATION", "HWP \uD750\uB984 \uD3B8\uC9D1 \uACB0\uACFC\uC758 \uBCF4\uC874\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  } finally {
    exported?.free();
    working.free();
  }
}
function verifyHwpFlowLayout(document, model, values, beforePages) {
  const pageCount = document.pageCount();
  requireCondition(Number.isSafeInteger(pageCount) && pageCount > 0 && pageCount <= 1e4, "E_LAYOUT", "HWP \uD398\uC774\uC9C0 \uBC94\uC704\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { region: "document", reason: "no-progress" });
  const targets = new Map([...model.targets].map((paragraph) => {
    const text = Array.from(expectedParagraph(model, paragraph, values));
    return [paragraphKey(paragraph.section, paragraph.paragraph), { paragraph, text, covered: new Uint8Array(text.length), positions: /* @__PURE__ */ new Map() }];
  }));
  for (let page = 0; page < pageCount; page++) {
    const info = JSON.parse(document.getPageInfo(page));
    const layout = JSON.parse(document.getPageTextLayout(page));
    requireCondition(Number.isFinite(info.width) && Number.isFinite(info.height) && Array.isArray(layout.runs), "E_LAYOUT", "HWP \uD398\uC774\uC9C0 \uC88C\uD45C\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { region: "document", reason: "no-progress" });
    for (const run of layout.runs) {
      if (run.text?.trim() && (![run.x, run.y, run.w, run.h].every(Number.isFinite) || run.x < -0.2 || run.y < -0.2 || run.w < 0 || run.h <= 0 || run.x + run.w > info.width + 0.2 || run.y + run.h > info.height + 0.2)) {
        throw new FillError("E_LAYOUT", "HWP \uBCF8\uBB38 \uB610\uB294 \uD6C4\uC18D \uD56D\uBAA9\uC774 \uD398\uC774\uC9C0 \uC601\uC5ED\uC744 \uBC97\uC5B4\uB0AC\uC2B5\uB2C8\uB2E4.", { region: "document", reason: "page-overflow", page: page + 1, section: run.secIdx, paragraph: run.paraIdx });
      }
      if (run.parentParaIdx != null || run.controlIdx != null || run.cellIdx != null) continue;
      const target = targets.get(paragraphKey(run.secIdx, run.paraIdx));
      if (!target) continue;
      const field = model.occurrences.find((item) => item.paragraph === target.paragraph).name;
      if (![run.x, run.y, run.w, run.h].every(Number.isFinite) || run.x < -0.2 || run.y < -0.2 || run.w < 0 || run.h <= 0 || run.x + run.w > info.width + 0.2 || run.y + run.h > info.height + 0.2) layoutFailure(field, "page-overflow", "HWP \uB300\uC0C1 \uD14D\uC2A4\uD2B8\uAC00 \uD398\uC774\uC9C0 \uC601\uC5ED\uC744 \uBC97\uC5B4\uB0AC\uC2B5\uB2C8\uB2E4.");
      const characters = Array.from(run.text);
      requireCondition(Number.isSafeInteger(run.charStart) && run.charStart >= 0 && run.charStart + characters.length <= target.text.length && Array.isArray(run.charX) && run.charX.length === characters.length + 1 && run.charX.every(Number.isFinite), "E_LAYOUT", "HWP \uD14D\uC2A4\uD2B8\uC640 \uD45C\uC2DC \uC88C\uD45C\uC758 \uB300\uC751\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { field, region: "body-paragraph", reason: "ambiguous-field" });
      for (let index = 0; index < characters.length; index++) {
        const offset = run.charStart + index;
        requireCondition(target.text[offset] === characters[index] && target.covered[offset] === 0 && run.charX[index] >= -0.2 && run.charX[index + 1] >= run.charX[index] && run.x + run.charX[index + 1] <= info.width + 0.2, "E_LAYOUT", "HWP \uC785\uB825\uAC12\uC758 \uBAA8\uB4E0 \uAE00\uC790\uAC00 \uD398\uC774\uC9C0 \uC548\uC5D0 \uD55C \uBC88\uC529 \uBC30\uCE58\uB418\uB294\uC9C0 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { field, region: "body-paragraph", reason: "ambiguous-field" });
        target.covered[offset] = 1;
        target.positions.set(offset, { page: page + 1, x: run.x + run.charX[index], y: run.y });
      }
    }
  }
  const lastCharacters = [];
  for (const target of targets.values()) {
    const fields = model.occurrences.filter((field) => field.paragraph === target.paragraph).sort((a, b) => a.start - b.start);
    requireCondition(target.text.every((character, index) => character === "\n" || target.covered[index] === 1), "E_LAYOUT", "HWP \uB300\uC0C1 \uD14D\uC2A4\uD2B8\uC758 \uC77C\uBD80\uAC00 \uD398\uC774\uC9C0 \uBC30\uCE58\uC5D0\uC11C \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", { field: fields[0].name, region: "body-paragraph", reason: "no-progress" });
    let shift = 0;
    for (const field of fields) {
      const replacement = Array.from(values[field.name].replace(/\r\n?/g, "\n"));
      const start = Array.from(target.paragraph.text.slice(0, field.start)).length + shift;
      const lastOffset = replacement.findLastIndex((character) => character !== "\n");
      lastCharacters.push({ field: field.name, ...target.positions.get(start + lastOffset) });
      shift += replacement.length - Array.from(target.paragraph.text.slice(field.start, field.end)).length;
    }
  }
  return { policy: "flow", strategy: "native", changedContainers: model.occurrences.map((field) => ({ field: field.name, region: "body-paragraph", changes: ["reflow-lines"] })), pagination: { source: "rhwp", before: beforePages, after: pageCount, status: "engine-checked" }, lastCharacters };
}

// lib/adapters/hwp.mjs
var ENGINE = "kordoc@4.19.2 + @rhwp/core@0.8.7";
async function open(bytes, context) {
  const streams = hwpContainer(bytes);
  let parsed;
  try {
    parsed = await parse(new Uint8Array(bytes), { layoutTables: "keep" });
  } catch {
    throw new FillError("E_INPUT", "HWP \uBCF8\uBB38\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  requireCondition(parsed.success && parsed.fileType === "hwp", "E_INPUT", "HWP \uBCF8\uBB38\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const document = await openHancom(bytes, context);
  return { streams, parsed, document };
}
function markdownFields(markdown) {
  return [...markdown.matchAll(/\{\{([\s\S]*?)\}\}/g)].map((match) => {
    const name = match[1].replace(/\\_/g, "_");
    requireCondition(fieldNamePattern.test(name), "E_FIELDS", "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 HWP \uD544\uB4DC \uBB38\uBC95\uC785\uB2C8\uB2E4.");
    return { name, start: match.index, end: match.index + match[0].length };
  });
}
function templateModel(document, parsed, overflow = "preserve") {
  const paragraphs = paragraphSnapshot(document);
  const occurrences = paragraphs.flatMap((paragraph) => placeholders(paragraph.text).map((tag) => ({ ...tag, paragraph })));
  const fields = fieldList(occurrences);
  const unsupported = (condition, message, reason, field) => requireCondition(condition, overflow === "flow" ? "E_LAYOUT" : "E_PRESERVATION", message, overflow === "flow" ? { field, region: "body-paragraph", reason } : void 0);
  unsupported(fields.every((field) => field.occurrences === 1), "HWP\uB294 \uD55C \uBC88\uC529 \uB098\uD0C0\uB098\uB294 \uACE0\uC720 \uD45C\uC2DD\uB9CC \uC9C0\uC6D0\uD569\uB2C8\uB2E4.", "ambiguous-field");
  const discovered = fieldList(markdownFields(parsed.markdown));
  unsupported(JSON.stringify(discovered.map((field) => [field.name, field.occurrences]).sort()) === JSON.stringify(fields.map((field) => [field.name, field.occurrences]).sort()), "HWP \uBCF8\uBB38 \uBC16 \uB610\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC601\uC5ED\uC5D0 \uD544\uB4DC\uAC00 \uC788\uC2B5\uB2C8\uB2E4.", "unsupported-anchor");
  const targets = new Set(occurrences.map((field) => field.paragraph));
  for (const paragraph of targets) {
    const matching = parsed.blocks.filter((block) => ["paragraph", "heading"].includes(block.type) && block.text === paragraph.text);
    const field = occurrences.find((item) => item.paragraph === paragraph).name;
    if (overflow !== "flow") unsupported(matching.length === 1, "HWP \uD544\uB4DC\uC640 \uBCF8\uBB38 \uBB38\uB2E8\uC744 \uBA85\uD655\uD558\uAC8C \uB300\uC751\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", "ambiguous-field", field);
    const styles = characterStyles(document, paragraph);
    const firstField = Math.min(...occurrences.filter((item) => item.paragraph === paragraph).map((item) => item.start));
    const tailStart = overflow === "flow" ? Array.from(paragraph.text.slice(0, firstField)).length : 0;
    const tailStyle = styles[tailStart];
    unsupported(styles.length > tailStart && styles.slice(tailStart).every((style) => style === tailStyle), "HWP \uD45C\uC2DD\uACFC \uADF8 \uB4A4 \uBCF8\uBB38\uC758 \uAE00\uC790 \uC11C\uC2DD\uC774 \uD63C\uD569\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uD45C\uC2DD \uB4A4\uB294 \uAC19\uC740 \uAE00\uC790 \uC11C\uC2DD\uC73C\uB85C \uC900\uBE44\uD558\uC138\uC694.", "mixed-character-styles", field);
    paragraph.characterStyle = tailStyle;
    paragraph.prefixStyles = styles.slice(0, tailStart);
  }
  verifyExportLoss(document);
  return { paragraphs, occurrences, fields, targets };
}
function editedMarkdown(parsed, model, values) {
  const lineBreak = `FILLDOCUMENTSLINEBREAK${randomUUID().replaceAll("-", "")}`;
  const targets = new Map([...model.targets].map((paragraph) => [paragraph.text, paragraph]));
  const blocks = parsed.blocks.map((block) => {
    const paragraph = targets.get(block.text);
    if (!paragraph) return block;
    const text = spliceText(paragraph.text, model.occurrences.filter((field) => field.paragraph === paragraph).map((field) => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, "\n") })));
    return { ...block, text: text.replaceAll("\n", lineBreak), spans: void 0 };
  });
  return blocksToMarkdown(blocks).replace(/(?<!\\)\$/g, "\\$").replaceAll(lineBreak, "<br>");
}
async function inspect(bytes, context = {}) {
  const { document, parsed, streams } = await open(bytes, context);
  try {
    let model;
    let requiresFlow = false;
    try {
      model = templateModel(document, parsed, context.overflow ?? "preserve");
    } catch (error) {
      if (context.overflow === "flow" || error.code !== "E_PRESERVATION") throw error;
      try {
        model = templateModel(document, parsed, "flow");
        verifyHwpFlowTargets(streams, model);
      } catch {
        throw error;
      }
      requiresFlow = true;
    }
    if (context.overflow === "flow") verifyHwpFlowTargets(streams, model);
    const warnings = [visualWarning, "HWP\uB294 \uACE0\uC720 \uD45C\uC2DD\uC758 \uCD5C\uC0C1\uC704 \uBCF8\uBB38\uB9CC \uCC44\uC6C1\uB2C8\uB2E4. flow\uB294 \uAE30\uC874 \uC811\uB450\uBD80 \uC11C\uC2DD\uC744 \uC720\uC9C0\uD558\uACE0 \uD45C\uC2DD \uC774\uD6C4\uAC00 \uADE0\uC77C\uD55C \uBB38\uB2E8\uC744 \uC9C0\uC6D0\uD569\uB2C8\uB2E4."];
    if (requiresFlow) warnings.push("\uC774 HWP\uC758 \uD544\uB4DC\uB294 --overflow flow\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. \uAE30\uBCF8 preserve \uCC44\uC6B0\uAE30\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC73C\uBA70 \uC2E4\uC81C \uCC44\uC6B0\uAE30\uC5D0\uC11C \uBCF4\uC874\xB7\uBC30\uCE58\uB97C \uCD94\uAC00 \uAC80\uC0AC\uD569\uB2C8\uB2E4.");
    return { format: "hwp", fields: model.fields, engine: ENGINE, ...requiresFlow ? { requiredOverflow: "flow" } : {}, warnings };
  } finally {
    document.free();
  }
}
async function fill(bytes, values, context = {}) {
  const overflow = context.overflow ?? "preserve";
  requireCondition(["preserve", "flow"].includes(overflow), "E_INPUT", "HWP overflow \uC815\uCC45\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const original = Buffer.from(bytes);
  const { document, parsed, streams } = await open(bytes, context);
  let candidate;
  try {
    const model = templateModel(document, parsed, overflow);
    requireCondition(model.fields.length > 0, "E_FIELDS", "\uCC44\uC6B8 \uC218 \uC788\uB294 \uBA85\uC2DC\uC801 HWP \uD544\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
    checkedValues(model.fields, values, context);
    let output;
    if (overflow === "flow") output = await createHwpFlowCandidate(bytes, streams, model, values, context);
    else {
      const markdown = editedMarkdown(parsed, model, values);
      let patched;
      try {
        patched = await patchHwp(new Uint8Array(bytes), markdown, { verify: true });
      } catch {
        throw new FillError("E_PRESERVATION", "HWP \uD328\uCE58\uB97C \uC548\uC804\uD558\uAC8C \uC644\uB8CC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      }
      requireCondition(patched.success && patched.data && patched.applied === model.targets.size && Array.isArray(patched.skipped) && patched.skipped.length === 0 && patched.verification && patched.verification.diffs.length === 0, "E_PRESERVATION", "HWP \uBCC0\uACBD\uC774 \uC77C\uBD80 \uC0DD\uB7B5\uB418\uC5C8\uAC70\uB098 \uB0A8\uC740 \uCC28\uC774\uAC00 \uC788\uC5B4 \uCD9C\uB825\uC744 \uC800\uC7A5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      output = patched.data;
    }
    candidate = await open(output, context);
    const after = paragraphSnapshot(candidate.document);
    requireCondition(after.length === model.paragraphs.length, "E_PRESERVATION", "HWP \uBB38\uB2E8 \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    for (let index = 0; index < after.length; index++) {
      const beforeParagraph = model.paragraphs[index];
      const afterParagraph = after[index];
      const expected = expectedParagraph(model, beforeParagraph, values);
      requireCondition(afterParagraph.text === expected && beforeParagraph.paragraphStyle === afterParagraph.paragraphStyle, "E_PRESERVATION", "HWP \uD14D\uC2A4\uD2B8 \uB610\uB294 \uBB38\uB2E8 \uC11C\uC2DD\uC758 \uBCF4\uC874\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      if (model.targets.has(beforeParagraph)) {
        const styles = characterStyles(candidate.document, afterParagraph);
        const prefix = beforeParagraph.prefixStyles;
        requireCondition(styles.every((style, offset) => style === (offset < prefix.length ? prefix[offset] : beforeParagraph.characterStyle)), "E_PRESERVATION", "HWP \uACE0\uC815 \uC811\uB450\uBD80 \uB610\uB294 \uC785\uB825 \uBCF8\uBB38\uC758 \uAE00\uC790 \uC11C\uC2DD\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
      } else requireCondition(JSON.stringify(characterStyles(document, beforeParagraph)) === JSON.stringify(characterStyles(candidate.document, afterParagraph)), "E_PRESERVATION", "\uBE44\uB300\uC0C1 HWP \uAE00\uC790 \uC11C\uC2DD\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    }
    requireCondition(candidate.streams.size === streams.size, "E_PRESERVATION", "HWP \uC2A4\uD2B8\uB9BC \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    for (const [path, content] of streams) if (!/^BodyText\/Section\d+$/.test(path)) requireCondition(candidate.streams.has(path) && content.equals(candidate.streams.get(path)), "E_PRESERVATION", "HWP \uBE44\uB300\uC0C1 \uC2A4\uD2B8\uB9BC\uC774 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    verifyExportLoss(candidate.document);
    requireCondition(Buffer.from(bytes).equals(original), "E_PRESERVATION", "HWP \uC6D0\uBCF8 \uBC84\uD37C\uAC00 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    let layout = { policy: "preserve", strategy: "existing-layout" };
    if (overflow === "flow") {
      try {
        layout = verifyHwpFlowLayout(candidate.document, model, values, document.pageCount());
      } catch (error) {
        if (error instanceof FillError) throw error;
        throw new FillError("E_LAYOUT", "HWP \uC5D4\uC9C4\uC758 \uD398\uC774\uC9C0 \uBC30\uCE58 \uACB0\uACFC\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { region: "document", reason: "no-progress" });
      }
    }
    const flowChecks = overflow === "flow" ? [{ name: "body-record-allowlist", status: "passed" }, { name: "page-text-bounds-and-coverage", status: "passed" }] : [{ name: "engine-skips-and-residuals", status: "passed" }];
    return { bytes: output, engine: ENGINE, layout, visualValidation: "not-performed", checks: [{ name: "hwp-reopen", status: "passed" }, { name: "exact-field-values", status: "passed" }, { name: "character-and-paragraph-styles", status: "passed" }, { name: "untouched-streams", status: "passed" }, ...flowChecks], warnings: [visualWarning, "\uAE30\uC874 \uBBF8\uB9AC\uBCF4\uAE30 \uC2A4\uD2B8\uB9BC\uC740 \uBCF4\uC874\uB418\uBBC0\uB85C \uBB38\uC11C \uBCF8\uBB38\uC744 \uC5F4\uC5B4 \uACB0\uACFC\uB97C \uD655\uC778\uD558\uC138\uC694."] };
  } finally {
    document.free();
    candidate?.document.free();
  }
}
async function validate(bytes, context = {}) {
  const { document } = await open(bytes, context);
  try {
    paragraphSnapshot(document);
    verifyExportLoss(document);
    return { engine: ENGINE, checks: [{ name: "hwp-reopen", status: "passed" }, { name: "engine-content-loss", status: "passed" }], warnings: [visualWarning] };
  } finally {
    document.free();
  }
}
export {
  fill,
  inspect,
  validate
};
