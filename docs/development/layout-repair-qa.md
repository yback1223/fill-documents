# 서식 유지 수정 독립 실행 검수

2026-10-08. 검수자 `/root/layout_quality_review`. 상태: **최종 8개 결과물과 bundle CLI 추가 검수 완료. 관측한 DOCX 고아 제목은 해당 준비본의 명시적 쪽 나눔으로 해소**. 아래에 한정한 입력·구조·렌더 기준을 충족했으며, 모든 양식·편집기·내용에 대한 보증이나 완성 신청서 승인은 아니다.

## 범위와 독립성

- 원래 요구: HWP/HWPX/DOCX/PDF의 기존 양식을 유지하거나 명시적으로 확장하고, 해당 문서의 목적에 맞는 가상 내용으로 시험한다. 서식을 축소하거나 원문을 요약하여 넘침을 숨기지 않는다.
- 제품 제작 문맥 없이 원래 요구·설계·실제 자료 경로를 전달받아 검수했다. 제품 코드와 제공 검사 코드는 읽었으나 제품 파일은 수정하지 않았다. 이 보고서만 작성한다.
- 판단 기준: `layout-repair-common-design.md`, `layout-repair-hwp-design.md`, `layout-repair-xml-design.md`, `layout-repair-pdf-design.md`. 설계자의 성공 예상이나 테스트의 종료 코드만을 정답으로 사용하지 않았다.
- 실제 자료의 기준 경로는 저장소 상위 `문서서식-재검증-20261008/`이다. `01-원본`, `02-준비본`, `03-입력값`, `04-결과`, `05-검증`을 구분했다. 아래 파일명은 그 기준 경로에 상대적이다.
- Git·Computer Use·외부 쓰기·중첩 위임을 수행하지 않았다. 직접 실행은 로컬 Node/Python 코드와 기존 테스트, 파일 읽기, 저장된 PNG 열람으로 한정했다. Word/한컴/일반 PDF 편집기의 실제 UI 검증은 수행하지 않았다.

## 현재 판정

