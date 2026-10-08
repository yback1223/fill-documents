import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument, PDFTextField, PDFCheckBox, PDFSignature, PDFDict, PDFArray, PDFName, PDFStream, PDFNull, PDFNumber,
} from 'pdf-lib';
import { FillError } from '../errors.mjs';
import { appendContinuations, planContinuation, readContinuations, verifyContinuationBounds, writeContinuations } from './pdf-flow.mjs';
import {
  fontSizeOf, textLayout, layoutFits, prepareLayoutProfile, pageSnapshot,
  addSourceNotes, verifyWidgetGraph, layoutError, hash,
} from './pdf-layout.mjs';

const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const ENGINE = 'pdf-lib@1.17.1';
const DEFAULT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const VISUAL_WARNING = 'PDF의 필드 값·appearance 구조를 확인했습니다. 뷰어에서의 최종 페이지 표시는 별도 확인이 필요합니다.';
const validName = (name) => FIELD_NAME.test(name) && !['constructor', 'prototype', '__proto__'].includes(name);

function aliasesOf(fields) {
  const names = new Set(fields.map((field) => field.getName()).filter(validName));
  const aliases = new Map();
  for (const field of fields) {
    const name = field.getName();
    if (validName(name)) { aliases.set(name, name); continue; }
    const hash = createHash('sha256').update(name).digest('hex');
    let length = 12;
    while (names.has(`field_${hash.slice(0, length)}`) && length < 56) length += 4;
    const alias = `field_${hash.slice(0, length)}`;
    if (names.has(alias)) throw new FillError('E_FIELDS', 'PDF 필드 별칭이 충돌합니다.');
    names.add(alias); aliases.set(name, alias);
  }
  return aliases;
}

