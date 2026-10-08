# PDF 장문 구현 독립 검토

검토일: 2026-10-08. 원래 요구는 공개 PDF 양식에 긴 입력을 채워 전체 내용을 보존하고 읽을 수 있는 추가 페이지로 잇는 것이다. 원본 불변, 새 출력, 축소·잘림 금지와 기존 preserve 호환을 기준으로 삼았다. 설계 기준은 `long-content-architecture.md` SHA-256 `351ce77595e5640f0989ec8997aaa33ffe12d9ef153e9bac948cb7d4640ab480`이다.

## 대상 버전과 판정

경로는 `plugins/fill-documents/skills/fill-documents/` 기준이다.

| 대상 | SHA-256 |
|---|---|
| `lib/adapters/pdf.mjs` | `899eafebfbb3a8b0c92a3ad81fca510bef2488462485823ddb6979acd9aa2c00` |
| `lib/adapters/pdf-flow.mjs` | `8c7cfa694ac5e925196890c4c0065407d0636b4b9236f5d95069d9f00bc2c414` |
| `tests/pdf-flow.test.mjs` | `af199e1603b50db4f75ca4354932e3fc86339801a6c103be18fb33eedb3a1b81` |
| `tests/office-pdf.test.mjs` | `f135c2dbec6ec54eff7f0aacdc309bed251ac456455dde01d84628e53927a4ce` |

**전체 판정: 수정 후 재검토.** 일반 appearance 재생성 후의 가시성 주장(PF1)과 서명란 없는 `SigFlags=0` 호환(PF2)이 남았다. 현재 전용 appearance로 처음 생성한 외부 FEMA short/long 결과는 아래 범위에서 정상 근거를 확보했다. PF1은 처음 생성한 모든 결과가 잘린다는 지적이 아니다.

## 직접 확인한 실행과 결과

전체 테스트 모음은 실행하지 않았다. 요청대로 특정 반례만 메모리에서 생성·변경했고 생산 코드, 원본, 외부 결과 파일을 수정하지 않았다. 이 검토 기록만 작성했다.

- `node --input-type=module` 표준입력 스크립트로 원본 FEMA와 `04-결과/pdf-short-flow.pdf`, `04-결과/pdf-long-flow.pdf`를 pdf-lib로 직접 열고 입력 JSON과 대조했다. short는 2쪽, long은 6쪽이며 모든 13개 입력 필드가 exact였다. 장문은 매핑 순서대로 청크를 합쳐 원문과 대조했다. 원래 2쪽의 content stream bytes, MediaBox/CropBox/회전, 빈 서명 field/widget dictionary와 AP stream bytes, SigFlags=1이 그대로였다. 종료 코드 0.
- short 출력 SHA-256은 `c53208356aa5bb6cc4dfde4fb78db9e8724a9680bf28d7dc8ca959a8c5086933`, long은 `bd14329b401c996eb7f63095bdc3b2136a1e06b4ce645bb69d2dacfa2208c870`이다. 설계에 쓰인 외부 폴더는 `/Users/yback_illusionist/AI/chatgpt/skill/외부양식-장문테스트-20261008/`이다.
- 외부 `05-검증/flow-pdf.json`, `pdf-reread.json`의 페이지/필드 결과를 직접 계산과 대조했다. `pdf-renders/pdf-long-flow.html`의 저장된 bbox를 Python XML로 읽었으며 6쪽 모두 페이지 밖 word는 0, 끝 표식은 6쪽이었다. 이것은 기존 렌더 산출물 검사이며 리뷰어가 새 렌더 엔진을 실행한 것은 아니다. `pdf-long-flow-3.png`, `pdf-long-flow-6.png`도 직접 열어 첫 별지와 끝 표식을 확인했다.
- PF2는 새 메모리 PDF에 일반 text field 하나만 두고 AcroForm `SigFlags=0`을 넣어 `pdf.inspect`로 재현했다. 결과는 `E_UNSUPPORTED: 확인할 수 없는 PDF 서명 상태입니다.`였다.
- PF1은 11pt `body` 필드에 `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(100)`을 넣어 flow 결과를 생성하고, 결과를 재열어 각 청크에 **기본** `field.updateAppearances(font)`를 호출했다. 재저장·재열기 후 실제 AP는 clipping 연산과 1개 `Tj`를 가졌다. 청크 문자열 2,600자의 기본 배치 폭은 18,615.3pt, 필드 폭은 499.28pt였다. 원문 재구성은 exact이고 `pdf.validate`는 structure/appearance/continuation-values를 모두 pass로 반환했다. 종료 코드 0.
- 첫 PF1 측정 시도는 저장 전 `PDFContentStream`을 raw-stream decoder에 넣은 검토 스크립트 오류로 종료 코드 1이었다. 제품 오류로 세지 않았다. 재저장 후 raw stream을 읽도록 검토 스크립트를 고쳐 위 결과를 얻었다. 파일 쓰기는 하지 않았다.

