import {
  PDFDocument, PDFDict, PDFName, PDFNumber, PDFHexString, PDFStream,
  rgb, pushGraphicsState, translate, drawObject, popGraphicsState,
} from 'pdf-lib';
import { FillError } from '../errors.mjs';
import { readLegacyContinuations } from './pdf-flow-legacy.mjs';
import {
  hash, layoutError, corrupt, same, fieldPages, geometryOf, pageGeometry,
  supportedField, textLayout, layoutFits, labelPosition, normalAppearance,
  verifyWidgetGraph, contentRecords, appearanceDictionary, verifySourceGraphics,
} from './pdf-layout.mjs';

const KEY = PDFName.of('FillDocumentsFlow');
const MAX_PAGES = 256;
export { fieldPages } from './pdf-layout.mjs';

// Split only at original whitespace/grapheme boundaries. Values remain raw /V
// strings, including trailing CRLFs and spaces; the default AP does all wrapping.
export function paginateText(value, field, font, size) {
  const widget = field.acroField.getWidgets()[0];
  const full = textLayout(field, widget, value, font, size);
  if (full.lines.some(line => line.text.trim() && line.width > full.bounds.width + 0.01)) {
    layoutError('공백으로 나눌 수 없는 문자열이 원래 PDF 칸보다 넓습니다.', { field: field.getName(), reason: 'unbreakable-run' });
  }
  const graphemeEnds = new Set([...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(value)].map(part => part.index + part.segment.length));
  const ends = [...value.matchAll(/\r\n|\r|\n|[^\S\r\n]+/gu)].map(match => match.index + match[0].length).filter(end => graphemeEnds.has(end));
  if (ends.at(-1) !== value.length) ends.push(value.length);
  const chunks = [];
  let offset = 0, firstEnd = 0;
  while (offset < value.length) {
    let low = firstEnd, high = ends.length - 1, best = -1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (layoutFits(textLayout(field, widget, value.slice(offset, ends[middle]), font, size))) { best = middle; low = middle + 1; }
      else high = middle - 1;
    }
    if (best < 0 || ends[best] <= offset) layoutError('원래 PDF 칸에 이어쓰기 본문을 배치할 수 없습니다.', { field: field.getName(), reason: 'no-progress' });
    chunks.push(value.slice(offset, ends[best]));
    offset = ends[best]; firstEnd = best + 1;
    if (chunks.length > MAX_PAGES + 1) layoutError('PDF 추가 페이지 수가 256쪽을 넘습니다.');
  }
  if (chunks.join('') !== value) corrupt();
  return chunks;
}

export function verifyContinuationBounds(field, font, size) {
  if (field.acroField.getWidgets().some(widget => !layoutFits(textLayout(field, widget, field.getText() ?? '', font, size)))) {
    layoutError('PDF 이어쓰기 내용이 원래 표시 영역을 넘습니다.', { field: field.getName() });
  }
}

export function planContinuation(doc, field, origin, value, font, plan) {
  if (!plan) layoutError('이 PDF 양식의 이어쓰기 설정이 필요합니다.', { field: origin, reason: 'continuation-template-required' });
  const chunks = paginateText(value, field, font, plan.geometry.fontSize);
  if (chunks.length < 2) layoutError('PDF 이어쓰기 계획이 실제 넘침과 일치하지 않습니다.', { field: origin });
  return { ...plan, chunks, origin, sourceName: field.getName(), originalPages: fieldPages(doc, field),
    sourcePage: plan.settings.sourcePage, fontSize: plan.geometry.fontSize, prefixLength: chunks[0].length,
    length: value.length, sha256: hash(value) };
}