| 요구·대상 | 기대 | 직접 관측·증거 | 판정 |
|---|---|---|---|
| 공통 rows 입력 | 명시된 행·열·문자 수 경계, 모든 열 필수, 불량 값 거부, 원 입력 불변 | 기존 core 검사와 별도 28개 경계 assertion. 100행/30열, 500,000자 허용 및 초과 거부, 누락/공란/제어문자/추가 열 거부, null-prototype 새 객체 확인 | 검사한 소스 API 범위 충족 |
| 공통 dry-run | 실제 후보 생성·검증 후 게시만 생략 | 초기 실제 HWP short 입력으로 8쪽 후보 검증, 결과 디렉터리 새 파일 0. 최종 bundle CLI는 네 형식 detailed 입력 모두 `publication=not-attempted`, 원본·기존 결과 hash 유지. 공란 입력/원본 덮어쓰기/preserve의 불지원 구조/다른 형식 프로필은 소스 검사에서 각 오류 | 검사한 소스·최종 CLI 범위 충족 |
| HWP 실제 항목 입력 | 빈 문단 대신 기존 33항목에 값, 원문·접두부·본문 서식 보존 | short/detailed 모두 33값 exact, 144문단 유지, 준비본 대비 모든 CHAR_SHAPE 레코드와 비본문 스트림 exact, 남은 표식·빈 `○` 문단 0 | 준비본→저장 결과 충족 |
| HWP 원래 서식·확장 | 원래 쪽/글자 서식, 읽을 수 있는 이어쓰기 | 원본 5쪽, short 8쪽, detailed 9쪽. 본문 전 쪽 PNG를 개별 열람. 잘림/겹침/고아 제목을 발견하지 못함. 쪽 사이 문단 이어짐과 기존 강제 쪽 나눔에 따른 여백은 존재 | 관측한 렌더 범위 충족 |
| HWP 미대상 BMC | 본문 밖 마지막 2쪽 보존 | 원본 및 두 결과 `BodyText/Section1`의 215개 레코드 exact. 2쪽은 미작성 상태를 유지 | 보존 충족, 완성 신청서 아님 |
| HWPX 실제 반복 업무 | 업무당 1행, 순서/5열값/폭/머리글/비대상 보존 | short 3행/18쪽, detailed 12행/21쪽. 모든 셀 텍스트·행주소·열폭 exact; 5개 헤더 행 지정. 상세 1~3월=7쪽, 4~6월=8쪽, 7~9월=9쪽, 10~12월=10쪽 | 실제 표 범위 충족 |
| HWPX 페이지 표시 | 업무가 찢어지지 않고 각 업무 쪽에 제목·열머리글 | short 7쪽 및 detailed 7~10쪽 PNG 개별 열람. 업무의 왼쪽 4열과 내용이 함께 표시되고 제목/법인명/단위/열 제목 반복 | 관측한 렌더 범위 충족 |
| HWPX 미대상 페이지 | 표 밖 원래 내용·모양 유지 | 각 결과의 비대상 17쪽 중 14쪽 SVG byte exact. 나머지 3쪽은 `y`의 약 1e-13 수준 부동소수 차이뿐이며 y를 1e-6픽셀로 반올림하면 17쪽 모두 exact. `Contents/section0.xml` 밖 ZIP 항목 exact | 해당 비교 정밀도에서 충족 |
| PDF 원래 칸·같은 양식 | 원래 Message 칸을 사용하고 원본 양식 크기/배경을 유지한 추가 쪽 | short 2쪽, detailed 4쪽. 상세 1/3/4쪽 및 설명 2쪽, short 1쪽 PNG 개별 열람. 첫 칸 본문과 계속 안내, 추가 쪽 같은 양식 확인 | 관측한 렌더 범위 충족 |
| PDF 값·연결·서명 | 원문 exact, 청크당 multiline 1개, 서명 복제/고아 위젯 없음 | pypdf로 필드/위젯 양쪽 검사. 13입력값 exact. 장문 3,828자=1,591+1,521+716. fields 15→17, widgets `[15,0,1,1]`, 전체 객체 열거에서 고아 위젯 0, 기존 서명 객체 `(213,0),(218,0)` 두 개 유지, field/widget/AP exact | 저장 데이터·객체 범위 충족 |
| PDF AP 재생성 | 기본 AP 재생성 후 원문과 지원 레이아웃 계약 유지 | 실제 상세 결과를 메모리에서 다시 열고 3본문 필드 `updateAppearances(font)` 후 저장·재열기. 3청크값 exact 및 adapter의 4검사 pass. 재생성된 메모리 결과를 다시 PNG로 렌더하지는 않음 | 데이터/adapter 검사 충족, 별도 렌더 미실행 |
| DOCX 입력·서식 | 입력 LF를 실제 문단으로 확장, 원래 양쪽 맞춤·표폭 유지 | 초기 소스 및 최종 CLI 결과의 본문 3값 exact, 901→short 904/detailed 921문단. 초기 구조 대조에서 삽입 `w:br` 0, 대상 `jc=both`, tblPr/tblGrid/tcPr 차이 0, 다른 ZIP part 차이 0. 최종 결과는 초기 소스 결과에서 제목 한 곳의 `pageBreakBefore=1`만 추가. 선행 preserve로 넣은 표지 4값도 저장값·렌더 확인 | 2단계 입력과 명시된 준비본 조정 범위 충족 |
| DOCX 전체 조판 | 긴 내용 및 후속 제목·표를 읽을 수 있게 연결 | 초기 detailed 19쪽의 고아 제목 관측 후 준비본 조정. 최종 short 19쪽/detailed 20쪽에 2.2 제목과 대응 표가 함께 표시. short 17~19쪽/detailed 19~20쪽 PNG를 직접 재확인. 상세 30쪽 유지, 짧은 결과는 28→29쪽 | 해당 결함 해소, 관측한 인접 렌더 범위 충족 |
| 실제 CLI/bundle | 소스 변경이 사용자 실행 경로에도 반영 | 초기 stale bundle 실패를 보존. 최종 bundle에서 독립 4 inspect + 4 detailed dry-run + 8 validate 종료 0, field 수 33/2/3/13, 원본·기존 결과 hash 유지. 총괄의 8개 실제 fill 기록과 현재 결과 hash 일치 | 최종 명시 범위 충족 |

## 실행 기록과 실패·재시도

작업 디렉터리: `plugins/fill-documents/skills/fill-documents`.

1. `node --test tests/core.test.mjs tests/hwp-flow.test.mjs`
   - 첫 시도는 다른 대용량 도구 응답에 완료 출력이 누락되어 완료/통과 근거로 사용하지 않았다.
   - 두 번째 실행: 종료 0, 29검사 통과, 실패/취소/건너뜀 0, 1,637.829ms. 실제 HWP adapter로 8,000자, Unicode/개행, 인접 필드, 혼합 접두부, 거절 사례와 원시 보존 반례를 검사했다.