function refuseActiveContent(doc) {
  // getForm() drops XFA in pdf-lib, so inspect this entry before constructing it.
  const rawForm = doc.catalog.lookupMaybe(PDFName.of('AcroForm'), PDFDict);
  if (rawForm?.has(PDFName.of('XFA'))) throw new FillError('E_UNSUPPORTED', 'XFA PDF는 지원하지 않습니다.');
  const signatureFields = doc.catalog.has(PDFName.of('AcroForm'))
    ? doc.getForm().getFields().filter((field) => field instanceof PDFSignature) : [];
  const emptySignatures = new Set();
  for (const field of signatureFields) {
    const value = field.acroField.dict.lookup(PDFName.of('V'));
    if (value && value !== PDFNull) throw new FillError('E_UNSUPPORTED', '서명된 PDF는 수정할 수 없습니다.');
    emptySignatures.add(field.acroField.dict);
  }
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
      if (['XFA', 'ByteRange', 'Perms', 'DocMDP'].includes(name)) {
        throw new FillError('E_UNSUPPORTED', 'XFA 또는 전자서명 PDF는 지원하지 않습니다.');
      }
      if (['JavaScript', 'JS', 'AA', 'OpenAction', 'RichMediaContent', 'EmbeddedFiles', 'EF'].includes(name)) {
        throw new FillError('E_UNSUPPORTED', '실행 동작 또는 첨부 파일이 포함된 PDF는 지원하지 않습니다.');
      }
      const value = object.lookup(key);
      if (name === 'SigFlags' && (!(value instanceof PDFNumber) || ![0, 1, 3].includes(value.asNumber()) ||
          object !== doc.getForm().acroForm.dict || (value.asNumber() !== 0 && !emptySignatures.size))) {
        throw new FillError('E_UNSUPPORTED', '확인할 수 없는 PDF 서명 상태입니다.');
      }
      if (value instanceof PDFName) {
        const valueName = value.decodeText();
        if (valueName === 'Sig' && (name === 'Type' || (name === 'FT' && !emptySignatures.has(object)))) {
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
    const knownWidgets = new Set();
    for (const page of doc.getPages()) {
      const annotations = page.node.Annots();
      if (!annotations) continue;
      for (let i = 0; i < annotations.size(); i += 1) pageWidgets.add(annotations.lookup(i));
    }
    for (const field of fields) {
      const name = field.getName();
      if (!name || name.length > 4096 || names.has(name)) throw new FillError('E_FIELDS', 'PDF 필드 이름이 유효하지 않거나 중복되었습니다.');
      names.add(name);
      for (const widget of field.acroField.getWidgets()) knownWidgets.add(widget.dict);
      if (field instanceof PDFSignature) continue;
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
    for (const annotation of pageWidgets) {
      if (annotation instanceof PDFDict && annotation.lookup(PDFName.of('Subtype'))?.toString() === '/Widget' && !knownWidgets.has(annotation)) {
        throw new FillError('E_UNSUPPORTED', '필드 트리에 연결되지 않은 PDF 표시 영역이 있습니다.');
      }
    }
    return fields.filter((field) => !(field instanceof PDFSignature));
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_INPUT', 'PDF 필드 구조가 올바르지 않습니다.');
  }
}

function describe(field, aliases) {
  const sourceName = field.getName();
  const name = aliases?.get(sourceName) ?? sourceName;
  return {
    name,
    ...(name !== sourceName ? { sourceName } : {}),
    type: field instanceof PDFTextField ? 'text' : 'checkbox',
    occurrences: field.acroField.getWidgets().length,
    ...(field instanceof PDFTextField ? { multiline: field.isMultiline(), ...(field.getMaxLength() !== undefined ? { maxLength: field.getMaxLength() } : {}) } : {}),
  };
}

function checkTextFits(field, text, font) {
  if (!field.isMultiline() && /[\r\n]/.test(text)) {
    throw new FillError('E_FIELDS', '한 줄 PDF 필드에는 줄바꿈을 입력할 수 없습니다.', { field: field.getName() });
  }
  for (const widget of field.acroField.getWidgets()) {
    const layout = textLayout(field, widget, text, font);
    if (!layoutFits(layout)) {
      throw new FillError('E_FIELDS', '입력한 텍스트가 PDF 필드 표시 영역을 넘습니다. 내용을 줄이거나 더 큰 서식을 사용하세요.', { field: field.getName() });
    }
    // Fix auto-sized input fields at the exact size checked above, keeping the existing color.
    const appearance = widget.getDefaultAppearance() ?? field.acroField.getDefaultAppearance() ?? '0 g';
    widget.setDefaultAppearance(`${appearance}\n/FillDocuments ${layout.fontSize} Tf`);
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
  const fields = fieldsOf(doc);
  const aliases = aliasesOf(fields);
  const flow = readContinuations(doc);
  if (!flow) prepareLayoutProfile(doc, fields, aliases, _context.layoutProfile, bytes);
  return { format: 'pdf', fields: fields.filter((field) => !flow?.chunks.has(field.getName())).map((field) => describe(field, aliases)),
    ...(flow ? { continuations: flow.entries } : {}), warnings: flow ? ['별지가 생성된 PDF입니다. 다시 채우려면 원본 서식을 사용하세요.'] : [], engine: ENGINE };
}

function signatureSnapshot(doc) {
  const appearance = object => object instanceof PDFStream
    ? { dictionary: object.dict.toString(), sha256: hash(object.getContents()) }
    : object instanceof PDFDict ? object.keys().map(key => [key.decodeText(), appearance(object.lookup(key))]) : object?.toString() ?? null;
  const signatures = doc.getForm().getFields().filter((field) => field instanceof PDFSignature).map((field) => ({
    name: field.getName(), dictionary: field.acroField.dict.toString(),
    widgets: field.acroField.getWidgets().map((widget) => ({ dictionary: widget.dict.toString(),
      appearance: appearance(widget.dict.lookup(PDFName.of('AP'))) })),
  }));
  return { signatures, flags: doc.getForm().acroForm.dict.get(PDFName.of('SigFlags'))?.toString() ?? null };
}

function fieldStructure(fields, aliases) {
  return fields.map(field => ({ ...describe(field, aliases), ref: field.ref.toString(),
    widgets: field.acroField.getWidgets().map(widget => ({
      ref: field.doc.context.getObjectRef(widget.dict)?.toString() ?? null, rectangle: widget.getRectangle(),
      page: widget.dict.get(PDFName.of('P'))?.toString() ?? null,
      parent: widget.dict.get(PDFName.of('Parent'))?.toString() ?? null,
    })) }));
}

export async function fill(bytes, values, context = {}) {
  const doc = await loadPdf(bytes);
  if (readContinuations(doc)) throw new FillError('E_UNSUPPORTED', '별지가 있는 결과 PDF는 다시 채울 수 없습니다. 원본 서식을 사용하세요.');
  const fields = fieldsOf(doc);
  if (!fields.length) throw new FillError('E_FIELDS', 'PDF에 채울 수 있는 AcroForm 필드가 없습니다.');
  const aliases = aliasesOf(fields);
  const profile = prepareLayoutProfile(doc, fields, aliases, context.layoutProfile, bytes);
  const names = new Set(aliases.values());
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
  const before = fieldStructure(fields, aliases);
  const pageCount = doc.getPageCount();
  const pagesBefore = pageSnapshot(doc, pageCount);
  const signaturesBefore = signatureSnapshot(doc);
  const plans = [];
  for (const field of fields) {
    const name = aliases.get(field.getName());
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
      try { checkTextFits(field, value, font); }
      catch (error) {
        if (error.code !== 'E_FIELDS' || context.overflow !== 'flow') throw error;
        plans.push(planContinuation(doc, field, name, value, font, profile.get(name)));
      }
    } else {
      if (typeof value !== 'boolean') throw new FillError('E_FIELDS', 'PDF 체크박스에는 true 또는 false가 필요합니다.', { field: name });
    }
  }
  const overflowing = new Set(plans.map(plan => plan.sourceName));
  for (const plan of profile.values()) {
    if (plan.repeat.some(field => overflowing.has(field.getName()))) layoutError('넘치는 본문 필드는 반복 문맥으로 사용할 수 없습니다.', { field: plan.settings.field, reason: 'overflowing-repeat-field' });
  }
  for (const field of fields) {
    const value = values[aliases.get(field.getName())];
    if (field instanceof PDFTextField) {
      const plan = plans.find(item => item.sourceName === field.getName());
      const text = plan?.chunks[0] ?? value;
      checkTextFits(field, text, font);
      field.setText(text); field.updateAppearances(font);
    } else {
      if (value) field.check(); else field.uncheck();
      field.updateAppearances();
    }
  }
  const continuations = await appendContinuations(doc, bytes, plans, font);
  addSourceNotes(doc, continuations, font);
  const expectedPages = pageSnapshot(doc, pageCount);
  const changedPages = new Set(continuations.map(entry => entry.sourcePage - 1));
  for (let index = 0; index < pageCount; index += 1) {
    if (!changedPages.has(index) && JSON.stringify(expectedPages[index]) !== JSON.stringify(pagesBefore[index])) {
      throw new FillError('E_PRESERVATION', '이어쓰기 안내 외의 원래 PDF 페이지가 변경되었습니다.');
    }
    if (changedPages.has(index)) {
      const { streams, resources, ...current } = expectedPages[index];
      const { streams: original, resources: _resources, ...previous } = pagesBefore[index];
      if (JSON.stringify(current) !== JSON.stringify(previous) || streams.length !== original.length + 3 ||
          JSON.stringify(streams.slice(1, -2)) !== JSON.stringify(original)) throw new FillError('E_PRESERVATION', '원래 PDF 내용 스트림이 변경되었습니다.');
    }
  }
  verifyWidgetGraph(doc);
  writeContinuations(doc, pageCount, continuations);
  let result;
  try { result = await doc.save({ updateFieldAppearances: false }); }
  catch { throw new FillError('E_ENGINE', 'PDF 저장에 실패했습니다.'); }
  const reread = await loadPdf(result);
  const rereadFields = fieldsOf(reread);
  const flow = readContinuations(reread);
  const originalFields = rereadFields.filter((field) => !flow?.chunks.has(field.getName()));
  const addedPages = continuations.reduce((count, entry) => count + entry.addedPages.length, 0);
  if (pageCount + addedPages !== reread.getPageCount() ||
      JSON.stringify(before) !== JSON.stringify(fieldStructure(originalFields, aliases)) ||
      JSON.stringify(expectedPages) !== JSON.stringify(pageSnapshot(reread, pageCount)) ||
      JSON.stringify(signaturesBefore) !== JSON.stringify(signatureSnapshot(reread))) {
    throw new FillError('E_PRESERVATION', 'PDF 페이지 또는 필드 구조가 달라졌습니다.');
  }
  for (const field of originalFields) {
    const continuation = flow?.entries.find((entry) => entry.sourceName === field.getName());
    const actual = continuation ? (field.getText() ?? '') + continuation.chunkFields.map((name) => reread.getForm().getTextField(name).getText() ?? '').join('')
      : field instanceof PDFTextField ? (field.getText() ?? '') : field.isChecked();
    if (actual !== values[aliases.get(field.getName())]) throw new FillError('E_PRESERVATION', 'PDF 입력값 재읽기 검증에 실패했습니다.');
  }
  verifyAppearances(rereadFields, { requireEmbeddedFont: true });
  if (flow) verifyFlowLayout(reread, flow, font, aliasesOf(rereadFields));
  return {
    bytes: result,
    checks: [
      { name: 'pdf-structure', status: 'pass' }, { name: 'field-values-reread', status: 'pass' },
      { name: 'page-and-field-preservation', status: 'pass' }, { name: 'appearance-streams', status: 'pass' },
      { name: 'embedded-unicode-font', status: 'pass' }, { name: 'text-within-field-bounds', status: 'pass' },
      ...(flow ? [{ name: 'continuation-values-exact', status: 'pass' }] : []),
    ],
    warnings: [VISUAL_WARNING, ...(flow ? ['반복 문맥은 고정 표시입니다. 원래 문맥을 바꾸려면 원본 서식과 수정한 입력으로 다시 생성하세요.'] : [])],
    engine: ENGINE,
    layout: { policy: context.overflow ?? 'preserve', strategy: flow ? 'continuation-pages' : 'existing-fields',
      pagination: { before: pageCount, after: reread.getPageCount() }, continuations },
  };
}

function verifyFlowLayout(doc, flow, font, aliases) {
  for (const entry of flow.entries) {
    if (aliases.get(entry.sourceName) !== entry.origin) throw new FillError('E_PRESERVATION', 'PDF 이어쓰기의 원본 필드 별칭이 일치하지 않습니다.');
    if (flow.version === 3 && (entry.settings?.field !== entry.origin || entry.settings?.sourcePage !== entry.sourcePage ||
        JSON.stringify(entry.repeatContexts.map(item => aliases.get(item.sourceName))) !== JSON.stringify(entry.settings.repeatFields))) {
      throw new FillError('E_PRESERVATION', 'PDF 이어쓰기 설정과 원래 필드의 연결이 일치하지 않습니다.');
    }
    for (const name of [...(flow.version === 3 ? [entry.sourceName] : []), ...entry.chunkFields]) {
      const field = doc.getForm().getTextField(name);
      if (field.acroField.getWidgets().some(widget => (fontSizeOf(widget) ?? fontSizeOf(field.acroField)) !== entry.fontSize)) {
        throw new FillError('E_PRESERVATION', 'PDF 이어쓰기의 고정 글자 크기가 달라졌습니다.');
      }
      verifyContinuationBounds(field, font, entry.fontSize);
    }
  }
}

export async function validate(bytes, _context = {}) {
  const doc = await loadPdf(bytes);
  const fields = fieldsOf(doc);
  const flow = readContinuations(doc);
  verifyAppearances(fields);
  if (flow) {
    const aliases = aliasesOf(fields);
    doc.registerFontkit(fontkit);
    const font = await doc.embedFont(await readFile(path.join(_context.skillRoot ?? DEFAULT_ROOT, 'assets/fonts/NanumGothic-Regular.ttf')), { subset: false });
    verifyFlowLayout(doc, flow, font, aliases);
  }
  return {
    checks: [{ name: 'pdf-structure', status: 'pass' }, { name: 'appearance-streams', status: 'pass' },
      ...(flow ? [{ name: 'continuation-values-exact', status: 'pass' }, { name: 'continuation-default-layout', status: 'pass' }] : [])],
    ...(flow ? { continuations: flow.entries } : {}),
    warnings: [VISUAL_WARNING, ...(!fields.length ? ['이 PDF에는 채울 수 있는 AcroForm 필드가 없습니다.'] : [])],
    engine: ENGINE,
  };
}
