import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const pluginRoot = path.join(root, 'plugins/fill-documents');
const skillRoot = path.join(pluginRoot, 'skills/fill-documents');
const require = createRequire(path.join(skillRoot, 'package.json'));
const PizZip = require('pizzip');
const json = async filename => JSON.parse(await fs.readFile(filename, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = await json(path.join(pluginRoot, 'plugin.json'));
assert.equal(manifest.name, 'fill-documents');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
const allowed = ['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions'];
assert(Object.keys(manifest).every(key => allowed.includes(key)), 'Portable manifest contains unsupported top-level fields');
const ui = manifest.extensions['com.openai'].interface;
assert(ui.displayName.length <= 30 && ui.shortDescription.length <= 30 && ui.longDescription.length <= 4000);
const publication = manifest.extensions['com.openai'].publication;
assert.deepEqual(publication.countries, [], 'Release must retain the selected all-country availability');
assert(publication.release_notes.trim().length > 0);
assert(publication.translations['ko-KR'].subtitle.length <= 30);
assert(publication.translations['ko-KR'].description.trim().length > 0);
assert.doesNotMatch(ui.longDescription, /\b(?:free|pricing|subscription|payments?|purchases?|discounts?|promotions?)\b/i, 'Listing descriptions must not advertise pricing or promotions');
assert.doesNotMatch(publication.translations['ko-KR'].description, /무료|구독|결제|할인|프로모션/, 'Korean listing descriptions must not advertise pricing or promotions');
assert.equal(manifest.extensions['com.openai'].review.commerce, false);
assert(Array.isArray(ui.capabilities) && ui.capabilities.every(value => typeof value === 'string'));
for (const filename of ['package.json', 'plugins/fill-documents/skills/fill-documents/package.json', 'plugins/fill-documents/skills/fill-documents/package-lock.json']) {
  assert.equal((await json(path.join(root, filename))).version, manifest.version, `Release version mismatch: ${filename}`);
}
// The publisher requested yback as package branding; the directory can override it with its verified identity.
assert.equal(ui.developerName, 'yback');
assert.equal(manifest.author.name, 'yback');
assert.equal(manifest.license, 'MIT');
for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) assert.match(ui[field], /^https:\/\/github\.com\/yback1223\/fill-documents/);
for (const field of ['logo', 'composerIcon', 'logoDark', 'composerIconDark']) {
  assert(!ui[field].includes('..'));
  const bytes = await fs.readFile(path.join(pluginRoot, ui[field]));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(bytes.length <= 5 * 1024 * 1024);
  assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  assert(bytes.readUInt32BE(16) >= 256 && bytes.readUInt32BE(16) <= 4096);
}
for (const compatibility of ['.claude-plugin', '.codex-plugin']) {
  const overlay = await json(path.join(pluginRoot, compatibility, 'plugin.json'));
  for (const key of ['name', 'version', 'description', 'author', 'homepage', 'repository', 'license']) assert.deepEqual(overlay[key], manifest[key]);
  assert(!overlay.apps && !overlay.extensions?.['com.openai']?.apps);
}
const codex = await json(path.join(pluginRoot, '.codex-plugin/plugin.json'));
assert.deepEqual(codex.interface, ui);
assert.deepEqual(codex.extensions['com.openai'].publication, publication);
assert.deepEqual(codex.extensions['com.openai'].review, manifest.extensions['com.openai'].review);
for (const name of ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']) {
  const marketplace = await json(path.join(root, name));
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, manifest.name);
}
const build = await json(path.join(skillRoot, 'lib/vendor/build-info.json'));
for (const [source, expected] of Object.entries(build.sourceHashes)) assert.equal(hash(await fs.readFile(path.join(skillRoot, source))), expected, `Stale runtime: ${source}`);
assert((await fs.readFile(path.join(pluginRoot, 'README.md'), 'utf8')).split(/\s+/).length >= 40, 'Plugin needs its own listing README');
async function validateFileSizes(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const filename = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `Plugin must not load symlinks: ${filename}`);
    if (entry.isDirectory()) await validateFileSizes(filename);
    else assert((await fs.stat(filename)).size < 5 * 1024 * 1024, `Claude directory file exceeds 5 MiB: ${filename}`);
  }
}
await validateFileSizes(pluginRoot);

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'fill-documents 한글 경로-'));
let count = 0;
let flowCount = 0;
try {
  const guard = path.join(temporary, 'offline.mjs');
  await fs.writeFile(guard, `import net from 'node:net'; import http from 'node:http'; import https from 'node:https'; import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module'; const deny=()=>{throw new Error('Network/process execution forbidden in package test');}; globalThis.fetch=deny; net.Socket.prototype.connect=deny; http.request=deny; http.get=deny; https.request=deny; https.get=deny; for(const key of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])cp[key]=deny; syncBuiltinESMExports();\n`);
  for (const kind of ['plugin', 'skill']) {
    const archivePath = path.join(root, `dist/fill-documents-${kind}-${manifest.version}.zip`);
    const zip = new PizZip(await fs.readFile(archivePath), { checkCRC32: true });
    if (kind === 'plugin') {
      assert.deepEqual(JSON.parse(zip.file('fill-documents/plugin.json').asText()), manifest, 'Packaged metadata differs from the checked source');
      assert.deepEqual(JSON.parse(zip.file('fill-documents/.codex-plugin/plugin.json').asText()), codex, 'Packaged Codex metadata differs from the checked source');
    }
    const destination = path.join(temporary, kind);
    for (const [name, entry] of Object.entries(zip.files)) {
      assert(name.startsWith('fill-documents/'));
      assert(!name.split('/').some(part => ['..', 'node_modules', '.git', '.app.json'].includes(part)));
      assert(!name.includes('\\'));
      if (entry.dir) continue;
      if (name.endsWith('/plugin.json')) {
        const packaged = JSON.parse(entry.asText());
        assert(!packaged.apps && !packaged.extensions?.['com.openai']?.apps);
      }
      const output = path.join(destination, name);
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, entry.asNodeBuffer());
    }
    const extractedSkill = path.join(destination, kind === 'plugin' ? 'fill-documents/skills/fill-documents' : 'fill-documents');
    const cli = path.join(extractedSkill, 'bin/fill-documents.mjs');
    const command = (args, expectedStatus = 0) => {
      const result = spawnSync(process.execPath, ['--import', pathToFileURL(guard).href, cli, ...args], { cwd: temporary, encoding: 'utf8', timeout: 45000, env: { ...process.env, NODE_PATH: '' } });
      assert.equal(result.status, expectedStatus, `${kind} ${args[0]}: ${result.stderr || result.stdout}`);
      const response = JSON.parse(expectedStatus === 0 ? result.stdout : result.stderr);
      assert.equal(response.ok, expectedStatus === 0);
      return response;
    };
    assert.equal(command(['--help']).version, manifest.version);
    assert(command(['doctor']).ready);
    const catalog = command(['templates', 'list', '--library', path.join(temporary, 'empty-library')]);
    assert.equal(catalog.templates.length, 16);
    for (const template of catalog.templates) {
      const details = command(['templates', 'show', template.id]);
      const directory = path.dirname(details.filePath);
      const values = path.join(directory, 'example-data.json');
      const output = path.join(temporary, `${kind}-${template.id}.${template.format}`);
      const before = hash(await fs.readFile(details.filePath));
      const inspected = command(['inspect', details.filePath]);
      assert.deepEqual(inspected.fieldDiscovery, { scope: 'explicit-fields', fullDocumentInventory: false });
      assert.equal(inspected.completion.fullDocumentComplete, false);
      const result = command(['fill', template.id, '--data', values, '--output', output]);
      assert.equal(result.operation, 'field-fill');
      assert.equal(result.completion.scope, 'full');
      assert.equal(result.completion.status, 'incomplete');
      assert.equal(result.completion.fullDocumentComplete, false);
      assert.equal(result.outputSha256, hash(await fs.readFile(output)));
      assert.equal(hash(await fs.readFile(details.filePath)), before);
      const validated = command(['validate', output]);
      assert.equal(validated.completion.fullDocumentComplete, false);
      if (template.id === 'official-letter-docx') {
        const coveragePath = path.join(temporary, `${kind}-coverage.json`);
        await fs.writeFile(coveragePath, JSON.stringify({ version: 1, templateSha256: before,
          slots: inspected.fields.map(field => ({ id: `field.${field.name}`, location: `Explicit field ${field.name}`, status: 'filled',
            evidence: { kind: 'fields', fields: [field.name] } })) }));
        const covered = command(['fill', template.id, '--data', values, '--output', path.join(temporary, `${kind}-covered.docx`), '--coverage', coveragePath, '--dry-run']);
        assert.equal(covered.completion.status, 'requires-review');
        assert.equal(covered.completion.fullDocumentComplete, false);
        const invalid = JSON.parse(await fs.readFile(coveragePath, 'utf8'));
        invalid.templateSha256 = '0'.repeat(64);
        await fs.writeFile(coveragePath, JSON.stringify(invalid));
        assert.equal(command(['fill', template.id, '--data', values, '--output', path.join(temporary, `${kind}-bad-coverage.docx`), '--coverage', coveragePath], 1).error.code, 'E_TEMPLATE_CHANGED');
      }
      assert.equal(command(['fill', template.id, '--data', values, '--output', output], 1).error.code, 'E_OUTPUT_EXISTS');
      count++;
      if (template.id === `report-${template.format}`) {
        const flowValues = { ...await json(values), findings: Array.from({ length: 80 }, (_, i) => `${String(i + 1).padStart(3, '0')}. 가상 내용 확인.`).join('\n') };
        const dataFile = path.join(temporary, `${kind}-${template.format}-flow.json`);
        const flowOutput = path.join(temporary, `${kind}-${template.format}-flow.${template.format}`);
        await fs.writeFile(dataFile, JSON.stringify(flowValues));
        const args = ['fill', template.id, '--data', dataFile, '--output', flowOutput, '--overflow', 'flow'];
        if (template.format === 'pdf') {
          assert.equal(command([...args, '--dry-run'], 1).error.code, 'E_LAYOUT');
          const profileFile = path.join(temporary, `${kind}-pdf-profile.json`);
          await fs.writeFile(profileFile, JSON.stringify({ version: 1, format: 'pdf', templateSha256: before,
            continuations: [{ field: 'findings', sourcePage: 1, repeatFields: ['title', 'author', 'date'],
              label: 'Findings continued', labelBox: { x: 40, y: 810, width: 515, height: 16 },
              sourceFooterBox: { x: 40, y: 12, width: 515, height: 16 },
              footer: 'See the original report for next steps.', footerBox: { x: 40, y: 12, width: 515, height: 16 } }] }));
          args.push('--layout-profile', profileFile);
        }
        const dry = command([...args, '--dry-run']);
        assert.equal(dry.publication, 'not-attempted');
        await assert.rejects(fs.access(flowOutput), { code: 'ENOENT' });
        const filled = command(args);
        assert.equal(filled.layout.policy, 'flow');
        assert.equal(filled.outputSha256, hash(await fs.readFile(flowOutput)));
        if (template.format === 'pdf') {
          assert(filled.layout.pagination.after > filled.layout.pagination.before);
          const continued = command(['inspect', flowOutput]);
          assert.equal(continued.completion.fullDocumentComplete, false);
          assert(continued.warnings.every(warning => !warning.includes('완성 PDF')));
        }
        command(['validate', flowOutput]);
        assert.equal(hash(await fs.readFile(details.filePath)), before);
        flowCount++;
      }
    }
  }
  console.log(JSON.stringify({ ok: true, archives: 2, isolatedTemplateRuns: count, isolatedFlowRuns: flowCount, networkAndChildProcesses: 'blocked', node: process.version, platform: process.platform, publicURLs: 'not-checked-by-this-command', nativeApps: 'not-tested' }, null, 2));
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
