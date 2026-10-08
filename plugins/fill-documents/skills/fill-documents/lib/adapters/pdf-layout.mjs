import { createHash } from 'node:crypto';
import {
  PDFArray, PDFDict, PDFName, PDFNumber, PDFStream, PDFTextField,
  layoutMultilineText, layoutSinglelineText, adjustDimsForRotation, reduceRotation, decodePDFRawStream,
} from 'pdf-lib';
import { FillError } from '../errors.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const layoutError = (message, details = {}) => {
  throw new FillError('E_LAYOUT', message, { region: 'continuation-page', reason: 'unrepresentable-layout', ...details });
};
export const corrupt = () => { throw new FillError('E_PRESERVATION', 'PDF 이어쓰기 필드와 매핑이 일치하지 않습니다.'); };
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, required, optional = []) => plain(value) && required.every(key => Object.hasOwn(value, key)) &&
  Object.keys(value).every(key => required.includes(key) || optional.includes(key));
export const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
export const appearanceDictionary = stream => JSON.stringify(stream.dict.entries()
  .filter(([key]) => key.decodeText() !== 'Length')
  .map(([key, value]) => [key.decodeText(), value.toString()]).sort(([left], [right]) => left.localeCompare(right)));
export const validBox = box => exactKeys(box, ['x', 'y', 'width', 'height']) && Object.values(box).every(Number.isFinite) && box.width > 0 && box.height > 0;
export const inside = (inner, outer) => inner.x >= outer.x && inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export function fontSizeOf(field) {
  const matches = [...(field.getDefaultAppearance() ?? '').matchAll(/\/[^\s]+\s+(\d*\.\d+|\d+)\s+Tf/g)];
  const size = Number(matches.at(-1)?.[1]);
  return size > 0 ? size : undefined;
}

export function fieldPages(doc, field) {
  const widgets = new Set(field.acroField.getWidgets().map(widget => widget.dict));
  return doc.getPages().flatMap((page, index) => {
    const annotations = page.node.Annots();
    return annotations && Array.from({ length: annotations.size() }, (_, i) => annotations.lookup(i)).some(object => widgets.has(object)) ? [index + 1] : [];
  });
}

export function textLayout(field, widget, text, font, size) {
  const dimensions = adjustDimsForRotation(widget.getRectangle(), reduceRotation(widget.getAppearanceCharacteristics()?.getRotation()));
  const inset = (widget.getBorderStyle()?.getWidth() ?? 0) + 1;
  const bounds = { x: inset, y: inset, width: dimensions.width - inset * 2, height: dimensions.height - inset * 2 };
  const fontSize = size ?? fontSizeOf(widget) ?? fontSizeOf(field.acroField) ?? 10;
  const options = { font, fontSize, bounds, alignment: field.getAlignment() };
  const layout = field.isMultiline() ? layoutMultilineText(text, options) : layoutSinglelineText(text, options);
  return { bounds, fontSize, lines: field.isMultiline() ? layout.lines : [layout.line],
    descent: font.heightAtSize(fontSize) - font.heightAtSize(fontSize, { descender: false }) };
}

export function layoutFits({ bounds, lines, descent }) {
  return bounds.width > 0 && bounds.height > 0 && lines.filter(line => line.text.trim()).every(line =>
    line.x >= bounds.x - 0.01 && line.x + line.width <= bounds.x + bounds.width + 0.01 &&
    line.y - descent >= bounds.y - 0.01 && line.y + line.height <= bounds.y + bounds.height + 0.01);
}

export function geometryOf(field) {
  const widget = field.acroField.getWidgets()[0];
  return { rectangle: widget.getRectangle(), borderWidth: widget.getBorderStyle()?.getWidth() ?? 0,
    alignment: field.getAlignment(), fontSize: fontSizeOf(widget) ?? fontSizeOf(field.acroField) ?? 10 };
}

export function pageGeometry(page) {
  return { media: page.getMediaBox(), crop: page.getCropBox(), rotation: page.getRotation().angle };
}

export function supportedField(doc, field, sourcePage, { multiline = false } = {}) {
  if (!(field instanceof PDFTextField) || field.isReadOnly() || (multiline && !field.isMultiline()) ||
      field.acroField.getWidgets().length !== 1 || !same(fieldPages(doc, field), [sourcePage])) return false;
  const page = doc.getPage(sourcePage - 1), { media, crop, rotation } = pageGeometry(page);
  const widget = field.acroField.getWidgets()[0], rect = widget.getRectangle();
  return validBox(media) && validBox(crop) && media.x === 0 && media.y === 0 && crop.x === 0 && crop.y === 0 &&
    rotation === 0 && (widget.getAppearanceCharacteristics()?.getRotation() ?? 0) === 0 &&
    validBox(rect) && inside(rect, crop) && inside(crop, media) && Number.isFinite(geometryOf(field).borderWidth) && geometryOf(field).borderWidth >= 0;
}

