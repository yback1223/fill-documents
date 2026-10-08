import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const plugin = path.join(root, 'plugins/fill-documents');
const skill = path.join(plugin, 'skills/fill-documents');
const require = createRequire(path.join(skill, 'package.json'));
const { build } = require('esbuild');
const PizZip = require('pizzip');
const vendor = path.join(skill, 'lib/vendor');
await fs.mkdir(vendor, { recursive: true });

// kordoc's two CFB imports use createRequire, which esbuild cannot discover.
// Rewrite only these locked dependency imports while bundling; preserve upstream source.
const result = await build({
  absWorkingDir: skill,
  entryPoints: ['scripts/runtime-entry.mjs'],
  outfile: path.join(vendor, 'runtime.mjs'),
  bundle: true, platform: 'node', target: 'node20', format: 'esm',
  minify: false, sourcemap: false, legalComments: 'eof', metafile: true,
  // These optional kordoc features are outside our HWP/HWPX API paths.
  // Do not bundle OCR, browser rendering or native PDF engines.
  external: ['@huggingface/transformers', '@hyzyla/pdfium', 'onnxruntime-node', 'pdfjs-dist', 'pdfjs-dist/*', 'sharp', 'puppeteer-core'],
  banner: { js: "import { createRequire as __fillCreateRequire } from 'node:module'; const require = __fillCreateRequire(import.meta.url);" },
  plugins: [{ name: 'kordoc-static-cfb', setup(builder) {
    builder.onLoad({ filter: /kordoc[\\/]dist[\\/]index\.js$/ }, async ({ path: source }) => {
      const text = await fs.readFile(source, 'utf8');
      const transformed = text.replace('var CFB = require2("cfb");', 'import CFB from "cfb";').replace('var CFB2 = require3("cfb");', 'import CFB2 from "cfb";')
        .replace(/import\("\.\/(?:image-ocr|parser)-[^"/]+\.js"\)/g, 'Promise.reject(new Error("Optional OCR/PDF conversion is outside the Fill Documents runtime"))');
      if (transformed === text || /var CFB2? = require[23]\("cfb"\)/.test(transformed)) throw new Error('Locked kordoc CFB imports changed; inspect before bundling.');
      return { contents: transformed, loader: 'js' };
    });
  } }],
});
await fs.copyFile(path.join(path.dirname(require.resolve('@rhwp/core')), 'rhwp_bg.wasm'), path.join(vendor, 'rhwp_bg.wasm'));
await fs.copyFile(path.join(root, 'LICENSE'), path.join(skill, 'LICENSE'));

const packages = new Map();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes('node_modules/')) continue;
  let directory = path.dirname(path.resolve(skill, input));
  while (directory.includes('node_modules')) {
    try {
      const metadata = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8'));
      if (metadata.name) {
        packages.set(metadata.name, { ...metadata, directory });
        break;
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    directory = path.dirname(directory);
  }
}
const licenseRoot = path.join(skill, 'licenses/dependencies');
await fs.rm(licenseRoot, { recursive: true, force: true });
await fs.mkdir(licenseRoot, { recursive: true });
const notices = ['# Third-party notices', '', 'The runtime bundles the following packages. Original copyright and license texts are retained below. PizZip is used under its MIT option.', ''];
for (const metadata of [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))) {
  const filenames = await fs.readdir(metadata.directory);
  const names = filenames.filter(name => /^(licen[cs]e|copying|copyright|notice)([._-]|$)/i.test(name));
  if (!names.length) {
    for (const filename of filenames.filter(name => /^readme([._-]|$)/i.test(name))) {
      const readme = await fs.readFile(path.join(metadata.directory, filename), 'utf8');
      if (/Permission is hereby granted|Redistribution and use in source/.test(readme)) names.push(filename);
    }
  }
  if (!names.length && !(metadata.name === '@pdf-lib/fontkit' && metadata.version === '1.1.1' && metadata.license === 'MIT')) throw new Error(`Missing license file: ${metadata.name}`);
  const id = metadata.name.replaceAll('/', '__').replaceAll('@', '');
  await fs.mkdir(path.join(licenseRoot, id));
  const links = [];
  if (!names.length) {
    const notice = 'The npm package @pdf-lib/fontkit 1.1.1 declares MIT in its package.json and README but includes no separate LICENSE file. Original author and contributor attribution and license declarations are preserved in the two accompanying files. The standard MIT permission text is reproduced below; this is a redistribution notice, not a claim that upstream supplied a LICENSE file.\n\n';
    const permission = (await fs.readFile(path.join(root, 'LICENSE'), 'utf8')).split('Permission is hereby granted')[1];
    await fs.writeFile(path.join(licenseRoot, id, 'LICENSE-DECLARATION.txt'), notice + 'Authors from upstream package.json: Andrew Dillon; Devon Govett (contributor).\n\nPermission is hereby granted' + permission);
    for (const filename of ['package.json', 'README.md']) await fs.copyFile(path.join(metadata.directory, filename), path.join(licenseRoot, id, filename));
    links.push(`[MIT declaration and original attribution](licenses/dependencies/${id}/LICENSE-DECLARATION.txt)`);
    const source = await fs.readFile(path.join(metadata.directory, 'dist/fontkit.umd.js'), 'utf8');
    const comments = source.match(/\/\*[\s\S]*?\*\/|(?:^[ \t]*\/\/[^\n]*\n)+/gm) ?? [];
    const embeddedNotices = comments.filter(comment => /Copyright|Permission is hereby granted|Licensed under|Apache License/i.test(comment));
    await fs.writeFile(path.join(licenseRoot, id, 'BUNDLED-NOTICES.txt'), embeddedNotices.join('\n\n') + '\n');
  }
  for (const name of names) {
    if (!(await fs.stat(path.join(metadata.directory, name))).isFile()) continue;
    await fs.copyFile(path.join(metadata.directory, name), path.join(licenseRoot, id, name));
    links.push(`[${name}](licenses/dependencies/${id}/${name})`);
  }
  notices.push(`- **${metadata.name} ${metadata.version}** — ${metadata.license ?? 'see license'} — ${links.join(', ')}`);
  if (metadata.name === 'kordoc') {
    await fs.cp(path.join(metadata.directory, 'THIRD_PARTY'), path.join(licenseRoot, id, 'THIRD_PARTY'), { recursive: true });
    notices.push('  - Its upstream [third-party attributions](licenses/dependencies/kordoc/THIRD_PARTY/) are also included. The build rewrites two CFB imports to static imports for bundling and disables optional OCR/PDF parser chunk imports. OCR/native PDF/browser dependencies and model weights are not included.');
  }
}
notices.push('', 'Font: Nanum Gothic, SIL Open Font License 1.1. See [font license](licenses/NanumGothic-OFL.txt) and [provenance](assets/fonts/SOURCES.json).', '');
await fs.writeFile(path.join(skill, 'THIRD_PARTY_NOTICES.md'), notices.join('\n'));
const sourceHashes = {};
for (const input of Object.keys(result.metafile.inputs).filter(name => !name.includes('node_modules/'))) {
  sourceHashes[input] = createHash('sha256').update(await fs.readFile(path.resolve(skill, input))).digest('hex');
}
sourceHashes['package-lock.json'] = createHash('sha256').update(await fs.readFile(path.join(skill, 'package-lock.json'))).digest('hex');
await fs.writeFile(path.join(vendor, 'build-info.json'), JSON.stringify({ sourceHashes }, null, 2) + '\n');

