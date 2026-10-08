# Fill Documents

**문서 서식을 고르고, 제공한 내용으로 채우세요.**

yback의 무료 오픈소스 도구입니다. Claude와 Codex에서 같은 스킬을 사용하며 HWP·HWPX·Word DOCX·PDF 기본 템플릿을 제공합니다. 사용자 서식을 등록해 다시 사용할 수도 있습니다. 로컬 CLI는 계정·API 키·별도 서버 없이 실행됩니다. 자체 코드와 템플릿은 MIT로 공개합니다.

> 0.1.0은 명시적인 필드를 가진 서식을 대상으로 합니다. 모든 문서의 임의 본문 편집이나 무손실 변환을 보장하지 않습니다.

## 제공하는 서식

공문, 보고서, 회의록, 신청서를 네 가지 형식으로 제공합니다. 총 16종이며 특정 기관이 승인한 공식 양식은 아닙니다. 각 폴더에는 빈 서식, 필드 정의, 가상 입력 예시가 있습니다.

| 문서 | 템플릿 ID 앞부분 |
| --- | --- |
| 공문 | `official-letter` |
| 보고서 | `report` |
| 회의록 | `meeting-minutes` |
| 신청서 | `application` |

ID 끝에 `-hwp`, `-hwpx`, `-docx`, `-pdf`를 붙입니다. 예: `report-hwpx`.

[빈 서식 모음](plugins/fill-documents/skills/fill-documents/assets/templates/) · [스킬](plugins/fill-documents/skills/fill-documents/SKILL.md) · [지원](SUPPORT.md)

## 설치

**Node.js 20 이상**이 필요합니다. 저장소와 배포 ZIP에 실행 번들·WASM·한글 글꼴이 포함되어 있어 일반 사용자는 npm 설치를 할 필요가 없습니다. Claude/Codex 자체의 계정·이용 조건은 각 제품을 따릅니다.

### Claude Code 플러그인

Claude Code에서 실행합니다.

```text
/plugin marketplace add yback1223/fill-documents
/plugin install fill-documents@fill-documents
```

설치 후 예를 들어 “fill-documents로 회의록 서식을 찾아 아래 내용으로 채워줘”라고 요청하세요. 공식 추천 디렉터리 등록과 별도로, 이 저장소가 제공하는 자체 marketplace에서 설치하는 방법입니다.

### Codex 플러그인

터미널에서 실행한 뒤 Codex의 플러그인을 새로고침하세요.

```sh
codex plugin marketplace add yback1223/fill-documents
codex plugin add fill-documents@fill-documents
```

요청 예: “`$fill-documents`로 공문 양식을 골라 내가 준 내용으로 채워줘.”

### 스킬만 사용

[스킬 폴더](plugins/fill-documents/skills/fill-documents/) 전체를 복사합니다. `SKILL.md`만 복사하면 실행기와 서식이 빠집니다.

- Claude Code: `~/.claude/skills/fill-documents/`
- Codex: `~/.agents/skills/fill-documents/`

플러그인과 스킬 중 하나만 설치하면 됩니다. 스킬 단독 ZIP과 플러그인 ZIP은 `npm run build`로 `dist/`에 생성됩니다.

## CLI로 바로 사용

저장소 루트에서 실행합니다. 경로에 공백이 있다면 따옴표로 감싸세요.

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs doctor
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs templates list
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs templates show report-docx
```

필드 이름과 타입을 확인한 뒤 UTF-8 JSON을 준비하세요. 모든 발견 필드는 필수이며 없는 사실은 임의로 채우지 않습니다. 아래 예제는 번들에 포함된 **가상 데이터**로 결과를 만듭니다.

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs fill report-docx --data plugins/fill-documents/skills/fill-documents/assets/templates/report-docx/example-data.json --output report-example.docx
```

자기 서식의 필드를 확인하거나 라이브러리에 등록할 수 있습니다.

```sh
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs inspect my-template.hwpx
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs templates register my-template.hwpx --id my-report --title "내 보고서"
node plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs fill my-report --data values.json --output completed.hwpx
```

출력은 기존 파일과 원본을 덮어쓰지 않습니다. 출력 폴더는 먼저 만들어 두세요. JSON 성공 결과에는 경로·해시·적용 필드·구조 검사·경고가 포함되며 입력 본문은 기록하지 않습니다. `--dry-run`은 입력 매핑만 검사하므로 실제 저장이나 배치 검증을 대신하지 않습니다.

## 지원 범위

| 형식 | 입력 방식 | 주요 제한 |
| --- | --- | --- |
| HWP 5.x | 균일한 글자 서식의 본문 문단에 있는 고유 `{{field_name}}` | 혼합 서식, 표/개체 안의 필드, 반복 필드 등은 거부. 엔진이 보존하지 못하는 연속 공백·빈 줄·탭·리터럴 `<br>` 입력도 저장 거부 |
| HWPX | `{{field_name}}`, 같은 문단 안의 지원되는 누름틀 | 비대상 ZIP 내용 유지. 변경 문단의 줄 배치 캐시 제거. 기존 미리보기는 갱신하지 않음 |
| DOCX | 분할 run·반복 사용 가능한 `{{field_name}}` | 표현식·반복문·raw XML·매크로 제외. 본문·머리말·꼬리말·각주·미주 텍스트 필드 |
| PDF | AcroForm 텍스트 및 체크박스 | 필드 영역 넘침·지원하지 않는 문자 거부. 스캔/일반 본문 편집·XFA·암호화·서명·실행 동작·복잡한 필드 제외 |

구형 Word `.doc`, 스프레드시트, 슬라이드, OCR은 이번 버전에 포함하지 않습니다. 실제 한컴·Word 앱의 페이지 배치와 모든 OS 호환성은 자동 구조 검사로 보장되지 않습니다. 출력은 사용 앱에서 열어 확인하세요. 자세한 준비 및 복구 방법은 [형식 안내](plugins/fill-documents/skills/fill-documents/references/formats.md)에 있습니다.

## 개발과 검증

```sh
npm run setup
npm test
npm run build
npm run validate
```

실행 번들은 추적하는 배포 파일입니다. 소스를 고쳤다면 반드시 다시 빌드하세요. 생성기 변경 후에는 스킬 폴더에서 해당 `scripts/generate-*-templates.mjs`를 실행하고 manifest 해시·예시를 검증하세요. 저장소에는 사용자 문서나 값 파일을 커밋하지 않습니다.

[설계와 수용 조건](docs/development/brief.md) · [아키텍처](docs/development/architecture.md) · [실제 검증 기록](docs/development/verification.md) · [공식 마켓 제출 상태](docs/distribution.md)

## 라이선스와 데이터

자체 코드·템플릿은 [MIT](LICENSE), 외부 엔진과 글꼴은 [원라이선스](plugins/fill-documents/skills/fill-documents/THIRD_PARTY_NOTICES.md)를 유지합니다. 외부 구성요소를 yback이 만든 것으로 표시하지 않습니다.

[개인정보 및 파일 처리](PRIVACY.md) · [이용 안내](TERMS.md) · [지원 문의](SUPPORT.md)