## PF1 · P1 · 일반 AP 재생성에서 긴 청크가 다시 잘리며 현재 검사는 이를 통과시킴

- **위치:** `pdf-flow.mjs:15`의 문자 경계 wrap, `:37`의 청크 계획, `:58`의 전용 appearance; `pdf.mjs:357`의 standalone validate; `pdf-flow.test.mjs:33,54`의 재생성 시험.
- **구체 조건:** 위 2,600자 무공백 영문은 전용 appearance가 여러 줄로 그리는 한 개 청크다. pdf-lib 기본 appearance는 공백을 찾지 못하면 전체 문자열을 한 줄로 반환한다. 설치된 `pdf-lib/cjs/api/text/layout.js`의 `splitOutLines` fallback과 `api/form/appearances.js`의 기본 제공자도 직접 읽었다. `field.updateAppearances(font)`라는 정상 라이브러리 경로를 사용하면 499.28pt 칸에 18,615.3pt의 한 줄이 잘린다. 이는 실제 원본 앱 전체의 동작을 일반화한 주장이 아니라 실행한 기본 제공자의 재현 결과다.
- **계약·영향:** 설계는 원문을 유지하는 영구 별지와 AP 재생성 검증을 요구한다. 현재 시험은 동일한 `continuationAppearance`를 재호출하므로 그 제공자를 사용할 때의 재생성만 증명한다. 기본 제공자에 대한 내구성이나 이후 가시성까지 넓히면 잘못된 완료 주장이 된다. `/V` 원문은 남지만 실제로 읽히는 내용은 잘릴 수 있다.
- **조치:** 재생성 지원 범위를 결정해 명시해야 한다. 일반 재생성도 지원한다면 청크 구조/배치가 해당 경로에서도 들어가도록 만들고 실제 기본 제공자·재열기 후 bounds를 확인한다. 현재 전용 제공자만 지원할 경우 설계·제품 안내·테스트 이름과 결과에서 그 범위를 명시하고 일반 재생성의 가시성 보장을 하지 않아야 한다. 이 선택은 전체 PDF 재작성이나 원문 손실로 해결하지 않는다. standalone `validate`의 nonempty AP 통과를 실제 배치 통과로 표현하지 않는다.
- **검증:** 위 문자열을 같은 11pt로 생성→재열기→기본 AP 재생성→재저장해 실제 AP와 bounds를 확인한다. 전용 재생성 양성 검사는 별도로 유지한다. 저장 원문 exact만 검사하면 이 반례를 잡지 못한다.
- **막히는 범위:** 일반 AP 재생성 이후에도 가시성을 보장한다는 주장·해당 지원 범위의 완료 판정. 현재 전용 AP로 생성한 외부 결과의 값/초기 가시성 확인을 무효화하지 않는다.

## PF2 · P2 · 서명란 없는 일반 SigFlags=0 PDF를 거부함

- **위치:** `pdf.mjs:69`의 `SigFlags` 검사에서 허용 값 `[0,1,3]` 전체에 `!emptySignatures.size` 조건을 적용한다.
- **구체 조건:** 일반 텍스트 필드만 있는 PDF에 AcroForm `SigFlags=0`을 저장해 inspect하면 거부된다. 설계는 생략/0인 일반 경우와 빈 서명란을 나타내는 1/3을 구분한다. 0에서도 빈 서명 필드가 하나 이상 필요하다는 현재 조건은 그 계약과 다르다.
- **영향:** 서명되지 않은 지원 가능 템플릿을 inspect/fill 모두 시작하지 못한다. FEMA의 1+빈 서명 사례가 통과하므로 현재 외부 양성 시험으로 드러나지 않는다.
- **조치:** AcroForm 위치와 정수 검증은 유지하면서 0은 빈 서명 필드 존재를 요구하지 않고, 1/3의 추가 확인과 실제 서명 dictionary·non-null V·ByteRange/DocMDP 거부를 유지한다.
- **검증:** 서명란 없음+0, 생략은 양성; 1/3+빈 서명은 양성; 실제 서명/알 수 없는 bit/비정수/비AcroForm SigFlags는 음성으로 분리한다. 0이라는 이유로 다른 실제 서명 검사를 건너뛰지 않는다.
- **막히는 범위:** 설계에 명시된 일반 unsigned PDF 호환.