export function prepareLayoutProfile(doc, fields, aliases, profile, bytes) {
  const plans = new Map();
  if (profile === undefined) return plans;
  if (!exactKeys(profile, ['version', 'format', 'templateSha256', 'continuations']) || profile.version !== 1 || profile.format !== 'pdf' ||
      typeof profile.templateSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(profile.templateSha256) ||
      !Array.isArray(profile.continuations) || !profile.continuations.length || profile.continuations.length > 1000) {
    layoutError('PDF 이어쓰기 설정 형식이 올바르지 않습니다.', { reason: 'invalid-profile' });
  }
  if (hash(bytes) !== profile.templateSha256) throw new FillError('E_TEMPLATE_CHANGED', 'PDF 이어쓰기 설정과 원본 파일이 다릅니다.');
  const byAlias = new Map(fields.map(field => [aliases.get(field.getName()), field]));
  const widgetRectangles = new Map(doc.getForm().getFields().flatMap(field => field.acroField.getWidgets().map(widget => [widget.dict, widget.getRectangle()])));
  const pageRectangles = doc.getPages().map(page => {
    const annotations = page.node.Annots();
    return annotations ? Array.from({ length: annotations.size() }, (_, index) => widgetRectangles.get(annotations.lookup(index))).filter(Boolean) : [];
  });
  const sourceFooters = new Map();
  for (const settings of profile.continuations) {
    if (!exactKeys(settings, ['field', 'sourcePage', 'repeatFields', 'label', 'labelBox', 'sourceFooterBox'], ['footer', 'footerBox']) ||
        typeof settings.field !== 'string' || plans.has(settings.field) || !Number.isInteger(settings.sourcePage) ||
        settings.sourcePage < 1 || settings.sourcePage > doc.getPageCount() ||
        !Array.isArray(settings.repeatFields) || settings.repeatFields.length > 1000 ||
        settings.repeatFields.some(name => typeof name !== 'string') || new Set(settings.repeatFields).size !== settings.repeatFields.length ||
        (Object.hasOwn(settings, 'footer') !== Object.hasOwn(settings, 'footerBox'))) layoutError('PDF 이어쓰기 필드 설정이 올바르지 않습니다.', { reason: 'invalid-profile' });
    for (const [key, maximum] of [['label', 80], ['footer', 240]]) {
      if (key === 'footer' && settings.footer === undefined) continue;
      if (typeof settings[key] !== 'string' || !settings[key].trim() || settings[key].length > maximum || /[\u0000-\u001f\u007f\ufffe\uffff\uD800-\uDFFF]/u.test(settings[key])) {
        layoutError('PDF 이어쓰기 안내 문구는 유효한 한 줄 문자열이어야 합니다.', { reason: 'invalid-profile' });
      }
    }
    const field = byAlias.get(settings.field);
    if (!supportedField(doc, field, settings.sourcePage, { multiline: true })) layoutError('PDF 이어쓰기는 한 페이지의 수평 다중 행 필드만 지원합니다.', { field: settings.field, reason: 'unsupported-geometry' });
    const page = doc.getPage(settings.sourcePage - 1);
    const rectangles = pageRectangles[settings.sourcePage - 1];
    const boxes = [settings.labelBox, ...(settings.footerBox ? [settings.footerBox] : [])];
    for (const box of [...boxes, settings.sourceFooterBox]) {
      if (!validBox(box) || !inside(box, page.getCropBox()) || rectangles.some(rect => overlaps(box, rect))) layoutError('PDF 이어쓰기 안내 영역이 페이지 또는 기존 필드와 겹칩니다.', { field: settings.field, reason: 'invalid-label-box' });
    }
    if (boxes.length > 1 && overlaps(...boxes)) layoutError('PDF 이어쓰기 안내 영역끼리 겹칩니다.', { field: settings.field, reason: 'invalid-label-box' });
    const previousFooters = sourceFooters.get(settings.sourcePage) ?? [];
    if (previousFooters.some(box => overlaps(box, settings.sourceFooterBox))) layoutError('원래 페이지의 이어쓰기 안내 영역끼리 겹칩니다.', { field: settings.field, reason: 'invalid-label-box' });
    sourceFooters.set(settings.sourcePage, [...previousFooters, settings.sourceFooterBox]);
    const repeat = settings.repeatFields.map(name => byAlias.get(name));
    if (settings.repeatFields.includes(settings.field) || repeat.some(item => !supportedField(doc, item, settings.sourcePage))) layoutError('반복 문맥은 같은 페이지의 일반 텍스트 필드여야 합니다.', { field: settings.field, reason: 'invalid-repeat-field' });
    plans.set(settings.field, { field, repeat, settings, geometry: geometryOf(field), page: pageGeometry(page),
      templateSha256: profile.templateSha256, profileSha256: hash(JSON.stringify(profile)) });
  }
  return plans;
}

