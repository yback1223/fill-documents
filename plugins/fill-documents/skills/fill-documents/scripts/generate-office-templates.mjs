import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const fixedDate = new Date('2026-10-08T00:00:00.000Z');
const field = (name, label, maxLength, height, multiline = false) => ({ name, label, maxLength, height, multiline });

export const templateDefinitions = [
  {
    category: 'official-letter', title: '공문',
    fields: [field('document_number', '문서 번호', 60, 24), field('date', '시행일', 30, 24), field('recipient', '수신', 120, 28), field('sender', '발신', 120, 28), field('title', '제목', 180, 44, true), field('body', '본문', 2500, 290, true), field('attachments', '첨부', 600, 64, true)],
    example: { document_number: '예시-2026-001', date: '2026-10-08', recipient: '가상 협력기관 담당자', sender: '가상 문서연구소', title: '문서 작성 워크숍 협조 요청', body: '※ 실제 기관·행사와 무관한 가상 예시입니다.\n\n문서 작성 워크숍 준비를 위해 회의실 사용 가능 여부를 확인해 주시기 바랍니다.\n예시 일정: 2026년 10월 20일 14:00~16:00\n예시 인원: 12명', attachments: '1. 가상 워크숍 계획안 1부.\n끝.' },
  },
  {
    category: 'report', title: '보고서',
    fields: [field('title', '제목', 180, 48, true), field('author', '작성자', 80, 26), field('date', '작성일', 30, 26), field('summary', '요약', 900, 108, true), field('findings', '주요 내용', 1800, 190, true), field('next_steps', '후속 조치', 900, 112, true)],
    example: { title: '가상 문서 작성 실험 결과', author: '예시 담당자', date: '2026-10-08', summary: '실제 조사 결과가 아닌 예시입니다.\n빈 서식과 입력 데이터를 분리하는 방법을 검토했습니다.', findings: '1. 문서마다 필요한 필드를 확인했습니다.\n2. 입력값을 새 파일에 적용했습니다.\n3. 원본 파일이 유지되는지 비교했습니다.\n\n위 내용과 수치는 서식 시연을 위한 가상 자료입니다.', next_steps: '담당자가 실제 사실과 일정을 확인한 뒤 내용을 교체합니다.\n배포 전 최종 페이지 배치를 확인합니다.' },
  },
  {
    category: 'meeting-minutes', title: '회의록',
    fields: [field('title', '회의명', 160, 44, true), field('date', '일시', 80, 28), field('location', '장소', 80, 28), field('attendees', '참석자', 300, 52, true), field('agenda', '안건', 800, 90, true), field('decisions', '논의·결정', 1400, 130, true), field('actions', '후속 조치', 1000, 100, true)],
    example: { title: '가상 서식 검토 회의', date: '2026-10-08 10:00~10:30', location: '예시 회의실', attendees: '예시 담당자 A, 예시 담당자 B\n모든 인물과 회의는 가상입니다.', agenda: '빈 서식의 필드와 작성 순서 검토\n한글 및 여러 줄 입력 방식 확인', decisions: '제목·일시·참석자를 먼저 입력합니다.\n결정 사항과 후속 조치를 별도 항목으로 기록합니다.', actions: '예시 담당자 A: 필드 목록 확인\n예시 담당자 B: 최종 페이지 배치 확인' },
  },
  {
    category: 'application', title: '신청서',
    fields: [field('title', '신청명', 160, 44, true), field('applicant', '신청인', 80, 28), field('organization', '소속', 120, 28), field('contact', '연락처', 100, 28), field('details', '신청 내용', 1600, 190, true), field('reason', '신청 사유', 1000, 120, true), field('date', '신청일', 30, 28)],
    example: { title: '가상 문서 워크숍 참가 신청', applicant: '예시 신청인', organization: '가상 문서연구소', contact: 'example@example.invalid', details: '실제 신청이 아닌 서식 작성 예시입니다.\n문서 작성 워크숍에 1명 참가를 신청합니다.', reason: '빈 서식을 이용한 문서 작성 과정을 익히기 위한 가상 예시입니다.', date: '2026-10-08' },
  },
];

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function createDocxTemplate(definition) {
  const zip = new PizZip();
  const put = (name, value) => zip.file(name, value, { date: fixedDate, createFolders: false });
  const paragraph = (text, style = 'Normal') => `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  const rows = definition.fields.map((item) => `<w:tr><w:trPr><w:trHeight w:val="${Math.round(item.height * 14)}" w:hRule="atLeast"/><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="1600" w:type="dxa"/><w:shd w:fill="F2F4F5"/><w:vAlign w:val="top"/></w:tcPr>${paragraph(item.label, 'Label')}</w:tc><w:tc><w:tcPr><w:tcW w:w="7720" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>${paragraph(`{{${item.name}}}`)}</w:tc></w:tr>`).join('');
  put('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
  put('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
  put('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>');
  put('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${paragraph('fill-documents', 'Brand')}${paragraph(definition.title, 'Title')}<w:tbl><w:tblPr><w:tblW w:w="9320" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="475569"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="8" w:color="475569"/><w:right w:val="nil"/><w:insideH w:val="single" w:sz="4" w:color="CBD5E1"/><w:insideV w:val="nil"/></w:tblBorders><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="110" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="1600"/><w:gridCol w:w="7720"/></w:tblGrid>${rows}</w:tbl>${paragraph('자체 제작 기본 서식 · 기관 지정 서식이 필요한 경우 해당 양식을 사용하세요.', 'Note')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1293" w:bottom="1134" w:left="1293" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  put('word/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="NanumGothic" w:hAnsi="NanumGothic" w:eastAsia="나눔고딕"/><w:sz w:val="21"/><w:color w:val="1F2937"/><w:lang w:val="ko-KR" w:eastAsia="ko-KR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="70" w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="100" w:after="300"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Label"><w:name w:val="Label"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="19"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Brand"><w:name w:val="Brand"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Note"><w:name w:val="Note"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="160"/></w:pPr><w:rPr><w:sz w:val="16"/><w:color w:val="64748B"/></w:rPr></w:style></w:styles>');
  put('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:compat/></w:settings>');
  put('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${definition.title}</dc:title><dc:creator>fill-documents</dc:creator><dc:description>자체 제작 빈 서식. 기관 지정 양식이 아닙니다.</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">2026-10-08T00:00:00Z</dcterms:created></cp:coreProperties>`);
  put('docProps/app.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>fill-documents</Application></Properties>');
  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function createPdfTemplate(definition, fontBytes) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: false });
  pdf.setTitle(definition.title);
  pdf.setAuthor('fill-documents');
  pdf.setSubject('자체 제작 빈 서식. 기관 지정 양식이 아닙니다.');
  pdf.setCreator('fill-documents');
  pdf.setProducer('fill-documents / pdf-lib');
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  pdf.setLanguage('ko-KR');
  const page = pdf.addPage([595.28, 841.89]);
  const form = pdf.getForm();
  const dark = rgb(0.12, 0.16, 0.22);
  const muted = rgb(0.35, 0.4, 0.46);
  page.drawText('fill-documents', { x: 46, y: 791, size: 9, font, color: muted });
  page.drawText(definition.title, { x: 46, y: 759, size: 22, font, color: dark });
  page.drawLine({ start: { x: 46, y: 743 }, end: { x: 549, y: 743 }, thickness: 1, color: dark });
  let top = 724;
  for (const item of definition.fields) {
    const text = form.createTextField(item.name);
    text.enableRequired();
    if (item.multiline) text.enableMultiline();
    text.setMaxLength(item.maxLength);
    text.disableScrolling();
    page.drawText(item.label, { x: 46, y: top - 16, size: 10, font, color: dark });
    text.addToPage(page, { x: 138, y: top - item.height, width: 411, height: item.height, font, fontSize: 10.5, textColor: dark, borderColor: rgb(0.78, 0.81, 0.84), borderWidth: 0.6, backgroundColor: rgb(1, 1, 1) });
    text.setFontSize(10.5);
    text.updateAppearances(font);
    top -= item.height + 10;
  }
  if (definition.category === 'application') {
    const checkbox = form.createCheckBox('confirmed');
    checkbox.enableRequired();
    checkbox.addToPage(page, { x: 138, y: top - 18, width: 14, height: 14, borderWidth: 0.7, borderColor: muted });
    checkbox.uncheck();
    page.drawText('신청 내용 확인', { x: 161, y: top - 15, size: 10, font, color: dark });
  }
  page.drawText('자체 제작 기본 서식 · 기관 지정 서식이 필요한 경우 해당 양식을 사용하세요.', { x: 46, y: 39, size: 8, font, color: muted });
  form.updateFieldAppearances(font);
  return pdf.save({ updateFieldAppearances: false });
}

