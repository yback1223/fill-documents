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
try {
  const guard = path.join(temporary, 'offline.mjs');
  await fs.writeFile(guard, `import net from 'node:net'; import http from 'node:http'; import https from 'node:https'; import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module'; const deny=()=>{throw new Error('Network/process execution forbidden in package test');}; globalThis.fetch=deny; net.Socket.prototype.connect=deny; http.request=deny; http.get=deny; https.request=deny; https.get=deny; for(const key of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])cp[key]=deny; syncBuiltinESMExports();\n`);
  for (const kind of ['plugin', 'skill']) {
    const archivePath = path.join(root, `dist/fill-documents-${kind}-${manifest.version}.zip`);
    const zip = new PizZip(await fs.readFile(archivePath), { checkCRC32: true });
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
    assert(command(['doctor']).ready);
    const catalog = command(['templates', 'list', '--library', path.join(temporary, 'empty-library')]);
    assert.equal(catalog.templates.length, 16);
    for (const template of catalog.templates) {
      const details = command(['templates', 'show', template.id]);
      const directory = path.dirname(details.filePath);
      const values = path.join(directory, 'example-data.json');
      const output = path.join(temporary, `${kind}-${template.id}.${template.format}`);
      const before = hash(await fs.readFile(details.filePath));
      const result = command(['fill', template.id, '--data', values, '--output', output]);
      assert.equal(result.outputSha256, hash(await fs.readFile(output)));
      assert.equal(hash(await fs.readFile(details.filePath)), before);
      command(['validate', output]);
      assert.equal(command(['fill', template.id, '--data', values, '--output', output], 1).error.code, 'E_OUTPUT_EXISTS');
      count++;
    }
  }
  console.log(JSON.stringify({ ok: true, archives: 2, isolatedTemplateRuns: count, networkAndChildProcesses: 'blocked', node: process.version, platform: process.platform, publicURLs: 'not-checked-by-this-command', nativeApps: 'not-tested' }, null, 2));
} finally { await fs.rm(temporary, { recursive: true, force: true }); }