2. `node --test tests/xml-flow.test.mjs tests/hwpx-repeat.test.mjs tests/pdf-flow.test.mjs`
   - 종료 0, 하위 사례 포함 142검사 통과, 실패/취소/건너뜀 0, 16,310.610ms.
   - 범위: DOCX 국소 흐름/개행/의미 경계 거절, HWPX 반복 1/3/4/6/100행·불량 프로필·기존 데이터·거대 행 거절, PDF v2 읽기/재채우기 거절·복수 넘침·grapheme/CRLF·dry-run.
3. `node --input-type=module` 인라인 독립 검사
   - 공통 rows의 28경계 assertion과 실제 HWP dry-run 및 4거절 사례.
   - HWP 원본/준비본/두 결과를 `openHancom`으로 다시 열어 대상 33문단의 예상 치환값 및 나머지 111문단·글자별 서식 비교. 해당 SDK가 모델/렌더를 제공한다는 도구 독립성 한계가 있다.
   - HWP 원본 5쪽+short 8쪽+detailed 9쪽의 재생성 SVG/text/control layout이 저장된 `05-검증` 증거와 exact.
   - HWPX short 18쪽+detailed 21쪽의 재생성 SVG가 저장된 증거와 exact. 업무 날짜별 실제 페이지 대응 검사.
4. 번들 Python 3.12의 `zipfile/lxml/pypdf` 인라인 독립 검사
   - HWPX 행 수/값/주소/폭/머리글·비대상 ZIP bytes 확인.
   - PDF `/AcroForm/Fields`와 모든 페이지 Widget의 effective `/V`, `/AP/N`, 전체 간접 객체 중 `/FT/Sig`와 `/Subtype/Widget`, 원본 stream bytes/순서/box/rotation을 확인.
   - 원본 PDF 1쪽 content stream 8개는 short 8개로 유지, detailed는 기존 8개 동일 순서+허용 안내 3개. 원본 2쪽 stream 1개와 페이지 속성 유지.
5. `node bin/fill-documents.mjs inspect <02-준비본/wict-business-plan.hwp>`
   - 종료 1, `E_PRESERVATION`, `HWP 필드와 본문 문단을 명확하게 대응할 수 없습니다.`
   - `bin/fill-documents.mjs`는 `lib/vendor/runtime.mjs`가 존재하면 그 bundle을 먼저 읽는다. 소스 테스트 성공을 이 CLI 성공으로 확대하지 않았다. 총괄 확인: 생산 수정 후 재빌드 예정인 알려진 중간 통합 상태.
6. DOCX 구조 대조 시도
   - 첫 시도는 `word/document.xml` KeyError, 두 번째는 `04-결과/CPSA-표준화사업계획-short.docx` FileNotFoundError, 이어서 해당 디렉터리 DOCX 목록 0을 관측했다.
   - 총괄 확인: 표지 기본정보 4필드 추가 작업으로 이전 결과를 `tmp/docx-before-identity-*.docx`에 보관했고 최종본을 준비 중이었다. 제품 결함이 아닌 시험 대상 교체 중의 환경/전제 불일치다. 이 두 시도에서 DOCX 구조 보존 통과를 주장하지 않는다.
   - 복구 후 세 번째 대조: 종료 0. `eismea-all-fields.docx`의 표지 4값은 `preserve`로 먼저 채우고, 본문 3표식만 남은 `eismea-application.docx`에 각 short/detailed의 `flow`를 적용한 실제 2단계 결과다. 7필드를 한 번에 flow로 처리한 성공으로 보고하지 않는다.
   - 동일 7필드 입력을 source `fillDocument(..., overflow:'flow', dryRun:true)`로 독립 실행: `E_LAYOUT`, field=`project_title`, region=`table-cell`, reason=`table-outside-body`. 원래 폭 가드를 유지한 거절이다. QA는 원래 폭을 수정하지 않았다.
   - 단락별 대응 검사: short는 profile/objectives/relevance 각 2문단, detailed는 14/5/4문단이다. 원래 대상 문단 480/488/493 외 텍스트는 모두 동일하며 표 폭·셀 속성과 다른 ZIP part는 변하지 않았다.
   - 해당 소스 결과의 PDF는 short 28쪽/detailed 30쪽. 입력 표지 4값 및 각 본문 마지막 100자를 렌더된 PDF text에서 확인했고, latest PNG의 short 16~17쪽/detailed 16~19쪽을 다시 열람했다. 상세 19쪽의 2.2 제목 분리는 총괄에 보고했다.
