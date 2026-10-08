import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);
import {
  checkValues,
  isPlainObject,
  matchManifestFields,
  normalizeFields
} from "./chunks/chunk-ORHQCEZZ.mjs";
import {
  assertSafeZip
} from "./chunks/chunk-IT3RRXA3.mjs";
import {
  FillError,
  requireCondition
} from "./chunks/chunk-Q2WAVGBC.mjs";
import "./chunks/chunk-WNYIIIUP.mjs";

// lib/catalog.mjs
import fs2 from "node:fs/promises";
import path2 from "node:path";
import os from "node:os";

// lib/io.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";

// lib/owned-paths.mjs
var sameIdentity = (a, b) => a.dev === b.dev && a.ino === b.ino;
async function assertDirectory(directory, identity, operations) {
  let current;
  try {
    current = await operations.lstat(directory);
  } catch {
  }
  if (!current?.isDirectory() || !sameIdentity(current, identity)) {
    throw new FillError("E_IO", "\uC791\uC5C5 \uC911 \uD3F4\uB354 \uACBD\uB85C\uAC00 \uBCC0\uACBD\uB410\uC2B5\uB2C8\uB2E4. \uC548\uC815\uB41C \uD3F4\uB354\uC5D0\uC11C \uB2E4\uC2DC \uC2E4\uD589\uD558\uC138\uC694.", { path: directory });
  }
}
async function createOwnedDirectory(directory, owned, operations, scope = "temporary") {
  await operations.mkdir(directory, { mode: 448 });
  const identity = await operations.lstat(directory);
  owned.push({ path: directory, identity, directory: true, scope });
  return identity;
}
async function createOwnedFile(filePath, bytes, owned, operations) {
  const handle = await operations.open(filePath, "wx", 384);
  try {
    const identity = await handle.stat();
    owned.push({ path: filePath, identity, directory: false, scope: "temporary" });
    await handle.writeFile(bytes);
    await handle.sync();
    return identity;
  } finally {
    await handle.close();
  }
}
async function cleanupOwned(owned, operations, committed = false) {
  const warnings = [];
  for (const item of [...owned].reverse()) {
    if (committed && item.scope === "published") continue;
    try {
      const current = await operations.lstat(item.path);
      if (!sameIdentity(current, item.identity) || current.isDirectory() !== item.directory) throw new Error("identity-changed");
      if (item.directory) await operations.rmdir(item.path);
      else await operations.unlink(item.path);
    } catch (error) {
      warnings.push({ code: "W_TEMP_CLEANUP", path: item.path, reason: error.code ?? "identity-changed", location: "path-at-creation" });
    }
  }
  return warnings;
}

