import { FillError } from '../errors.mjs';
import { ancestor, scanXml, spliceText, xmlEscape } from './hancom-utils.mjs';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const is = local => node => node.namespace === W && node.local === local;
const children = (node, local) => (node?.children ?? []).filter(is(local));
const descendants = node => node ? [node, ...node.children.flatMap(descendants)] : [];
const attr = (node, local) => node?.element.getAttributeNodeNS(W, local)?.value;
const val = node => attr(node, 'val');
const horizontalDirections = new Set(['lrTb', 'tb']);
const order = {
  pPr: 'pStyle keepNext keepLines pageBreakBefore framePr widowControl numPr suppressLineNumbers pBdr shd tabs suppressAutoHyphens kinsoku wordWrap overflowPunct topLinePunct autoSpaceDE autoSpaceDN bidi adjustRightInd snapToGrid spacing ind contextualSpacing mirrorIndents suppressOverlap jc textDirection textAlignment textboxTightWrap outlineLvl divId cnfStyle rPr sectPr pPrChange'.split(' '),
  trPr: 'cnfStyle divId gridBefore gridAfter wBefore wAfter cantSplit trHeight tblHeader tblCellSpacing jc hidden ins del trPrChange'.split(' '),
  tblPr: 'tblStyle tblpPr tblOverlap bidiVisual tblStyleRowBandSize tblStyleColBandSize tblW jc tblCellSpacing tblInd tblBorders shd tblLayout tblCellMar tblLook tblCaption tblDescription tblPrChange'.split(' '),
};

function fail(field, region, reason) {
  throw new FillError('E_LAYOUT', '선택한 DOCX 영역의 페이지 흐름을 안전하게 확장할 수 없습니다.', { field, region, reason });
}

function one(node, local, field, region) {
  const found = children(node, local);
  if (found.length > 1) fail(field, region, 'ambiguous-property');
  return found[0];
}

function styleReference(properties, local, field, region) {
  const reference = one(properties, local, field, region);
  if (reference && !val(reference)) fail(field, region, 'ambiguous-style');
  return val(reference);
}

function enabled(node, field, region) {
  if (!node) return false;
  return enabledValue(val(node), field, region);
}

function enabledValue(value, field, region) {
  if (value === undefined || ['1', 'true', 'on'].includes(value)) return true;
  if (['0', 'false', 'off'].includes(value)) return false;
  fail(field, region, 'ambiguous-property');
}

function integer(value, positive = false) {
  if (!/^\d+$/.test(value ?? '')) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= (positive ? 1 : 0) ? number : undefined;
}

function attributes(xml, node, updates) {
  let raw = xml.slice(node.start, node.openEnd);
  for (const [name, value] of Object.entries(updates)) {
    const [prefix, local] = name.split(':');
    const namespace = prefix === 'w' ? W : 'http://www.w3.org/XML/1998/namespace';
    const current = node.element.getAttributeNodeNS(namespace, local);
    const qualifiedName = current?.name ?? name;
    const escapedName = qualifiedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expression = new RegExp(`(\\s${escapedName}\\s*=\\s*)(["'])[^"']*\\2`);
    raw = current ? raw.replace(expression, `$1"${value}"`) : raw.replace(/(\/?>)$/, ` ${qualifiedName}="${value}"$1`);
  }
  return raw;
}

