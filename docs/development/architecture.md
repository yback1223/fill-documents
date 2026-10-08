# fill-documents 초기 구현 계약

버전: 2026-10-08 / 초기 설계 및 저장 경합 보완안 승인 반영

## 요구와 배포

사용자 요구와 승인 범위는 [brief.md](brief.md)를 따른다. 첫 릴리스는 HWP 5.x, HWPX, Word DOCX, AcroForm PDF를 대상으로 한다. 스캔 PDF의 OCR, 일반 PDF 본문 편집, 구형 Word DOC, XLSX/PPTX, 웹 서버, DB, MCP 서버는 이 릴리스의 구현 범위가 아니다. 제목의 '문서'는 작업 종류를 뜻하며 모든 바이너리 파일과 무손실 호환을 의미하지 않는다.

Node.js 20 이상 한 런타임을 사용한다. `plugins/fill-documents/skills/fill-documents/` 안에 스킬, CLI, 소스, 템플릿, 폰트, 라이선스가 있다. 소스 설치는 잠금된 npm 의존성을 명시적으로 설치한다. 배포 ZIP은 같은 스킬의 실행 의존성을 포함하고, 경로가 다른 격리 디렉터리에서 실제 실행한다. 작업 도중 엔진을 자동 다운로드하거나 설치하지 않는다.

Claude 디렉터리의 파일 크기 상한을 맞추기 위해 실행 번들은 기존 형식별 동적 import를 유지한 읽을 수 있는 ESM 파일로 분할한다. WASM은 gzip으로 포함하고 Node 표준 zlib로 메모리에서만 해제하며 16 MiB 상한을 둔다. 손상된 압축 엔진은 `E_ENGINE`으로 거부하고 다음 초기화에서 재시도할 수 있다. 이 패키징 변경은 필드·저장·파일 API를 바꾸지 않는다. 바이너리 서식과 엔진, 대형 코드에 대한 사람의 심사 가능성은 별도로 남는다.

저장소 루트는 Claude와 Codex의 marketplace 목록을 제공한다. `plugins/fill-documents/`에는 portable `plugin.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`을 제공한다. 스킬은 두 플랫폼에 동일하다. 제품 고유 모델 API 호출은 없다.

## 실행 API

스킬 루트 기준 `bin/fill-documents.mjs`가 아래 CLI를 제공한다. stdout은 JSON, 진단은 stderr이며 실패 종료코드는 0이 아니다.

```text
doctor
templates list [--library DIR]
templates show ID [--library DIR]
templates register FILE --id ID --title TITLE [--library DIR]
inspect FILE
fill ID_OR_FILE --data VALUES.json --output OUTPUT [--library DIR] [--dry-run]
validate FILE
```

`fill FILE`은 파일에서 확인한 명시적 필드만 입력한다. 누락된 사실을 창작하지 않는다. `templates register`는 원본을 라이브러리로 복사하고 현재 해시와 필드 목록을 저장한다. 명시 필드가 없는 서식은 자동 채우기 가능하다고 등록하지 않는다. HWP 등록과 채우기는 adapter의 보존 지원 조건을 통과해야 한다.

공용 모듈은 `lib/errors.mjs`, `lib/io.mjs`, `lib/catalog.mjs`, `lib/engine.mjs`이다. 형식 구현은 `lib/adapters/{hwp,hwpx,docx,pdf}.mjs`에 둔다. 각 adapter는 다음 async 함수를 내보낸다.

```js
inspect(bytes, context) // -> { format, fields: [{name, type, occurrences}], warnings: [] }
fill(bytes, values, context) // -> { bytes: Uint8Array, checks: [{name, status}], warnings: [] }
validate(bytes, context) // -> { checks: [{name, status}], warnings: [] }
```

context는 `filePath`, `skillRoot`, `manifest`를 담으며 사용자 지정 실행 명령을 받지 않는다. adapter는 파일을 최종 경로에 저장하지 않는다. values는 공용 검사를 통과한 객체다. `FillError(code, message, details?)`를 `lib/errors.mjs`에서 사용한다. details와 기본 로그는 입력값 원문을 포함하지 않는다.

## 형식 계약