async function embedBackground(doc, donor, sourcePage) {
  const page = donor.getPage(sourcePage - 1);
  for (const name of ['Resources', 'MediaBox', 'CropBox', 'Rotate']) {
    const value = page.node.getInheritableAttribute(PDFName.of(name));
    if (value) page.node.set(PDFName.of(name), value);
  }
  const allowed = new Set(['Type', 'Contents', 'Resources', 'MediaBox', 'CropBox', 'Rotate']);
  for (const key of page.node.keys()) if (!allowed.has(key.decodeText())) page.node.delete(key);
  if (!page.node.Contents()) page.node.set(PDFName.of('Contents'), donor.context.register(donor.context.flateStream('')));
  // Removing Annots after copying leaves duplicate signature objects behind.
  return doc.embedPage(page);
}

function appendBody(doc, page, plan, name, value, font) {
  const field = doc.getForm().createTextField(name);
  field.enableMultiline(); field.setAlignment(plan.geometry.alignment);
  field.addToPage(page, { ...plan.geometry.rectangle, font, borderWidth: 0,
    textColor: undefined, backgroundColor: undefined, borderColor: undefined });
  const widget = field.acroField.getWidgets()[0], sourceWidget = plan.field.acroField.getWidgets()[0];
  for (const key of ['MK', 'BS']) {
    const visual = sourceWidget.dict.lookupMaybe(PDFName.of(key), PDFDict);
    if (visual) widget.dict.set(PDFName.of(key), visual.clone(doc.context));
  }
  widget.setRectangle(plan.geometry.rectangle);
  widget.setDefaultAppearance(sourceWidget.getDefaultAppearance() ?? plan.field.acroField.getDefaultAppearance() ?? '0 g');
  field.setFontSize(plan.fontSize);
  field.setText(value); field.updateAppearances(font);
  verifyContinuationBounds(field, font, plan.fontSize);
}

export async function appendContinuations(doc, sourceBytes, plans, font) {
  const count = plans.reduce((total, plan) => total + plan.chunks.length - 1, 0);
  if (count > MAX_PAGES || doc.getPageCount() + count > 4096) layoutError('PDF 추가 또는 전체 페이지 수가 지원 범위를 넘습니다.');
  if (!plans.length) return [];
  for (const sourcePage of new Set(plans.map(plan => plan.sourcePage))) verifySourceGraphics(doc.getPage(sourcePage - 1));
  const donor = await PDFDocument.load(sourceBytes, { updateMetadata: false, throwOnInvalidObject: true });
  const backgrounds = new Map(), existing = new Set(doc.getForm().getFields().map(field => field.getName()));
  const entries = [];
  for (const plan of plans) {
    if (!backgrounds.has(plan.sourcePage)) backgrounds.set(plan.sourcePage, await embedBackground(doc, donor, plan.sourcePage));
    const background = backgrounds.get(plan.sourcePage);
    const entry = { origin: plan.origin, sourceName: plan.sourceName, originalPages: plan.originalPages, sourcePage: plan.sourcePage,
      prefixLength: plan.prefixLength, chunkFields: [], chunkPages: [], addedPages: [], fontSize: plan.fontSize,
      length: plan.length, sha256: plan.sha256, templateSha256: plan.templateSha256, profileSha256: plan.profileSha256,
      geometry: plan.geometry, page: plan.page, settings: plan.settings, repeatContexts: [] };
    const repeats = plan.repeat.map(field => {
      const appearance = normalAppearance(field);
      const ref = doc.context.getObjectRef(appearance) ?? doc.context.register(appearance);
      const record = { sourceName: field.getName(), valueSha256: hash(field.getText() ?? ''),
        appearanceSha256: hash(appearance.getContents()), appearanceDictionary: appearanceDictionary(appearance), bindings: [] };
      entry.repeatContexts.push(record);
      return { record, ref, rectangle: field.acroField.getWidgets()[0].getRectangle() };
    });
    for (let index = 1; index < plan.chunks.length; index += 1) {
      const name = `continuation_${hash(plan.sourceName).slice(0, 24)}_${index}`;
      if (existing.has(name)) layoutError('PDF 이어쓰기 필드 이름이 기존 이름과 충돌합니다.', { field: plan.origin });
      existing.add(name);
      const page = doc.addPage([plan.page.media.width, plan.page.media.height]);
      page.setCropBox(plan.page.crop.x, plan.page.crop.y, plan.page.crop.width, plan.page.crop.height);
      const pageNumber = doc.getPageCount();
      page.drawPage(background, { x: 0, y: 0, width: plan.page.media.width, height: plan.page.media.height });
      for (const { record, ref, rectangle } of repeats) {
        const key = page.node.newXObject('Context', ref);
        page.pushOperators(pushGraphicsState(), translate(rectangle.x, rectangle.y), drawObject(key), popGraphicsState());
        record.bindings.push({ page: pageNumber, key: key.decodeText(), ref: ref.toString() });
      }
      const label = `${plan.settings.label} - part ${index + 1} of ${plan.chunks.length} - original form page ${plan.sourcePage}`;
      page.drawText(label, { ...labelPosition(label, plan.settings.labelBox, font), font, color: rgb(0, 0, 0) });
      if (plan.settings.footer) page.drawText(plan.settings.footer, { ...labelPosition(plan.settings.footer, plan.settings.footerBox, font), font, color: rgb(0, 0, 0) });
      appendBody(doc, page, plan, name, plan.chunks[index], font);
      entry.chunkFields.push(name); entry.chunkPages.push(pageNumber); entry.addedPages.push(pageNumber);
    }
    entries.push(entry);
  }
  return entries;
}