// lib/io.mjs
var sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function readDocument(filePath) {
  let handle;
  try {
    handle = await fs.open(filePath, "r");
    const info = await handle.stat();
    requireCondition(info.isFile() && info.size > 0 && info.size <= 50 * 1024 * 1024, "E_INPUT", "\uBB38\uC11C\uB294 50 MiB \uC774\uD558\uC758 \uC77C\uBC18 \uD30C\uC77C\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
    const bytes = await handle.readFile();
    requireCondition(bytes.length <= 50 * 1024 * 1024, "E_INPUT", "\uBB38\uC11C \uD06C\uAE30 \uC81C\uD55C\uC744 \uCD08\uACFC\uD588\uC2B5\uB2C8\uB2E4.");
    return bytes;
  } catch (error) {
    if (error instanceof FillError) throw error;
    throw new FillError("E_IO", "\uBB38\uC11C \uD30C\uC77C\uC744 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { path: path.resolve(filePath) });
  } finally {
    await handle?.close();
  }
}
async function readJson(filePath) {
  const bytes = await readDocument(filePath);
  requireCondition(bytes.length <= 2 * 1024 * 1024, "E_INPUT", "JSON \uC785\uB825\uC740 2 MiB \uC774\uD558\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, ""));
  } catch {
    throw new FillError("E_INPUT", "\uC62C\uBC14\uB978 UTF-8 JSON \uD30C\uC77C\uC774 \uC544\uB2D9\uB2C8\uB2E4.");
  }
}
async function publishNewFile(output, bytes, operations = fs) {
  let parent;
  try {
    parent = await operations.realpath(path.dirname(path.resolve(output)));
  } catch {
    throw new FillError("E_IO", "\uCD9C\uB825 \uD3F4\uB354\uAC00 \uC874\uC7AC\uD558\uACE0 \uC811\uADFC \uAC00\uB2A5\uD55C\uC9C0 \uD655\uC778\uD558\uC138\uC694.");
  }
  const destination = path.join(parent, path.basename(output));
  const temporary = path.join(parent, `.fill-documents-${randomUUID()}.tmp`);
  const identity = await operations.lstat(parent);
  let committed = false;
  let failure;
  const owned = [];
  const warnings = [];
  try {
    await assertDirectory(parent, identity, operations);
    await createOwnedFile(temporary, bytes, owned, operations);
    await assertDirectory(parent, identity, operations);
    await operations.link(temporary, destination);
    committed = true;
    try {
      await assertDirectory(parent, identity, operations);
    } catch {
      warnings.push({ code: "W_OUTPUT_LOCATION_CHANGED", path: destination, location: "path-at-creation" });
    }
  } catch (error) {
    failure = error instanceof FillError ? error : error.code === "EEXIST" ? new FillError("E_OUTPUT_EXISTS", "\uACB0\uACFC \uD30C\uC77C\uC774 \uC774\uBBF8 \uC788\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uC774\uB984\uC744 \uC9C0\uC815\uD558\uC138\uC694.", { path: destination }) : new FillError("E_IO", "\uC0C8 \uACB0\uACFC \uD30C\uC77C\uC744 \uC548\uC804\uD558\uAC8C \uAC8C\uC2DC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uD30C\uC77C\uC740 \uAD50\uCCB4\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  } finally {
    warnings.push(...await cleanupOwned(owned, operations, committed));
  }
  if (failure) {
    if (warnings.length) failure.details = { ...failure.details, warnings };
    throw failure;
  }
  return { path: destination, warnings };
}

// lib/catalog.mjs
var defaultLibrary = () => path2.join(os.homedir(), ".local", "share", "fill-documents", "templates");
var validId = (id) => typeof id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id.length <= 64;
function validateManifest(data) {
  requireCondition(data?.schemaVersion === 1 && validId(data.id) && typeof data.title === "string" && data.title.trim() && ["hwp", "hwpx", "docx", "pdf"].includes(data.format), "E_INPUT", "\uD15C\uD50C\uB9BF manifest\uC758 \uD544\uC218 \uC815\uBCF4\uAC00 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  requireCondition(data.file === `template.${data.format}` && /^[a-f0-9]{64}$/.test(data.sha256), "E_INPUT", "\uD15C\uD50C\uB9BF \uD30C\uC77C\uBA85 \uB610\uB294 \uD574\uC2DC\uAC00 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const fields = normalizeFields(data.fields);
  requireCondition(fields.length > 0, "E_FIELDS", "\uBA85\uC2DC\uC801\uC778 \uC785\uB825 \uD544\uB4DC\uAC00 \uC5C6\uB294 \uC11C\uC2DD\uC785\uB2C8\uB2E4.");
  return { ...data, fields };
}
async function readEntry(directory, origin) {
  const manifest = validateManifest(await readJson(path2.join(directory, "manifest.json")));
  const filePath = path2.join(directory, manifest.file);
  return { manifest, filePath, origin };
}
async function listTemplates(skillRoot, library = defaultLibrary()) {
  const entries = [];
  const warnings = [];
  for (const [directory, origin] of [[path2.join(skillRoot, "assets", "templates"), "bundled"], [library, "user"]]) {
    let children;
    try {
      children = await fs2.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
      if (child.name.startsWith(".") || !child.isDirectory()) continue;
      try {
        try {
          await fs2.lstat(path2.join(directory, child.name, "manifest.json"));
        } catch (error) {
          if (error.code === "ENOENT") continue;
          throw error;
        }
        const entry = await readEntry(path2.join(directory, child.name), origin);
        requireCondition(entry.manifest.id === child.name, "E_INPUT", "\uD15C\uD50C\uB9BF \uD3F4\uB354\uBA85\uACFC ID\uAC00 \uB2E4\uB985\uB2C8\uB2E4.");
        requireCondition(!entries.some((item) => item.manifest.id === entry.manifest.id), "E_INPUT", "\uC911\uBCF5 \uD15C\uD50C\uB9BF ID\uAC00 \uC788\uC2B5\uB2C8\uB2E4.");
        entries.push(entry);
      } catch (error) {
        warnings.push({ code: "W_INVALID_TEMPLATE", id: child.name, reason: error.code ?? "E_IO" });
      }
    }
  }
  return { entries, warnings };
}
async function findTemplate(id, skillRoot, library) {
  requireCondition(validId(id), "E_INPUT", "\uC62C\uBC14\uB978 \uD15C\uD50C\uB9BF ID \uB610\uB294 \uBB38\uC11C \uACBD\uB85C\uB97C \uC9C0\uC815\uD558\uC138\uC694.");
  const { entries } = await listTemplates(skillRoot, library);
  const item = entries.find((entry) => entry.manifest.id === id);
  requireCondition(item, "E_INPUT", "\uD15C\uD50C\uB9BF\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.", { id });
  const bytes = await readDocument(item.filePath);
  requireCondition(sha256(bytes) === item.manifest.sha256, "E_TEMPLATE_CHANGED", "\uB4F1\uB85D \uD6C4 \uD15C\uD50C\uB9BF \uD30C\uC77C\uC774 \uBCC0\uACBD\uB410\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uB4F1\uB85D\uD558\uC138\uC694.", { id });
  return { ...item, bytes };
}
async function registerTemplate({ filePath, id, title, skillRoot, library = defaultLibrary(), inspectDocument: inspectDocument2, operations = fs2 }) {
  requireCondition(validId(id) && typeof title === "string" && title.trim().length > 0 && title.length <= 200, "E_INPUT", "\uD15C\uD50C\uB9BF ID\uC640 \uC81C\uBAA9\uC744 \uD655\uC778\uD558\uC138\uC694.");
  const { entries } = await listTemplates(skillRoot, library);
  requireCondition(!entries.some((entry) => entry.manifest.id === id), "E_OUTPUT_EXISTS", "\uAC19\uC740 ID\uC758 \uD15C\uD50C\uB9BF\uC774 \uC774\uBBF8 \uC788\uC2B5\uB2C8\uB2E4.", { id });
  const bytes = await readDocument(filePath);
  const info = await inspectDocument2(bytes, { skillRoot, filePath });
  const fields = normalizeFields(info.fields);
  requireCondition(fields.length > 0, "E_FIELDS", "\uC785\uB825 \uD544\uB4DC\uAC00 \uC5C6\uB294 \uBB38\uC11C\uB294 \uC790\uB3D9 \uCC44\uC6B0\uAE30 \uD15C\uD50C\uB9BF\uC73C\uB85C \uB4F1\uB85D\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  const manifest = validateManifest({ schemaVersion: 1, id, title: title.trim(), category: "custom", version: "1.0.0", format: info.format, file: `template.${info.format}`, sha256: sha256(bytes), source: "user", license: "user-supplied", fields });
  await operations.mkdir(library, { recursive: true });
  const parent = await operations.realpath(library);
  const reservation = path2.join(parent, `.${id}.lock`);
  const destination = path2.join(parent, id);
  const parentIdentity = await operations.lstat(parent);
  const owned = [];
  let committed = false;
  let failure;
  const warnings = [];
  try {
    await assertDirectory(parent, parentIdentity, operations);
    const reservationIdentity = await createOwnedDirectory(reservation, owned, operations);
    const staging = path2.join(reservation, "staging");
    const stagingIdentity = await createOwnedDirectory(staging, owned, operations);
    const fileIdentity = await createOwnedFile(path2.join(staging, manifest.file), bytes, owned, operations);
    const manifestIdentity = await createOwnedFile(path2.join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}
`, owned, operations);
    const written = await operations.readFile(path2.join(staging, manifest.file));
    requireCondition(sha256(written) === manifest.sha256, "E_IO", "\uB4F1\uB85D \uD30C\uC77C\uC758 \uD574\uC2DC \uAC80\uC99D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    validateManifest(JSON.parse(await operations.readFile(path2.join(staging, "manifest.json"), "utf8")));
    await assertDirectory(parent, parentIdentity, operations);
    await assertDirectory(reservation, reservationIdentity, operations);
    await assertDirectory(staging, stagingIdentity, operations);
    const destinationIdentity = await createOwnedDirectory(destination, owned, operations, "published");
    await assertDirectory(destination, destinationIdentity, operations);
    await operations.link(path2.join(staging, manifest.file), path2.join(destination, manifest.file));
    owned.push({ path: path2.join(destination, manifest.file), identity: fileIdentity, directory: false, scope: "published" });
    await assertDirectory(destination, destinationIdentity, operations);
    await operations.link(path2.join(staging, "manifest.json"), path2.join(destination, "manifest.json"));
    owned.push({ path: path2.join(destination, "manifest.json"), identity: manifestIdentity, directory: false, scope: "published" });
    committed = true;
  } catch (error) {
    failure = error instanceof FillError ? error : error.code === "EEXIST" ? new FillError("E_OUTPUT_EXISTS", "\uD15C\uD50C\uB9BF ID\uAC00 \uC0AC\uC6A9 \uC911\uC785\uB2C8\uB2E4. \uC911\uB2E8\uB41C \uB4F1\uB85D\uC758 \uC7A0\uAE08\uC740 \uD655\uC778 \uD6C4 \uC218\uB3D9 \uC815\uB9AC\uD558\uC138\uC694.", { id, reservation }) : new FillError("E_IO", "\uD15C\uD50C\uB9BF\uC744 \uB4F1\uB85D\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uB77C\uC774\uBE0C\uB7EC\uB9AC\uB294 \uAD50\uCCB4\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
  } finally {
    warnings.push(...await cleanupOwned(owned, operations, committed));
  }
  if (failure) {
    if (warnings.length) failure.details = { ...failure.details, warnings };
    throw failure;
  }
  return { id, path: destination, manifest, warnings };
}

// lib/engine.mjs
import fs3 from "node:fs/promises";
import path3 from "node:path";

// lib/coverage.mjs
var hasText = (value) => typeof value === "string" && value.trim().length > 0;
var states = ["filled", "explicitly_excluded", "not_applicable", "blocked"];
function check(condition, reason, slotIndex) {
  requireCondition(condition, "E_COVERAGE", "\uC791\uC131 \uB300\uC0C1 \uBAA9\uB85D\uC758 \uD615\uC2DD\xB7\uADFC\uAC70\xB7\uD544\uB4DC \uB300\uC751\uC744 \uD655\uC778\uD558\uC138\uC694.", {
    reason,
    ...slotIndex === void 0 ? {} : { slotIndex }
  });
}
function userInstruction(evidence, reason, slotIndex) {
  check(isPlainObject(evidence) && evidence.kind === "user-instruction" && hasText(evidence.reference), reason, slotIndex);
  return { kind: "user-instruction", reference: evidence.reference };
}
function readCoverage(input, templateSha256) {
  if (input === void 0) return void 0;
  check(isPlainObject(input) && input.version === 1, "invalid-version");
  check(typeof input.templateSha256 === "string" && /^[a-f0-9]{64}$/.test(input.templateSha256), "invalid-template-hash");
  const scope = input.scope === void 0 ? "full" : input.scope;
  check(["full", "partial"].includes(scope), "invalid-scope");
  const scopeEvidence = scope === "partial" ? userInstruction(input.scopeEvidence, "missing-scope-instruction") : void 0;
  check(Array.isArray(input.slots), "invalid-slots");
  const ids = /* @__PURE__ */ new Set();
  const slots = input.slots.map((slot, index) => {
    check(isPlainObject(slot) && hasText(slot.id), "invalid-slot-id", index);
    check(!ids.has(slot.id), "duplicate-slot-id", index);
    ids.add(slot.id);
    check(hasText(slot.location), "missing-location", index);
    check(states.includes(slot.status), "invalid-status", index);
    const copy = { id: slot.id, location: slot.location, status: slot.status };
    if (slot.status === "blocked") {
      check(hasText(slot.reason) && hasText(slot.nextAction), "missing-blocker-action", index);
      return { ...copy, reason: slot.reason, nextAction: slot.nextAction };
    }
    if (slot.status === "explicitly_excluded") {
      return { ...copy, evidence: userInstruction(slot.evidence, "missing-exclusion-instruction", index) };
    }
    const evidence = slot.evidence;
    check(isPlainObject(evidence), "missing-evidence", index);
    if (slot.status === "not_applicable") {
      check(evidence.kind === "applicability" && hasText(evidence.condition) && hasText(evidence.reason), "missing-applicability", index);
      return { ...copy, evidence: { kind: "applicability", condition: evidence.condition, reason: evidence.reason } };
    }
    check(["fields", "external-review"].includes(evidence.kind), "invalid-filled-evidence", index);
    if (evidence.kind === "external-review") {
      check(hasText(evidence.reference), "missing-review-reference", index);
      return { ...copy, evidence: { kind: "external-review", reference: evidence.reference } };
    }
    check(Array.isArray(evidence.fields) && evidence.fields.length > 0 && evidence.fields.every(hasText), "invalid-evidence-fields", index);
    return { ...copy, evidence: { kind: "fields", fields: [...evidence.fields] } };
  });
  requireCondition(input.templateSha256 === templateSha256, "E_TEMPLATE_CHANGED", "\uC791\uC131 \uB300\uC0C1 \uBAA9\uB85D\uC758 \uC900\uBE44\uBCF8 \uD574\uC2DC\uC640 \uD604\uC7AC \uBB38\uC11C\uAC00 \uB2E4\uB985\uB2C8\uB2E4.");
  return { version: 1, templateSha256, scope, ...scopeEvidence ? { scopeEvidence } : {}, slots };
}
function checkCoverageFields(coverage, fields) {
  if (!coverage) return;
  const found = new Set(fields.map((field) => field.name)), linked = /* @__PURE__ */ new Set();
  for (const [index, slot] of coverage.slots.entries()) {
    if (slot.evidence?.kind !== "fields") continue;
    for (const name of slot.evidence.fields) {
      check(found.has(name), "unknown-field", index);
      check(!linked.has(name), "duplicate-field", index);
      linked.add(name);
    }
  }
  check(linked.size === found.size, "unmapped-fields");
}
function completionReport(coverage, { structureOnly = false } = {}) {
  const slots = coverage?.slots ?? [];
  const counts = {
    declaredSlots: slots.length,
    fieldLinkedSlots: slots.filter((slot) => slot.evidence?.kind === "fields").length,
    externallyDeclaredFilledSlots: slots.filter((slot) => slot.evidence?.kind === "external-review").length,
    explicitlyExcludedSlots: slots.filter((slot) => slot.status === "explicitly_excluded").length,
    notApplicableSlots: slots.filter((slot) => slot.status === "not_applicable").length,
    blockedSlots: slots.filter((slot) => slot.status === "blocked").length
  };
  return {
    scope: coverage?.scope ?? "full",
    status: !coverage || counts.blockedSlots ? "incomplete" : "requires-review",
    fullDocumentComplete: false,
    inventory: coverage ? "declared" : "not-provided",
    verificationScope: structureOnly ? "structure-only" : coverage ? "explicit-fields-and-manifest-consistency" : "explicit-fields",
    reason: structureOnly ? "\uBB38\uC11C \uAD6C\uC870\uB9CC \uAC80\uC0AC\uD588\uC73C\uBA70 \uC804\uCCB4 \uC791\uC131 \uB300\uC0C1\uACFC \uCD5C\uC885 \uD45C\uC2DC\uB97C \uD655\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." : !coverage ? "\uBB38\uC11C \uC804\uCCB4 \uC791\uC131 \uB300\uC0C1\uACFC \uCD5C\uC885 \uD45C\uC2DC\uB97C \uD655\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." : counts.blockedSlots ? "\uC791\uC131 \uB300\uC0C1 \uBAA9\uB85D\uC5D0 \uBBF8\uD574\uACB0 \uD56D\uBAA9\uC774 \uC788\uC2B5\uB2C8\uB2E4. \uC804\uCCB4 \uC791\uC131\uACFC \uCD5C\uC885 \uD45C\uC2DC \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." : "\uC791\uC131 \uB300\uC0C1 \uBAA9\uB85D\uC758 \uC120\uC5B8\uC740 \uC77C\uAD00\uB418\uC9C0\uB9CC \uC6D0\uBCF8 \uC804\uCCB4\uC640 \uCD5C\uC885 \uD30C\uC77C\uC744 \uB300\uC870\uD55C \uAC80\uC218\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.",
    counts,
    fieldVerification: { source: "not-performed", verifiedFields: 0 }
  };
}

// lib/engine.mjs
var loaders = {
  hwp: () => import("./chunks/hwp-DA4JLAPL.mjs"),
  hwpx: () => import("./chunks/hwpx-UOS4KLHP.mjs"),
  docx: () => import("./chunks/docx-OAXC5KWC.mjs"),
  pdf: () => import("./chunks/pdf-VCGFKAND.mjs")
};
function formatFromPath(filePath) {
  const format = path3.extname(filePath).slice(1).toLowerCase();
  requireCondition(Object.hasOwn(loaders, format), "E_UNSUPPORTED", "\uC9C0\uC6D0 \uD615\uC2DD\uC740 .hwp, .hwpx, .docx, .pdf\uC785\uB2C8\uB2E4.");
  return format;
}
function validateSignature(bytes, format) {
  if (format === "hwp") requireCondition(bytes.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")), "E_INPUT", "\uD655\uC7A5\uC790\uC640 HWP \uD30C\uC77C \uC11C\uBA85\uC774 \uB2E4\uB985\uB2C8\uB2E4.");
  else if (format === "pdf") requireCondition(bytes.subarray(0, 5).toString() === "%PDF-", "E_INPUT", "\uD655\uC7A5\uC790\uC640 PDF \uD30C\uC77C \uC11C\uBA85\uC774 \uB2E4\uB985\uB2C8\uB2E4.");
  else assertSafeZip(bytes);
}
async function inspectDocument(input, context) {
  const bytes = Buffer.from(input);
  const format = formatFromPath(context.filePath);
  validateSignature(bytes, format);
  const templateSha256 = sha256(bytes);
  const coverage = readCoverage(context.coverage, templateSha256);
  if (context.layoutProfile !== void 0) {
    const profile = context.layoutProfile;
    requireCondition(isPlainObject(profile) && profile.version === 1 && ["hwpx", "pdf"].includes(profile.format) && typeof profile.templateSha256 === "string" && /^[a-f0-9]{64}$/.test(profile.templateSha256), "E_INPUT", "\uB808\uC774\uC544\uC6C3 \uD504\uB85C\uD544\uC758 \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
    requireCondition(profile.format === format, "E_UNSUPPORTED", "\uD504\uB85C\uD544\uACFC \uBB38\uC11C\uC758 \uD615\uC2DD\uC774 \uB2E4\uB985\uB2C8\uB2E4.");
    requireCondition(profile.templateSha256 === sha256(bytes), "E_TEMPLATE_CHANGED", "\uD504\uB85C\uD544\uC758 \uC6D0\uBCF8 \uD574\uC2DC\uC640 \uD604\uC7AC \uBB38\uC11C\uAC00 \uB2E4\uB985\uB2C8\uB2E4.");
    requireCondition(!(context.manifest && format === "hwpx"), "E_UNSUPPORTED", "HWPX \uBC18\uBCF5 \uD589\uC740 \uB4F1\uB85D ID \uB300\uC2E0 \uD30C\uC77C \uACBD\uB85C\uC640 \uD504\uB85C\uD544\uC744 \uC9C0\uC815\uD558\uC138\uC694.");
  }
  const adapter = await loaders[format]();
  const info = await adapter.inspect(bytes, context);
  const fields = normalizeFields(info.fields);
  checkCoverageFields(coverage, fields);
  return {
    ...info,
    format,
    fields,
    sha256: templateSha256,
    warnings: info.warnings ?? [],
    fieldDiscovery: { scope: "explicit-fields", fullDocumentInventory: false },
    completion: completionReport(coverage)
  };
}
async function inspectFile(filePath, skillRoot, options = {}) {
  return inspectDocument(await readDocument(filePath), { ...options, filePath: path3.resolve(filePath), skillRoot });
}
async function validateFile(filePath, skillRoot) {
  const bytes = await readDocument(filePath);
  const format = formatFromPath(filePath);
  validateSignature(bytes, format);
  const report = await (await loaders[format]()).validate(bytes, { filePath: path3.resolve(filePath), skillRoot });
  requireCondition(!report.checks?.some((check2) => check2.status === "failed"), "E_PRESERVATION", "\uBB38\uC11C \uAC80\uC99D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
  return {
    format,
    sha256: sha256(bytes),
    ...report,
    operation: "structure-validation",
    completion: completionReport(void 0, { structureOnly: true }),
    visualValidation: "not-performed"
  };
}
async function fillDocument({ target, values, output, skillRoot, library, dryRun = false, overflow = "preserve", layoutProfile, coverage }) {
  requireCondition(["preserve", "flow"].includes(overflow), "E_INPUT", "overflow\uB294 preserve \uB610\uB294 flow\uC5EC\uC57C \uD569\uB2C8\uB2E4.");
  requireCondition(layoutProfile === void 0 || overflow === "flow", "E_INPUT", "\uB808\uC774\uC544\uC6C3 \uD504\uB85C\uD544\uC740 overflow=flow\uC640 \uD568\uAED8 \uC0AC\uC6A9\uD558\uC138\uC694.");
  let item;
  try {
    const info2 = await fs3.stat(target);
    requireCondition(info2.isFile(), "E_INPUT", "\uBB38\uC11C \uD30C\uC77C \uACBD\uB85C\uB97C \uC9C0\uC815\uD558\uC138\uC694.");
    item = { filePath: path3.resolve(target), bytes: await readDocument(target) };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    item = await findTemplate(target, skillRoot, library);
  }
  const context = { filePath: item.filePath, skillRoot, manifest: item.manifest, overflow, layoutProfile, coverage };
  const info = await inspectDocument(item.bytes, context);
  requireCondition(info.fields.length > 0, "E_FIELDS", "\uBA85\uC2DC\uC801\uC778 \uC785\uB825 \uD544\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC11C\uC2DD \uB4F1\uB85D \uC548\uB0B4\uB97C \uD655\uC778\uD558\uC138\uC694.");
  const fields = item.manifest ? matchManifestFields(info.fields, item.manifest.fields) : info.fields;
  const data = checkValues(values, fields);
  requireCondition(typeof output === "string" && formatFromPath(output) === info.format, "E_INPUT", "\uCD9C\uB825 \uD655\uC7A5\uC790\uB294 \uC785\uB825 \uBB38\uC11C\uC640 \uAC19\uC544\uC57C \uD569\uB2C8\uB2E4.");
  requireCondition(path3.resolve(output) !== path3.resolve(item.filePath), "E_OUTPUT_EXISTS", "\uC6D0\uBCF8\uC744 \uB36E\uC5B4\uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8 \uCD9C\uB825 \uACBD\uB85C\uB97C \uC9C0\uC815\uD558\uC138\uC694.");
  const base = { operation: "field-fill", format: info.format, templateSha256: info.sha256, fields: fields.map((field) => field.name), visualValidation: "not-performed" };
  const adapter = await loaders[info.format]();
  const result = await adapter.fill(item.bytes, data, context);
  const candidate = Buffer.from(result.bytes);
  validateSignature(candidate, info.format);
  const validation = await adapter.validate(candidate, context);
  const checks = [...result.checks ?? [], ...validation.checks ?? []];
  requireCondition(!checks.some((check2) => check2.status === "failed"), "E_PRESERVATION", "\uC785\uB825 \uACB0\uACFC\uC758 \uAC80\uC99D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
  requireCondition(sha256(await readDocument(item.filePath)) === info.sha256, "E_TEMPLATE_CHANGED", "\uC791\uC5C5 \uC911 \uC6D0\uBCF8\uC774 \uBCC0\uACBD\uB410\uC2B5\uB2C8\uB2E4. \uC0C8 \uC6D0\uBCF8\uC744 \uD655\uC778\uD558\uC138\uC694.");
  const valuesReread = checks.some((check2) => ["field-values-reread", "exact-field-values"].includes(check2.name) && ["pass", "passed"].includes(check2.status));
  const report = {
    ...base,
    engine: result.engine ?? info.engine,
    checks,
    completion: { ...info.completion, fieldVerification: {
      source: valuesReread ? "candidate-reread" : "not-performed",
      verifiedFields: valuesReread ? fields.length : 0
    } },
    layout: result.layout ?? { policy: overflow },
    warnings: [...result.warnings ?? [], ...validation.warnings ?? []]
  };
  if (dryRun) return { ...report, dryRun: true, output: path3.resolve(output), publication: "not-attempted" };
  const published = await publishNewFile(output, candidate);
  return { ...report, output: published.path, outputSha256: sha256(candidate), warnings: [...report.warnings, ...published.warnings] };
}
export {
  FillError,
  defaultLibrary,
  fillDocument,
  findTemplate,
  formatFromPath,
  inspectDocument,
  inspectFile,
  listTemplates,
  publishNewFile,
  readDocument,
  readJson,
  registerTemplate,
  requireCondition,
  sha256,
  validateFile,
  validateManifest
};