## 확인 범위와 재검토

alias는 원래 이름을 바꾸지 않고 입력 이름과 sourceName을 연결한다. 현재 외부 13개 값 대조에서 이 연결을 확인했다. 청크 매핑은 원본 참조값, 이름 hash·순서, 페이지 순서/중복, 길이·SHA를 다시 검사하고 완성 결과의 재채우기를 거부한다. 서명값·XFA·활성 콘텐츠 거부 경로와 테스트도 읽었다. 전체 활성 콘텐츠 변형이나 모든 서명 트리를 독립적으로 재시험한 것은 아니다.

필요한 재검토는 PF1의 지원 범위 확정 또는 구현 변경과 두 제공자의 실제 결과, PF2의 0/1/3 분기 수정에 한정한다. 부모가 이후 전체 테스트를 수행할 예정이며 이 기록은 그 결과를 대신하지 않는다. 수정 후 코드 hash와 해당 반례 결과를 연결해야 한다. 코드·스키마·원문 보존 계약이 달라지면 그 영향 범위도 추가로 검토한다.

## 수정안 설계 검토 · 생산 구현 재검토 전

설계 11절 SHA-256 `b51746669e025d72b37aa956d9066bf2bd7dd60ff628e4ec4f0ff23967521e5f`의 PDF 한 줄 청크/v2 매핑 및 SigFlags=0 분리안은 **구현 진행 가능**으로 검토했다. 상세 근거는 `long-content-review.md`의 재검토 3에 있다. 한 줄 raw substring의 기본 배치 가능성은 메모리에서 확인했지만 새 v2 생산 저장·재열기·기본 AP 재생성은 아직 실행하지 않았다. 따라서 이 설계 승인만으로 위 실제 구현 PF1/PF2를 해결 완료로 바꾸지 않는다.

## 재검토 1 · v2 실제 구현의 PF1/PF2 해소 확인

검토일: 2026-10-08. **현재 아래 버전은 PF1/PF2 범위에서 진행 가능**이다. 앞의 수정 후 재검토 판정은 이전 v1 구현에 적용하며, 이번 실제 재현 결과로 두 지적을 해소한다. 기준 설계는 `long-content-architecture.md` SHA-256 `97b28395ebde1ffd39598bd04c354d9e1d76152ed7c1d85bd47bf86e48690f6d`의 11절이다.

| 현재 대상 | SHA-256 |
|---|---|
| `lib/adapters/pdf.mjs` | `4e2a57dab566ebfb192f2bdf7ce5b7831ff2b3e74cf7c663c5a22304c82e571d` |
| `lib/adapters/pdf-flow.mjs` | `180b13f5cbb705e23c01ed5604834ab433d5df224c9277643d241bd0af7536fd` |
| `tests/pdf-flow.test.mjs` | `c329fcc5c92e6732afc335c05ea589199308e7510bc026f070d4e1ac336817b7` |
| `tests/office-pdf.test.mjs` | `f135c2dbec6ec54eff7f0aacdc309bed251ac456455dde01d84628e53927a4ce` |

`pdf-flow.mjs`의 `appendContinuation`은 실제 raw substring 한 줄마다 별도 필드를 생성하고 기본 `updateAppearances(font)`를 사용한다. 고정 글자 크기와 서로 겹치지 않는 줄별 높이를 유지한다. `writeContinuations`/`readContinuations`는 Version 2의 `chunkPages`를 함께 쓰고 읽으며 페이지 순서·필드 유일성·비겹침·길이·해시를 검사한다. `pdf.mjs`의 `validate`는 sourceName 별칭, 고정 글자 크기와 기본 multiline 배치의 비어 있지 않은 줄 bounds도 대조한다. 원문 실제 newline은 `/V`에 남고 뒤따르는 glyph 없는 빈 줄은 가시 텍스트 잘림으로 잘못 판정하지 않는다.

