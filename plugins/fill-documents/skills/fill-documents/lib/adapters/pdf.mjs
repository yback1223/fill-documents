import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument, PDFTextField, PDFCheckBox, PDFDict, PDFArray, PDFName, PDFStream,
  layoutMultilineText, layoutSinglelineText, adjustDimsForRotation, reduceRotation,
} from 'pdf-lib';
import { FillError } from '../errors.mjs';

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const ENGINE = 'pdf-lib@1.17.1';
const DEFAULT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const VISUAL_WARNING = 'PDF의 필드 값·appearance 구조를 확인했습니다. 뷰어에서의 최종 페이지 표시는 별도 확인이 필요합니다.';

function refuseActiveContent(doc) {
  const pending = doc.context.enumerateIndirectObjects().map(([, object]) => object);
  const seen = new Set();
  while (pending.length) {
    const object = pending.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    if (seen.size > 100000) throw new FillError('E_UNSUPPORTED', 'PDF 객체 수가 지원 범위를 넘었습니다.');
    if (object instanceof PDFStream) { pending.push(object.dict); continue; }
    if (object instanceof PDFArray) {
      for (let i = 0; i < object.size(); i += 1) pending.push(object.lookup(i));
      continue;
    }
    if (!(object instanceof PDFDict)) continue;
    for (const key of object.keys()) {
      const name = key.decodeText();
      if (['XFA', 'ByteRange', 'Perms', 'DocMDP', 'SigFlags'].includes(name)) {
        throw new FillError('E_UNSUPPORTED', 'XFA 또는 전자서명 PDF는 지원하지 않습니다.');
      }
      if (['JavaScript', 'JS', 'AA', 'OpenAction', 'RichMediaContent', 'EmbeddedFiles', 'EF'].includes(name)) {
        throw new FillError('E_UNSUPPORTED', '실행 동작 또는 첨부 파일이 포함된 PDF는 지원하지 않습니다.');
      }
      const value = object.lookup(key);
      if (value instanceof PDFName) {
        const valueName = value.decodeText();
        if ((name === 'FT' || name === 'Type') && valueName === 'Sig') {
          throw new FillError('E_UNSUPPORTED', '전자서명 필드가 있는 PDF는 지원하지 않습니다.');
        }
        if (name === 'S' && ['JavaScript', 'Launch', 'SubmitForm', 'ImportData', 'Rendition', 'Movie', 'Sound', 'GoToR', 'GoToE'].includes(valueName)) {
          throw new FillError('E_UNSUPPORTED', '외부 실행 동작이 포함된 PDF는 지원하지 않습니다.');
        }
      }
      pending.push(value);
    }
  }
}

async function loadPdf(bytes) {
  const copy = Buffer.from(bytes);
  if (!copy.subarray(0, 8).toString('ascii').startsWith('%PDF-') || !/%%EOF\s*$/.test(copy.subarray(-1024).toString('ascii'))) {
    throw new FillError('E_INPUT', '완전한 PDF 파일이 아닙니다.');
  }
  try {
    const doc = await PDFDocument.load(copy, { updateMetadata: false, throwOnInvalidObject: true });
    if (doc.isEncrypted) throw new FillError('E_UNSUPPORTED', '암호화된 PDF는 지원하지 않습니다.');
    refuseActiveContent(doc);
    if (!doc.getPageCount()) throw new FillError('E_INPUT', 'PDF에 페이지가 없습니다.');
    return doc;
  } catch (error) {
    if (error instanceof FillError) throw error;
    if (error?.name === 'EncryptedPDFError' || /encrypted/i.test(error?.message ?? '')) {
      throw new FillError('E_UNSUPPORTED', '암호화된 PDF는 지원하지 않습니다.');
    }
    throw new FillError('E_INPUT', 'PDF 구조를 읽을 수 없습니다.');
  }
}

function fieldsOf(doc) {
  try {
    if (!doc.catalog.has(PDFName.of('AcroForm'))) return [];
    const fields = doc.getForm().getFields();
    const names = new Set();
    const pageWidgets = new Set();
    for (const page of doc.getPages()) {
      const annotations = page.node.Annots();
      if (!annotations) continue;
      for (let i = 0; i < annotations.size(); i += 1) pageWidgets.add(annotations.lookup(i));
    }
    for (const field of fields) {
      const name = field.getName();
      if (!FIELD_NAME.test(name) || names.has(name)) throw new FillError('E_FIELDS', 'PDF 필드 이름이 유효하지 않거나 중복되었습니다.');
      names.add(name);
      if (!(field instanceof PDFTextField) && !(field instanceof PDFCheckBox)) {
        throw new FillError('E_UNSUPPORTED', 'PDF 텍스트와 체크박스 필드만 지원합니다.');
      }
      if (field.isReadOnly()) throw new FillError('E_UNSUPPORTED', '읽기 전용 PDF 필드는 채울 수 없습니다.');
      if (field instanceof PDFTextField && (field.isRichFormatted() || field.isPassword() || field.isFileSelector() || field.isCombed())) {
        throw new FillError('E_UNSUPPORTED', '서식 있는 텍스트·암호·파일 선택·분할 칸 PDF 필드는 지원하지 않습니다.');
      }
      const widgets = field.acroField.getWidgets();
      if (!widgets.length) throw new FillError('E_UNSUPPORTED', '페이지 표시 영역이 없는 PDF 필드입니다.');
      for (const widget of widgets) {
        const rect = widget.getRectangle();
        if (!pageWidgets.has(widget.dict) || !(rect.width > 0 && rect.height > 0) || (widget.getFlags() & 3) !== 0) {
          throw new FillError('E_UNSUPPORTED', '페이지에서 보이지 않는 PDF 필드는 지원하지 않습니다.');
        }
      }
    }
    return fields;
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_INPUT', 'PDF 필드 구조가 올바르지 않습니다.');
  }
}