- HWPX: 명시 누름틀 또는 `{{field_name}}` 표식. 원본 ZIP의 변경 대상 XML만 패치하고 이미지·표·스타일 등 비대상 데이터는 유지한다. 변경 문단의 저장된 줄 배치 캐시 삭제는 허용 변경이다. 실제 한글 페이지 배치 검증과 구분한다.
- HWP: 공개 라이선스 엔진으로 읽고 제한된 텍스트를 패치한다. 혼합 서식 문단, 엔진의 skipped/부분 적용, 명확하지 않은 대응은 실패한다. 균일한 서식의 고유 표식을 가진 자체 템플릿부터 지원한다. HWPX 변환을 HWP 수정 성공으로 보고하지 않는다.
- DOCX: `docxtemplater`와 PizZip의 단순 이름 태그만 사용한다. `{{field_name}}` 표식과 줄바꿈 문자열을 지원한다. 표현식·raw XML·루프·템플릿 코드·매크로는 실행하지 않는다. 분할된 run에 있는 표식도 처리한다.
- PDF: 실제 AcroForm 텍스트와 체크박스 필드. 한글 지원 재배포 폰트를 임베딩하고 appearance를 갱신한다. XFA·암호화·서명 문서는 초기 범위 밖이다. 필드 없는 PDF를 채웠다고 보고하지 않는다. 스캔 문서나 기존 본문 재작성은 지원하지 않는다.
- 모든 adapter는 형식을 확장자뿐 아니라 컨테이너/내용으로 확인하며 문서 내 명령이나 외부 관계 대상을 실행/다운로드하지 않는다.

## 카탈로그와 템플릿

내장 템플릿은 `assets/templates/<id>/template.<format>`, `manifest.json`, `example-data.json`이다. 공문(official-letter), 보고서(report), 회의록(meeting-minutes), 신청서(application)를 네 형식으로 자체 제작한다. 사용자 등록은 `.<id>.lock` 디렉터리를 독점 생성해 ID를 예약하고 그 아래 staging에서 파일과 manifest를 완성·재검증한다. 공개 `<id>` 경로는 exclusive mkdir로 생성하고 template 파일을 hardlink한 뒤 manifest.json을 hardlink한다. 마지막 manifest hardlink가 등록 커밋이다. 목록은 점으로 시작하는 경로와 manifest 없는 미완성 폴더를 노출하지 않는다. 같은 ID의 경쟁 등록은 예약 또는 목적지 생성에서 실패한다. 소유한 dev/ino가 일치하는 파일만 해제하고 소유한 빈 디렉터리만 rmdir하며 재귀 삭제하지 않는다. 외부 파일이나 변경된 경로는 남기고 성공/실패 결과에 정리 경고를 제공한다. 중단된 예약·공개 폴더는 자동 탈취하지 않는다. [보완 설계와 검증 조건](storage-amendment.md)을 따른다.

manifest v1:

```json
{
  "schemaVersion": 1,
  "id": "meeting-minutes-docx",
  "version": "1.0.0",
  "title": "회의록",
  "category": "meeting-minutes",
  "format": "docx",
  "file": "template.docx",
  "sha256": "실제 파일 해시",
  "license": "MIT",
  "source": "original",
  "fields": [{"name":"title","label":"제목","type":"text","required":true,"maxLength":200,"occurrences":1}]
}
```

필드명은 영문자 시작, 영숫자/underscore, 최대 64자. text와 checkbox만 지원하고 타입이 다르면 실패한다. 내장·등록·비등록 파일에서 발견한 필드 모두 required를 기본으로 한다. 필수 text는 빈 문자열·공백만으로 된 값을 거부하며 기본 상한은 10,000 Unicode code point이다. manifest에 더 작은 maxLength가 있으면 그것을 적용한다. checkbox의 false는 유효 값이고 누락과 구분한다. 임의 공란을 성공으로 감추지 않는다. 사용자 라이브러리 기본 경로는 `~/.local/share/fill-documents/templates`이며 `--library`로 바꿀 수 있다. 설치 폴더는 변경하지 않는다. 파일명 경로 순회·중복 필드·중복 ID/버전·해시 변경은 거부한다.

## 파일과 실패 계약