const dist = path.join(root, 'dist');
await fs.mkdir(dist, { recursive: true });
const version = JSON.parse(await fs.readFile(path.join(plugin, 'plugin.json'), 'utf8')).version;
const forbidden = new Set(['node_modules', '.git', '.DS_Store', 'tests', 'scripts', 'package-lock.json']);
async function addTree(zip, source, prefix, kind) {
  for (const entry of (await fs.readdir(source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (forbidden.has(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Symlink is forbidden in distribution: ${entry.name}`);
    const disk = path.join(source, entry.name);
    const name = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await addTree(zip, disk, name, kind);
    else if (entry.isFile()) zip.file(name, await fs.readFile(disk), { date: new Date('2026-10-08T00:00:00Z') });
  }
}
const outputs = [];
for (const [kind, directory] of [['plugin', plugin], ['skill', skill]]) {
  const zip = new PizZip();
  await addTree(zip, directory, 'fill-documents', kind);
  const bytes = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  const name = `fill-documents-${kind}-${version}.zip`;
  await fs.writeFile(path.join(dist, name), bytes);
  outputs.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await fs.writeFile(path.join(dist, 'SHA256SUMS'), outputs.map(item => `${item.sha256}  ${item.name}`).join('\n') + '\n');
console.log(JSON.stringify({ packages: packages.size, outputs }, null, 2));