function describe(field) {
  return {
    name: field.getName(),
    type: field instanceof PDFTextField ? 'text' : 'checkbox',
    occurrences: field.acroField.getWidgets().length,
    ...(field instanceof PDFTextField ? { multiline: field.isMultiline(), ...(field.getMaxLength() !== undefined ? { maxLength: field.getMaxLength() } : {}) } : {}),
  };
}

function fontSizeOf(field) {
  const matches = [...(field.getDefaultAppearance() ?? '').matchAll(/\/[^\s]+\s+(\d*\.\d+|\d+)\s+Tf/g)];
  const size = Number(matches.at(-1)?.[1]);
  return size > 0 ? size : undefined;
}

function checkTextFits(field, text, font) {
  if (!field.isMultiline() && /[\r\n]/.test(text)) {
    throw new FillError('E_FIELDS', '한 줄 PDF 필드에는 줄바꿈을 입력할 수 없습니다.', { field: field.getName() });
  }
  for (const widget of field.acroField.getWidgets()) {
    const rotation = reduceRotation(widget.getAppearanceCharacteristics()?.getRotation());
    const dimensions = adjustDimsForRotation(widget.getRectangle(), rotation);
    const inset = (widget.getBorderStyle()?.getWidth() ?? 0) + 1;
    const bounds = { x: inset, y: inset, width: dimensions.width - inset * 2, height: dimensions.height - inset * 2 };
    if (bounds.width <= 0 || bounds.height <= 0) throw new FillError('E_FIELDS', 'PDF 필드 표시 영역이 너무 작습니다.', { field: field.getName() });
    const fontSize = fontSizeOf(widget) ?? fontSizeOf(field.acroField) ?? 10;
    const options = { font, fontSize, bounds, alignment: field.getAlignment() };
    const layout = field.isMultiline() ? layoutMultilineText(text, options) : layoutSinglelineText(text, options);
    const lines = field.isMultiline() ? layout.lines : [layout.line];
    if (lines.some((line) => line.width > bounds.width + 0.01 || line.y < bounds.y - 0.01 || line.y + line.height > bounds.y + bounds.height + 0.01)) {
      throw new FillError('E_FIELDS', '입력한 텍스트가 PDF 필드 표시 영역을 넘습니다. 내용을 줄이거나 더 큰 서식을 사용하세요.', { field: field.getName() });
    }
    // Fix auto-sized input fields at the exact size checked above, keeping the existing color.
    const appearance = widget.getDefaultAppearance() ?? field.acroField.getDefaultAppearance() ?? '0 g';
    widget.setDefaultAppearance(`${appearance}\n/FillDocuments ${fontSize} Tf`);
  }
}

function embeddedFontPresent(stream) {
  const resources = stream.dict.lookupMaybe(PDFName.of('Resources'), PDFDict);
  const fonts = resources?.lookupMaybe(PDFName.of('Font'), PDFDict);
  if (!fonts) return false;
  return fonts.keys().some((key) => {
    const font = fonts.lookup(key, PDFDict);
    if (!font.has(PDFName.of('ToUnicode'))) return false;
    const descendants = font.lookupMaybe(PDFName.of('DescendantFonts'), PDFArray);
    const base = descendants?.lookup(0, PDFDict) ?? font;
    const descriptor = base.lookupMaybe(PDFName.of('FontDescriptor'), PDFDict);
    return descriptor?.lookup(PDFName.of('FontFile2')) instanceof PDFStream;
  });
}

