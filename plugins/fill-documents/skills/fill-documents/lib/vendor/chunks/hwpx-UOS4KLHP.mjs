import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);
import {
  checkValues,
  isPlainObject,
  normalizeFields
} from "./chunk-ORHQCEZZ.mjs";
import {
  openHancom,
  validateHwpx
} from "./chunk-JYYDJ5XF.mjs";
import "./chunk-7E4DDKWS.mjs";
import {
  assertSafeZip,
  require_js
} from "./chunk-IT3RRXA3.mjs";
import {
  ancestor,
  checkedValues,
  fieldList,
  placeholders,
  scanXml,
  spliceText,
  visualWarning,
  xmlEscape
} from "./chunk-4D6IQWXV.mjs";
import "./chunk-THFP5JW5.mjs";
import {
  FillError,
  requireCondition
} from "./chunk-Q2WAVGBC.mjs";
import {
  __toESM
} from "./chunk-WNYIIIUP.mjs";

// lib/adapters/hwpx.mjs
var import_pizzip = __toESM(require_js(), 1);

// lib/adapters/hwpx-flow.mjs
var HP = "http://www.hancom.co.kr/hwpml/2011/paragraph";
var HH = "http://www.hancom.co.kr/hwpml/2011/head";
var HS = "http://www.hancom.co.kr/hwpml/2011/section";
var is = (local) => (node) => node.namespace === HP && node.local === local;
var anchorPattern = { flowWithText: "1", allowOverlap: "0", holdAnchorAndSO: "0", vertRelTo: "PARA", horzRelTo: "COLUMN", vertAlign: "TOP", horzAlign: "LEFT", vertOffset: "0", horzOffset: "0" };
function fail(field, region, reason) {
  throw new FillError("E_LAYOUT", "\uC120\uD0DD\uD55C HWPX \uC601\uC5ED\uC758 \uD398\uC774\uC9C0 \uD750\uB984\uC744 \uC548\uC804\uD558\uAC8C \uD655\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { field, region, reason });
}
function only(node, local, field, region) {
  const found = (node?.children ?? []).filter(is(local));
  if (found.length !== 1) fail(field, region, "ambiguous-property");
  return found[0];
}
function opening(xml, node, changes) {
  let value = xml.slice(node.start, node.openEnd);
  for (const [name, replacement] of Object.entries(changes)) {
    const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(["'])[^"']*\\2`);
    requireCondition(pattern.test(value), "E_PRESERVATION", "HWPX \uD750\uB984 \uC18D\uC131\uC758 \uC6D0\uB798 \uC704\uCE58\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    value = value.replace(pattern, `$1"${replacement}"`);
  }
  return value;
}
function createParagraphFlowPlan(zip) {
  const xml = zip.file("Contents/header.xml")?.asText();
  requireCondition(xml, "E_LAYOUT", "HWPX \uBB38\uB2E8 \uC18D\uC131\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { region: "body", reason: "ambiguous-style" });
  const nodes = scanXml(xml);
  const containers = nodes.filter((node) => node.namespace === HH && node.local === "paraProperties");
  requireCondition(containers.length === 1, "E_LAYOUT", "HWPX \uBB38\uB2E8 \uC18D\uC131 \uC815\uC758\uAC00 \uBA85\uD655\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", { region: "body", reason: "ambiguous-style" });
  const container = containers[0];
  const styles = container.children.filter((node) => node.namespace === HH && node.local === "paraPr");
  const ids = styles.map((node) => node.attrs.id);
  requireCondition(ids.every((id) => /^\d+$/.test(id)) && new Set(ids).size === ids.length && Number(container.attrs.itemCnt) === styles.length, "E_LAYOUT", "HWPX \uBB38\uB2E8 \uC18D\uC131 ID\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { region: "body", reason: "ambiguous-style" });
  const copies = /* @__PURE__ */ new Map();
  let next = Math.max(...ids.map(Number)) + 1;
  return {
    paragraph(paragraph, field, region, source, edits) {
      const style = styles.find((node) => node.attrs.id === paragraph.attrs.paraPrIDRef);
      if (!style) fail(field, region, "ambiguous-style");
      const settings = style.children.filter((node) => node.namespace === HH && node.local === "breakSetting");
      if (settings.length !== 1) fail(field, region, "ambiguous-style");
      const setting = settings[0];
      if (!["0", "1"].includes(setting.attrs.keepLines) || !["0", "1"].includes(setting.attrs.keepWithNext)) fail(field, region, "ambiguous-style");
      if (setting.attrs.lineWrap !== "BREAK" || style.attrs.textDir !== void 0 && !["AUTO", "HORIZONTAL"].includes(style.attrs.textDir)) fail(field, region, "vertical-text");
      if (setting.attrs.keepLines === "0" && setting.attrs.keepWithNext === "0") return false;
      let copy = copies.get(style.attrs.id);
      if (!copy) {
        if (!Number.isSafeInteger(next)) fail(field, region, "ambiguous-style");
        const id = String(next++);
        const patched = spliceText(xml.slice(style.start, style.end), [
          { start: 0, end: style.openEnd - style.start, replacement: opening(xml, style, { id }) },
          { start: setting.start - style.start, end: setting.openEnd - style.start, replacement: opening(xml, setting, { keepLines: "0", keepWithNext: "0" }) }
        ]);
        copy = { id, xml: patched };
        copies.set(style.attrs.id, copy);
      }
      edits.push({ start: paragraph.start, end: paragraph.openEnd, replacement: opening(source, paragraph, { paraPrIDRef: copy.id }) });
      return true;
    },
    finish() {
      if (!copies.size) return void 0;
      return spliceText(xml, [
        { start: container.start, end: container.openEnd, replacement: opening(xml, container, { itemCnt: String(styles.length + copies.size) }) },
        { start: container.closeStart, end: container.closeStart, replacement: [...copies.values()].map((copy) => copy.xml).join("") }
      ]);
    }
  };
}
function planHwpxFlow(zip, models, header = createParagraphFlowPlan(zip)) {
  const changedContainers = [];
  const partEdits = /* @__PURE__ */ new Map();
  for (const part of models) {
    const edits = [];
    const changedTables = /* @__PURE__ */ new Set();
    const changedParagraphs = /* @__PURE__ */ new Set();
    const cacheParagraphs = /* @__PURE__ */ new Set();
    for (const field of part.occurrences) {
      const paragraph = field.group.paragraph;
      const cell = ancestor(paragraph, is("tc"));
      const table = ancestor(paragraph, is("tbl"));
      const region = cell ? "table-cell" : "body";
      const changes = ["refresh-line-layout"];
      if (table) {
        if (!cell || ancestor(table, is("tbl")) || part.nodes.some((node) => is("tbl")(node) && ancestor(node, is("tc")) === cell)) fail(field.name, region, "nested-table");
        const list = only(cell, "subList", field.name, region);
        const span = only(cell, "cellSpan", field.name, region);
        if (paragraph.parent !== list || span.attrs.rowSpan !== "1") fail(field.name, region, "merged-cell");
        if (list.attrs.textDirection !== "HORIZONTAL" || list.attrs.lineWrap !== "BREAK") fail(field.name, region, "vertical-text");
        if (cell.attrs.protect !== "0") fail(field.name, region, "fixed-container");
        const size = only(table, "sz", field.name, region);
        const position = only(table, "pos", field.name, region);
        if (table.attrs.textWrap !== "TOP_AND_BOTTOM" || table.attrs.pageBreak !== "CELL" || table.attrs.noAdjust !== "0" || size.attrs.widthRelTo !== "ABSOLUTE" || size.attrs.heightRelTo !== "ABSOLUTE" || size.attrs.protect !== "0") fail(field.name, region, "fixed-container");
        if (!Object.entries(anchorPattern).every(([name, expected]) => position.attrs[name] === expected) || !["0", "1"].includes(position.attrs.treatAsChar)) fail(field.name, region, "unsupported-anchor");
        const anchor = ancestor(table, is("p"));
        if (!anchor || anchor.parent?.namespace !== HS || anchor.parent?.local !== "sec") fail(field.name, region, "unsupported-anchor");
        if (!changedTables.has(table)) {
          if (position.attrs.treatAsChar === "1") edits.push({ start: position.start, end: position.openEnd, replacement: opening(part.xml, position, { treatAsChar: "0" }) });
          cacheParagraphs.add(anchor);
          changedTables.add(table);
        }
        changes.push(position.attrs.treatAsChar === "1" ? "inline-table-to-flow" : "existing-flow-table");
      } else if (paragraph.parent?.namespace !== HS || paragraph.parent?.local !== "sec") fail(field.name, region, "fixed-container");
      const sections = part.nodes.filter(is("secPr"));
      if (sections.some((section) => section.attrs.textDirection !== "HORIZONTAL")) fail(field.name, region, "vertical-text");
      if (!changedParagraphs.has(paragraph)) {
        if (header.paragraph(paragraph, field.name, region, part.xml, edits)) changes.push("clone-paragraph-flow-style");
        changedParagraphs.add(paragraph);
      }
      changedContainers.push({ field: field.name, region, changes });
    }
    for (const node of part.nodes.filter(is("linesegarray"))) {
      const paragraph = ancestor(node, is("p"));
      if (cacheParagraphs.has(paragraph) && !changedParagraphs.has(paragraph)) edits.push({ start: node.start, end: node.end, replacement: "" });
    }
    partEdits.set(part.path, edits);
  }
  return { partEdits, headerXml: header.finish(), layout: { policy: "flow", strategy: "native", changedContainers, pagination: { status: "not-performed" } } };
}
function checkHwpxFlowReferences(zip, models) {
  const nodes = scanXml(zip.file("Contents/header.xml").asText());
  const ids = nodes.filter((node) => node.namespace === HH && node.local === "paraPr").map((node) => node.attrs.id);
  requireCondition(new Set(ids).size === ids.length, "E_PRESERVATION", "HWPX \uBB38\uB2E8 \uC18D\uC131 ID\uAC00 \uC911\uBCF5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  for (const part of models) {
    for (const paragraph of scanXml(part.xml).filter(is("p"))) requireCondition(ids.includes(paragraph.attrs.paraPrIDRef), "E_PRESERVATION", "HWPX \uBB38\uB2E8 \uC18D\uC131 \uCC38\uC870\uAC00 \uB04A\uC5B4\uC84C\uC2B5\uB2C8\uB2E4.");
  }
}

// lib/adapters/hwpx-repeat.mjs
import { createHash } from "node:crypto";
var HP2 = "http://www.hancom.co.kr/hwpml/2011/paragraph";
var HH2 = "http://www.hancom.co.kr/hwpml/2011/head";
var HS2 = "http://www.hancom.co.kr/hwpml/2011/section";
var is2 = (name) => (node) => node?.namespace === HP2 && node.local === name;
var kids = (node, name) => (node?.children ?? []).filter(is2(name));
var below = (node) => [node, ...node.children.flatMap(below)];
var integer = (value) => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? Number(value) : void 0;
var fail2 = (field, reason, recordIndex) => {
  throw new FillError("E_LAYOUT", "HWPX \uBC18\uBCF5 \uC601\uC5ED\uC744 \uC6D0\uB798 \uC11C\uC2DD\uC73C\uB85C \uC548\uC804\uD558\uAC8C \uD655\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { field, region: "table-rows", ...recordIndex === void 0 ? {} : { recordIndex }, reason });
};
var exactKeys = (value, names) => isPlainObject(value) && Object.keys(value).every((key) => names.includes(key)) && names.every((key) => Object.hasOwn(value, key));
var only2 = (node, name, field) => {
  const list = kids(node, name);
  if (list.length !== 1) fail2(field, "unsupported-row-shape");
  return list[0];
};
var raw = (xml, node) => xml.slice(node.start, node.end);
function setOpening(xml, node, updates) {
  let source = xml.slice(node.start, node.openEnd);
  for (const [key, value] of Object.entries(updates)) {
    const pattern = new RegExp(`(\\s${key}\\s*=\\s*)(["'])[^"']*\\2`);
    source = pattern.test(source) ? source.replace(pattern, `$1"${value}"`) : source.replace(/(\/?>)$/, ` ${key}="${value}"$1`);
  }
  return { start: node.start, end: node.openEnd, replacement: source };
}
function signature(node, skipBottom = false) {
  return JSON.stringify([node.namespace, node.local, Object.entries(node.attrs).filter(([key]) => key !== "id").sort(), node.children.filter((child) => !skipBottom || child.local !== "bottomBorder").map((child) => signature(child))]);
}
function inspectHwpxRepeat(bytes, zip, models, context) {
  const profile = context.layoutProfile;
  requireCondition(exactKeys(profile, ["version", "format", "templateSha256", "repeatRegions"]) && profile.version === 1 && profile.format === "hwpx" && /^[a-f0-9]{64}$/.test(profile.templateSha256), "E_INPUT", "HWPX \uBC18\uBCF5 \uD504\uB85C\uD544\uC758 \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  requireCondition(createHash("sha256").update(bytes).digest("hex") === profile.templateSha256, "E_TEMPLATE_CHANGED", "\uD504\uB85C\uD544\uC758 \uC6D0\uBCF8 \uD574\uC2DC\uC640 \uD604\uC7AC \uBB38\uC11C\uAC00 \uB2E4\uB985\uB2C8\uB2E4.");
  requireCondition(!context.manifest, "E_UNSUPPORTED", "HWPX \uBC18\uBCF5 \uD589\uC740 \uD30C\uC77C \uACBD\uB85C\uC640 \uD504\uB85C\uD544\uC744 \uC0AC\uC6A9\uD558\uC138\uC694.");
  requireCondition(Array.isArray(profile.repeatRegions) && profile.repeatRegions.length === 1, "E_INPUT", "HWPX \uBC18\uBCF5 \uC601\uC5ED\uC740 \uC815\uD655\uD788 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  let region = profile.repeatRegions[0];
  requireCondition(exactKeys(region, ["name", "part", "tableId", "headerRows", "bodyRows", "prototypeRow", "insertBeforeRow", "maxRows", "columns"]) && exactKeys(region.bodyRows, ["start", "end"]), "E_INPUT", "HWPX \uBC18\uBCF5 \uC601\uC5ED \uC124\uC815\uC5D0 \uB204\uB77D\uB418\uAC70\uB098 \uC54C \uC218 \uC5C6\uB294 \uD0A4\uAC00 \uC788\uC2B5\uB2C8\uB2E4.");
  requireCondition(typeof region.part === "string" && /^Contents\/section\d+\.xml$/.test(region.part) && typeof region.tableId === "string" && region.tableId.length > 0 && Array.isArray(region.columns) && region.columns.every((column) => exactKeys(column, ["name", "column", "maxLength"])), "E_INPUT", "HWPX \uBC18\uBCF5 \uC601\uC5ED\uC758 \uC704\uCE58\uC640 \uC5F4\uC744 \uD655\uC778\uD558\uC138\uC694.");
  region = { ...region, columns: [...region.columns].sort((a, b) => a.column - b.column) };
  const [field] = normalizeFields([{ name: region.name, type: "rows", occurrences: 1, maxRows: region.maxRows, columns: region.columns.map((column) => ({ name: column.name, type: "text", occurrences: 1, maxLength: column.maxLength })) }]);
  const part = models.find((item) => item.path === region.part);
  if (!part) fail2(region.name, "missing-table");
  const tables = part.nodes.filter((node) => is2("tbl")(node) && node.attrs.id === region.tableId);
  if (tables.length !== 1) fail2(region.name, "ambiguous-table");
  const table = tables[0];
  const rows = kids(table, "tr");
  const columns = integer(table.attrs.colCnt);
  const { start, end } = region.bodyRows;
  if (![start, end, region.prototypeRow, region.insertBeforeRow].every(Number.isInteger) || start < 1 || end >= rows.length || end - start < 2 || !(start < region.prototypeRow && region.prototypeRow < end) || region.insertBeforeRow !== end || !Array.isArray(region.headerRows) || region.headerRows.length !== start || region.headerRows.some((value, index) => value !== index) || integer(table.attrs.rowCnt) !== rows.length || columns !== region.columns.length || region.columns.some((column, index) => column.column !== index)) fail2(region.name, "invalid-row-range");
  const anchor = ancestor(table, is2("p"));
  if (!anchor || anchor.parent?.namespace !== HS2 || anchor.parent?.local !== "sec" || ancestor(table, is2("tbl")) || below(table).some((node) => node !== table && is2("tbl")(node))) fail2(region.name, "unsupported-anchor");
  if (part.nodes.filter(is2("secPr")).some((node) => node.attrs.textDirection !== "HORIZONTAL")) fail2(region.name, "vertical-text");
  const position = only2(table, "pos", region.name);
  const size = only2(table, "sz", region.name);
  const pattern = { flowWithText: "1", allowOverlap: "0", holdAnchorAndSO: "0", vertRelTo: "PARA", horzRelTo: "COLUMN", vertAlign: "TOP", horzAlign: "LEFT", vertOffset: "0", horzOffset: "0" };
  if (table.attrs.textWrap !== "TOP_AND_BOTTOM" || table.attrs.pageBreak !== "CELL" || table.attrs.noAdjust !== "0" || !["0", "1"].includes(position.attrs.treatAsChar) || !Object.entries(pattern).every(([key, value]) => position.attrs[key] === value) || size.attrs.widthRelTo !== "ABSOLUTE" || size.attrs.heightRelTo !== "ABSOLUTE" || size.attrs.protect !== "0") fail2(region.name, "unsupported-anchor");
  const headerNodes = scanXml(zip.file("Contents/header.xml").asText());
  const definitions = (kind, id) => headerNodes.filter((node) => node.namespace === HH2 && node.local === kind && node.attrs.id === id);
  const cellInfo = [];
  const heights = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cells = kids(rows[rowIndex], "tc");
    if (cells.length !== rows[rowIndex].children.length) fail2(region.name, "unsupported-row-shape");
    let width = 0;
    let column = 0;
    let height = 0;
    const info = [];
    for (const cell of cells) {
      if (cell.children.some((node) => node.namespace !== HP2 || !["subList", "cellAddr", "cellSpan", "cellSz", "cellMargin"].includes(node.local))) fail2(region.name, "unsupported-row-shape");
      const address = only2(cell, "cellAddr", region.name);
      const span = only2(cell, "cellSpan", region.name);
      const dimensions = only2(cell, "cellSz", region.name);
      if (integer(address.attrs.rowAddr) !== rowIndex || integer(address.attrs.colAddr) !== column || span.attrs.rowSpan !== "1" || !integer(span.attrs.colSpan) || !integer(dimensions.attrs.width) || !integer(dimensions.attrs.height)) fail2(region.name, "unsupported-row-shape");
      width += Number(dimensions.attrs.width);
      column += Number(span.attrs.colSpan);
      height = Math.max(height, Number(dimensions.attrs.height));
      if (definitions("borderFill", cell.attrs.borderFillIDRef).length !== 1) fail2(region.name, "ambiguous-style");
      const list = only2(cell, "subList", region.name);
      if (cell.attrs.protect !== "0" || list.attrs.textDirection !== "HORIZONTAL" || list.attrs.lineWrap !== "BREAK" || ["linkListIDRef", "linkListNextIDRef", "hasTextRef", "hasNumRef"].some((key) => list.attrs[key] !== "0")) fail2(region.name, "unsupported-row-shape");
      if (rowIndex >= start && rowIndex <= end) {
        const paragraph = only2(list, "p", region.name);
        const run = only2(paragraph, "run", region.name);
        const texts = kids(run, "t");
        const text = texts[0];
        if (span.attrs.colSpan !== "1" || list.children.length !== 1 || paragraph.children.some((node) => node.namespace !== HP2 || !["run", "linesegarray"].includes(node.local)) || texts.length > 1 || run.children.length !== texts.length || text?.children.length || below(cell).some((node) => ["ctrl", "tbl", "pic", "fieldBegin", "fieldEnd"].includes(node.local))) fail2(region.name, "unsupported-row-shape");
        if (definitions("paraPr", paragraph.attrs.paraPrIDRef).length !== 1 || definitions("charPr", run.attrs.charPrIDRef).length !== 1) fail2(region.name, "ambiguous-style");
        const value = text?.element.textContent ?? "";
        if (value !== (rowIndex === start ? `{{${region.columns[info.length].name}}}` : "")) fail2(region.name, "nonempty-repeat-row");
        info.push({ cell, address, dimensions, paragraph, run, text });
      }
    }
    if (width !== integer(size.attrs.width) || column !== columns) fail2(region.name, "inconsistent-column-width");
    heights.push(height);
    cellInfo.push(info);
  }
  if (heights.reduce((sum, height) => sum + height, 0) !== integer(size.attrs.height)) fail2(region.name, "inconsistent-table-height");
  const isBodyField = (model2, item) => model2 === part && rows.slice(start, end + 1).includes(ancestor(item.group.paragraph, is2("tr")));
  const outsideModels = models.map((model2) => ({ ...model2, groups: model2.groups.map((group) => ({ ...group, fields: group.fields.filter((item) => !isBodyField(model2, item)) })), occurrences: model2.occurrences.filter((item) => !isBodyField(model2, item)) }));
  if (outsideModels.flatMap((model2) => model2.occurrences).some((item) => item.name === field.name) || part.groups.find((group) => group.paragraph === anchor)?.fields.length) fail2(region.name, "ambiguous-field");
  return { field, region, part, table, rows, size, position, anchor, cellInfo, heights, outsideModels, definitions };
}
function checkedRepeatValues(values, fields, context) {
  const normalized = checkValues(values, normalizeFields(fields));
  for (const field of fields) {
    if (field.type === "rows") for (const row of normalized[field.name]) checkedValues(field.columns, row, {});
    else checkedValues([field], { [field.name]: normalized[field.name] }, context);
  }
  return normalized;
}
function planHwpxRepeat(plan, records, paragraphPlan, scalarEdits = []) {
  const { region, part, table, rows, position, size, anchor, cellInfo, heights } = plan;
  const { start, end } = region.bodyRows;
  const count = records.length;
  const selected = count === 1 ? [start] : [start, ...Array.from({ length: count - 2 }, (_, index) => start + index + 1 < end ? start + index + 1 : region.prototypeRow), end];
  const used = new Set(selected);
  const pieces = [];
  let totalHeight = 0;
  let outputRow = 0;
  const emit = (sourceIndex, recordIndex) => {
    const row = rows[sourceIndex];
    const changes2 = [];
    if (recordIndex === void 0) {
      changes2.push(...scalarEdits.filter((edit) => edit.start >= row.start && edit.end <= row.end));
      for (const group of part.groups.filter((group2) => ancestor(group2.paragraph, is2("tr")) === row && group2.fields.length)) paragraphPlan.paragraph(group.paragraph, region.name, "table-rows", part.xml, changes2);
    }
    totalHeight += heights[sourceIndex];
    for (const cell of kids(row, "tc")) {
      const address = only2(cell, "cellAddr", region.name);
      changes2.push(setOpening(part.xml, address, { rowAddr: String(outputRow) }));
      if (sourceIndex < start) changes2.push(setOpening(part.xml, cell, { header: "1" }));
    }
    if (recordIndex !== void 0) for (let column = 0; column < region.columns.length; column++) {
      const info = cellInfo[sourceIndex][column];
      const value = records[recordIndex][region.columns[column].name].replace(/\r\n?/g, "\n");
      const prefix = info.run.name.includes(":") ? info.run.name.split(":")[0] + ":" : "";
      const text = xmlEscape(value).replaceAll("\n", `<${prefix}lineBreak/>`).replaceAll("	", `<${prefix}tab/>`);
      if (info.text) changes2.push({ start: info.text.start, end: info.text.end, replacement: part.xml.slice(info.text.start, info.text.openEnd).replace(/\/\s*>$/, ">") + text + `</${info.text.name}>` });
      else changes2.push({ start: info.run.start, end: info.run.end, replacement: part.xml.slice(info.run.start, info.run.openEnd).replace(/\/\s*>$/, ">") + `<${prefix}t>${text}</${prefix}t></${info.run.name}>` });
      paragraphPlan.paragraph(info.paragraph, region.name, "table-rows", part.xml, changes2);
      for (const cache of kids(info.paragraph, "linesegarray")) changes2.push({ start: cache.start, end: cache.end, replacement: "" });
      if (count === 1) {
        const last = cellInfo[end][column].cell;
        const firstBorder = plan.definitions("borderFill", info.cell.attrs.borderFillIDRef)[0];
        const lastBorder = plan.definitions("borderFill", last.attrs.borderFillIDRef)[0];
        if (signature(firstBorder, true) !== signature(lastBorder, true)) fail2(region.name, "incompatible-single-row-border");
        changes2.push(setOpening(part.xml, info.cell, { borderFillIDRef: last.attrs.borderFillIDRef }));
      }
    }
    pieces.push(spliceText(raw(part.xml, row), changes2.map((change) => ({ ...change, start: change.start - row.start, end: change.end - row.start }))));
    outputRow++;
  };
  for (let index = 0; index < start; index++) emit(index);
  selected.forEach((sourceIndex, recordIndex) => emit(sourceIndex, recordIndex));
  for (let index = end + 1; index < rows.length; index++) emit(index);
  const changes = [setOpening(part.xml, table, { rowCnt: String(outputRow), pageBreak: "TABLE", repeatHeader: "1" }), setOpening(part.xml, position, { treatAsChar: "0" }), setOpening(part.xml, size, { height: String(totalHeight) }), { start: rows[0].start, end: rows.at(-1).end, replacement: pieces.join("") }];
  const tableXml = spliceText(raw(part.xml, table), changes.map((change) => ({ ...change, start: change.start - table.start, end: change.end - table.start })));
  const edits = [{ start: table.start, end: table.end, replacement: tableXml }, ...kids(anchor, "linesegarray").map((node) => ({ start: node.start, end: node.end, replacement: "" }))];
  return { edits, tableId: region.tableId, part: part.path, start, count, headerRows: region.headerRows, field: region.name, changes: { field: region.name, region: "table-rows", strategy: "repeat-original-rows", records: count, reusedRows: used.size, clonedRows: selected.length - used.size, removedRows: end - start + 1 - used.size, headerRows: region.headerRows } };
}
function tableLayoutTarget(part, table, field, rows, repeated = false, headerRows = []) {
  const anchor = ancestor(table, is2("p"));
  const anchors = part.nodes.filter((node) => is2("p")(node) && node.parent?.namespace === HS2);
  const objects = below(anchor).filter((node) => ["tbl", "pic", "ole", "equation", "container", "rect", "line", "ellipse", "arc", "polygon", "curve", "connectLine", "textart", "video"].includes(node.local) && ancestor(node, is2("p")) === anchor);
  const control = objects.indexOf(table);
  if (control < 0 || anchors.indexOf(anchor) < 0) fail2(field, "unmapped-table");
  const cells = kids(table, "tr").flatMap((row) => kids(row, "tc"));
  return { field, rows, repeated, headerRows, section: Number(part.path.match(/section(\d+)/)[1]), paragraph: anchors.indexOf(anchor), control, cells: cells.map((cell, index) => ({ index, row: Number(only2(cell, "cellAddr", field).attrs.rowAddr), col: Number(only2(cell, "cellAddr", field).attrs.colAddr), text: below(cell).filter(is2("t")).map((node) => node.element.textContent).join("") })) };
}
async function validateHwpxTableLayout(bytes, targets, context) {
  if (!targets.length) return { source: "rhwp", status: "not-performed" };
  const document = await openHancom(bytes, context);
  const rowPages = targets.map(() => /* @__PURE__ */ new Map());
  const issues = [];
  try {
    const pages = document.pageCount();
    if (!Number.isInteger(pages) || pages < 1) fail2(targets[0].field, "unavailable-row-layout");
    for (let page = 0; page < pages; page++) {
      const controls = JSON.parse(document.getPageControlLayout(page)).controls;
      const runs = JSON.parse(document.getPageTextLayout(page)).runs;
      const pageInfo = JSON.parse(document.getPageInfo(page));
      if (!Array.isArray(controls) || !Array.isArray(runs) || ![pageInfo.width, pageInfo.height].every((value) => Number.isFinite(value) && value > 0)) fail2(targets[0].field, "unavailable-row-layout");
      for (let index = 0; index < targets.length; index++) {
        const target = targets[index];
        const tables = controls.filter((item) => item.type === "table" && item.secIdx === target.section && item.paraIdx === target.paragraph && item.controlIdx === target.control);
        if (tables.length > 1) fail2(target.field, "unmapped-table");
        if (!tables.length) continue;
        const cells = tables[0].cells;
        for (const row of target.rows) if (cells.some((cell) => cell.row === row)) {
          const seen = rowPages[index].get(row) ?? /* @__PURE__ */ new Set();
          seen.add(page);
          rowPages[index].set(row, seen);
        }
        if (!target.repeated || !cells.some((cell) => target.rows.includes(cell.row))) continue;
        for (const row of target.headerRows) if (!cells.some((cell) => cell.row === row)) fail2(target.field, "missing-repeated-header");
        for (const expected of target.cells.filter((cell) => target.rows.includes(cell.row) || target.headerRows.includes(cell.row))) {
          const rectangle = cells.find((cell) => cell.row === expected.row && cell.col === expected.col);
          if (!rectangle) {
            if (cells.some((cell) => cell.row === expected.row)) issues.push({ field: target.field, reason: "missing-cell-layout" });
            continue;
          }
          const within = (item, box) => [item.x, item.y, item.w, item.h].every(Number.isFinite) && item.x >= box.x - 0.2 && item.y >= box.y - 0.2 && item.x + item.w <= box.x + box.w + 0.2 && item.y + item.h <= box.y + box.h + 0.2;
          if (!within(rectangle, { x: 0, y: 0, w: pageInfo.width, h: pageInfo.height })) issues.push({ field: target.field, reason: "table-outside-page" });
          const textRuns = runs.filter((run) => run.secIdx === target.section && run.parentParaIdx === target.paragraph && run.controlIdx === target.control && run.cellIdx === expected.index).sort((a, b) => a.cellParaIdx - b.cellParaIdx || a.charStart - b.charStart);
          if (textRuns.some((run) => run.text.trim() && !within(run, rectangle))) issues.push({ field: target.field, reason: "text-outside-cell" });
          const visible = textRuns.map((run) => run.text).join("").replace(/\s/g, "");
          if (visible !== expected.text.replace(/\s/g, "")) issues.push({ field: target.field, reason: "missing-cell-text" });
        }
      }
    }
    for (let index = 0; index < targets.length; index++) for (const [recordIndex, row] of targets[index].rows.entries()) {
      const target = targets[index];
      if (rowPages[index].get(row)?.size !== 1) fail2(target.field, target.repeated ? "record-requires-continuation" : "repeat-profile-required", target.repeated ? recordIndex : void 0);
    }
    if (issues.length) fail2(issues[0].field, issues[0].reason);
    return { source: "rhwp", status: "engine-checked", after: pages, tables: targets.map((target, index) => ({ field: target.field, rows: target.rows.map((row) => ({ row, pages: [...rowPages[index].get(row)].map((page) => page + 1) })), headerRows: target.headerRows })) };
  } catch (error) {
    if (error instanceof FillError) throw error;
    fail2(targets[0].field, "unavailable-row-layout");
  } finally {
    document.free();
  }
}

// lib/adapters/hwpx.mjs
var HP3 = "http://www.hancom.co.kr/hwpml/2011/paragraph";
var ENGINE = "fill-documents XML patch + kordoc@4.19.2 validation";
var isParagraph = (node) => node.local === "p" && node.namespace === HP3;
var isText = (node) => node.local === "t" && node.namespace === HP3;
function textContent(node) {
  let text = "";
  let safe = true;
  for (const child of Array.from(node.element.childNodes)) {
    if (child.nodeType === 3 || child.nodeType === 4) text += child.data;
    else if (child.nodeType === 1 && child.namespaceURI === HP3 && child.localName === "lineBreak") text += "\n";
    else if (child.nodeType === 1 && child.namespaceURI === HP3 && child.localName === "tab") text += "	";
    else if (child.nodeType !== 8) {
      safe = false;
      text += "\uFFFC";
    }
  }
  return { text, safe };
}
function model(xml) {
  const nodes = scanXml(xml);
  const groups = nodes.filter(isParagraph).map((paragraph) => ({ paragraph, textNodes: [], fields: [] }));
  const byParagraph = new Map(groups.map((group) => [group.paragraph, group]));
  for (const node of nodes.filter(isText)) byParagraph.get(ancestor(node, isParagraph))?.textNodes.push({ ...node, ...textContent(node) });
  for (const group of groups) {
    let offset = 0;
    for (const node of group.textNodes) {
      node.textStart = offset;
      offset += node.text.length;
      node.textEnd = offset;
    }
    group.text = group.textNodes.map((node) => node.text).join("");
  }
  const explicit = [];
  for (const begin of nodes.filter((node) => node.namespace === HP3 && node.local === "fieldBegin" && node.attrs.type?.toUpperCase() === "CLICK_HERE")) {
    const group = byParagraph.get(ancestor(begin, isParagraph));
    const ends = nodes.filter((node) => node.namespace === HP3 && node.local === "fieldEnd" && node.attrs.beginIDRef === begin.attrs.id && node.start > begin.end);
    requireCondition(begin.attrs.id && ends.length === 1 && group && ancestor(ends[0], isParagraph) === group.paragraph, "E_PRESERVATION", "\uB204\uB984\uD2C0\uC758 \uC2DC\uC791\uACFC \uB05D\uC774 \uD55C \uBB38\uB2E8 \uC548\uC5D0\uC11C \uBA85\uD655\uD558\uAC8C \uB300\uC751\uD574\uC57C \uD569\uB2C8\uB2E4.");
    const end = ends[0];
    requireCondition(!nodes.some((node) => node.local === "fieldBegin" && node.start > begin.start && node.start < end.start), "E_PRESERVATION", "\uC911\uCCA9 \uB204\uB984\uD2C0\uC740 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    const selected = group.textNodes.filter((node) => node.start >= begin.end && node.end <= end.start);
    requireCondition(selected.length > 0 && selected.every((node) => node.safe), "E_PRESERVATION", "\uB204\uB984\uD2C0 \uC548\uC5D0 \uBCF4\uC874 \uAC00\uB2A5\uD55C \uD14D\uC2A4\uD2B8 \uC601\uC5ED\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
    const entry = { name: begin.attrs.name ?? "", start: selected[0].textStart, end: selected.at(-1).textEnd, group, begin, selected };
    requireCondition(!explicit.some((field) => field.group === group && field.end > entry.start && field.start < entry.end), "E_PRESERVATION", "\uB204\uB984\uD2C0 \uBC94\uC704\uAC00 \uACB9\uCE69\uB2C8\uB2E4.");
    explicit.push(entry);
    group.fields.push(entry);
  }
  for (const group of groups) {
    const masked = [...group.fields].sort((a, b) => b.start - a.start).reduce((text, field) => text.slice(0, field.start) + " ".repeat(field.end - field.start) + text.slice(field.end), group.text);
    for (const tag of placeholders(masked)) {
      const selected = group.textNodes.filter((node) => node.textEnd > tag.start && node.textStart < tag.end);
      requireCondition(selected.length > 0 && selected.every((node) => node.safe), "E_PRESERVATION", "\uD45C\uC2DD\uC744 \uD3EC\uD568\uD55C \uD14D\uC2A4\uD2B8 \uC601\uC5ED\uC744 \uC548\uC804\uD558\uAC8C \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      requireCondition(!nodes.some((node) => node.start > selected[0].start && node.end < selected.at(-1).end && ["ctrl", "tbl", "pic", "fieldBegin", "fieldEnd"].includes(node.local)), "E_PRESERVATION", "\uD45C\uC2DD\uC774 \uAC1C\uCCB4 \uB610\uB294 \uB204\uB984\uD2C0 \uACBD\uACC4\uB97C \uAC00\uB85C\uC9C0\uB985\uB2C8\uB2E4.");
      group.fields.push({ ...tag, group, selected });
    }
  }
  const occurrences = groups.flatMap((group) => group.fields);
  fieldList(occurrences);
  return { nodes, groups, occurrences };
}
async function open(bytes) {
  assertSafeZip(bytes);
  let zip;
  try {
    zip = new import_pizzip.default(bytes);
  } catch {
    throw new FillError("E_INPUT", "HWPX ZIP\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  requireCondition(zip.file("mimetype")?.asText() === "application/hwp+zip", "E_INPUT", "HWPX \uBB38\uC11C \uD615\uC2DD\uC774 \uC544\uB2D9\uB2C8\uB2E4.");
  requireCondition(!Object.keys(zip.files).some((path) => /(?:^|\/)(?:signatures?|_xmlsignatures|encrypted-package)(?:\/|\.)/i.test(path)), "E_UNSUPPORTED", "\uC554\uD638\uD654 \uB610\uB294 \uC11C\uBA85\uB41C HWPX\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  for (const entry of Object.values(zip.files)) {
    if (!entry.dir && /\.(?:xml|hpf|rdf)$/i.test(entry.name)) {
      const nodes = scanXml(entry.asText());
      requireCondition(!nodes.some((node) => ["script", "ole", "encryption-data", "Signature"].includes(node.local)), "E_UNSUPPORTED", "\uC2A4\uD06C\uB9BD\uD2B8\xB7\uC2E4\uD589 \uAC1C\uCCB4\xB7\uC554\uD638\uD654\xB7\uC11C\uBA85\uC774 \uC788\uB294 HWPX\uB294 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    }
  }
  let result;
  try {
    result = await validateHwpx(new Uint8Array(bytes));
  } catch {
    throw new FillError("E_INPUT", "HWPX \uAD6C\uC870 \uAC80\uC0AC\uB97C \uC2E4\uD589\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  requireCondition(result.ok, "E_INPUT", "HWPX \uBB38\uC11C \uAD6C\uC870\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const parts = Object.keys(zip.files).filter((path) => /^Contents\/section\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0])).map((path) => ({ path, xml: zip.file(path).asText() }));
  requireCondition(parts.length > 0, "E_INPUT", "HWPX \uBCF8\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
  return { zip, parts };
}
function encodedText(text, node) {
  const prefix = node.name.includes(":") ? node.name.slice(0, node.name.indexOf(":") + 1) : "";
  return xmlEscape(text).replaceAll("\n", `<${prefix}lineBreak/>`).replaceAll("	", `<${prefix}tab/>`);
}
function replaceGroup(group, values, xml, allNodes) {
  const edits = [];
  const textEdits = /* @__PURE__ */ new Map();
  for (const field of group.fields) {
    const value = values[field.name].replace(/\r\n?/g, "\n");
    for (let index = 0; index < field.selected.length; index++) {
      const node = field.selected[index];
      const replacements = textEdits.get(node) ?? [];
      replacements.push({ start: Math.max(field.start - node.textStart, 0), end: Math.min(field.end - node.textStart, node.text.length), replacement: index === 0 ? value : "" });
      textEdits.set(node, replacements);
    }
    if (field.begin) {
      const raw2 = xml.slice(field.begin.start, field.begin.openEnd);
      const updated = /\sdirty\s*=/.test(raw2) ? raw2.replace(/(\sdirty\s*=\s*)(["'])[^"']*\2/, '$1"1"') : raw2.replace(/(\/?>)$/, ' dirty="1"$1');
      edits.push({ start: field.begin.start, end: field.begin.openEnd, replacement: updated });
    }
  }
  for (const [node, replacements] of textEdits) {
    const text = encodedText(spliceText(node.text, replacements), node);
    if (node.selfClosing) edits.push({ start: node.start, end: node.end, replacement: xml.slice(node.start, node.end).replace(/\/\s*>$/, ">") + text + `</${node.name}>` });
    else edits.push({ start: node.openEnd, end: node.closeStart, replacement: text });
  }
  if (group.fields.length) {
    for (const node of allNodes.filter((node2) => node2.local === "linesegarray" && ancestor(node2, isParagraph) === group.paragraph)) edits.push({ start: node.start, end: node.end, replacement: "" });
  }
  return edits;
}
async function inspect(bytes, context = {}) {
  const { zip, parts } = await open(bytes);
  const models = parts.map((part) => ({ ...part, ...model(part.xml) }));
  const repeated = context.layoutProfile ? inspectHwpxRepeat(bytes, zip, models, context) : void 0;
  const fields = [...fieldList((repeated?.outsideModels ?? models).flatMap((part) => part.occurrences)), ...repeated ? [repeated.field] : []];
  return { format: "hwpx", fields, engine: ENGINE, warnings: [visualWarning] };
}
async function fill(bytes, values, context = {}) {
  const { zip, parts } = await open(bytes);
  const models = parts.map((part) => ({ ...part, ...model(part.xml) }));
  const repeated = context.layoutProfile ? inspectHwpxRepeat(bytes, zip, models, context) : void 0;
  requireCondition(!repeated || context.overflow === "flow", "E_INPUT", "HWPX \uBC18\uBCF5 \uD504\uB85C\uD544\uC740 overflow=flow\uC640 \uD568\uAED8 \uC0AC\uC6A9\uD558\uC138\uC694.");
  const workingModels = repeated?.outsideModels ?? models;
  const fields = [...fieldList(workingModels.flatMap((part) => part.occurrences)), ...repeated ? [repeated.field] : []];
  requireCondition(fields.length > 0, "E_FIELDS", "\uCC44\uC6B8 \uC218 \uC788\uB294 \uBA85\uC2DC\uC801 HWPX \uD544\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  if (repeated) values = checkedRepeatValues(values, fields, context);
  else checkedValues(fields, values, context);
  const changed = /* @__PURE__ */ new Set();
  const paragraphPlan = context.overflow === "flow" ? createParagraphFlowPlan(zip) : void 0;
  const scalarEdits = new Map(workingModels.map((part) => [part.path, part.groups.flatMap((group) => replaceGroup(group, values, part.xml, part.nodes))]));
  const repetition = repeated ? planHwpxRepeat(repeated, values[repeated.field.name], paragraphPlan, scalarEdits.get(repeated.part.path)) : void 0;
  const flowModels = repeated ? workingModels.map((part) => ({ ...part, occurrences: part.occurrences.filter((field) => ancestor(field.group.paragraph, (node) => node.local === "tbl") !== repeated.table) })) : workingModels;
  const flow = context.overflow === "flow" ? planHwpxFlow(zip, flowModels, paragraphPlan) : void 0;
  if (repetition) flow.layout.changedContainers.push(repetition.changes);
  if (flow?.headerXml) {
    zip.file("Contents/header.xml", flow.headerXml);
    changed.add("Contents/header.xml");
  }
  for (const part of workingModels) {
    const edits = [...scalarEdits.get(part.path).filter((edit) => !(repeated && part.path === repeated.part.path && edit.start >= repeated.table.start && edit.end <= repeated.table.end)), ...flow?.partEdits.get(part.path) ?? [], ...repetition && part.path === repeated.part.path ? repetition.edits : []];
    if (!edits.length) continue;
    const updated = spliceText(part.xml, edits);
    const after = model(updated);
    let beforeGroups = part.groups;
    let afterGroups = after.groups;
    if (repetition && part.path === repeated.part.path) {
      const table = after.nodes.find((node) => node.local === "tbl" && node.attrs.id === repetition.tableId);
      const rows = table.children.filter((node) => node.local === "tr");
      const omitted = new Set(repeated.rows.slice(repetition.start, repeated.region.bodyRows.end + 1));
      const inserted = new Set(rows.slice(repetition.start, repetition.start + repetition.count));
      beforeGroups = beforeGroups.filter((group) => !omitted.has(ancestor(group.paragraph, (node) => node.local === "tr")));
      afterGroups = afterGroups.filter((group) => !inserted.has(ancestor(group.paragraph, (node) => node.local === "tr")));
      const actual = after.groups.filter((group) => inserted.has(ancestor(group.paragraph, (node) => node.local === "tr"))).map((group) => group.text);
      const expected = values[repeated.field.name].flatMap((row) => repeated.region.columns.map((column) => row[column.name].replace(/\r\n?/g, "\n")));
      requireCondition(JSON.stringify(actual) === JSON.stringify(expected), "E_PRESERVATION", "\uBC18\uBCF5 \uD589\uC758 \uC785\uB825\uAC12 \uB610\uB294 \uC21C\uC11C\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    }
    requireCondition(afterGroups.length === beforeGroups.length, "E_PRESERVATION", "\uCE58\uD658 \uD6C4 \uBE44\uB300\uC0C1 \uBB38\uB2E8 \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    for (let index = 0; index < beforeGroups.length; index++) {
      const group = beforeGroups[index];
      const expected = spliceText(group.text, group.fields.map((field) => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, "\n") })));
      requireCondition(afterGroups[index].text === expected, "E_PRESERVATION", "HWPX \uC785\uB825\uAC12\uC758 \uC644\uC804\uD55C \uC801\uC6A9\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    }
    zip.file(part.path, updated);
    changed.add(part.path);
  }
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  const output = zip.generate({ type: "uint8array", compression: "DEFLATE" });
  const reopened = await open(output);
  if (flow) checkHwpxFlowReferences(reopened.zip, reopened.parts);
  if (flow) {
    const targets = [];
    for (const part of reopened.parts.map((part2) => ({ ...part2, ...model(part2.xml) }))) {
      if (repetition && part.path === repetition.part) {
        const table = part.nodes.find((node) => node.local === "tbl" && node.attrs.id === repetition.tableId);
        targets.push(tableLayoutTarget(part, table, repetition.field, Array.from({ length: repetition.count }, (_, index) => repetition.start + index), true, repetition.headerRows));
      }
      const originalPart = workingModels.find((item) => item.path === part.path);
      const rows = /* @__PURE__ */ new Map();
      for (const field of originalPart.occurrences) {
        const row = ancestor(field.group.paragraph, (node) => node.local === "tr");
        if (!row || row.children.filter((node) => node.local === "tc").length < 2) continue;
        const table = ancestor(row, (node) => node.local === "tbl");
        if (table === repeated?.table && repeated.region.headerRows.includes(repeated.rows.indexOf(row))) continue;
        const key = `${table.start}:${row.start}`;
        const old = rows.get(key);
        if (!old || values[field.name].length > values[old.field.name].length) rows.set(key, { row, table, field });
      }
      for (const { row, table, field } of rows.values()) {
        const allTables = originalPart.nodes.filter((node) => node.local === "tbl");
        const newTable = part.nodes.filter((node) => node.local === "tbl")[allTables.indexOf(table)];
        let rowIndex = table.children.filter((node) => node.local === "tr").indexOf(row);
        if (table === repeated?.table && rowIndex > repeated.region.bodyRows.end) rowIndex += repetition.count - (repeated.region.bodyRows.end - repetition.start + 1);
        targets.push(tableLayoutTarget(part, newTable, field.name, [rowIndex]));
      }
    }
    flow.layout.pagination = await validateHwpxTableLayout(output, targets, context);
  }
  const original = new import_pizzip.default(bytes);
  requireCondition(Object.keys(reopened.zip.files).length === Object.keys(original.files).length, "E_PRESERVATION", "HWPX ZIP \uD56D\uBAA9 \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  for (const [path, entry] of Object.entries(original.files)) {
    if (!entry.dir && !changed.has(path)) requireCondition(Buffer.from(entry.asUint8Array()).equals(Buffer.from(reopened.zip.file(path).asUint8Array())), "E_PRESERVATION", "HWPX \uBE44\uB300\uC0C1 \uB370\uC774\uD130\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  }
  return { bytes: output, engine: ENGINE, checks: [{ name: "hwpx-structure", status: "passed" }, { name: "exact-field-values", status: "passed" }, { name: "untouched-entries", status: "passed" }], warnings: [visualWarning, "\uAE30\uC874 \uBBF8\uB9AC\uBCF4\uAE30 \uB370\uC774\uD130\uB294 \uBCF4\uC874\uB418\uBBC0\uB85C \uBB38\uC11C \uBCF8\uBB38\uC744 \uC5F4\uC5B4 \uACB0\uACFC\uB97C \uD655\uC778\uD558\uC138\uC694."], ...flow ? { layout: flow.layout, visualValidation: "not-performed" } : {} };
}
async function validate(bytes, context = {}) {
  await open(bytes);
  return { engine: ENGINE, checks: [{ name: "hwpx-structure", status: "passed" }], warnings: [visualWarning] };
}
export {
  fill,
  inspect,
  validate
};