// Preserve the original property container and insert only schema-ordered local overrides.
function propertyEdit(xml, owner, kind, updates, field, region) {
  const container = one(owner, kind, field, region);
  const additions = [];
  const edits = [];
  for (const [local, attrs] of Object.entries(updates)) {
    const current = one(container, local, field, region);
    if (current) edits.push({ start: current.start, end: current.openEnd, replacement: attributes(xml, current, attrs) });
    else additions.push({ local, raw: `<w:${local}${Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join('')}/>` });
  }
  if (!container) {
    // CT_Row's sequence is tblPrEx?, trPr?, followed by cell content.
    const rowException = kind === 'trPr' ? one(owner, 'tblPrEx', field, region) : undefined;
    const position = rowException?.end ?? owner.openEnd;
    return { start: position, end: position, replacement: `<w:${kind}>${additions.map(item => item.raw).join('')}</w:${kind}>` };
  }
  if (container.selfClosing) return { start: container.start, end: container.end, replacement: xml.slice(container.start, container.openEnd).replace(/\/\s*>$/, '>') + additions.map(item => item.raw).join('') + `</${container.name}>` };
  const inserts = new Map();
  for (const addition of additions) {
    const rank = order[kind].indexOf(addition.local);
    const next = container.children.find(child => order[kind].indexOf(child.local) > rank);
    const position = next?.start ?? container.closeStart;
    inserts.set(position, (inserts.get(position) ?? '') + addition.raw);
  }
  for (const [position, replacement] of inserts) {
    const existing = edits.find(edit => edit.start === position);
    if (existing) existing.replacement = replacement + existing.replacement;
    else edits.push({ start: position, end: position, replacement });
  }
  return { start: container.start, end: container.end, replacement: spliceText(xml.slice(container.start, container.end), edits.map(edit => ({ ...edit, start: edit.start - container.start, end: edit.end - container.start }))) };
}

function stylesFor(zip) {
  const nodes = zip.file('word/styles.xml') ? scanXml(zip.file('word/styles.xml').asText()) : [];
  const all = nodes.filter(is('style'));
  const defaults = nodes.find(is('docDefaults'));
  return {
    defaults,
    chain(reference, type, field, region) {
      const found = reference ? all.filter(node => attr(node, 'styleId') === reference) : all.filter(node => attr(node, 'type') === type && enabledValue(attr(node, 'default') ?? '0', field, region));
      if (found.length > 1 || (reference && !found.length)) fail(field, region, 'ambiguous-style');
      const result = [];
      let current = found[0];
      while (current) {
        if (result.includes(current) || attr(current, 'type') !== type) fail(field, region, 'ambiguous-style');
        result.push(current);
        const base = one(current, 'basedOn', field, region);
        if (!base) break;
        if (!val(base)) fail(field, region, 'ambiguous-style');
        const next = all.filter(node => attr(node, 'styleId') === val(base));
        if (next.length !== 1) fail(field, region, 'ambiguous-style');
        current = next[0];
      }
      return result;
    },
  };
}

function risk(nodes, field, region, table = false) {
  for (const node of nodes.flatMap(descendants)) {
    if (node.namespace !== W) continue;
    if (node.local === 'fitText' || (['tcFitText', 'noWrap'].includes(node.local) && enabled(node, field, region))) fail(field, region, 'text-compression');
    if (node.local === 'textDirection' && !horizontalDirections.has(val(node))) fail(field, region, 'vertical-text');
    if (node.local === 'framePr' || (table && node.local === 'tblpPr')) fail(field, region, 'fixed-container');
  }
}

function effective(tablePr, chain, local, field, region) {
  const direct = one(tablePr, local, field, region);
  if (direct) return direct;
  for (const style of chain) {
    // The initial implementation does not infer conditional table-style activation.
    if (descendants(style).some(node => is(local)(node) && ancestor(node, is('tblStylePr')))) fail(field, region, 'ambiguous-style');
    const property = one(one(style, 'tblPr', field, region), local, field, region);
    if (property) return property;
  }
  return undefined;
}

function sectionFor(nodes, container, field, region, required = true) {
  // A paragraph's own sectPr closes the section that includes that paragraph.
  const sections = nodes.filter(node => is('sectPr')(node) && node.start > container.start && (is('body')(node.parent) || (is('pPr')(node.parent) && is('p')(node.parent.parent) && is('body')(node.parent.parent.parent))));
  const section = sections[0];
  if (!section && required) fail(field, region, 'ambiguous-section');
  return section;
}