export function writeContinuations(doc, originalPageCount, entries) {
  if (!entries.length) return;
  const encoded = JSON.stringify(entries);
  if (encoded.length > 500000) layoutError('PDF 이어쓰기 매핑 크기가 지원 범위를 넘습니다.');
  doc.catalog.set(KEY, doc.context.obj({ Version: 3, OriginalPages: originalPageCount, Entries: PDFHexString.fromText(encoded) }));
}

function verifyRepeatContexts(doc, entry, fields, originalPageCount) {
  if (!Array.isArray(entry.repeatContexts) || entry.repeatContexts.length > 1000 ||
      !Array.isArray(entry.settings?.repeatFields) || entry.repeatContexts.length !== entry.settings.repeatFields.length) corrupt();
  const names = new Set();
  for (const context of entry.repeatContexts) {
    const field = fields.get(context?.sourceName);
    if (!context || names.has(context.sourceName) || context.sourceName === entry.sourceName ||
        !supportedField(doc, field, entry.sourcePage) || entry.sourcePage > originalPageCount ||
        hash(field.getText() ?? '') !== context.valueSha256 || !/^[a-f0-9]{64}$/.test(context.appearanceSha256) ||
        typeof context.appearanceDictionary !== 'string' || !Array.isArray(context.bindings) || context.bindings.length !== entry.addedPages.length) corrupt();
    names.add(context.sourceName);
    for (const [index, binding] of context.bindings.entries()) {
      if (!binding || binding.page !== entry.addedPages[index] || typeof binding.key !== 'string' || !/^Context-\d+$/.test(binding.key) || typeof binding.ref !== 'string') corrupt();
      const xObjects = doc.getPage(binding.page - 1).node.Resources()?.lookupMaybe(PDFName.of('XObject'), PDFDict);
      const raw = xObjects?.get(PDFName.of(binding.key));
      const appearance = xObjects?.lookup(PDFName.of(binding.key));
      if (!raw || raw.toString() !== binding.ref || !(appearance instanceof PDFStream) ||
          hash(appearance.getContents()) !== context.appearanceSha256 || appearanceDictionary(appearance) !== context.appearanceDictionary) corrupt();
    }
  }
}