7. 검사 모델 자체 수정
   - pypdf 서명 dict를 `str()`로 비교한 첫 결과는 false였다. 출력에 PdfReader 객체 식별 표현이 포함되는 비교 모델 오류다. 간접 참조를 `(objectId,generation)`으로 정규화하고 dictionary/배열과 AP bytes를 다시 비교한 결과 차이 0이었다.
   - `pdf-render/*.txt`에서 마지막 문장을 찾는 검사는 실패했다. 해당 추출은 Widget AP의 입력 텍스트를 포함하지 않는다. PDF의 원문 누락으로 판정하지 않고 `/V`와 PNG를 별도로 확인했다. `pdftotext` 단독 또는 그 bbox만으로 모든 입력값의 가시성/영역 내 표시를 입증할 수 없다.

## 실제 버전과 증거 식별

소스 검사 환경: macOS arm64, Node `v25.9.0`. HWP 엔진은 `kordoc 4.19.2 + @rhwp/core 0.8.7`, PDF `pdf-lib 1.17.1`. 문서/PDF 독립 읽기는 Codex workspace bundle `26.1007.11041`의 Python 3.12 사용. DOCX 기존 렌더는 총괄 제공 LibreOffice 결과이며 EC Square 폰트 미설치/Arial 대체 조건으로 전달받았다.

2026-10-08T05:42:36Z에 식별한 HWP/공통 대상 SHA-256:

| 파일 | SHA-256 |
|---|---|
| `lib/fields.mjs` | `c0666de9b1ca7cc1de7d2658f8f058ae495656f33875a16afa7d1c5f46694a64` |
| `lib/engine.mjs` | `83b65d38328dbe313272910bbcd0f2b833e9d2c4f5e3226113f6172d2dfbd486` |
| `bin/fill-documents.mjs` | `c74edba86476a4bf9a4e8d7bec481936843cd451434c854a5e12f7d121785fd6` |
| `lib/adapters/hwp.mjs` | `a54fd24942d0a19a63f4d3d99ae6b0200a52693ab84cb808c27ebe33edcbe8dd` |
| `lib/adapters/hwp-flow.mjs` | `20af47ba739a6ee5631252b90dc72acaeaedcb789d788b70d6dd786ffc85a968` |
| `lib/adapters/hancom-runtime.mjs` | `4fa342cc7182f08661e00b420c48f1d4824a4c3f97d379771502387cc215d636` |
| `package-lock.json` | `b5264a44885d20641fe883319fe9b4876708ddbde9c3203db822cb9db08e5626` |
| `tests/core.test.mjs` | `be5248b55834dadfe70d0ff2ca03921b85a52d3cd51eb003672cf2b63c2a812e` |
| `tests/hwp-flow.test.mjs` | `16ec25156db4b30d994c22f06e1c75a7b984ac1deedd77899d7dd410ac01f5e2` |

초기 소스 생성 결과물 SHA-256. 아래 `04-결과` 경로는 최초 검사 시점의 위치이며, 이후 해당 파일은 `tmp/source-results/`로 이동됐다. 현재 `04-결과`의 식별값과 연결 검사는 다음 절에 별도로 기록한다.