이번 검토자는 전체 테스트 모음을 실행하지 않았다. 현재 테스트 소스를 읽고, 별도의 `node --input-type=module` 표준입력 스크립트를 Node v25.9.0에서 실행했다. 아래는 모두 메모리 생성·재열기·재저장 또는 외부 파일 읽기이며 종료 코드 0이었다.

- **PF1 동일 반례:** A4 원본의 11pt multiline 필드에 `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(100)` 2,600자를 채웠다. 결과는 총 2쪽/실제 별지 필드 38개였다. 모든 청크를 기본 `field.updateAppearances(font)`로 재생성한 뒤 재저장·재열기했다. 38개 가시 줄과 38개 실제 nonempty AP를 확인했고 최대 줄 폭 494.45pt, bounds 초과 0, 필드 겹침 0이었다. 청크 결합은 원문 exact이고 `validate`의 네 검사가 모두 pass였다. 이전처럼 2,600자를 한 필드에 남겨 두는 동작은 사라졌다.
- **줄바꿈·혼합값:** 한글/무공백 영문에 연속 CRLF·빈 줄·앞뒤 공백·후행 CRLF를 포함한 6,021자는 총 4쪽/98개 실제 청크였다. 기본 AP 재생성 후 가시 줄 96개, 최대 폭 494.989pt, bounds 초과 0, 겹침 0, 원문 exact였다. glyph 없는 빈 줄은 그대로 보존했다. 두 결과에서 첫 청크의 글자 크기를 11→10으로 바꾸면 `validate`가 `E_PRESERVATION`으로 거부했다.
- **PF2 양성/음성 경계:** 일반 텍스트 필드만 있는 `SigFlags=0`은 inspect와 short fill 모두 성공했다. 빈 서명 필드가 없는 1/3, 값 2와 0.5는 `E_UNSUPPORTED`였다. 1/3과 null `/V` 빈 서명 필드 조합은 성공했고, 같은 필드의 `/V`를 non-null로 바꾸면 거부했다. `SigFlags=0` 문서에 JavaScript `OpenAction`을 추가한 경우도 거부했다. 0 예외가 실제 서명·활성 콘텐츠 필터를 우회하지 않았다.
- **새 외부 FEMA 출력:** 현재 `04-결과/pdf-short-flow.pdf`는 2쪽/13개 값 exact, `pdf-long-flow.pdf`는 6쪽/13개 값 exact다. long의 `7 Message` 원문 6,596자는 10pt 실제 청크 162개와 추가 페이지 3·4·5·6에 대응하며 마지막 값은 `장문-끝-080`이다. 원래 2쪽의 content stream bytes/MediaBox/CropBox/회전, 빈 서명 두 개의 field/widget dictionary와 AP stream bytes, `SigFlags=1`이 원본과 모두 같다. 현재 long에 `validate`를 실행하여 기본 배치 검사까지 pass를 확인했다.

외부 파일 SHA-256은 원본 `e745a3a7b78bea3295e33b1efbc291011a9b78bdd1c937115c8c5301e7b9454f`, short `c53208356aa5bb6cc4dfde4fb78db9e8724a9680bf28d7dc8ca959a8c5086933`, 새 long `1c84d661db7fd7810eec527ec56fd86067c811c10cc8612ef98641b5644b8c3a`이다. short는 overflow가 없어 이전 결과와 동일한 해시다.

**비차단 가정·남은 확인:** 검사 대상은 위 source 버전과 설치된 pdf-lib 기본 제공자의 동작이다. 모든 PDF 뷰어나 수동 변경된 arbitrary AP의 시각적 무결성을 증명하지 않는다. 이번 재검토에서는 새 v2와 연결된 PNG를 직접 확인하지 않았으며 앞 절의 v1 PNG 관찰을 새 v2 시각 근거로 재사용하지 않았다. 최종 새 렌더 확인, 전체 회귀 및 배포 bundle 확인은 총괄의 후행 검증 범위다. 현재 두 지적에 추가로 막히는 구현 범위는 발견하지 않았다.
