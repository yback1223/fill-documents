import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);
import {
  ancestor,
  checkedValues,
  fieldList,
  placeholders,
  scanXml,
  spliceText,
  validateHwpx,
  visualWarning,
  xmlEscape
} from "./chunk-D6FESC3K.mjs";
import "./chunk-7E4DDKWS.mjs";
import {
  assertSafeZip,
  require_js
} from "./chunk-IT3RRXA3.mjs";
import "./chunk-FTQWIUG6.mjs";
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
var HP = "http://www.hancom.co.kr/hwpml/2011/paragraph";
var ENGINE = "fill-documents XML patch + kordoc@4.19.2 validation";
var isParagraph = (node) => node.local === "p" && node.namespace === HP;
var isText = (node) => node.local === "t" && node.namespace === HP;
function textContent(node) {
  let text = "";
  let safe = true;
  for (const child of Array.from(node.element.childNodes)) {
    if (child.nodeType === 3 || child.nodeType === 4) text += child.data;
    else if (child.nodeType === 1 && child.namespaceURI === HP && child.localName === "lineBreak") text += "\n";
    else if (child.nodeType === 1 && child.namespaceURI === HP && child.localName === "tab") text += "	";
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
  for (const begin of nodes.filter((node) => node.namespace === HP && node.local === "fieldBegin" && node.attrs.type?.toUpperCase() === "CLICK_HERE")) {
    const group = byParagraph.get(ancestor(begin, isParagraph));
    const ends = nodes.filter((node) => node.namespace === HP && node.local === "fieldEnd" && node.attrs.beginIDRef === begin.attrs.id && node.start > begin.end);
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
      const raw = xml.slice(field.begin.start, field.begin.openEnd);
      const updated = /\sdirty\s*=/.test(raw) ? raw.replace(/(\sdirty\s*=\s*)(["'])[^"']*\2/, '$1"1"') : raw.replace(/(\/?>)$/, ' dirty="1"$1');
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
  const { parts } = await open(bytes);
  const fields = fieldList(parts.flatMap((part) => model(part.xml).occurrences));
  return { format: "hwpx", fields, engine: ENGINE, warnings: [visualWarning] };
}
async function fill(bytes, values, context = {}) {
  const { zip, parts } = await open(bytes);
  const models = parts.map((part) => ({ ...part, ...model(part.xml) }));
  const fields = fieldList(models.flatMap((part) => part.occurrences));
  requireCondition(fields.length > 0, "E_FIELDS", "\uCC44\uC6B8 \uC218 \uC788\uB294 \uBA85\uC2DC\uC801 HWPX \uD544\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  checkedValues(fields, values, context);
  const changed = /* @__PURE__ */ new Set();
  for (const part of models) {
    const edits = part.groups.flatMap((group) => replaceGroup(group, values, part.xml, part.nodes));
    if (!edits.length) continue;
    const updated = spliceText(part.xml, edits);
    const after = model(updated);
    requireCondition(after.groups.length === part.groups.length, "E_PRESERVATION", "\uCE58\uD658 \uD6C4 \uBB38\uB2E8 \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
    for (let index = 0; index < part.groups.length; index++) {
      const group = part.groups[index];
      const expected = spliceText(group.text, group.fields.map((field) => ({ start: field.start, end: field.end, replacement: values[field.name].replace(/\r\n?/g, "\n") })));
      requireCondition(after.groups[index].text === expected, "E_PRESERVATION", "HWPX \uC785\uB825\uAC12\uC758 \uC644\uC804\uD55C \uC801\uC6A9\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    }
    zip.file(part.path, updated);
    changed.add(part.path);
  }
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  const output = zip.generate({ type: "uint8array", compression: "DEFLATE" });
  const reopened = await open(output);
  const original = new import_pizzip.default(bytes);
  requireCondition(Object.keys(reopened.zip.files).length === Object.keys(original.files).length, "E_PRESERVATION", "HWPX ZIP \uD56D\uBAA9 \uAC1C\uC218\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  for (const [path, entry] of Object.entries(original.files)) {
    if (!entry.dir && !changed.has(path)) requireCondition(Buffer.from(entry.asUint8Array()).equals(Buffer.from(reopened.zip.file(path).asUint8Array())), "E_PRESERVATION", "HWPX \uBE44\uB300\uC0C1 \uB370\uC774\uD130\uAC00 \uB2EC\uB77C\uC84C\uC2B5\uB2C8\uB2E4.");
  }
  return { bytes: output, engine: ENGINE, checks: [{ name: "hwpx-structure", status: "passed" }, { name: "exact-field-values", status: "passed" }, { name: "untouched-entries", status: "passed" }], warnings: [visualWarning, "\uAE30\uC874 \uBBF8\uB9AC\uBCF4\uAE30 \uB370\uC774\uD130\uB294 \uBCF4\uC874\uB418\uBBC0\uB85C \uBB38\uC11C \uBCF8\uBB38\uC744 \uC5F4\uC5B4 \uACB0\uACFC\uB97C \uD655\uC778\uD558\uC138\uC694."] };
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
