import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { DOMParser } from '@xmldom/xmldom';
import { FillError } from '../errors.mjs';
import { assertSafeZip } from '../zip-safety.mjs';
import { fillDocxFlow } from './docx-flow.mjs';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const FIELD_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const TEXT_PART = /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes)\.xml$/;
const ENGINE = 'docxtemplater@3.71.0';
const VISUAL_WARNING = 'Word의 실제 페이지 배치와 글꼴 대체는 확인하지 않았습니다.';

function parseXml(text) {
  try {
    return new DOMParser({
      onError: () => { throw new Error('Invalid XML'); },
    }).parseFromString(text, 'application/xml');
  } catch {
    throw new FillError('E_INPUT', 'DOCX에 올바르지 않은 XML이 있습니다.');
  }
}

function loadDocx(bytes) {
  assertSafeZip(bytes);
  try {
    const zip = new PizZip(Buffer.from(bytes));
    const types = zip.file('[Content_Types].xml')?.asText();
    const document = zip.file('word/document.xml')?.asText();
    if (!types || !document) throw new FillError('E_INPUT', 'Word DOCX 컨테이너가 아닙니다.');
    const typesXml = parseXml(types);
    const main = Array.from(typesXml.getElementsByTagNameNS('*', 'Override')).find(
      (node) => node.getAttribute('PartName') === '/word/document.xml',
    );
    if (main?.getAttribute('ContentType') !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml') {
      throw new FillError('E_UNSUPPORTED', '매크로 없는 Word DOCX 문서만 지원합니다.');
    }
    const root = parseXml(document).documentElement;
    if (root.namespaceURI !== WORD_NS || root.localName !== 'document' || root.prefix !== 'w') {
      throw new FillError('E_UNSUPPORTED', '지원하지 않는 Word XML 네임스페이스입니다.');
    }
    return zip;
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_INPUT', 'DOCX 컨테이너를 읽을 수 없습니다.');
  }
}

// Keep run boundaries transparent, but never join a field across paragraphs or line breaks.
function paragraphText(paragraph) {
  let text = '';
  function visit(node) {
    if (node !== paragraph && node.namespaceURI === WORD_NS && node.localName === 'p') return;
    // Paragraph tab stops are formatting; visible text tokens belong to a run.
    if (node.namespaceURI === WORD_NS && node.parentNode?.namespaceURI === WORD_NS && node.parentNode.localName === 'r') {
      if (node.localName === 't') { text += node.textContent; return; }
      if (node.localName === 'br' || node.localName === 'cr') { text += '\n'; return; }
      if (node.localName === 'tab') { text += '\t'; return; }
    }
    for (let child = node.firstChild; child; child = child.nextSibling) visit(child);
  }
  visit(paragraph);
  return text;
}

function paragraphs(xml) {
  return Array.from(xml.getElementsByTagNameNS(WORD_NS, 'p')).map(paragraphText);
}

function tagsInText(text) {
  const tags = [];
  const remainder = text.replace(/\{\{([\s\S]*?)\}\}/g, (_whole, name) => {
    if (!FIELD_NAME.test(name)) {
      throw new FillError('E_UNSUPPORTED', 'DOCX는 {{field_name}} 형식의 단순 이름만 지원합니다.');
    }
    tags.push(name);
    return '';
  });
  if (remainder.includes('{{') || remainder.includes('}}')) {
    throw new FillError('E_FIELDS', '닫히지 않았거나 문단을 가로지르는 DOCX 필드가 있습니다.');
  }
  return tags;
}

function collectTemplate(zip) {
  const counts = new Map();
  const parts = new Map();
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !path.endsWith('.xml')) continue;
    const xml = parseXml(entry.asText());
    const texts = paragraphs(xml);
    const names = texts.flatMap(tagsInText);
    // The templating engine also recognizes metadata and drawing text. They are deliberately
    // outside this adapter's contract, so reject their markers before invoking the engine.
    for (const element of Array.from(xml.getElementsByTagName('*'))) {
      for (let child = element.firstChild; child; child = child.nextSibling) {
        if ((child.nodeType === 3 || child.nodeType === 4) && /\{\{|\}\}/.test(child.data)) {
          if (element.namespaceURI !== WORD_NS || element.localName !== 't') {
            throw new FillError('E_UNSUPPORTED', 'DOCX 본문·머리말·꼬리말·각주 텍스트의 필드만 지원합니다.');
          }
          if (!element.parentNode || element.prefix !== 'w') {
            throw new FillError('E_UNSUPPORTED', '지원하지 않는 DOCX 필드 위치입니다.');
          }
        }
      }
    }
    if (!names.length) continue;
    if (!TEXT_PART.test(path)) throw new FillError('E_UNSUPPORTED', '지원하지 않는 DOCX 부분에 필드가 있습니다.');
    parts.set(path, texts);
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return {
    parts,
    fields: [...counts].map(([name, occurrences]) => ({ name, type: 'text', occurrences })),
  };
}