- 원본과 템플릿은 변경하지 않는다. 기존 출력 덮어쓰기 옵션은 제공하지 않는다.
- 공용 엔진은 필수값·알 수 없는 키·타입·길이·필드 이름과 출현 횟수·원본 해시를 입력 전에 검사한다.
- 원본과 출력이 같은 경로/하드링크/심볼릭링크이면 실패한다.
- 같은 출력 폴더의 독점 임시파일에 후보를 쓰고, adapter 재검증 후 원자적인 no-clobber 게시(하드링크 생성 후 임시파일 해제)를 수행한다. 불가능한 파일시스템에서 일반 덮어쓰기로 우회하지 않는다.
- 하드링크 생성 성공은 출력 커밋 지점이다. 이후 임시파일 정리가 실패하면 결과는 성공으로 유지하고 정리 경고와 해당 임시 경로만 제공한다. 이미 게시된 결과를 실패라고 보고하거나 자동 삭제하지 않는다. 템플릿 등록 역시 manifest hardlink 성공 이후 예약 정리 오류는 성공+경고로 처리한다.
- 출력 부모의 dev/ino를 임시파일 생성 전후 및 게시 전후에 확인하고, 동일 출력의 동시 요청은 하나만 성공한다. 검사와 시스템 호출 사이의 모든 경로 교체를 원자적으로 방어하지는 못하므로 안정된 로컬 작업 폴더를 전제로 한다. 게시 뒤 위치 변경이 관찰되면 성공과 위치 재확인 경고를 반환한다.
- 실패 시 소유권을 확인한 현 실행의 임시파일만 정리하고 기존 파일은 보존한다. 실패 응답에도 정리 실패와 생성 당시 경로를 제공하며 이동된 파일의 현재 위치를 안다고 주장하지 않는다.
- 입력 ZIP은 엔트리 수/확장 크기 제한, 중복 이름, 경로 순회, XML 외부 엔티티 및 활성 콘텐츠를 검사한다. 보존 불가능한 활성 요소는 조용히 제거하지 않는다.
- 오류 코드: `E_INPUT`, `E_FIELDS`, `E_TEMPLATE_CHANGED`, `E_UNSUPPORTED`, `E_PRESERVATION`, `E_OUTPUT_EXISTS`, `E_IO`, `E_ENGINE`.
- 성공 보고는 출력 해시·엔진·적용한 필드 이름·실제 구조 검사와 시각 미검증 상태를 포함한다.

## 검증

각 형식에서 한글·줄바꿈·XML 특수문자, 누락/추가 필드, 수정된 템플릿, 원본 불변, 출력 충돌, 손상 입력을 검사한다. DOCX run 분할, HWP 부분 적용/혼합 서식 거부, PDF 한글 appearance를 추가한다. 스킬 단독 ZIP을 공백/한글 경로에 풀어 네트워크 없는 실행을 검사한다. Claude CLI의 plugin validator와 portable JSON schema를 검사한다. 실제 OS/앱에서 실행하지 않은 것은 검증 완료로 표기하지 않는다.

## 배포와 남은 정보

자체 코드와 템플릿은 사용자 선택에 따라 MIT. 외부 엔진·폰트는 각 원라이선스를 함께 포함한다. GitHub 공개와 자체 marketplace, 공식 디렉터리 심사 제출·승인은 별개다. 사용자는 게시자 표시명 yback, 공개 지원 연락처, 지원 가능한 모든 국가에 무료 배포·제품 내 결제 없음을 확정했다. 인증된 법적 신원과 실제 신청 화면의 법적 확인은 온라인 제출 단계에서 확인한다.

HWP 격리 실험은 자체 Markdown→HWPX→rhwp HWP export→patchHwp→재읽기를 확인했다. 혼합 굵기 손실도 확인되어 변경 문단을 rhwp getCharPropertiesAt으로 검사하고 혼합 서식이면 E_PRESERVATION으로 거부한다. engine success만으로 통과하지 않고 skipped·잔차 diff·exporter contentLoss를 확인한다. 상세 실험은 /tmp에 보관하며 제품 검증과 구분한다.

## 엔진 근거

- https://github.com/chrisryugj/kordoc/tree/v4.19.2
- https://github.com/chrisryugj/kordoc/blob/v4.19.2/src/roundtrip/hwp5-patch.ts
- https://github.com/open-xml-templating/docxtemplater
- https://github.com/Hopding/pdf-lib
- https://developers.openai.com/plugins/build/plugins
- https://code.claude.com/docs/en/plugin-marketplaces