| 파일 | SHA-256 |
|---|---|
| `01-원본/wict-business-plan.hwp` | `6bf4e5f85bc34c7076e07a164283fe37fae504f5ae9883eb6c9a40940f0aff14` |
| `02-준비본/wict-business-plan.hwp` | `5c9d77817471acf302ea4b36509be94ca57768141212b3c2388c3acd77944e29` |
| `03-입력값/hwp-short.json` | `17ca06f808f3a8d1db6844aadca24ab3aaf46d0ef2320ddbacf0aa2be69c5337` |
| `03-입력값/hwp-detailed.json` | `4a5a9facbe8aaf6fb3c6e54d0f508c7c085acb2832dc003ffd5e71c81618d416` |
| `04-결과/다온케어-사업계획서-short.hwp` | `bc517e396d63d0141a203276d15d58d799c4d05f437bc7c8ddaf225860ecaebb` |
| `04-결과/다온케어-사업계획서-detailed.hwp` | `3f88ec165d7ab18b9fa9a0d17c7eb760aed092c7b3a3703b040107b908cf8c84` |
| `04-결과/마을배움연구소-연간활동계획-short.hwpx` | `e79e26ae50a6f48dc648b2ec55c56d4e2fece5eae3666e3a03daf39f2e87f30d` |
| `04-결과/마을배움연구소-연간활동계획-detailed.hwpx` | `029c0a4dd94df794cddf19b9b0124abce04766eebb022677f9d3025ac49fbd4b` |
| `04-결과/Riverside-대피소지원요청-short.pdf` | `0ff2a5e1916248c4f86c8c337ca5cdf96eec31454048f8c1bd77f4aaf690105c` |
| `04-결과/Riverside-대피소지원요청-detailed.pdf` | `0be76807c7487d762e6afbfb7754ada7e02aed4de649128d86f05a0365cbc72a` |
| `02-준비본/eismea-all-fields.docx` | `926a7a92ea7d941e52bd56842f500c4810c096324e342b4337c2d3e41ad2f8c6` |
| `02-준비본/eismea-application.docx` | `0914a8497e3effa12e6ca13389c6e66d6d44485da04c7797960b2736e99fab32` |
| `04-결과/CPSA-표준화사업계획-short.docx` | `d7407bd6d01fb7d62887d8b5f52798661eb06de78b7fe2050d96f04e655eecf8` |
| `04-결과/CPSA-표준화사업계획-detailed.docx` | `372b0e6a775d7c6ff27304dffa71f758798f7fe66e1526bb9bc0f55539d1aa56` |

## 최종 bundle CLI 및 DOCX 수정 재검수

총괄이 작성한 `05-검증/cli-verification.json`에서 8개 결과의 inspect→dry-run→fill→validate 기록을 읽고 현재 파일 hash와 대조했다. 8개 모두 `dryRun`, `published`, `validated`, `sourceUnchanged`가 true이고 현재 결과 hash가 일치했다. 이것은 총괄의 실제 fill 실행 증거 검토이며, 아래 QA의 독립 실행과 구분한다.

QA는 Node `v25.9.0`에서 `bin/fill-documents.mjs`를 자식 프로세스로 직접 호출했다. 각 프로세스의 종료 코드와 JSON의 실제 값·검사 결과를 확인했다. 이때 `lib/vendor/runtime.mjs`의 SHA-256은 `b1880b97f00fdb72ef8b202b7c38615bb4942e3092335baf14728eab1319c55e`이며 검사 전후 동일했다.

```text
node bin/fill-documents.mjs inspect <02-준비본/해당 서식> [--layout-profile <해당 프로필>]
node bin/fill-documents.mjs fill <02-준비본/해당 서식> --data <03-입력값/해당-detailed.json> --output <04-결과/해당-detailed> --overflow flow --dry-run [--layout-profile <해당 프로필>]
node bin/fill-documents.mjs validate <04-결과/각 short 또는 detailed 파일>
```