export function readContinuations(doc) {
  if (!doc.catalog.has(KEY)) return null;
  try {
    const dictionary = doc.catalog.lookup(KEY, PDFDict);
    const version = dictionary.lookup(PDFName.of('Version'), PDFNumber).asNumber();
    if (version === 2) return { ...readLegacyContinuations(doc), version };
    if (version !== 3) return corrupt();
    const originalPageCount = dictionary.lookup(PDFName.of('OriginalPages'), PDFNumber).asNumber();
    const encoded = dictionary.lookup(PDFName.of('Entries'), PDFHexString).decodeText();
    if (encoded.length > 500000) return corrupt();
    const entries = JSON.parse(encoded);
    if (!Number.isInteger(originalPageCount) || originalPageCount < 1 || originalPageCount >= doc.getPageCount() ||
        doc.getPageCount() > 4096 || !Array.isArray(entries) || !entries.length || entries.length > 1000 || doc.getPageCount() - originalPageCount > MAX_PAGES) return corrupt();
    verifyWidgetGraph(doc);
    const fields = new Map(doc.getForm().getFields().map(field => [field.getName(), field]));
    const origins = new Set(), chunks = new Set();
    let nextPage = originalPageCount + 1;
    for (const entry of entries) {
      if (!entry || typeof entry.origin !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(entry.origin) ||
          typeof entry.sourceName !== 'string' || origins.has(entry.sourceName) || !Number.isInteger(entry.sourcePage) || entry.sourcePage < 1 || entry.sourcePage > originalPageCount ||
          !Number.isFinite(entry.fontSize) || entry.fontSize <= 0 || !Number.isInteger(entry.length) || entry.length < 1 || entry.length > 20000 ||
          !Number.isInteger(entry.prefixLength) || entry.prefixLength < 1 || entry.prefixLength >= entry.length ||
          ![entry.sha256, entry.templateSha256, entry.profileSha256].every(value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)) ||
          !Array.isArray(entry.chunkFields) || !entry.chunkFields.length || entry.chunkFields.length > MAX_PAGES ||
          !same(entry.chunkPages, entry.addedPages) || !Array.isArray(entry.addedPages) || entry.chunkFields.length !== entry.addedPages.length ||
          !same(entry.originalPages, [entry.sourcePage])) return corrupt();
      origins.add(entry.sourceName);
      const source = fields.get(entry.sourceName);
      if (!supportedField(doc, source, entry.sourcePage, { multiline: true }) || source.getText()?.length !== entry.prefixLength ||
          !same(geometryOf(source), entry.geometry) || entry.geometry.fontSize !== entry.fontSize || !same(pageGeometry(doc.getPage(entry.sourcePage - 1)), entry.page)) return corrupt();
      const note = entry.sourceNote;
      if (!note || !contentRecords(doc.getPage(entry.sourcePage - 1)).some(record => record.ref === note.ref && record.sha256 === note.sha256)) return corrupt();
      let value = source.getText();
      for (const [index, name] of entry.chunkFields.entries()) {
        const pageNumber = entry.addedPages[index];
        if (pageNumber !== nextPage || pageNumber > doc.getPageCount() || typeof name !== 'string' ||
            name !== `continuation_${hash(entry.sourceName).slice(0, 24)}_${index + 1}` || chunks.has(name) || origins.has(name)) return corrupt();
        nextPage += 1; chunks.add(name);
        const field = fields.get(name), page = doc.getPage(pageNumber - 1);
        if (!supportedField(doc, field, pageNumber, { multiline: true }) || !same(geometryOf(field), entry.geometry) || !same(pageGeometry(page), entry.page) ||
            field.acroField.getWidgets()[0].dict.get(PDFName.of('P'))?.toString() !== page.ref.toString() || page.node.Annots()?.size() !== 1 || !field.getText()?.length) return corrupt();
        value += field.getText();
      }
      if (value.length !== entry.length || hash(value) !== entry.sha256) return corrupt();
      verifyRepeatContexts(doc, entry, fields, originalPageCount);
    }
    if (nextPage !== doc.getPageCount() + 1 || [...origins].some(name => chunks.has(name)) ||
        entries.some(entry => entry.repeatContexts.some(context => origins.has(context.sourceName)))) return corrupt();
    return { version, originalPageCount, entries, chunks };
  } catch (error) {
    if (error instanceof FillError && error.code === 'E_PRESERVATION') throw error;
    return corrupt();
  }
}
