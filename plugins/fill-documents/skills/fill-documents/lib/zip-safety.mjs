import PizZip from 'pizzip';
import { inflateRawSync } from 'node:zlib';
import { FillError, requireCondition } from './errors.mjs';

const MAX_EXPANDED = 128 * 1024 * 1024;
const MAX_ENTRY = 32 * 1024 * 1024;

export function assertSafeZip(input) {
  const bytes = Buffer.from(input);
  requireCondition(bytes.length <= 50 * 1024 * 1024, 'E_INPUT', '문서 크기 제한을 초과했습니다.');
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50 && i + 22 + bytes.readUInt16LE(i + 20) === bytes.length) {
      end = i;
      break;
    }
  }
  requireCondition(end >= 0, 'E_INPUT', '유효한 ZIP 문서가 아닙니다.');
  const count = bytes.readUInt16LE(end + 10);
  const centralSize = bytes.readUInt32LE(end + 12);
  let pos = bytes.readUInt32LE(end + 16);
  requireCondition(count > 0 && count <= 4096 && pos + centralSize === end && bytes.readUInt16LE(end + 4) === 0 && bytes.readUInt16LE(end + 6) === 0 && bytes.readUInt16LE(end + 8) === count, 'E_UNSUPPORTED', '분할 ZIP, ZIP64 또는 너무 복잡한 문서는 지원하지 않습니다.');
  const names = new Set();
  let expanded = 0;
  for (let i = 0; i < count; i++) {
    requireCondition(pos + 46 <= end && bytes.readUInt32LE(pos) === 0x02014b50, 'E_INPUT', '손상된 ZIP 디렉터리입니다.');
    const flags = bytes.readUInt16LE(pos + 8);
    const method = bytes.readUInt16LE(pos + 10);
    const size = bytes.readUInt32LE(pos + 24);
    const compressed = bytes.readUInt32LE(pos + 20);
    const nameLength = bytes.readUInt16LE(pos + 28);
    const extraLength = bytes.readUInt16LE(pos + 30);
    const commentLength = bytes.readUInt16LE(pos + 32);
    const localOffset = bytes.readUInt32LE(pos + 42);
    const next = pos + 46 + nameLength + extraLength + commentLength;
    requireCondition(next <= end && nameLength > 0, 'E_INPUT', '손상된 ZIP 항목입니다.');
    const rawName = bytes.subarray(pos + 46, pos + 46 + nameLength);
    const name = rawName.toString('utf8').normalize('NFC');
    requireCondition(!name.includes('\\') && !name.includes('\0') && !name.startsWith('/') && !/^[A-Za-z]:/.test(name) && !name.split('/').includes('..') && !names.has(name), 'E_INPUT', 'ZIP 경로 또는 중복 항목이 유효하지 않습니다.');
    names.add(name);
    requireCondition(!(flags & 1) && (method === 0 || method === 8), 'E_UNSUPPORTED', '암호화 또는 지원하지 않는 ZIP 압축 형식입니다.');
    expanded += size;
    requireCondition(size <= MAX_ENTRY && expanded <= MAX_EXPANDED && localOffset + 30 <= pos && bytes.readUInt32LE(localOffset) === 0x04034b50, 'E_INPUT', 'ZIP 크기 또는 오프셋 제한을 초과했습니다.');
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    requireCondition(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength).equals(rawName) && localOffset + 30 + localNameLength + localExtraLength + compressed <= bytes.readUInt32LE(end + 16), 'E_INPUT', 'ZIP 로컬 항목이 디렉터리와 다릅니다.');
    // Bound decompression before PizZip sees the entry: header sizes can be forged.
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    try {
      const data = bytes.subarray(dataStart, dataStart + compressed);
      const actual = method === 8 ? inflateRawSync(data, { maxOutputLength: MAX_ENTRY }) : data;
      requireCondition(actual.length === size, 'E_INPUT', 'ZIP에 선언된 압축 해제 크기가 실제 크기와 다릅니다.');
    } catch (error) {
      if (error instanceof FillError) throw error;
      throw new FillError('E_INPUT', 'ZIP 압축 데이터가 손상되었거나 크기 제한을 초과했습니다.');
    }
    requireCondition(!/(^|\/)(vbaProject\.bin|embeddings\/|Scripts\/)/i.test(name), 'E_UNSUPPORTED', '매크로 또는 내장 실행 개체를 포함한 문서는 지원하지 않습니다.');
    pos = next;
  }
  requireCondition(pos === end, 'E_INPUT', 'ZIP 디렉터리 길이가 일치하지 않습니다.');
  try {
    const zip = new PizZip(bytes, { checkCRC32: true });
    let actualExpanded = 0;
    for (const entry of Object.values(zip.files)) {
      if (entry.dir) continue;
      const content = entry.asUint8Array();
      actualExpanded += content.length;
      requireCondition(content.length <= MAX_ENTRY && actualExpanded <= MAX_EXPANDED, 'E_INPUT', '압축 해제 크기 제한을 초과했습니다.');
      if (/\.(xml|rels)$/i.test(entry.name)) {
        const text = Buffer.from(content).toString('utf8');
        requireCondition(!/<!DOCTYPE|<!ENTITY/i.test(text), 'E_UNSUPPORTED', '외부 엔티티가 포함된 XML은 지원하지 않습니다.');
      }
    }
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_INPUT', 'ZIP 문서의 압축 또는 검사값이 올바르지 않습니다.');
  }
}
