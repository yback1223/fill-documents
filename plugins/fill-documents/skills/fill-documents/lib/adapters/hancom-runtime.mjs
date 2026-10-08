import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import CFB from 'cfb';
import { HwpDocument, initSync } from '@rhwp/core';
import { FillError, requireCondition } from '../errors.mjs';

let initialized;

export async function initHancom(context = {}) {
  initialized ??= (async () => {
    const candidates = context.skillRoot ? [join(context.skillRoot, 'lib/vendor/rhwp_bg.wasm')] : [];
    try { candidates.push(fileURLToPath(new URL('rhwp_bg.wasm', import.meta.resolve('@rhwp/core')))); } catch { /* bundled runtime uses the first path */ }
    for (const path of candidates) {
      let bytes;
      try { bytes = await readFile(path); } catch (error) { if (error.code === 'ENOENT') continue; throw new FillError('E_ENGINE', '한글 엔진 파일을 읽을 수 없습니다.'); }
      try { initSync({ module: bytes }); return; } catch { throw new FillError('E_ENGINE', '한글 WASM 엔진을 초기화할 수 없습니다.'); }
    }
    throw new FillError('E_ENGINE', '한글 WASM 엔진이 설치되지 않았습니다. 패키지를 다시 설치하세요.');
  })();
  try { await initialized; } catch (error) { initialized = undefined; throw error; }
}

export async function openHancom(bytes, context = {}) {
  await initHancom(context);
  try { return new HwpDocument(new Uint8Array(bytes)); } catch { throw new FillError('E_INPUT', '한글 문서를 읽을 수 없습니다.'); }
}

export function hwpContainer(bytes) {
  const buffer = Buffer.from(bytes);
  requireCondition(buffer.length >= 512 && buffer.length <= 50 * 1024 * 1024 && buffer.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex')), 'E_INPUT', 'HWP 5.x 컨테이너가 아닙니다.');
  let doc;
  try { doc = CFB.read(buffer, { type: 'buffer' }); } catch { throw new FillError('E_INPUT', 'HWP 컨테이너가 손상되었습니다.'); }
  const header = CFB.find(doc, '/FileHeader')?.content;
  requireCondition(header?.length >= 40 && Buffer.from(header).subarray(0, 17).toString('ascii') === 'HWP Document File' && header[35] === 5, 'E_INPUT', 'HWP 5.x 문서 머리말이 올바르지 않습니다.');
  const flags = Buffer.from(header).readUInt32LE(36);
  requireCondition((flags & ~1) === 0, 'E_UNSUPPORTED', '암호화·배포용·서명·스크립트 등 추가 기능이 있는 HWP는 지원하지 않습니다.');
  const streams = new Map();
  let expanded = 0;
  for (let index = 0; index < doc.FullPaths.length; index++) {
    const path = doc.FullPaths[index].replace(/^[^/]+\//, '');
    const entry = doc.FileIndex[index];
    if (entry.type !== 2) continue;
    requireCondition(!/(^|\/)(Scripts|ViewText|DocHistory|XMLTemplate|_xmlsignatures|signatures|ObjectPool)(\/|$)/i.test(path), 'E_UNSUPPORTED', '스크립트·서명·변경 기록·실행 개체가 있는 HWP는 지원하지 않습니다.');
    requireCondition(!/^BinData\//i.test(path) || /\.(?:png|jpe?g|gif|bmp|tiff?)$/i.test(path), 'E_UNSUPPORTED', 'HWP 내장 개체는 정적 이미지 형식만 지원합니다.');
    const content = Buffer.from(entry.content);
    requireCondition(!streams.has(path) && content.length <= 32 * 1024 * 1024, 'E_INPUT', 'HWP 스트림이 중복되거나 너무 큽니다.');
    if (/^(BodyText\/Section\d+|DocInfo)$/.test(path) && (flags & 1)) {
      try { expanded += inflateRawSync(content, { maxOutputLength: 32 * 1024 * 1024 }).length; } catch { throw new FillError('E_INPUT', 'HWP 압축 스트림이 손상되었거나 너무 큽니다.'); }
    } else expanded += content.length;
    requireCondition(expanded <= 128 * 1024 * 1024, 'E_INPUT', 'HWP 압축 해제 크기 제한을 초과했습니다.');
    streams.set(path, content);
  }
  requireCondition([...streams.keys()].some(path => /^BodyText\/Section\d+$/.test(path)) && streams.has('DocInfo'), 'E_INPUT', '필수 HWP 스트림이 없습니다.');
  return streams;
}

export function paragraphSnapshot(document) {
  const paragraphs = [];
  let total = 0;
  for (let section = 0; section < document.getSectionCount(); section++) {
    const count = document.getParagraphCount(section);
    requireCondition(paragraphs.length + count <= 10000, 'E_UNSUPPORTED', '검사할 문단이 너무 많습니다.');
    for (let paragraph = 0; paragraph < count; paragraph++) {
      const length = document.getParagraphLength(section, paragraph);
      total += length;
      requireCondition(total <= 1000000, 'E_UNSUPPORTED', '검사할 문서 텍스트가 너무 큽니다.');
      paragraphs.push({ section, paragraph, length, text: document.getTextRange(section, paragraph, 0, length), paragraphStyle: document.getParaPropertiesAt(section, paragraph) });
    }
  }
  return paragraphs;
}

export function characterStyles(document, paragraph) {
  const styles = [];
  for (let offset = 0; offset < paragraph.length; offset++) styles.push(document.getCharPropertiesAt(paragraph.section, paragraph.paragraph, offset));
  return styles;
}

export function verifyExportLoss(document) {
  let exported;
  try {
    exported = document.exportHwpWithReport();
    const loss = JSON.parse(exported.contentLoss());
    requireCondition(loss.count === 0 && Array.isArray(loss.losses) && loss.losses.length === 0, 'E_PRESERVATION', '한글 엔진이 지원하지 않는 문서 요소를 발견했습니다.');
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_PRESERVATION', '한글 엔진의 내용 보존 보고서를 확인할 수 없습니다.');
  } finally { exported?.free(); }
}