function compile(zip, parts) {
  try {
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: false,
      linebreaks: true,
      errorLogging: false,
      parser(name) {
        if (!FIELD_NAME.test(name)) throw new FillError('E_UNSUPPORTED', '지원하지 않는 DOCX 표현식입니다.');
        return { get: (scope) => Object.hasOwn(scope, name) ? scope[name] : undefined };
      },
      nullGetter: () => { throw new FillError('E_FIELDS', 'DOCX 필드에 입력값이 없습니다.'); },
    });
    for (const path of parts.keys()) {
      if (!Object.hasOwn(doc.compiled, path)) throw new FillError('E_UNSUPPORTED', '처리할 수 없는 DOCX 필드 위치입니다.');
    }
    return doc;
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError('E_FIELDS', 'DOCX 필드 구문을 처리할 수 없습니다.');
  }
}

export async function inspect(bytes, _context = {}) {
  const zip = loadDocx(bytes);
  const template = collectTemplate(zip);
  compile(zip, template.parts);
  return { format: 'docx', fields: template.fields, warnings: [], engine: ENGINE };
}

export async function fill(bytes, values, context = {}) {
  const original = loadDocx(bytes);
  const template = collectTemplate(original);
  if (!template.fields.length) throw new FillError('E_FIELDS', 'DOCX에 채울 수 있는 명시적 필드가 없습니다.');
  const data = Object.create(null);
  const fieldNames = new Set(template.fields.map((field) => field.name));
  if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).some((name) => !fieldNames.has(name))) {
    throw new FillError('E_FIELDS', 'DOCX 필드와 입력 키가 일치하지 않습니다.');
  }
  for (const { name } of template.fields) {
    const value = Object.hasOwn(values, name) ? values[name] : undefined;
    if (typeof value !== 'string' || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(value) || /[\uD800-\uDFFF]/u.test(value)) {
      throw new FillError('E_FIELDS', 'DOCX 텍스트 값이 누락되었거나 유효하지 않습니다.', { field: name });
    }
    data[name] = value.replace(/\r\n?/g, '\n');
  }
  let renderedZip;
  let layout;
  let paragraphCounts;
  if (context.overflow === 'flow') {
    renderedZip = new PizZip(Buffer.from(bytes));
    ({ layout, paragraphCounts } = fillDocxFlow(renderedZip, data, template.parts));
  } else {
    const doc = compile(new PizZip(Buffer.from(bytes)), template.parts);
    try { doc.render(data); }
    catch { throw new FillError('E_ENGINE', 'DOCX 필드 입력에 실패했습니다.'); }
    renderedZip = doc.getZip();
  }

  // Only copy the field-bearing XML parts back. This preserves all other package entries,
  // including styles, images, relationships and metadata, byte for byte when decompressed.
  for (const [path, texts] of template.parts) {
    const rendered = renderedZip.file(path)?.asText();
    if (!rendered) throw new FillError('E_PRESERVATION', 'DOCX의 원본 부분이 누락되었습니다.');
    const actual = paragraphs(parseXml(rendered));
    const expected = texts.map((text) => text.replace(/\{\{([A-Za-z][A-Za-z0-9_]{0,63})\}\}/g, (_match, name) => data[name]));
    let offset = 0;
    const exact = expected.every((text, index) => {
      const count = paragraphCounts?.get(path)?.[index] ?? 1;
      const match = actual.slice(offset, offset + count).join('\n') === text;
      offset += count;
      return match;
    });
    if (!exact || offset !== actual.length) {
      throw new FillError('E_PRESERVATION', 'DOCX 입력 결과를 원본 문단과 대조하지 못했습니다.');
    }
    original.file(path, rendered);
  }
  const result = original.generate({ type: 'uint8array', compression: 'DEFLATE' });
  const checked = await validate(result);
  return {
    bytes: result,
    checks: [...checked.checks, { name: 'field-values-reread', status: 'pass' }, { name: 'untouched-package-parts', status: 'pass' }],
    warnings: checked.warnings,
    engine: ENGINE,
    ...(layout ? { layout, visualValidation: 'not-performed' } : {}),
  };
}

export async function validate(bytes, _context = {}) {
  const zip = loadDocx(bytes);
  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry.dir && path.endsWith('.xml')) parseXml(entry.asText());
  }
  return {
    checks: [{ name: 'docx-container', status: 'pass' }, { name: 'xml-well-formed', status: 'pass' }],
    warnings: [VISUAL_WARNING],
    engine: ENGINE,
  };
}
