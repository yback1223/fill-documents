import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import CFB from 'cfb';
import PizZip from 'pizzip';
import { markdownToHwpx } from 'kordoc';
import { openHancom } from '../lib/adapters/hancom-runtime.mjs';
import * as hwp from '../lib/adapters/hwp.mjs';
import * as hwpx from '../lib/adapters/hwpx.mjs';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const field = (name, label, maxLength = 200) => ({ name, label, type: 'text', required: true, maxLength, occurrences: 1 });

const templates = [
  {
    category: 'official-letter', title: '공문',
    fields: [field('title', '제목'), field('document_number', '문서번호', 80), field('date', '시행일', 40), field('recipient', '수신', 200), field('sender', '발신', 200), field('body', '내용', 4000), field('contact', '담당 및 연락처', 200)],
    markdown: '# 공문\n\n문서번호: {{document_number}}\n\n시행일: {{date}}\n\n수신: {{recipient}}\n\n발신: {{sender}}\n\n제목: {{title}}\n\n## 내용\n\n{{body}}\n\n담당 및 연락처: {{contact}}',
    example: { title: '가상 교육 프로그램 협력 요청', document_number: '예시-2026-001', date: '2026-10-08', recipient: '가상협력센터 담당자', sender: '예시연구소', body: '예시 교육 프로그램의 공동 운영을 요청합니다.\n세부 일정은 협의 후 확정할 예정입니다.', contact: '김예시 / example@example.invalid' },
  },
  {
    category: 'report', title: '보고서',
    fields: [field('title', '제목'), field('date', '작성일', 40), field('author', '작성자', 100), field('summary', '요약', 2000), field('findings', '주요 내용', 4000), field('next_steps', '후속 조치', 2000)],
    markdown: '# 보고서\n\n제목: {{title}}\n\n작성일: {{date}}\n\n작성자: {{author}}\n\n## 요약\n\n{{summary}}\n\n## 주요 내용\n\n{{findings}}\n\n## 후속 조치\n\n{{next_steps}}',
    example: { title: '가상 시범 운영 결과 보고', date: '2026-10-08', author: '예시연구소 김예시', summary: '교육 자료 시범 운영의 관찰 내용을 정리했습니다.', findings: '참여자 안내 문구를 단순화했습니다.\n자료 배포 순서를 보완할 필요가 있습니다.', next_steps: '보완한 자료를 내부 검토하고 다음 회의에서 확정합니다.' },
  },
  {
    category: 'meeting-minutes', title: '회의록',
    fields: [field('title', '회의명'), field('date', '일시', 80), field('location', '장소', 200), field('attendees', '참석자', 500), field('agenda', '안건', 2000), field('decisions', '결정 사항', 3000), field('actions', '후속 업무', 3000)],
    markdown: '# 회의록\n\n회의명: {{title}}\n\n일시: {{date}}\n\n장소: {{location}}\n\n참석자: {{attendees}}\n\n## 안건\n\n{{agenda}}\n\n## 결정 사항\n\n{{decisions}}\n\n## 후속 업무\n\n{{actions}}',
    example: { title: '가상 교육 자료 검토 회의', date: '2026-10-08 14:00', location: '예시회의실', attendees: '김예시, 이가상', agenda: '안내 자료 구성과 시범 일정 검토', decisions: '안내 문구를 간결하게 수정합니다.\n시범 일정은 다음 회의에서 확정합니다.', actions: '김예시: 자료 초안 보완\n이가상: 검토 의견 취합' },
  },
  {
    category: 'application', title: '신청서',
    fields: [field('title', '신청명'), field('applicant', '신청자', 100), field('organization', '소속', 200), field('contact', '연락처', 200), field('request', '신청 내용', 3000), field('reason', '신청 사유', 3000), field('date', '신청일', 40)],
    markdown: '# 신청서\n\n신청명: {{title}}\n\n신청자: {{applicant}}\n\n소속: {{organization}}\n\n연락처: {{contact}}\n\n## 신청 내용\n\n{{request}}\n\n## 신청 사유\n\n{{reason}}\n\n신청일: {{date}}',
    example: { title: '가상 교육 프로그램 참가 신청', applicant: '김예시', organization: '예시연구소', contact: 'example@example.invalid', request: '기초 교육 프로그램 참가를 신청합니다.', reason: '새로운 교육 자료를 검토하고 내부 업무에 참고하려고 합니다.', date: '2026-10-08' },
  },
];

function removeGeneratedSeedData(bytes) {
  const document = CFB.read(Buffer.from(bytes), { type: 'buffer' });
  const paths = document.FullPaths.filter(path => /\/(?:Scripts|DocOptions)(?:\/|$)|\/(?:PrvText|PrvImage|\u0005?HwpSummaryInformation)$/.test(path)).sort((a, b) => b.length - a.length);
  for (const path of paths) CFB.utils.cfb_del(document, path);
  CFB.utils.cfb_gc(document);
  return new Uint8Array(CFB.write(document, { type: 'buffer' }));
}

for (const template of templates) {
  const source = `${template.markdown}\n\nfill-documents · 자체 기본 서식`;
  const zip = new PizZip(await markdownToHwpx(source));
  zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE' });
  zip.file('Contents/header.xml', zip.file('Contents/header.xml').asText().replace(/face="[^"]*"/g, 'face="NanumGothic"'));
  // The preview is generated from this project's own source, never an external template.
  for (const entry of Object.values(zip.files)) entry.date = new Date('2026-01-01T00:00:00Z');
  const hwpxBytes = zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
  const document = await openHancom(hwpxBytes, { skillRoot });
  let exported;
  let hwpBytes;
  try {
    exported = document.exportHwpWithReport();
    const loss = JSON.parse(exported.contentLoss());
    if (loss.count !== 0 || loss.losses.length !== 0) throw new Error('자체 HWP 생성에서 내용 손실이 보고되었습니다.');
    hwpBytes = removeGeneratedSeedData(exported.takeBytes());
  } finally { exported?.free(); document.free(); }
  for (const [format, bytes, adapter] of [['hwpx', hwpxBytes, hwpx], ['hwp', hwpBytes, hwp]]) {
    const id = `${template.category}-${format}`;
    const directory = join(skillRoot, 'assets/templates', id);
    const inspected = await adapter.inspect(bytes, { skillRoot });
    const expected = template.fields.map(({ name, type, occurrences }) => ({ name, type, occurrences })).sort((a, b) => a.name.localeCompare(b.name));
    if (JSON.stringify(inspected.fields.sort((a, b) => a.name.localeCompare(b.name))) !== JSON.stringify(expected)) throw new Error(`필드 목록 불일치: ${id}`);
    const manifest = { schemaVersion: 1, id, version: '1.0.0', title: template.title, category: template.category, format, file: `template.${format}`, sha256: createHash('sha256').update(bytes).digest('hex'), license: 'MIT', source: 'original', fields: template.fields };
    await adapter.validate(bytes, { skillRoot, manifest });
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, manifest.file), bytes);
    await writeFile(join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(join(directory, 'example-data.json'), `${JSON.stringify(template.example, null, 2)}\n`);
    console.log(`${id}: ${bytes.length} bytes, ${inspected.fields.length} fields`);
  }
}