function checkRowException(row, field, region) {
  const exception = one(row, 'tblPrEx', field, region);
  if (!exception) return;
  // Layout/width exceptions override tblPr for this row. Only appearance-only
  // exceptions have a known safe effect in this initial flow implementation.
  if (row.children[0] !== exception || exception.children.some(node => node.namespace !== W || !['shd', 'tblBorders', 'tblLook'].includes(node.local))) fail(field, region, 'unsupported-row-exception');
  risk([exception], field, region, true);
}

function fixedWidth(table, tablePr, chain, nodes, field, region) {
  const layout = effective(tablePr, chain, 'tblLayout', field, region);
  if (attr(layout, 'type') === 'fixed') return undefined;
  if (layout && attr(layout, 'type') !== 'autofit') fail(field, region, 'ambiguous-layout');
  const grid = one(table, 'tblGrid', field, region);
  if (!grid || grid.children.some(node => !is('gridCol')(node))) fail(field, region, 'ambiguous-grid');
  const widths = children(grid, 'gridCol').map(node => integer(attr(node, 'w'), true));
  if (!widths.length || widths.includes(undefined)) fail(field, region, 'ambiguous-grid');
  const total = widths.reduce((sum, width) => sum + width, 0);
  const rows = children(table, 'tr');
  if (!rows.length || table.children.some(node => !['tblPr', 'tblGrid', 'tr'].includes(node.local))) fail(field, region, 'ambiguous-grid');
  for (const row of rows) {
    checkRowException(row, field, region);
    const trPr = one(row, 'trPr', field, region);
    if (row.children.some(node => !['tblPrEx', 'trPr', 'tc'].includes(node.local)) || children(trPr, 'gridBefore').length || children(trPr, 'gridAfter').length || children(trPr, 'trPrChange').length) fail(field, region, 'ambiguous-grid');
    const rowSpacing = one(trPr, 'tblCellSpacing', field, region);
    if (rowSpacing && (attr(rowSpacing, 'type') !== 'dxa' || integer(attr(rowSpacing, 'w')) !== 0)) fail(field, region, 'unsupported-horizontal-layout');
    let column = 0;
    for (const cell of children(row, 'tc')) {
      const pr = one(cell, 'tcPr', field, region);
      if (children(pr, 'vMerge').length || children(pr, 'hMerge').length || children(pr, 'tcPrChange').length) fail(field, region, 'ambiguous-grid');
      const spanNode = one(pr, 'gridSpan', field, region);
      const span = spanNode ? integer(val(spanNode), true) : 1;
      const width = one(pr, 'tcW', field, region);
      if (!span || column + span > widths.length || attr(width, 'type') !== 'dxa' || integer(attr(width, 'w'), true) !== widths.slice(column, column + span).reduce((sum, value) => sum + value, 0)) fail(field, region, 'inconsistent-cell-width');
      column += span;
    }
    if (column !== widths.length) fail(field, region, 'ambiguous-grid');
  }
  const width = effective(tablePr, chain, 'tblW', field, region);
  if (width && !((attr(width, 'type') === 'auto' && attr(width, 'w') === '0') || (attr(width, 'type') === 'dxa' && integer(attr(width, 'w'), true) === total))) fail(field, region, 'inconsistent-table-width');
  const alignment = effective(tablePr, chain, 'jc', field, region);
  const indent = effective(tablePr, chain, 'tblInd', field, region);
  const spacing = effective(tablePr, chain, 'tblCellSpacing', field, region);
  const bidi = effective(tablePr, chain, 'bidiVisual', field, region);
  if ((alignment && !['left', 'start'].includes(val(alignment))) || (indent && (attr(indent, 'type') !== 'dxa' || integer(attr(indent, 'w')) === undefined)) || (spacing && (attr(spacing, 'type') !== 'dxa' || integer(attr(spacing, 'w')) !== 0)) || enabled(bidi, field, region)) fail(field, region, 'unsupported-horizontal-layout');
  const section = sectionFor(nodes, table, field, region);
  const size = one(section, 'pgSz', field, region);
  const margins = one(section, 'pgMar', field, region);
  const columns = one(section, 'cols', field, region);
  const pageWidth = integer(attr(size, 'w'), true);
  const left = integer(attr(margins, 'left'));
  const right = integer(attr(margins, 'right'));
  if (pageWidth === undefined || left === undefined || right === undefined || (columns && ((attr(columns, 'num') !== undefined && attr(columns, 'num') !== '1') || children(columns, 'col').length > 0)) || enabled(one(section, 'bidi', field, region), field, region) || children(section, 'textDirection').some(node => !horizontalDirections.has(val(node))) || integer(attr(margins, 'gutter') ?? '0') !== 0) fail(field, region, 'ambiguous-section');
  if (total + Number(attr(indent, 'w') ?? 0) > pageWidth - left - right) fail(field, region, 'table-outside-body');
  return total;
}