export function labelPosition(text, box, font) {
  const size = 9, height = font.heightAtSize(size), descent = height - font.heightAtSize(size, { descender: false });
  const characters = new Set(font.getCharacterSet());
  if ([...text].some(character => !characters.has(character.codePointAt(0))) ||
      font.widthOfTextAtSize(text, size) > box.width + 0.01 || height + descent > box.height + 0.01) {
    layoutError('PDF 이어쓰기 안내 문구가 지정된 여백에 들어가지 않습니다.', { reason: 'label-overflow' });
  }
  return { x: box.x, y: box.y + descent, size };
}

export function contentRecords(page) {
  const contents = page.node.Contents();
  const values = contents instanceof PDFArray ? contents.asArray() : contents ? [page.node.get(PDFName.of('Contents'))] : [];
  return values.map(value => {
    const stream = page.doc.context.lookup(value);
    if (!(stream instanceof PDFStream)) corrupt();
    return { ref: value.toString(), sha256: hash(stream.getContents()) };
  });
}

// Our outer q/Q pair can isolate the source only when its own graphics-state
// stack is balanced. This tokenizer deliberately rejects inline-image data;
// ordinary image XObjects remain supported. It is not a general PDF renderer.
export function verifySourceGraphics(page) {
  const contents = page.node.Contents();
  const streams = contents instanceof PDFArray ? contents.asArray().map(value => page.doc.context.lookup(value)) : contents ? [contents] : [];
  let text;
  try { text = streams.map(stream => Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1')).join('\n'); }
  catch { layoutError('원래 PDF 페이지의 그래픽 상태를 확인할 수 없습니다.', { reason: 'unsupported-source-graphics' }); }
  const delimiter = character => /[\x00\t\n\f\r ()<>\[\]{}/%]/.test(character);
  let index = 0, depth = 0;
  while (index < text.length) {
    const character = text[index];
    if (/[\x00\t\n\f\r ]/.test(character)) { index += 1; continue; }
    if (character === '%') { while (index < text.length && !/[\r\n]/.test(text[index])) index += 1; continue; }
    if (character === '/') { index += 1; while (index < text.length && !delimiter(text[index])) index += 1; continue; }
    if (character === '(') {
      index += 1; let nesting = 1;
      while (index < text.length && nesting > 0) {
        if (text[index] === '\\') { index += 2; continue; }
        if (text[index] === '(') nesting += 1;
        if (text[index] === ')') nesting -= 1;
        index += 1;
      }
      if (nesting) layoutError('원래 PDF 페이지의 문자열이 끝나지 않습니다.', { reason: 'unsupported-source-graphics' });
      continue;
    }
    if (character === '<' && text[index + 1] !== '<') {
      const end = text.indexOf('>', index + 1);
      if (end < 0 || /[^0-9a-fA-F\x00\t\n\f\r ]/.test(text.slice(index + 1, end))) layoutError('원래 PDF 페이지의 문자열을 해석할 수 없습니다.', { reason: 'unsupported-source-graphics' });
      index = end + 1; continue;
    }
    if (character === '<' && text[index + 1] === '<') { index += 2; continue; }
    if (delimiter(character)) { index += 1; continue; }
    const start = index;
    while (index < text.length && !delimiter(text[index])) index += 1;
    const token = text.slice(start, index);
    if (token === 'BI') layoutError('인라인 이미지가 있는 원래 PDF 페이지는 이어쓰기 배경으로 지원하지 않습니다.', { reason: 'unsupported-source-graphics' });
    if (token === 'q') depth += 1;
    if (token === 'Q') depth -= 1;
    if (depth < 0) layoutError('원래 PDF 페이지의 그래픽 상태 복원이 맞지 않습니다.', { reason: 'unbalanced-source-graphics' });
  }
  if (depth !== 0) layoutError('원래 PDF 페이지의 그래픽 상태가 닫히지 않았습니다.', { reason: 'unbalanced-source-graphics' });
}

export function pageSnapshot(doc, count) {
  return doc.getPages().slice(0, count).map(page => ({ ...pageGeometry(page), streams: contentRecords(page),
    annotations: page.node.Annots()?.asArray().map(ref => ref.toString()) ?? [],
    resources: page.node.Resources()?.toString() ?? null }));
}

// Add only known q/Q wrappers and our own note stream; never edit an original stream.
export function addSourceNotes(doc, entries, font) {
  const grouped = new Map();
  for (const entry of entries) grouped.set(entry.sourcePage, [...(grouped.get(entry.sourcePage) ?? []), entry]);
  for (const [number, notes] of grouped) {
    const page = doc.getPage(number - 1);
    const resources = (page.node.Resources() ?? doc.context.obj({})).clone(doc.context);
    for (const name of ['Font', 'XObject', 'ExtGState']) {
      const dictionary = resources.lookupMaybe(PDFName.of(name), PDFDict);
      if (dictionary) resources.set(PDFName.of(name), dictionary.clone(doc.context));
    }
    const fonts = resources.lookupMaybe(PDFName.of('Font'), PDFDict) ?? doc.context.obj({});
    resources.set(PDFName.of('Font'), fonts);
    let index = 1;
    while (fonts.has(PDFName.of(`ContinuationNote${index}`))) index += 1;
    const fontName = `ContinuationNote${index}`;
    fonts.set(PDFName.of(fontName), font.ref);
    page.node.set(PDFName.of('Resources'), resources);
    const operations = notes.map(entry => {
      const text = `${entry.settings.label}: page ${entry.addedPages[0]}`;
      const { x, y, size } = labelPosition(text, entry.settings.sourceFooterBox, font);
      return `q\n0 g\nBT\n/${fontName} ${size} Tf\n1 0 0 1 ${PDFNumber.of(x)} ${PDFNumber.of(y)} Tm\n${font.encodeText(text)} Tj\nET\nQ\n`;
    }).join('');
    const original = page.node.Contents();
    const oldValues = original instanceof PDFArray ? original.asArray() : original ? [page.node.get(PDFName.of('Contents'))] : [];
    const note = doc.context.register(doc.context.flateStream(operations));
    const push = doc.context.register(doc.context.flateStream('q\n')), pop = doc.context.register(doc.context.flateStream('Q\n'));
    page.node.set(PDFName.of('Contents'), doc.context.obj([push, ...oldValues, pop, note]));
    for (const entry of notes) entry.sourceNote = { ref: note.toString(), sha256: hash(doc.context.lookup(note).getContents()) };
  }
}

export function verifyWidgetGraph(doc) {
  const owner = new Map(), seen = new Set();
  for (const field of doc.getForm().getFields()) {
    for (const widget of field.acroField.getWidgets()) {
      if (owner.has(widget.dict)) corrupt();
      owner.set(widget.dict, field);
    }
  }
  for (const page of doc.getPages()) {
    const annotations = page.node.Annots();
    for (let i = 0; annotations && i < annotations.size(); i += 1) {
      const widget = annotations.lookup(i);
      if (!(widget instanceof PDFDict) || widget.lookup(PDFName.of('Subtype'))?.toString() !== '/Widget') continue;
      const field = owner.get(widget), parent = widget.get(PDFName.of('Parent')), pointer = widget.get(PDFName.of('P'));
      if (!field || seen.has(widget) || (parent && widget !== field.acroField.dict && parent.toString() !== field.ref.toString()) ||
          (pointer && pointer.toString() !== page.ref.toString())) corrupt();
      seen.add(widget);
    }
  }
  if (seen.size !== owner.size) corrupt();
}

export function normalAppearance(field) {
  const widget = field.acroField.getWidgets()[0], appearance = widget.getAppearances()?.normal;
  if (!(appearance instanceof PDFStream)) layoutError('반복 문맥의 표시 스트림을 읽을 수 없습니다.', { reason: 'unsupported-appearance' });
  const box = appearance.dict.lookupMaybe(PDFName.of('BBox'), PDFArray)?.asArray().map(value => value instanceof PDFNumber ? value.asNumber() : NaN);
  const matrix = appearance.dict.lookupMaybe(PDFName.of('Matrix'), PDFArray)?.asArray().map(value => value instanceof PDFNumber ? value.asNumber() : NaN) ?? [1, 0, 0, 1, 0, 0];
  const rect = widget.getRectangle();
  if (!box || box.length !== 4 || !box.every(Number.isFinite) || !same(matrix, [1, 0, 0, 1, 0, 0]) ||
      Math.abs(box[0]) > 0.01 || Math.abs(box[1]) > 0.01 || Math.abs(box[2] - rect.width) > 0.01 || Math.abs(box[3] - rect.height) > 0.01) {
    layoutError('반복 문맥의 표시 좌표계를 지원하지 않습니다.', { reason: 'unsupported-appearance' });
  }
  return appearance;
}