- 총 16회: 네 형식 inspect, 네 형식 detailed dry-run, 여덟 결과 validate. 모두 종료 0. inspect field 수는 HWP 33, HWPX 2, DOCX 3, PDF 13이다. HWPX/PDF는 준비본 디렉터리의 각 layout profile을 사용했다.
- 네 dry-run 모두 `dryRun=true`, `publication=not-attempted`, 실행 전후 준비본과 기존 결과 hash 동일. 여덟 validate는 해당 결과 hash와 일치했고 형식별 검사 모두 pass/passed였다. 이 독립 실행에서는 결과 파일을 다시 게시하지 않았다.
- HWP/PDF 최종 두 변형은 각 초기 소스 결과와 파일 bytes exact. HWPX 두 변형은 ZIP 컨테이너 bytes는 다르지만 항목 이름과 모든 항목 bytes exact. 따라서 해당 초기 내용·렌더 검수 근거를 현재 파일에 연결할 수 있다.
- DOCX 두 변형은 초기 소스 결과 대비 `word/document.xml` 하나만 다르다. `w14:paraId="3B17EDF0"`의 `w:pPr`에서 `w:pageBreakBefore w:val="1"` 한 요소를 제거하면 초기 XML과 정확히 같다. 실제 준비본 조정 기록은 `05-검증/docx-template-adjustment.json`, 작성 스크립트는 `scripts/prepare-docx-pagebreak.py`다. 이는 해당 준비본의 명시적인 수정이며 범용 엔진의 고아 제목 자동 해결 기능이 아니다.
- 최종 DOCX를 다시 열어 준비본의 901개 문단을 입력값의 줄바꿈과 대응시켰다. short 904개/detailed 921개 문단 모두 예상 텍스트와 일치하고 불일치 0이다. 최종 DOCX보다 나중에 생성된 전체 렌더 PDF는 short 29쪽/detailed 30쪽이다.
- 직접 열람한 최종 PNG는 `05-검증/docx-render/CPSA-표준화사업계획-short-{17,18,19}.png`와 `CPSA-표준화사업계획-detailed-{19,20}.png`다. 초기 상세 19쪽에 홀로 있던 2.2 제목은 최종 상세 20쪽의 대응 표 바로 위로 이동했다. 짧은 결과는 19쪽에 제목과 표가 함께 있고, 18쪽은 앞선 2.1 표의 연속과 외부 자원 표가 있는 내용 쪽이다. 확인한 인접 쪽에 새 잘림·겹침·빈 페이지는 관측되지 않았지만 짧은 결과의 여백과 1쪽 증가는 남는다.
- 최종 PDF에서 대응 표의 페이지를 찾을 때 처음 사용한 검색어 `Project management, quality assurance`는 뒤의 업무 패키지 제목도 찾아 잘못된 페이지를 반환했다. 이 검색은 판정 근거로 쓰지 않았고, 실제 2.2 제목과 대응 표의 PNG를 직접 대조했다.
- `05-검증/zip-source-cli-comparison.json`의 최초 DOCX `entryContentsEqual=true`는 위 준비본 조정 이전 결과와의 비교였다. 해당 기록은 최종 동일성의 근거로 채택하지 않고 갱신을 요청했다. 최종 확인에서는 두 DOCX 모두 `entryContentsEqual=false`, `changed=["word/document.xml"]`, `onlyTemplatePageBreakAdded=true`이며, 비교 대상이 명시적 쪽 나눔 이전 소스 결과임을 note에 표시한 갱신 내용을 직접 읽었다. `05-검증/source-cli-comparison.json`도 현재 바이트 비교와 일치한다. 이 증거 동기화 문제는 해소됐다. HWPX의 항목 동일성은 QA가 현재 파일로 별도 재현했다.
- `05-검증/npm-test.log`에서 총괄의 266검사 통과/실패·취소·건너뜀 0과 17,958.990ms를 확인했다. QA가 266개 전체를 독립 재실행한 것은 아니며, 직접 실행한 소스 테스트는 앞 절의 29+142개다. 배포 ZIP의 32개 기본+8개 flow 검사 성공은 총괄의 보고이고, 이 QA는 별도 배포 ZIP을 풀어 재실행하지 않았다.
- 총괄의 문서 포함 최종 빌드 통보 후 runtime과 결과 8개의 SHA-256을 다시 읽었다. 모두 이 절의 기록과 같아 기존 실행·결과 검수 근거가 유지된다.
- 7쪽 최종 보고서 `output/pdf/Fill-Documents-서식유지-재검증보고서.pdf`의 전체 텍스트를 읽어 이 검수 범위와 대조했다. 지정한 4개 양식/입력 영역 한정, 미작성 영역 보존, DOCX 준비본 한정 수정, 폰트 대체, 편집기 자체 UI 미검증, PDF 정적 반복 문맥을 명시하고 있어 주요 범위 모순을 발견하지 못했다. 보고서의 전체 페이지 렌더 검토 주장은 총괄의 검수 범위이며 이 QA의 개별 PNG 열람 범위는 앞 기록과 같다. 이번 추가 확인은 보고서 텍스트 대조이고 보고서 PNG의 독립 시각 검수는 아니다. 확인한 보고서 SHA-256: `e49c6d6b2bc080b05c11535304718e1f3d1702f68aeb1b81da0b458da28fcf08`.

현재 준비본 `02-준비본/eismea-application.docx`의 SHA-256은 `6b95f55a46513077c7d3e4800397e2ce38e6ab911a5376f497a86d3da98b07ce`다. 현재 `04-결과`의 SHA-256:

| 파일 | SHA-256 |
|---|---|
| `다온케어-사업계획서-short.hwp` | `bc517e396d63d0141a203276d15d58d799c4d05f437bc7c8ddaf225860ecaebb` |
| `다온케어-사업계획서-detailed.hwp` | `3f88ec165d7ab18b9fa9a0d17c7eb760aed092c7b3a3703b040107b908cf8c84` |
| `마을배움연구소-연간활동계획-short.hwpx` | `9dbee67ed6100368a334c95f77709308163ca199f1a8e716b886549372cfdd33` |
| `마을배움연구소-연간활동계획-detailed.hwpx` | `287c20cbf71d7191998abe6510186ce8cbce05ff49857ebd7f8558e5be1b40bb` |
| `Riverside-대피소지원요청-short.pdf` | `0ff2a5e1916248c4f86c8c337ca5cdf96eec31454048f8c1bd77f4aaf690105c` |
| `Riverside-대피소지원요청-detailed.pdf` | `0be76807c7487d762e6afbfb7754ada7e02aed4de649128d86f05a0365cbc72a` |
| `CPSA-표준화사업계획-short.docx` | `6b94c9b461f425fdda2fb258ce6d5f2f90b5e9835e4481ae6eda90b6e2f90da8` |
| `CPSA-표준화사업계획-detailed.docx` | `6c5b836e326187f08e2fab7273ec90ed1c6ac107d6cfd3aeb86dd5e2d4bee106` |

## 관측 한계와 인계

- 원본→HWP 준비본은 완전 byte 보존 대상이 아니다. 제목 자리와 33개 표식을 준비하며, 원본 22/24번 문단의 마지막 공백 한 글자씩의 글자 서식을 본문용으로 바꾼다. 이 사실을 `원본 모든 문자 서식 exact`로 포장하지 않는다. 준비본→결과의 글자서식 exact 관측은 유효하다.
- HWP short의 2/4/6쪽과 detailed 7쪽에 큰 여백이 남는다. 기존 강제 쪽 나눔과 짧은 후속 내용이 유지된 결과이며 빈 페이지는 아니다. 완성 신청서·최적 편집 조판을 승인한 것은 아니다.
- HWPX 전체 허가 신청서가 완성된 것은 아니다. 명시한 법인명과 연간 활동표만 채웠으며 다른 서식/빈 칸은 유지한다. 좁은 마지막 열의 긴 설명으로 행 높이가 커지는 원래 열폭 조건이 남는다.
- DOCX도 전체 신청서를 채운 결과가 아니다. 표지 기본정보 4값과 본문 3항목만 입력했다. 해당 준비본의 고아 제목은 해소됐으나, 원래 문단 속성 보존이나 이 한 번의 쪽 나눔이 다른 내용·다른 편집기의 조판까지 보장하지는 않는다. 최종 short 18쪽의 큰 여백과 전체 1쪽 증가는 명시적 쪽 나눔의 대가다. DOCX의 실제 UI 및 EC Square 폰트 환경 렌더는 미검증이다.
- PDF 추가 쪽의 반복 문맥은 정적 출력이다. 원래 문맥 필드를 다른 편집기에서 수정했을 때 자동 동기화를 보장하지 않는다. 별도 PDF 편집기에서 수정·저장 후 표시, 접근성/태그/보조기술, 서명 실행은 미검증이다.
- 시험 데이터는 돌봄 사업·지역 교육계획·표준화 단체·재난 훈련이라는 문서 목적을 따르며 가상/계획 상태를 표시한다. 실제 고객·계약·시장 조사·자금 확보·승인·제출 여부를 검증한 자료가 아니다.
- 수정 소유자: 공통/CLI/bundle/HWP/실제 자료는 총괄, XML adapter는 XML 개발 담당, PDF adapter는 PDF 개발 담당. 이 기록 이후 코드·준비본·결과가 변하면 영향을 받는 실제 입력·저장 결과·렌더 검사를 다시 연결해야 한다. 문서만 반영하는 최종 패키징은 위 runtime/결과 hash가 유지되는지 확인하면 된다.
- 소비 기록: 정량 토큰·시간 예산은 별도 배정되지 않았다. 유효 소스 테스트 2회(29+142검사), 증거 미확보 초기 테스트 시도 1회, 최종 bundle CLI 독립 호출 16회, 위 독립 읽기/메모리 검사와 PNG 열람을 수행했다. 자동 시스템의 정확한 토큰 소비량은 이 검수자에게 제공되지 않아 수치를 추정하지 않는다.