function paragraphModel(paragraph) {
  const runs = [];
  let text = '';
  for (const node of descendants(paragraph)) {
    // Do not read pPr/tabs/tab (a tab stop) as a visible run tab.
    if (ancestor(node, is('p')) !== paragraph || !is('r')(node.parent)) continue;
    if (is('t')(node)) {
      const start = text.length;
      text += node.element.textContent;
      runs.push({ node, start, end: text.length });
    } else if (is('br')(node) || is('cr')(node)) text += '\n';
    else if (is('tab')(node)) text += '\t';
  }
  return { paragraph, text, runs };
}

function expandedParagraph(xml, paragraph, textEdits, styleNodes, field, region) {
  const unsafe = new Set(['numPr', 'outlineLvl', 'sectPr', 'framePr', 'pPrChange', 'rPrChange', 'ins', 'del', 'moveFrom', 'moveTo']);
  if ([...styleNodes, paragraph].flatMap(descendants).some(node => node.namespace === W && (unsafe.has(node.local) || (node.local === 'style' && /^Heading\d/i.test(attr(node, 'styleId') ?? '')) || (node.local === 'name' && /^heading\s*\d/i.test(val(node) ?? ''))))) fail(field, region, 'unsupported-paragraph-expansion');
  if (paragraph.children.some(node => node.namespace !== W || !['pPr', 'r'].includes(node.local))) fail(field, region, 'unsupported-paragraph-expansion');
  const paragraphParts = [[]];
  for (const run of children(paragraph, 'r')) {
    if (run.children.some(node => node.namespace !== W || !['rPr', 't', 'br', 'cr', 'tab', 'lastRenderedPageBreak'].includes(node.local))) fail(field, region, 'unsupported-paragraph-expansion');
    const runProperties = one(run, 'rPr', field, region);
    const runOpen = xml.slice(run.start, run.openEnd).replace(/\/\s*>$/, '>');
    const segments = [''];
    const append = text => { segments[segments.length - 1] += text; };
    for (const node of run.children) {
      if (['rPr', 'lastRenderedPageBreak'].includes(node.local)) continue;
      const changes = textEdits.get(node);
      if (!changes) { append(xml.slice(node.start, node.end)); continue; }
      const opening = attributes(xml, node, { 'xml:space': 'preserve' }).replace(/\/\s*>$/, '>');
      const addText = value => append(opening + xmlEscape(value).replaceAll('\t', `</${node.name}><w:tab/>${opening}`) + `</${node.name}>`);
      let offset = 0;
      for (const change of [...changes].sort((a, b) => a.start - b.start)) {
        addText(node.element.textContent.slice(offset, change.start));
        const lines = change.replacement.split('\n');
        for (let index = 0; index < lines.length; index++) {
          if (index) segments.push('');
          addText(lines[index]);
        }
        offset = change.end;
      }
      addText(node.element.textContent.slice(offset));
    }
    for (let index = 0; index < segments.length; index++) {
      if (index) paragraphParts.push([]);
      paragraphParts.at(-1).push(runOpen + (runProperties ? xml.slice(runProperties.start, runProperties.end) : '') + segments[index] + `</${run.name}>`);
    }
  }
  const firstProperties = propertyEdit(xml, paragraph, 'pPr', { keepNext: { 'w:val': '0' }, keepLines: { 'w:val': '0' } }, field, region).replacement;
  const laterProperties = propertyEdit(xml, paragraph, 'pPr', { keepNext: { 'w:val': '0' }, keepLines: { 'w:val': '0' }, pageBreakBefore: { 'w:val': '0' } }, field, region).replacement;
  const firstOpen = xml.slice(paragraph.start, paragraph.openEnd);
  let laterOpen = firstOpen;
  for (const attribute of Array.from(paragraph.element.attributes)) {
    if (attribute.namespaceURI === 'http://schemas.microsoft.com/office/word/2010/wordml' && ['paraId', 'textId'].includes(attribute.localName)) {
      const escaped = attribute.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      laterOpen = laterOpen.replace(new RegExp(`\\s${escaped}\\s*=\\s*(["'])[^"']*\\1`), '');
    }
  }
  return { count: paragraphParts.length, xml: paragraphParts.map((runs, index) => (index ? laterOpen : firstOpen) + (index ? laterProperties : firstProperties) + runs.join('') + `</${paragraph.name}>`).join('') };
}

