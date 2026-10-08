import { PDFDict, PDFName, PDFNumber, PDFHexString, PDFTextField } from 'pdf-lib';
import { FillError } from '../errors.mjs';
import { hash, fieldPages, corrupt } from './pdf-layout.mjs';

const KEY = PDFName.of('FillDocumentsFlow');
const BOX = { x: 48, y: 54, width: 499.28, height: 680 };
const MAX_PAGES = 256;

// Version 2 used reference text and multiple one-line fields per generic page.
// Keep its reader for existing documents; all new output uses version 3.
export function readLegacyContinuations(doc) {
  if (!doc.catalog.has(KEY)) return null;
  try {
    const dictionary = doc.catalog.lookup(KEY, PDFDict);
    if (dictionary.lookup(PDFName.of('Version'), PDFNumber).asNumber() !== 2) return corrupt();
    const originalPageCount = dictionary.lookup(PDFName.of('OriginalPages'), PDFNumber).asNumber();
    const encoded = dictionary.lookup(PDFName.of('Entries'), PDFHexString).decodeText();
    if (encoded.length > 500000) return corrupt();
    const entries = JSON.parse(encoded);
    if (!Number.isInteger(originalPageCount) || originalPageCount < 1 || originalPageCount >= doc.getPageCount() ||
        !Array.isArray(entries) || !entries.length || entries.length > 1000) return corrupt();
    const fields = new Map(doc.getForm().getFields().map((field) => [field.getName(), field]));
    const origins = new Set(), chunks = new Set(), pages = new Set();
    const lowerEdge = new Map();
    let nextPage = originalPageCount + 1;
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || typeof entry.origin !== 'string' ||
          !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(entry.origin) || typeof entry.sourceName !== 'string' ||
          !Number.isFinite(entry.fontSize) || entry.fontSize <= 0 ||
          !Number.isInteger(entry.length) || entry.length < 1 || entry.length > 20000 ||
          !/^[0-9a-f]{64}$/.test(entry.sha256) || typeof entry.reference !== 'string' ||
          !Array.isArray(entry.originalPages) || !Array.isArray(entry.chunkFields) || !entry.chunkFields.length ||
          entry.chunkFields.length > 10000 || !Array.isArray(entry.addedPages) || !entry.addedPages.length ||
          entry.addedPages.length > MAX_PAGES || !Array.isArray(entry.chunkPages) ||
          entry.chunkPages.length !== entry.chunkFields.length || origins.has(entry.sourceName)) return corrupt();
      origins.add(entry.sourceName);
      if (entry.reference !== `별지 ${entry.addedPages[0]}쪽 참조`) return corrupt();
      for (const page of entry.addedPages) {
        if (!Number.isInteger(page) || page !== nextPage || page > doc.getPageCount() || pages.has(page)) return corrupt();
        pages.add(page); nextPage += 1;
      }
      if (JSON.stringify([...new Set(entry.chunkPages)]) !== JSON.stringify(entry.addedPages)) return corrupt();
      const source = fields.get(entry.sourceName);
      if (!(source instanceof PDFTextField) || source.getText() !== entry.reference ||
          JSON.stringify(fieldPages(doc, source)) !== JSON.stringify(entry.originalPages) ||
          entry.originalPages.some((page) => !Number.isInteger(page) || page < 1 || page > originalPageCount)) return corrupt();
      let value = '';
      for (const [index, name] of entry.chunkFields.entries()) {
        const page = entry.chunkPages[index];
        if (typeof name !== 'string' || !/^continuation_[a-f0-9]{24}_\d+$/.test(name) ||
            chunks.has(name) || origins.has(name) || !Number.isInteger(page) || page <= originalPageCount ||
            page > doc.getPageCount() || (index > 0 && page < entry.chunkPages[index - 1]) ||
            name !== `continuation_${hash(entry.sourceName).slice(0, 24)}_${index + 1}`) return corrupt();
        chunks.add(name);
        const field = fields.get(name);
        if (!(field instanceof PDFTextField) || !field.isMultiline() || field.isReadOnly() ||
            JSON.stringify(fieldPages(doc, field)) !== JSON.stringify([page]) || field.acroField.getWidgets().length !== 1) return corrupt();
        const rectangle = field.acroField.getWidgets()[0].getRectangle();
        if (Math.abs(rectangle.x - BOX.x) > 0.01 || rectangle.width > BOX.width + 0.01 || rectangle.y < BOX.y - 0.01 ||
            rectangle.y + rectangle.height > (lowerEdge.get(page) ?? BOX.y + BOX.height) + 0.01) return corrupt();
        lowerEdge.set(page, rectangle.y);
        value += field.getText() ?? '';
      }
      if (value.length !== entry.length || hash(value) !== entry.sha256) return corrupt();
    }
    if ([...origins].some((name) => chunks.has(name)) || pages.size !== doc.getPageCount() - originalPageCount) return corrupt();
    return { originalPageCount, entries, chunks };
  } catch (error) {
    if (error instanceof FillError) throw error;
    return corrupt();
  }
}
