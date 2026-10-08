#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const skillRoot = fileURLToPath(new URL('../', import.meta.url));
async function loadRuntime() {
  try { await fs.access(new URL('../lib/vendor/runtime.mjs', import.meta.url)); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const modules = await Promise.all([import('../lib/errors.mjs'), import('../lib/catalog.mjs'), import('../lib/engine.mjs'), import('../lib/io.mjs')]);
    return Object.assign({}, ...modules);
  }
  return import('../lib/vendor/runtime.mjs');
}
const commands = [
  'doctor',
  'templates list [--library DIR]',
  'templates show ID [--library DIR]',
  'templates register FILE --id ID --title TITLE [--library DIR]',
  'inspect FILE [--layout-profile PROFILE.json] [--coverage COVERAGE.json]',
  'fill ID_OR_FILE --data VALUES.json --output OUTPUT [--overflow preserve|flow] [--layout-profile PROFILE.json] [--coverage COVERAGE.json] [--library DIR] [--dry-run]',
  'validate FILE',
];

async function run() {
  let parsed;
  try { parsed = parseArgs({ allowPositionals: true, options: {
    library: { type: 'string' }, data: { type: 'string' }, output: { type: 'string' },
    id: { type: 'string' }, title: { type: 'string' }, 'dry-run': { type: 'boolean' }, overflow: { type: 'string' }, 'layout-profile': { type: 'string' }, coverage: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } }); } catch { throw Object.assign(new Error('명령의 옵션과 인수를 확인하세요. --help로 사용법을 볼 수 있습니다.'), { code: 'E_INPUT' }); }
  const { values: options, positionals } = parsed;
  const [command, action, operand] = positionals;
  if (options.help || !command) return { name: 'fill-documents', version: '0.2.2', commands };
  if (options.coverage !== undefined && !['inspect', 'fill'].includes(command)) {
    throw Object.assign(new Error('--coverage는 inspect 또는 fill에서 사용하세요.'), { code: 'E_INPUT' });
  }
  if (command === 'doctor') {
    const formats = {};
    let runtime;
    try { runtime = await loadRuntime(); } catch { /* report the incomplete installation below */ }
    for (const format of ['hwp', 'hwpx', 'docx', 'pdf']) {
      try {
        if (!runtime) throw new Error('Runtime missing');
        const info = await runtime.inspectFile(path.join(skillRoot, 'assets', 'templates', `report-${format}`, `template.${format}`), skillRoot);
        formats[format] = { ready: info.fields.length > 0 };
      } catch (error) { formats[format] = { ready: false, code: error.code ?? 'E_ENGINE' }; }
    }
    const ready = Number(process.versions.node.split('.')[0]) >= 20 && Object.values(formats).every(item => item.ready);
    if (!ready) process.exitCode = 1;
    return { ok: ready, ready, node: process.version, platform: process.platform, formats, setup: ready ? null : '완성된 배포 패키지를 다시 받거나 소스 스킬 폴더에서 npm ci --ignore-scripts를 실행하세요. 실행 중에는 자동 설치하지 않습니다.', visualValidation: 'not-performed' };
  }
  const runtime = await loadRuntime();
  const { FillError, requireCondition, readJson } = runtime;
  const catalog = runtime;
  const engine = runtime;
  const need = (condition, message) => requireCondition(condition, 'E_INPUT', message);
  need(!options['layout-profile'] || ['inspect', 'fill'].includes(command), '--layout-profile은 inspect 또는 fill에서 사용하세요.');
  const layoutProfile = options['layout-profile'] ? await readJson(options['layout-profile']) : undefined;
  const coverage = options.coverage === undefined ? undefined : await readJson(options.coverage);
  if (command === 'templates' && action === 'list') {
    need(positionals.length === 2, 'templates list 명령의 인수를 확인하세요.');
    const { entries, warnings } = await catalog.listTemplates(skillRoot, options.library);
    return { templates: entries.map(({ manifest, origin, filePath }) => ({ id: manifest.id, title: manifest.title, format: manifest.format, origin, file: filePath, fields: manifest.fields.length })), warnings };
  }
  if (command === 'templates' && action === 'show') {
    need(positionals.length === 3, 'templates show ID를 지정하세요.');
    const { manifest, filePath, origin } = await catalog.findTemplate(operand, skillRoot, options.library);
    return { ...manifest, filePath, origin };
  }
  if (command === 'templates' && action === 'register') {
    need(positionals.length === 3 && options.id && options.title, '파일, --id, --title을 지정하세요.');
    return catalog.registerTemplate({ filePath: path.resolve(operand), id: options.id, title: options.title, skillRoot, library: options.library, inspectDocument: engine.inspectDocument });
  }
  if (command === 'inspect' || command === 'validate') {
    need(positionals.length === 2, '문서 파일을 하나 지정하세요.');
    return command === 'inspect' ? engine.inspectFile(action, skillRoot, { layoutProfile, coverage }) : engine.validateFile(action, skillRoot);
  }
  if (command === 'fill') {
    need(positionals.length === 2 && options.data && options.output, '서식, --data JSON, --output 경로를 지정하세요.');
    return engine.fillDocument({ target: action, values: await readJson(options.data), output: options.output, skillRoot, library: options.library, dryRun: options['dry-run'], overflow: options.overflow, layoutProfile, coverage });
  }
  throw new FillError('E_INPUT', '지원하지 않는 명령입니다.', { commands });
}

try { console.log(JSON.stringify({ ok: true, ...(await run()) }, null, 2)); }
catch (error) {
  const known = typeof error.code === 'string' && /^E_(INPUT|FIELDS|COVERAGE|LAYOUT|TEMPLATE_CHANGED|UNSUPPORTED|PRESERVATION|OUTPUT_EXISTS|IO|ENGINE)$/.test(error.code);
  console.error(JSON.stringify({ ok: false, error: { code: known ? error.code : 'E_ENGINE', message: known ? error.message : '문서 처리에 실패했습니다. 설치 상태와 지원 형식을 확인하세요.', ...(known && error.details ? { details: error.details } : {}) } }, null, 2));
  process.exitCode = 1;
}