export function fillDocxFlow(zip, values, parts) {
  const styles = stylesFor(zip);
  const changedContainers = [];
  const paragraphCounts = new Map();
  for (const path of parts.keys()) {
    const xml = zip.file(path).asText();
    const nodes = scanXml(xml);
    const edits = [];
    const properties = new Map();
    const textEdits = new Map();
    const expansions = new Map();
    const setProperties = (owner, kind, update, field, region) => {
      const previous = properties.get(owner) ?? { kind, update: {}, field, region };
      Object.assign(previous.update, update);
      properties.set(owner, previous);
    };
    for (const group of nodes.filter(is('p')).map(paragraphModel)) {
      const matches = [...group.text.matchAll(/\{\{([A-Za-z][A-Za-z0-9_]{0,63})\}\}/g)];
      for (const match of matches) {
        const field = match[1];
        const paragraph = group.paragraph;
        const cell = ancestor(paragraph, is('tc'));
        const table = ancestor(paragraph, is('tbl'));
        const region = cell ? 'table-cell' : 'body';
        if (path !== 'word/document.xml' || !ancestor(paragraph, is('body')) || (table ? table.parent?.local !== 'body' || !cell || paragraph.parent !== cell : paragraph.parent?.local !== 'body')) fail(field, region, 'fixed-container');
        if (table && (ancestor(table, is('tbl')) || descendants(cell).some(node => is('tbl')(node)))) fail(field, region, 'nested-table');
        const pPr = one(paragraph, 'pPr', field, region);
        const pChain = styles.chain(styleReference(pPr, 'pStyle', field, region), 'paragraph', field, region);
        risk([styles.defaults, pPr, ...pChain].filter(Boolean), field, region);
        if (values[field].includes('\n')) expansions.set(paragraph, { field, region, styleNodes: [pPr, styles.defaults, ...pChain].filter(Boolean) });
        const section = sectionFor(nodes, table ?? paragraph, field, region, false);
        const sectionDirection = one(section, 'textDirection', field, region);
        if (sectionDirection && !horizontalDirections.has(val(sectionDirection))) fail(field, region, 'vertical-text');
        const selected = group.runs.filter(run => run.end > match.index && run.start < match.index + match[0].length);
        if (!selected.length) fail(field, region, 'ambiguous-field');
        for (const selectedRun of selected) {
          const run = ancestor(selectedRun.node, is('r'));
          if (!run || ancestor(run, is('p')) !== paragraph) fail(field, region, 'ambiguous-field');
          const rPr = one(run, 'rPr', field, region);
          const rChain = styles.chain(styleReference(rPr, 'rStyle', field, region), 'character', field, region);
          risk([rPr, ...rChain].filter(Boolean), field, region);
          const list = textEdits.get(selectedRun.node) ?? [];
          list.push({ start: Math.max(match.index - selectedRun.start, 0), end: Math.min(match.index + match[0].length - selectedRun.start, selectedRun.end - selectedRun.start), replacement: selectedRun === selected[0] ? values[field] : '' });
          textEdits.set(selectedRun.node, list);
        }
        const changes = ['allow-paragraph-split'];
        setProperties(paragraph, 'pPr', { keepNext: { 'w:val': '0' }, keepLines: { 'w:val': '0' } }, field, region);
        if (table) {
          const tablePr = one(table, 'tblPr', field, region);
          const cellPr = one(cell, 'tcPr', field, region);
          const row = ancestor(cell, is('tr'));
          const rowPr = one(row, 'trPr', field, region);
          checkRowException(row, field, region);
          const tableChain = styles.chain(styleReference(tablePr, 'tblStyle', field, region), 'table', field, region);
          expansions.get(paragraph)?.styleNodes.push(...tableChain);
          risk([tablePr, cellPr, ...tableChain].filter(Boolean), field, region, true);
          if (tableChain.some(style => descendants(style).some(node => (node.local === 'trHeight' && attr(node, 'hRule') === 'exact') || (node.local === 'tblCellSpacing' && (attr(node, 'type') !== 'dxa' || integer(attr(node, 'w')) !== 0))))) fail(field, region, 'ambiguous-style');
          if (children(cellPr, 'vMerge').length || children(cellPr, 'hMerge').length) fail(field, region, 'merged-cell');
          if (descendants(tablePr).some(node => node.local.endsWith('PrChange')) || descendants(cellPr).some(node => node.local.endsWith('PrChange')) || descendants(rowPr).some(node => node.local.endsWith('PrChange'))) fail(field, region, 'ambiguous-property');
          const total = fixedWidth(table, tablePr, tableChain, nodes, field, region);
          if (total !== undefined) {
            setProperties(table, 'tblPr', { tblW: { 'w:w': String(total), 'w:type': 'dxa' }, tblLayout: { 'w:type': 'fixed' } }, field, region);
            changes.push('fix-declared-grid-width');
          }
          const height = one(rowPr, 'trHeight', field, region);
          const update = { cantSplit: { 'w:val': '0' } };
          if (attr(height, 'hRule') === 'exact') { update.trHeight = { 'w:hRule': 'atLeast' }; changes.push('minimum-row-height'); }
          setProperties(row, 'trPr', update, field, region);
          changes.push('allow-row-split');
        }
        changedContainers.push({ field, region, changes });
      }
    }
    const counts = nodes.filter(is('p')).map(paragraph => {
      const expansion = expansions.get(paragraph);
      if (!expansion) return 1;
      const expanded = expandedParagraph(xml, paragraph, textEdits, expansion.styleNodes, expansion.field, expansion.region);
      edits.push({ start: paragraph.start, end: paragraph.end, replacement: expanded.xml });
      return expanded.count;
    });
    paragraphCounts.set(path, counts);
    for (const [owner, { kind, update, field, region }] of properties) if (!expansions.has(owner)) edits.push(propertyEdit(xml, owner, kind, update, field, region));
    for (const [node, replacements] of textEdits) {
      if (expansions.has(ancestor(node, is('p')))) continue;
      const text = xmlEscape(spliceText(node.element.textContent, replacements));
      const opening = attributes(xml, node, { 'xml:space': 'preserve' }).replace(/\/\s*>$/, '>');
      edits.push({ start: node.start, end: node.end, replacement: opening + text.replaceAll('\n', `</${node.name}><w:br/>${opening}`).replaceAll('\t', `</${node.name}><w:tab/>${opening}`) + `</${node.name}>` });
    }
    zip.file(path, spliceText(xml, edits));
  }
  return { layout: { policy: 'flow', strategy: 'native', changedContainers, pagination: { status: 'not-performed' } }, paragraphCounts };
}
