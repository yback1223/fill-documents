import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { deflateRawSync, gzipSync, inflateRawSync } from 'node:zlib';
import CFB from 'cfb';
import { markdownToHwpx } from 'kordoc';
import * as hwp from '../lib/adapters/hwp.mjs';
import { characterStyles, hwpContainer, openHancom, paragraphSnapshot } from '../lib/adapters/hancom-runtime.mjs';
import { decodeHwpDocInfo, parseHwpRecords, verifyHwpFlowChanges, verifyHwpFlowLayout, writeHwpContainer } from '../lib/adapters/hwp-flow.mjs';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const context = { skillRoot, overflow: 'flow' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rejectCode = code => error => { assert.equal(error.code, code); return true; };
const defaults = new Map([
  ['Scripts/JScriptVersion', Buffer.from('0100000000000000', 'hex')],
  ['Scripts/DefaultJScript', Buffer.from('00000000000000000000000000000000ffffffff', 'hex')],
]);

async function fixture() {
  const directory = join(skillRoot, 'assets/templates/report-hwp');
  return { bytes: await readFile(join(directory, 'template.hwp')), values: JSON.parse(await readFile(join(directory, 'example-data.json'), 'utf8')) };
}

async function generated(markdown) {
  const document = await openHancom(new Uint8Array(await markdownToHwpx(markdown)), context);
  const exported = document.exportHwpWithReport();
  try { return exported.takeBytes(); } finally { exported.free(); document.free(); }
}

function withStreams(bytes, streams, remove = []) {
  const container = CFB.read(Buffer.from(bytes), { type: 'buffer' });
  for (const name of remove) CFB.utils.cfb_del(container, `/${name}`);
  for (const [name, data] of streams) CFB.utils.cfb_add(container, `/${name}`, data);
  if (remove.length) CFB.utils.cfb_gc(container);
  return new Uint8Array(CFB.write(container, { type: 'buffer' }));
}

function modelFor(document) {
  const paragraphs = paragraphSnapshot(document);
  const occurrences = paragraphs.flatMap(paragraph => [...paragraph.text.matchAll(/\{\{([A-Za-z][A-Za-z0-9_]*)\}\}/g)].map(match => ({ name: match[1], start: match.index, end: match.index + match[0].length, paragraph })));
  return { paragraphs, occurrences, targets: new Set(occurrences.map(field => field.paragraph)), fields: occurrences.map(({ name }) => ({ name, type: 'text', occurrences: 1 })) };
}

function changedRecord(streams, predicate, mutate) {
  const next = new Map(streams);
  const body = Buffer.from(inflateRawSync(next.get('BodyText/Section0')));
  const record = parseHwpRecords(body).find(predicate);
  assert.ok(record, 'mutation must match a real record');
  mutate(body, record);
  next.set('BodyText/Section0', deflateRawSync(body));
  return next;
}

test('HWP flow: 8,000 continuous characters reflow, with exact values, styles, original streams and final visible character', async () => {
  const { bytes, values } = await fixture();
  const originalHash = hash(bytes);
  const atom = '긴 내용을 다음 줄과 다음 페이지까지 보존합니다. ';
  const value = atom.repeat(300).slice(0, 7995) + '끝검사표식';
  const original = await openHancom(bytes, context);
  const result = await hwp.fill(bytes, { ...values, findings: value }, context);
  const after = await openHancom(result.bytes, context);
  try {
    assert.equal(value.length, 8000);
    assert.equal(result.layout.pagination.before, 1);
    assert.equal(result.layout.pagination.after, after.pageCount());
    assert.ok(after.pageCount() >= 4);
    assert.ok(result.layout.lastCharacters.find(field => field.field === 'findings').page >= 4);
    assert.equal(result.visualValidation, 'not-performed');
    const beforeParagraphs = paragraphSnapshot(original);
    const afterParagraphs = paragraphSnapshot(after);
    assert.equal(beforeParagraphs.length, afterParagraphs.length);
    for (const [index, before] of beforeParagraphs.entries()) {
      const paragraph = afterParagraphs[index];
      assert.equal(paragraph.paragraphStyle, before.paragraphStyle);
      const expected = before.text.replace(/\{\{(\w+)\}\}/g, (_, name) => name === 'findings' ? value : values[name]);
      assert.equal(paragraph.text, expected);
      if (before.text.includes('{{')) assert.ok(characterStyles(after, paragraph).every(style => style === characterStyles(original, before)[0]));
      else assert.deepEqual(characterStyles(after, paragraph), characterStyles(original, before));
    }
    const sourceStreams = hwpContainer(bytes);
    const outputStreams = hwpContainer(result.bytes);
    assert.deepEqual([...sourceStreams.keys()].sort(), [...outputStreams.keys()].sort());
    for (const [name, content] of sourceStreams) if (!name.startsWith('BodyText/')) assert.deepEqual(outputStreams.get(name), content, name);
    assert.equal(hash(bytes), originalHash);
    const preserved = await hwp.fill(bytes, { ...values, findings: value }, { skillRoot });
    const old = await openHancom(preserved.bytes, context);
    try { assert.equal(old.pageCount(), 1, 'default preserve remains the original layout policy'); } finally { old.free(); }
  } finally { after.free(); original.free(); }
});

test('HWP flow: explicit line breaks, blank lines, spaces, emoji and CRLF normalization remain exact', async () => {
  const { bytes, values } = await fixture();
  for (const value of ['긴 내용을 다음 줄과 다음 페이지까지 보존합니다.\n'.repeat(285).slice(0, 7995) + '끝검사표식', '앞  공백 & <태그> 😀\r\n\r\n다음 줄\r끝\n']) {
    const output = await hwp.fill(bytes, { ...values, findings: value }, context);
    const reopened = await openHancom(output.bytes, context);
    try {
      assert.ok(paragraphSnapshot(reopened).some(paragraph => paragraph.text === value.replace(/\r\n?/g, '\n')));
      if (value.length > 1000) assert.ok(reopened.pageCount() > 1);
    } finally { reopened.free(); }
  }
});

test('HWP flow: adjacent fields retain exact Unicode offsets after the first value grows', async () => {
  const bytes = await generated('고정 제목\n\n{{first}} / {{second}}');
  const values = { first: '😀'.repeat(100) + '\n끝', second: '둘째 값' };
  const output = await hwp.fill(bytes, values, context);
  const reopened = await openHancom(output.bytes, context);
  try {
    assert.ok(paragraphSnapshot(reopened).some(paragraph => paragraph.text === `${values.first} / ${values.second}`));
    assert.deepEqual(output.layout.lastCharacters.map(field => field.field), ['first', 'second']);
    assert.ok(output.layout.lastCharacters.every(field => Number.isFinite(field.x) && Number.isFinite(field.y) && field.page > 0));
  } finally { reopened.free(); }
});

test('HWP neutral Scripts: only the exact two inflated payloads and their valid CRC/size footer are accepted and retained', async () => {
  const { bytes, values } = await fixture();
  const scripts = [...defaults].map(([name, data]) => [name, gzipSync(data).subarray(10)]);
  const source = withStreams(bytes, scripts);
  assert.ok(hwpContainer(source).has('Scripts/DefaultJScript'));
  const output = await hwp.fill(source, values, context);
  for (const [name, data] of scripts) assert.deepEqual(hwpContainer(output.bytes).get(name), data);
  const plainRaw = withStreams(bytes, [...defaults].map(([name, data]) => [name, deflateRawSync(data)]));
  assert.ok(hwpContainer(plainRaw).has('Scripts/DefaultJScript'));
  const changed = Buffer.from(defaults.get('Scripts/DefaultJScript')); changed[0] = 1;
  const flags = Buffer.from(hwpContainer(source).get('FileHeader')); flags.writeUInt32LE(9, 36);
  const bad = [
    withStreams(source, [['Scripts/Extra', deflateRawSync(Buffer.alloc(0))]]),
    withStreams(source, [], ['Scripts/JScriptVersion']),
    withStreams(source, [['Scripts/DefaultJScript', deflateRawSync(changed)]]),
    withStreams(source, [['Scripts/DefaultJScript', Buffer.from('broken deflate')]]),
    withStreams(source, [['Scripts/DefaultJScript', deflateRawSync(Buffer.alloc(21))]]),
    withStreams(source, [['Scripts/DefaultJScript', Buffer.concat([scripts[1][1], Buffer.from('extra')])]]),
    withStreams(source, [['FileHeader', flags]]),
    withStreams(source, [['Scripts/jscriptversion', scripts[0][1]]], ['Scripts/JScriptVersion']),
  ];
  for (const candidate of bad) assert.throws(() => hwpContainer(candidate), rejectCode('E_UNSUPPORTED'));
});

test('HWP flow: the CFB writer never adds its private seed stream to an original without it', async () => {
  const { bytes, values } = await fixture();
  const originalStreams = hwpContainer(bytes);
  originalStreams.delete('\u0001Sh33tJ5');
  const withoutSeed = writeHwpContainer(CFB.read(bytes, { type: 'buffer' }), originalStreams);
  assert.equal(hwpContainer(withoutSeed).has('\u0001Sh33tJ5'), false);
  const result = await hwp.fill(withoutSeed, values, context);
  assert.deepEqual([...hwpContainer(result.bytes).keys()].sort(), [...originalStreams.keys()].sort());
  for (const [name, data] of originalStreams) if (!name.startsWith('BodyText/')) assert.deepEqual(hwpContainer(result.bytes).get(name), data);
});

test('HWP flow: different DocInfo compression is accepted only for identical full payload, keeping the source bytes', async () => {
  const { bytes, values } = await fixture();
  const originalStreams = hwpContainer(bytes);
  const payload = inflateRawSync(originalStreams.get('DocInfo'));
  const encoded = Buffer.concat([deflateRawSync(payload, { level: 0 }), gzipSync(payload).subarray(-8)]);
  assert.ok(!encoded.equals(originalStreams.get('DocInfo')));
  const source = withStreams(bytes, [['DocInfo', encoded]]);
  const result = await hwp.fill(source, values, context);
  assert.deepEqual(hwpContainer(result.bytes).get('DocInfo'), encoded);
  assert.deepEqual(decodeHwpDocInfo(hwpContainer(result.bytes)), payload);

  const document = await openHancom(source, context);
  try {
    const changedPayload = Buffer.from(payload); changedPayload[0] ^= 1;
    const tampered = hwpContainer(result.bytes);
    tampered.set('DocInfo', Buffer.concat([deflateRawSync(changedPayload), gzipSync(changedPayload).subarray(-8)]));
    assert.throws(() => verifyHwpFlowChanges(hwpContainer(source), tampered, modelFor(document), values), rejectCode('E_PRESERVATION'));
  } finally { document.free(); }
});

test('HWP DocInfo decoder: valid CRC/size footer is narrow; extra bytes, bad footer, concatenation and expansion are rejected', async () => {
  const { bytes } = await fixture();
  const streams = hwpContainer(bytes);
  const payload = inflateRawSync(streams.get('DocInfo'));
  const raw = deflateRawSync(payload);
  const footer = gzipSync(payload).subarray(-8);
  const badCrc = Buffer.from(footer); badCrc[0] ^= 1;
  const badSize = Buffer.from(footer); badSize[4] ^= 1;
  for (const encoded of [raw, Buffer.concat([raw, footer])]) {
    const input = new Map(streams); input.set('DocInfo', encoded);
    assert.deepEqual(decodeHwpDocInfo(input), payload);
  }
  for (const encoded of [
    Buffer.concat([raw, Buffer.from([0])]),
    Buffer.concat([raw, footer, Buffer.from([0])]),
    Buffer.concat([raw, badCrc]),
    Buffer.concat([raw, badSize]),
    Buffer.concat([raw, deflateRawSync(Buffer.from('second stream'))]),
    deflateRawSync(Buffer.alloc(32 * 1024 * 1024 + 1)),
  ]) {
    const input = new Map(streams); input.set('DocInfo', encoded);
    assert.throws(() => decodeHwpDocInfo(input), rejectCode('E_PRESERVATION'));
  }
  const uncompressed = new Map(streams);
  const header = Buffer.from(uncompressed.get('FileHeader')); header.writeUInt32LE(0, 36);
  uncompressed.set('FileHeader', header); uncompressed.set('DocInfo', payload);
  assert.deepEqual(decodeHwpDocInfo(uncompressed), payload, 'FileHeader controls whether the entire stream is already uncompressed');
});

test('HWP standalone inspect: safe raw paragraph fallback reports flow requirement while preserve fill still rejects', async () => {
  const document = await openHancom(await generated('고정 제목\n\n{{value}}'), context);
  let exported;
  let bytes;
  try {
    const bulletId = document.ensureDefaultBullet('•');
    assert.equal(JSON.parse(document.applyParaFormat(0, 1, JSON.stringify({ headType: 'Bullet', numberingId: bulletId }))).ok, true);
    exported = document.exportHwpWithReport();
    bytes = exported.takeBytes();
  } finally { exported?.free(); document.free(); }
  const info = await hwp.inspect(bytes, { skillRoot });
  assert.deepEqual(info.fields, [{ name: 'value', type: 'text', occurrences: 1 }]);
  assert.equal(info.requiredOverflow, 'flow');
  assert.ok(info.warnings.some(warning => warning.includes('--overflow flow')));
  await assert.rejects(hwp.fill(bytes, { value: '원시 본문 대응으로 채운 값' }, { skillRoot }), rejectCode('E_PRESERVATION'));
  const result = await hwp.fill(bytes, { value: '원시 본문 대응으로 채운 값' }, context);
  assert.equal(result.layout.policy, 'flow');
  for (const markdown of ['고정 제목\n\n{{value}} **굵은 뒷부분**', '| 항목 | 값 |\n| --- | --- |\n| 본문 | {{value}} |']) await assert.rejects(hwp.inspect(await generated(markdown), { skillRoot }), rejectCode('E_PRESERVATION'));
});

test('HWP flow fills the existing mixed-style bullet prefix without changing any character-style run', async () => {
  const bytes = await generated('고정 제목\n\n**사업 목표:** {{value}}\n\n다음 항목');
  const original = await openHancom(bytes, context);
  const originalParagraph = paragraphSnapshot(original).find(p => p.text.includes('{{value}}'));
  const prefixLength = originalParagraph.text.indexOf('{{value}}');
  const styles = characterStyles(original, originalParagraph);
  assert.ok(new Set(styles).size > 1, 'the test must exercise a mixed-style paragraph');
  const beforeRuns = parseHwpRecords(inflateRawSync(hwpContainer(bytes).get('BodyText/Section0'))).filter(r => r.tag === 68).map(r => r.raw);
  try {
    assert.equal((await hwp.inspect(bytes, { skillRoot })).requiredOverflow, 'flow');
    for (const value of ['기록 누락 감소', '업무 기록의 누락을 확인하고 담당자가 수정하도록 안내합니다. '.repeat(90)]) {
      const result = await hwp.fill(bytes, { value }, context);
      const next = await openHancom(result.bytes, context);
      try {
        const p = paragraphSnapshot(next)[originalParagraph.paragraph];
        assert.equal(p.text, originalParagraph.text.replace('{{value}}', value));
        const actualStyles = characterStyles(next, p);
        assert.deepEqual(actualStyles.slice(0, prefixLength), styles.slice(0, prefixLength));
        assert.ok(actualStyles.slice(prefixLength).every(s => s === styles[prefixLength]));
        assert.deepEqual(parseHwpRecords(inflateRawSync(hwpContainer(result.bytes).get('BodyText/Section0'))).filter(r => r.tag === 68).map(r => r.raw), beforeRuns);
      } finally { next.free(); }
    }
    for (const markdown of ['앞 {{val**ue}}**', '앞 {{value}} **다른 서식**']) {
      await assert.rejects(hwp.fill(await generated(markdown), { value: '시험' }, context), rejectCode('E_LAYOUT'));
    }
  } finally { original.free(); }
});

test('HWP flow: actual native candidate passes, but changed styles, non-target text/geometry and unrelated sections are refused', async () => {
  const { bytes, values } = await fixture();
  const input = { ...values, findings: '가나다라마바사'.repeat(900) };
  const source = await openHancom(bytes, context);
  try {
    const model = modelFor(source);
    const output = await hwp.fill(bytes, input, context);
    const before = hwpContainer(bytes);
    const after = hwpContainer(output.bytes);
    assert.deepEqual(verifyHwpFlowChanges(before, after, model, input), ['BodyText/Section0']);
    for (const [predicate, offset] of [
      [record => record.paragraph === 7 && record.tag === 66, 8],
      [record => record.paragraph === 7 && record.tag === 67, 0],
      [record => record.paragraph === 7 && record.tag === 68, 4],
      [record => record.paragraph === 8 && record.tag === 67, 0],
      [record => record.paragraph === 8 && record.tag === 69, 24],
      [record => record.paragraph === 0 && record.tag === 69, 4],
    ]) {
      const mutated = changedRecord(after, predicate, (body, record) => { body[record.offset + record.headerSize + offset] ^= 1; });
      assert.throws(() => verifyHwpFlowChanges(before, mutated, model, input), rejectCode('E_PRESERVATION'));
    }
    for (const name of ['FileHeader', 'DocInfo']) {
      const mutated = new Map(after); const content = Buffer.from(mutated.get(name)); content[0] ^= 1; mutated.set(name, content);
      assert.throws(() => verifyHwpFlowChanges(before, mutated, model, input), rejectCode('E_PRESERVATION'));
    }
    const withSection = new Map(before); withSection.set('BodyText/Section1', before.get('BodyText/Section0'));
    const afterSection = new Map(after); afterSection.set('BodyText/Section1', after.get('BodyText/Section0'));
    assert.throws(() => verifyHwpFlowChanges(withSection, afterSection, model, input), rejectCode('E_PRESERVATION'));
  } finally { source.free(); }
});

test('HWP record reader: truncated, oversized, deep, discontinuous and excessive records fail closed', () => {
  const header = (tag, level, size) => { const bytes = Buffer.alloc(4); bytes.writeUInt32LE((tag | level << 10 | size << 20) >>> 0); return bytes; };
  for (const bytes of [Buffer.from([1]), header(66, 0, 0xfff), Buffer.concat([header(66, 0, 0xfff), Buffer.from([255, 255, 255, 127])]), header(66, 65, 0), Buffer.concat([header(66, 0, 0), header(67, 2, 0)]), Buffer.concat(Array.from({ length: 100001 }, () => header(66, 0, 0)))]) assert.throws(() => parseHwpRecords(bytes), rejectCode('E_INPUT'));
});

test('HWP flow layout: overflow, missing glyph runs and wrong rendered text cannot claim success', async () => {
  const { bytes, values } = await fixture();
  const source = await openHancom(bytes, context);
  const output = await hwp.fill(bytes, values, context);
  const document = await openHancom(output.bytes, context);
  try {
    const model = modelFor(source);
    for (const mutate of [
      layout => { layout.runs.find(run => run.paraIdx === 7).x = 99999; },
      layout => { layout.runs = layout.runs.filter(run => run.paraIdx !== 7); },
      layout => { layout.runs.find(run => run.paraIdx === 7).text = '다른 값'; },
      layout => { layout.runs.find(run => run.paraIdx === 0 && run.text.trim()).x = 99999; },
    ]) {
      const fake = { pageCount: () => document.pageCount(), getPageInfo: page => document.getPageInfo(page), getPageTextLayout: page => { const layout = JSON.parse(document.getPageTextLayout(page)); mutate(layout); return JSON.stringify(layout); } };
      assert.throws(() => verifyHwpFlowLayout(fake, model, values, 1), rejectCode('E_LAYOUT'));
    }
    const withNestedParagraph = {
      pageCount: () => document.pageCount(), getPageInfo: page => document.getPageInfo(page),
      getPageTextLayout: page => {
        const layout = JSON.parse(document.getPageTextLayout(page));
        const run = layout.runs.find(item => item.paraIdx === 7);
        if (run) layout.runs.push({ ...run, parentParaIdx: 0, controlIdx: 0, cellIdx: 0, text: '별도 표 셀' });
        return JSON.stringify(layout);
      },
    };
    assert.doesNotThrow(() => verifyHwpFlowLayout(withNestedParagraph, model, values, 1));
  } finally { source.free(); document.free(); }
});

test('HWP flow: table, mixed-format, repeated fields and tab controls are explicit unsupported layouts', async () => {
  for (const markdown of ['제목\n\n{{value}} 혼합 **강조**', '제목\n\n{{value}}\n\n{{value}}', '| 항목 | 값 |\n| --- | --- |\n| 본문 | {{value}} |']) {
    const bytes = await generated(markdown);
    await assert.rejects(hwp.inspect(bytes, context), rejectCode('E_LAYOUT'));
    await assert.rejects(hwp.fill(bytes, { value: '새 값' }, context), rejectCode('E_LAYOUT'));
  }
  const { bytes, values } = await fixture();
  await assert.rejects(hwp.fill(bytes, { ...values, findings: '앞\t뒤' }, context), rejectCode('E_LAYOUT'));
  await assert.rejects(hwp.fill(bytes, { ...values, findings: '가'.repeat(10001) }, context), rejectCode('E_FIELDS'));
});