export async function generateOfficeTemplates(root = skillRoot) {
  const fontBytes = await readFile(path.join(root, 'assets/fonts/NanumGothic-Regular.ttf'));
  for (const definition of templateDefinitions) {
    for (const format of ['docx', 'pdf']) {
      const id = `${definition.category}-${format}`;
      const directory = path.join(root, 'assets/templates', id);
      await mkdir(directory, { recursive: true });
      const bytes = format === 'docx' ? createDocxTemplate(definition) : await createPdfTemplate(definition, fontBytes);
      const fields = definition.fields.map(({ name, label, maxLength }) => ({ name, label, type: 'text', required: true, maxLength, occurrences: 1 }));
      const example = { ...definition.example };
      if (format === 'pdf' && definition.category === 'application') {
        fields.push({ name: 'confirmed', label: '신청 내용 확인', type: 'checkbox', required: true, occurrences: 1 });
        example.confirmed = true;
      }
      const manifest = { schemaVersion: 1, id, version: '1.0.0', title: definition.title, category: definition.category, format, file: `template.${format}`, sha256: createHash('sha256').update(bytes).digest('hex'), license: 'MIT', source: 'original', fields };
      await writeFile(path.join(directory, `template.${format}`), bytes);
      await writeFile(path.join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      await writeFile(path.join(directory, 'example-data.json'), `${JSON.stringify(example, null, 2)}\n`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await generateOfficeTemplates();
  process.stdout.write('Generated 4 DOCX and 4 PDF blank templates.\n');
}