function verifyAppearances(fields, { requireEmbeddedFont = false } = {}) {
  try {
    for (const field of fields) {
      for (const widget of field.acroField.getWidgets()) {
        const normal = widget.getAppearances()?.normal;
        if (field instanceof PDFTextField) {
          if (!(normal instanceof PDFStream) || normal.getContents().length === 0) {
            throw new FillError('E_PRESERVATION', 'PDF 텍스트 appearance가 누락되었습니다.');
          }
          if (requireEmbeddedFont && !embeddedFontPresent(normal)) {
            throw new FillError('E_PRESERVATION', 'PDF appearance에 유니코드 글꼴이 임베딩되지 않았습니다.');
          }
        } else {
          const state = widget.getAppearanceState();
          if (!(normal instanceof PDFDict) || !state || !(normal.lookup(state) instanceof PDFStream)) {
            throw new FillError('E_PRESERVATION', 'PDF 체크박스 appearance가 누락되었습니다.');
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_PRESERVATION', 'PDF appearance 구조를 확인하지 못했습니다.');
  }
}

export async function inspect(bytes, _context = {}) {
  const doc = await loadPdf(bytes);
  return { format: 'pdf', fields: fieldsOf(doc).map(describe), warnings: [], engine: ENGINE };
}

export async function fill(bytes, values, context = {}) {
  const doc = await loadPdf(bytes);
  const fields = fieldsOf(doc);
  if (!fields.length) throw new FillError('E_FIELDS', 'PDF에 채울 수 있는 AcroForm 필드가 없습니다.');
  const names = new Set(fields.map((field) => field.getName()));
  if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).some((name) => !names.has(name))) {
    throw new FillError('E_FIELDS', 'PDF 필드와 입력 키가 일치하지 않습니다.');
  }
  let fontBytes;
  try { fontBytes = await readFile(path.join(context.skillRoot ?? DEFAULT_ROOT, 'assets/fonts/NanumGothic-Regular.ttf')); }
  catch { throw new FillError('E_ENGINE', '포함된 PDF 한글 글꼴을 읽을 수 없습니다. 설치 파일을 확인하세요.'); }
  doc.registerFontkit(fontkit);
  let font;
  // Nanum Gothic subsetting in this fontkit version can create broken glyph outlines.
  // Embed the full font so appearance streams render the same glyphs that we validate.
  try { font = await doc.embedFont(fontBytes, { subset: false }); }
  catch { throw new FillError('E_ENGINE', 'PDF 한글 글꼴을 임베딩하지 못했습니다.'); }
  const characterSet = new Set(font.getCharacterSet());
  const before = fields.map(describe);
  const pageCount = doc.getPageCount();
  for (const field of fields) {
    const name = field.getName();
    const value = Object.hasOwn(values, name) ? values[name] : undefined;
    if (field instanceof PDFTextField) {
      if (typeof value !== 'string' || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(value) || /[\uD800-\uDFFF]/u.test(value)) {
        throw new FillError('E_FIELDS', 'PDF 텍스트 값이 누락되었거나 유효하지 않습니다.', { field: name });
      }
      if (field.getMaxLength() !== undefined && value.length > field.getMaxLength()) {
        throw new FillError('E_FIELDS', 'PDF 필드의 최대 글자 수를 넘었습니다.', { field: name });
      }
      for (const character of value) {
        if (!/[\r\n\t]/.test(character) && !characterSet.has(character.codePointAt(0))) {
          throw new FillError('E_UNSUPPORTED', '포함된 글꼴이 표현할 수 없는 문자가 있습니다.', { field: name });
        }
      }
      checkTextFits(field, value, font);
      field.setText(value);
      field.updateAppearances(font);
    } else {
      if (typeof value !== 'boolean') throw new FillError('E_FIELDS', 'PDF 체크박스에는 true 또는 false가 필요합니다.', { field: name });
      if (value) field.check(); else field.uncheck();
      field.updateAppearances();
    }
  }
  let result;
  try { result = await doc.save({ updateFieldAppearances: false }); }
  catch { throw new FillError('E_ENGINE', 'PDF 저장에 실패했습니다.'); }
  const reread = await loadPdf(result);
  const rereadFields = fieldsOf(reread);
  if (pageCount !== reread.getPageCount() || JSON.stringify(before) !== JSON.stringify(rereadFields.map(describe))) {
    throw new FillError('E_PRESERVATION', 'PDF 페이지 또는 필드 구조가 달라졌습니다.');
  }
  for (const field of rereadFields) {
    const actual = field instanceof PDFTextField ? (field.getText() ?? '') : field.isChecked();
    if (actual !== values[field.getName()]) throw new FillError('E_PRESERVATION', 'PDF 입력값 재읽기 검증에 실패했습니다.');
  }
  verifyAppearances(rereadFields, { requireEmbeddedFont: true });
  return {
    bytes: result,
    checks: [
      { name: 'pdf-structure', status: 'pass' }, { name: 'field-values-reread', status: 'pass' },
      { name: 'page-and-field-preservation', status: 'pass' }, { name: 'appearance-streams', status: 'pass' },
      { name: 'embedded-unicode-font', status: 'pass' }, { name: 'text-within-field-bounds', status: 'pass' },
    ],
    warnings: [VISUAL_WARNING],
    engine: ENGINE,
  };
}

export async function validate(bytes, _context = {}) {
  const doc = await loadPdf(bytes);
  const fields = fieldsOf(doc);
  verifyAppearances(fields);
  return {
    checks: [{ name: 'pdf-structure', status: 'pass' }, { name: 'appearance-streams', status: 'pass' }],
    warnings: [VISUAL_WARNING, ...(!fields.length ? ['이 PDF에는 채울 수 있는 AcroForm 필드가 없습니다.'] : [])],
    engine: ENGINE,
  };
}
