# 장문 채우기 독립 설계 검토

검토일: 2026-10-08. 검토자는 설계·생산 코드 작성에 참여하지 않았다. 이 기록은 구현 전 설계 판정이며 제품 인수, 원본 앱의 표시 검증, 배포 승인이 아니다.

## 대상과 판정

대상 설계는 `docs/development/long-content-architecture.md`, SHA-256 `8d6639f2b468495ae163ca2a4ba76d9a66425e995558b5b6ccf0d3bd82794326`이다. 원래 과업은 공개된 복잡한 HWP/HWPX/DOCX/PDF를 실제 채워 보고, 긴 값 전체를 보존하면서 뒤의 문단·행·페이지로 흐르게 하는 것이다. 원본 불변, 새 출력, 축소·잘림 금지, 기존 기본 동작 호환을 기준으로 검토했다.

| 범위 | 판정 | 적용 범위와 제한 |
|---|---|---|
| 공통 `overflow`, 메모리 후보 검증, 기존 게시 경로 | 진행 가능 | 기존 no-clobber 게시 계약 유지. dry-run의 생성 오류와 실제 게시 시 I/O 오류는 구별한다. |
| DOCX flow | 수정 후 재검토 | D1의 선택 영역 축소·가로 넘침 조건이 정해질 때까지 해당 flow 지원 판정을 막는다. 기존 preserve 및 다른 형식의 구현을 막지 않는다. |
| HWPX flow | 진행 가능 | 아래에서 확인한 수평 본문 표의 앵커 패턴 및 명확한 본문에 한정한다. 다른 앵커·중첩·세로 병합을 추정 허용하지 않는 현재 설계의 거부 조건을 유지한다. |
| HWP native flow와 중립 Scripts 예외 | 진행 가능 | 고유 표식·균일 서식·최상위 본문, FileHeader/DocInfo 동일, 원시 레코드 허용 차이, 원본 CFB 이식 조건에 한정한다. |
| PDF 별지와 alias·빈 서명 | 진행 가능 | exact 청크 재구성, 고정 폰트, 모든 widget 참조 확인, 원래 페이지·서명 필드 보존, 재채우기 거부를 함께 구현한다. N1을 실제 원본 회귀에 반영한다. |
| 복잡한 외부 HWP/PDF의 채우기 성공 | 근거 부족 | 현재 자료에는 그 두 원본의 완성 출력·재열기·표시 결과가 없다. 위 설계 진행 판정으로 실제 성공을 대신할 수 없다. |

## 실제 확인 근거

코드 기준은 스킬 루트 `plugins/fill-documents/skills/fill-documents/`이다.

| 파일 | SHA-256 |
|---|---|
| `lib/engine.mjs` | `d4aa74e40607fbd462d9b1b11438d98349ff9a65c8e627af4c2002ccca7a9485` |
| `lib/fields.mjs` | `e74f43ddc10a64d6d3f9d7ac970ed23152d1cd0d0f08590425c6a441ff6bc215` |
| `lib/adapters/docx.mjs` | `0859cc01215cf3b641f4122fff51d5a10aa3ded225724f8242837b16c9286c06` |
| `lib/adapters/hwpx.mjs` | `ddbb9c9e1e75d0080e92befc1da8e2308e1aefdef9e1c07a45ef49c6aa9d750c` |
| `lib/adapters/hwp.mjs` | `6f4b810932b084c179dd8e65ce0240904b3adec37a24d4682ea2a6f809b467a5` |
| `lib/adapters/hancom-runtime.mjs` | `ae6d34166571e35eff84d55840aab9d26edb85ffa74e388f7a1fe1b324173fcc` |
| `lib/adapters/hancom-utils.mjs` | `0cc29286da9ddb1c30af77e5be42048293065de89cb1d915244ee6c719f35d6d` |
| `lib/adapters/pdf.mjs` | `9176608fec6168aef99b5b564a29caf554c9e7efddc9e93eec00176b750692ee` |

기존 `architecture.md`, `brief.md`, 해당 adapter, 공통 값 검사·게시 경로, `office-pdf.test.mjs`의 overflow·서명·페이지 보존 검사와 한컴 검사 항목을 읽었다. 아래 새 확인은 기존 파일 읽기 및 메모리 실행으로 수행했고 모두 종료 코드 0이었다. 생산 코드·원본·실험 파일을 수정하거나 생성하지 않았다. 전체 테스트 모음은 실행하지 않았다.

1. **DOCX 축소 설정 반례:** `node --input-type=module` 표준입력 스크립트로 `createDocxTemplate`의 1개 `body` 필드 셀에 `<w:tcFitText w:val="true"/>`를 메모리에서 추가했다. 값 `'가나다라마바사 '.repeat(200)`로 기존 adapter를 실행했다. 필드 1개 검출, 채우기 성공, 긴 값 보존, `tcFitText=true` 보존을 확인했다. 이는 현재 치환·문단 exact 검사로 축소 설정을 검출하지 못함을 확인한 실험이다. 아직 없는 새 flow 구현을 시험했다고 주장하지 않는다. Word 렌더는 실행하지 않았다.
2. **HWPX 실데이터와 SVG:** 외부 폴더의 `02-준비본/moel-business-plan.hwpx`, `04-결과/hwpx-long-baseline.hwpx`, `05-검증/experiments/hwpx-long-flow-probe.hwpx`를 XML로 직접 읽고, 뒤의 두 파일을 `openHancom`/`renderPageSvg`로 메모리 재렌더했다. SVG text/tspan을 연결해 값과 좌표를 읽었으며 원문 긴 문자열 단순 검색에 의존하지 않았다. 기본 경로는 18쪽, 7쪽의 최대 text y=13494.9733, 페이지 높이=1122.48, 페이지 밖 text 4624개였다. 80개 번호 항목 중 화면 안은 5개였고 끝 표식 및 다른 4개 짧은 값도 페이지 밖이었다. 기존 `hwpx-long-baseline-7.png`도 직접 열어 보았다.
3. **HWPX 좁은 변환의 양성 근거:** 실험본 SHA-256 `b3370c1b266ce6f5dd923e469a0b2990f708bbf9aad1f0eb1c36c6775b53cb26`은 33쪽이었다. 전체 페이지 SVG에서 text y가 페이지 높이 밖인 항목이 없었고, 끝 표식은 21쪽 안, 짧은 4개 값은 7쪽 안에 있었다. 이 확인은 수직 좌표·텍스트 확인이며 전체 겹침, 수평 폭, 원본 앱의 최종 표시를 증명하지 않는다.
4. **HWP 이식 결과 재검사:** `.cache/long-content-probes/architect/grafted-rhwp-replace.hwp`(SHA-256 `2d93aa967a0900be071ef7a0b180b74b2fcad85ccb42e0fc29fc266427ac3984`)를 원본 report-hwp와 다시 열었다. 1→4쪽, 11→11문단, 예상 8,000자 전체 exact, 비본문 스트림 동일, 비대상 텍스트와 문단 서식 동일, 대상 글자 서식 동일, contentLoss 0을 직접 확인했다. 레코드 세부 허용 차이의 결과 파일·실험 코드도 읽었으나 새 레코드 변조 시험은 하지 않았다.
5. **외부 HWP/PDF 원본:** CFB와 pdf-lib로 직접 읽었다. HWP 원본 hash는 `6bf4e5f85bc34c7076e07a164283fe37fae504f5ae9883eb6c9a40940f0aff14`, flags=1이고 Scripts 두 payload가 설계의 8/20 bytes와 일치했다. PDF는 2쪽, AcroForm `/SigFlags 1`, `/V` 없는 `Signature_19`·`Signature_20`, 공백·숫자 시작 이름의 텍스트 필드가 있었다. 해당 원본을 새 구현으로 채운 시험은 아직 없다.
6. **DOCX 외부 렌더:** 외부 `baseline.json`, `docx-renders.json`, 준비 기록을 대조했다. 28→31쪽 및 끝 표식 확인은 총괄의 기존 실행 기록이다. 리뷰어가 LibreOffice/Word 렌더를 새로 실행한 결과는 아니다.

HWPX에서 직접 확인한 표 id `1729651736`의 지원 후보 패턴은 `textWrap=TOP_AND_BOTTOM`, `pageBreak=CELL`, `noAdjust=0`, 크기 `widthRelTo/heightRelTo=ABSOLUTE`, `protect=0`, 앵커 `flowWithText=1`, `allowOverlap=0`, `holdAnchorAndSO=0`, `vertRelTo=PARA`, `horzRelTo=COLUMN`, `vertAlign=TOP`, `horzAlign=LEFT`, 두 offset=0이다. 기존 `treatAsChar=1`을 0으로 바꾸고 앵커 문단 캐시를 갱신한 실험만 양성 근거로 인정한다. 이 패턴 밖은 새 근거 또는 명시적 거부가 필요하다.

## 우선순위별 지적

### D1 · P1 · DOCX 선택 영역의 자동 압축·가로 넘침이 지원 조건에서 빠짐

- **위치:** 설계 5절, 특히 95–103행의 일반 `w:tbl` 지원·허용 변경 목록. 현재 `lib/adapters/docx.mjs`의 `collectTemplate`, `fill`, 문단 exact 검사는 이 배치 속성을 검사하지 않는다.
- **반례:** 수평·비중첩·비병합·비부유 일반 표의 대상 셀에 `w:tcFitText=true`가 있으면 현재 적힌 지원 조건을 모두 통과할 수 있다. 높이를 `atLeast`로 풀고 `cantSplit/keepLines`를 해제해도 셀 폭에 맞춘 압축 속성은 그대로다. 위 메모리 시험에서 기존 채우기 성공과 속성 보존을 확인했다. 대상 run의 `w:fitText`도 같은 종류의 반례다.
- **요구·영향:** 글자 크기 숫자가 같고 문자열이 exact여도 읽을 수 있는 폭을 압축하면 축소 금지 요구를 충족하지 못한다. 또 AutoFit 표에 `noWrap` 및 `growAutofit` 조건이 있으면 긴 연속 문자열을 넣었을 때 열 폭이 바뀌거나 페이지 오른쪽으로 넘치는 경로가 남는다. XML에 기록된 열 폭 동일만으로 표시 폭 보존을 판정할 수 없다.
- **원문 근거:** Microsoft의 [TableCellFitText](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.tablecellfittext?view=openxml-3.0.1)는 셀의 문자열을 폭에 맞추도록 문자 간격을 줄이거나 늘린다고 설명한다. [NoWrap](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.nowrap?view=openxml-3.0.1)은 AutoFit에서 비분리 문자열로 취급하는 조건을, [GrowAutofit](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.growautofit?view=openxml-3.0.1)은 페이지 여백을 넘어 오른쪽에서 잘리는 예를 제시한다. 문서에 대한 실제 Word 렌더 결과와 규격상 반례는 구별한다.
- **최소 조치:** 대상 셀·run의 실제 적용 압축 설정(상속 포함)을 검사하고 `E_LAYOUT`으로 거부하는 범위를 정한다. 안전한 국소 해제를 선택하면 셀/run 속성도 허용 변경 목록에 넣고 인접 텍스트 서식 보존을 검사한다. AutoFit의 알려진 가로 넘침 조건도 선택 표에서 거부하거나 폭을 유지할 수 있는 근거를 명시한다. 전체 문서의 무관한 같은 속성 때문에 정상 대상을 거부하지 않는다. 일반적인 기능 확장이나 새 렌더 서비스는 필요 없다.
- **검증:** `tcFitText`가 직접 또는 스타일로 적용된 대상, 대상 run `fitText`, 가로 넘침 조건의 긴 무공백 값은 명시한 정책대로 오류 또는 안전한 출력이 되어야 한다. 정상 외부 DOCX 및 preserve는 계속 성공해야 한다. 성공 정책을 선택했을 때만 실제 표시·폭 검증을 추가한다.
- **막히는 범위:** 이 조건을 통과시키는 DOCX flow 지원 계약. 공통 경로, preserve, 다른 형식은 막지 않는다.

## 비차단 구현 가정과 주의

- **N1 · 외부 PDF의 빈 서명:** 실제 원본에는 `/SigFlags 1`도 있다. `pdf.mjs`의 현재 blanket reject에서 `/FT /Sig`만 제외하면 여전히 원본을 거부한다. 빈 서명 판정은 `/V`와 실제 서명 dictionary·ByteRange·DocMDP 등을 대조하고, 해당 빈 서명의 SigFlags와 AP/widget은 보존한다. 현재 테스트는 `FT`만 Sig로 바꾼 빈 필드도 거부하도록 되어 있으므로, 이것을 실제 서명 거부 증거로 그대로 재사용하지 말고 빈/실제 서명 fixture를 분리한다. 설계의 빈 서명 지원 방향과 일치하는 세부 적용이며 별지 구조 자체를 차단하지 않는다.
- **N2 · dry-run 결과:** 설계 4절의 동일 오류는 동일 원본·입력의 후보 생성/검증 오류에 적용한다. 현재 기존 출력 충돌은 `publishNewFile`의 hardlink에서 검출된다. dry-run은 기존 출력·부모 폴더를 읽기 검사할 수 있지만 미래의 경합, 디스크 고갈, hardlink 실패를 보장할 수 없다. 이 구분을 결과/문서에 남기고 원자적 게시 검사를 약화하지 않는다.
- **N3 · 줄바꿈의 exact 의미:** 현재 DOCX/HWP/HWPX는 CRLF/CR을 LF로 정규화한다. preserve 호환을 유지한다는 해석하에 이 기존 의미를 인정한다. PDF의 원문 substring/청크 재구성은 CRLF까지 그대로 보존한다. 형식 전체에 같은 byte-exact 의미라고 표시하지 않는다.
- **N4 · 실제 외부 성공 증거:** HWP의 제한 경로 구현 승인은 표 셀 안 HWP 필드 지원을 뜻하지 않는다. 외부 HWP의 선택 본문 준비·값 입력·보존/렌더 결과와 외부 PDF의 alias·빈 서명·별지 결과는 원래 과업 완료 전에 별도로 확보해야 한다. 실패하면 위치·코드·범위를 그대로 보고한다.

## 검증 계획 평가와 재검토

설계 9절은 시험 개수보다 사용자 결과(전체 값, 뒤 문단/행 보존, 실제 페이지 안 가시성), 실패 후 출력 없음, 재열기, PDF appearance 재생성, 원시 레코드 손실을 기준으로 하므로 방향이 적절하다. `exact value`나 페이지 증가만으로 성공을 넓히지 않는 조건도 적절하다. D1의 반례와 N1의 실제 빈 서명 구조를 여기에 연결하면 된다.

재검토는 수정된 DOCX 지원/거부 조건·XML 허용 변경 목록·D1 검증 사례와 그 변경된 설계 hash에 한정한다. 다른 범위는 위 hash의 계약을 유지하는 한 다시 검토할 필요가 없다. HWPX 허용 앵커 확대, HWP 레코드 허용 차이 확대, PDF 원문 저장/별지 매핑 계약 변경은 해당 범위만 새로 검토한다.

실행하지 않은 범위는 새 flow 생산 코드, 전체 테스트 모음, 최종 번들, 실제 Word/한컴 앱, 외부 HWP/PDF의 완성 채우기이다. 원시 레코드·보존·레이아웃 검사를 구현해 실제 통과하기 전에는 구현 완료로 해석하지 않는다.

## 재검토 1 · 2026-10-08

대상 설계 SHA-256: `f4fa87aedcc009ee5a1be4340795cec73a922694ff8632962883c0c776054668`. 요청받은 변경 범위인 DOCX D1 조치, PDF SigFlags 조건, HWPX 앵커 제한만 다시 읽었다. 이 절의 판정은 해당 hash에 적용하며 위 최초 검토 기록을 덮어쓰지 않는다.

| 범위 | 판정 | 근거 |
|---|---|---|
| DOCX D1 축소·상속 검사 | 진행 가능 | 104–111행은 대상 셀 `tcFitText/noWrap`, 치환 run `fitText`, 도달 가능한 상속 체인과 불명확 적용을 거부한다. 위험 속성을 임의 삭제하지 않으며 무관한 스타일을 거부 근거로 쓰지 않는다. D1의 기존 누락은 설계상 해소됐다. |
| DOCX AutoFit/기존 fixed 폭 검사 | 수정 후 재검토 | 120행의 새 검사식이 실제 외부 DOCX 세 표를 모두 거부한다. D2 참조. |
| PDF SigFlags | 진행 가능 | 198–201행은 1/3을 정확한 정수로 제한하고, 모든 서명 필드가 비어 있으며 실제 서명 dictionary·ByteRange·DocMDP 등이 없는 조건을 요구한다. AP/widget/flag 보존과 빈/실제 서명 fixture 구분이 명시됐다. |
| HWPX 정확 앵커 | 진행 가능 | 137–144행은 앞서 직접 확인한 앵커 패턴과 이미 `pageBreak=CELL`인 표로 제한한다. 생략 속성의 임의 기본값, NONE/TABLE 변환, id 하드코딩을 피하며 양성 근거의 수직 좌표 한계도 유지한다. |

### D2 · P1 · 기존 fixed 표에 새 본문 폭 가드를 적용하면 외부 인수 시나리오가 모두 거부됨

- **위치:** 수정 설계 120행의 `grid 합+indent가 가용 본문 폭 안` 및 `기존 fixed 표도 이 지원 범위와 폭 정합 검사를 통과` 조건, 125행의 준비된 EU 양식 관찰, 220행의 실제 외부 세 필드 시험.
- **직접 확인:** `python3` 표준입력 스크립트의 `zipfile`/`xml.etree.ElementTree`로 `02-준비본/eismea-application.docx`의 세 표와 각 표가 속한 다음 `sectPr`를 읽었다. profile/objectives/relevance 모두 `tblLayout=fixed`, grid 합=8527twip, `tblInd=dxa(228)`, `pgSz.w=11907`, 좌우 margin=1588이다. 모든 `tcW=dxa(8527)`이며 단일 열 section이다. 명령 종료 코드 0.
- **반례 계산:** 가용 본문 폭은 `11907 - 1588 - 1588 = 8731`, 설계 검사값은 `8527 + 228 = 8755`이다. 검사값이 24twip 크므로 세 필드를 flow로 처리하면 새 규칙상 모두 `E_LAYOUT`이다. 이것은 실제 페이지 밖으로 잘린다는 증명이 아니라, 현재 작성된 가드가 외부 성공 시나리오를 제외한다는 직접 증거다. 이전 28→31쪽 baseline 렌더의 관찰을 이 계산만으로 무효화할 수 없다.
- **영향:** D1 보완에 새로 추가한 검사 때문에 이미 fixed인 정상 대표 경로가 제외된다. 문서가 주장하는 외부 flow 시험과 양립하지 않는다. 폭 검사를 느슨하게 추측하거나 원본 표 폭을 줄이는 것으로 해결하면 원본 서식 보존 조건을 잃을 수 있다.
- **최소 조치:** 기존 fixed 표의 layout/폭을 그대로 두는 경로와 새 AutoFit→fixed 전환의 가드를 분리하거나, 표 원점·들여쓰기·셀 여백을 포함한 실제 기하 의미에 맞게 가드를 정정한다. 기존 표의 본문 여백 초과와 물리적 페이지 밖 잘림을 같은 것으로 취급하지 않는다. 임의 허용오차를 추가하거나 원본 grid/셀 폭을 다시 쓰지 않는다. 수정한 규칙으로 이 세 표가 요구한 지원 범위인지 명확히 하고, 지원한다면 긴 값의 실제 수평 표시를 검증한다.
- **막히는 범위:** 위 폭 검사에 걸리는 DOCX flow 경로. D1의 축소 거부 구현, 공통·HWP·PDF·HWPX 작업은 막지 않는다.

이 재검토에서는 새 생산 코드를 시험하지 않았다. 새 실험 파일도 만들지 않았다. PDF/HWPX의 이전 직접 근거는 입력과 해당 계약이 같아 재사용했다. 다음 재검토는 D2의 fixed 표 경계 조건 및 그 조건에 대한 실제 세 표의 수용 여부에 한정한다.

## 재검토 2 · 2026-10-08 · 현재 설계 판정

대상 설계 SHA-256: `351ce77595e5640f0989ec8997aaa33ffe12d9ef153e9bac948cb7d4640ab480`.

**판정: 진행 가능.** DOCX/HWPX 구현을 막는 설계 지적은 해소됐다. PDF SigFlags 조건의 직전 진행 판정도 유지한다. 이 판정은 해당 설계의 구현 진행에 대한 것이며 생산 코드 또는 실제 외부 완성 출력의 검증 통과가 아니다.

- **D2 해결:** 115–130행은 기존 유효 fixed 표와 새 AutoFit→fixed 전환을 명시적으로 분리한다. 기존 fixed는 `tblLayout/tblW/grid/tcW/indent` 등 가로 속성을 그대로 두고 높이·페이지 흐름만 조절하며, 새 변환용 가용 본문 폭 가드를 재사용하지 않는다. 새 AutoFit 전환은 엄격한 기존 1–5 조건을 유지하고 실패를 fixed 경로로 우회하지 않는다.
- **실제 반례와 정합:** 128행과 223행은 기존 EU 세 표를 위험 가드 통과 시 fixed 지원 대상으로 정하고, 24twip 계산 때문에 폭을 줄이거나 거부하지 않도록 한다. 준비 DOCX SHA-256이 앞서 직접 읽은 `8ce7a14c23e7ccf519efb3526cd77f35d48658a516eae0e1a7c36bd1f0d5e1a3`과 같은 것을 다시 확인했다. 따라서 D2에서 제시한 원자료와 수정 계약의 적용 대상이 일치한다.
- **D1 유지:** 104–109행의 직접/상속 `tcFitText`, `noWrap`, run `fitText` 및 해석 불명 거부가 두 경로에 계속 적용된다. 기존 fixed 예외가 축소 속성이나 부유·중첩·세로쓰기·대상 세로 병합을 허용하는 통로가 되지 않는다.
- **다른 수정 범위:** HWPX 140–147행은 확인한 정확 앵커 패턴과 이미 CELL인 표의 변환 제한을 유지한다. PDF의 정확한 정수 SigFlags 1/3, 모든 서명 값 없음/null, 실제 서명 구조 부재 및 AP/widget 보존 조건도 현재 파일에서 다시 읽었다.
- **검증 계획:** 223행은 기존 fixed의 가로 속성 보존, 새 AutoFit의 가드 실패, 두 경로의 긴 무공백 값 실제 렌더, 정확 HWPX 앵커의 양성/단일 속성 음성 사례를 분리한다. 선언된 폭 보존과 실제 가시성을 같다고 주장하지 않는다.

이번에는 수정된 설계 구간 읽기와 SHA-256 재확인만 수행했다. `python3` 확인 명령은 종료 코드 0이었다. 새 생산 코드·전체 테스트·렌더 실험은 실행하지 않았고 원자료를 수정하지 않았다. 기존 fixed의 실제 가로 가시성, HWPX 전체 겹침, 외부 HWP/PDF 완성 출력 등 최초 검토의 미검증 범위는 그대로 남는다. 구현에서 위 지원 조건·허용 변경 범위가 달라질 때만 영향받는 계약을 다시 검토한다.

## 재검토 3 · 구현 중 발견한 경계의 설계 보완

대상 설계 SHA-256: `b51746669e025d72b37aa956d9066bf2bd7dd60ff628e4ec4f0ff23967521e5f`, 11절만 검토했다. PDF 실제 구현에서 발견한 PF1/PF2와 검토 버전은 별도 `pdf-flow-implementation-review.md`에 있다.

- **PDF 한 줄별 청크/v2 설계: 진행 가능.** 한 개 시각적 줄의 raw substring을 실제 필드로 저장하고, 원래 newline/빈 줄을 보존하며, 충분한 높이의 겹치지 않는 rect와 고정 폰트를 쓰는 계약은 기본 제공자의 긴 단어 비분할 반례를 제거하는 방향이다. 같은 원문을 새 newline 없이 연결하는 exact 조건, 같은 페이지의 여러 청크를 표현하는 `chunkPages`, 중복 없는 `addedPages`, 순서·위치 검사가 함께 정해져 있다. 기본 제공자로 다시 생성하는 회귀가 명시되어 있다. 이는 새 생산 구현의 통과 판정은 아니다.
- **PDF SigFlags=0 수정: 진행 가능.** 일반 0을 빈 서명 존재 조건과 분리하고 실제 서명/활성 콘텐츠 거부를 유지하는 범위다.
- **HWP DocInfo 전체 해제 바이트 비교 방향: 타당.** 원본 CFB의 DocInfo raw bytes를 최종 출력에 보존하고 FileHeader 및 모든 기존 레코드/서식 가드를 유지하면, raw 압축 표현만 다른 것을 스타일 변경으로 취급할 필요는 없다. 다만 아래 D3 때문에 현재 적힌 해제 종료 조건은 수정 후 재검토다.

### D3 · P1 · 원본의 검증 가능한 8바이트 trailer도 일괄 거부됨

검토자는 원본 `wict-business-plan.hwp`를 `openHancom`으로 읽어 무편집 `exportHwpWithReport`를 메모리에서 다시 실행했다. FileHeader byte exact, contentLoss 0, 두 BodyText section의 전체 inflated bytes 동일을 확인했다. DocInfo raw 크기는 3311→3187, 양쪽 inflated 크기는 16390, SHA-256은 모두 `47912fc966a7caa82a0dbaf6ac2e8afda16abb445a2f868e072d2564804db760`이었다. 원본 파일 hash도 그대로였다.

그러나 `inflateRawSync(..., {info:true, maxOutputLength:32*1024*1024})`의 실제 입력 소비량은 원본 3303/3311, export 3187/3187이다. 원본의 남은 8 bytes는 `c56dcb5606400000`이며 앞 4 bytes little-endian CRC32=1456172485, 뒤 4 bytes 길이=16390이다. Node zlib `crc32`로 다시 계산한 해제 전체 데이터 CRC32와 길이가 둘 다 정확히 같았다. 따라서 11절의 **남은 압축 데이터는 모두 거부** 조건은 이 원본도 거부한다. 전체 inflated 동일성만 확인한 실험은 이 실패 조건을 대신하지 못한다.

최소 조치는 DocInfo의 잔여 데이터가 0이거나, 정확히 8 bytes이고 CRC32와 원래 길이가 전체 해제 결과와 일치하는 경우만 인정하는 좁은 조건을 정하는 것이다. 임의 trailing bytes·다중 stream·잘못된 checksum/길이는 거부하고 최종 원본 raw DocInfo 보존은 유지한다. 이 예외를 다른 스트림이나 다른 손실 허용으로 확대하지 않는다. Node 20 지원 때문에 구현에서는 현재 Node 25의 `zlib.crc32` 존재를 필수 전제로 삼지 말아야 한다.

추가 메모리 실험에서 PDF 기존 PF1 문자열에 CRLF·빈 줄·tab·끝 newline을 붙여 시각적 한 줄 raw substring 40개로 나눈 뒤 기본 `layoutMultilineText`로 검사했다. 결합 exact, 각 청크의 비어 있지 않은 줄 최대 1개, 폭 최대 494.45pt/허용 497.28pt, 비어 있지 않은 줄의 bounds 초과 0이었다. 이것은 분할안의 가능성 검사이며 아직 없는 v2 필드 저장·재열기·매핑 구현 검증은 아니다.

위 수정된 검토 명령들은 종료 코드 0이었다. HWP 첫 측정 명령은 CFB가 반환한 Array를 Buffer로 바꾸지 않고 zlib에 전달한 검토 스크립트 오류로 1회 종료 코드 1이었으며, Buffer 변환 후 같은 원본으로 재실행해 위 결과를 얻었다. 생산 코드·원본·준비본은 수정하지 않았다. D3의 잔여 데이터 해석 조건만 다음 재검토 대상으로 남는다.

## 재검토 4 · 11절 최종 계약 확인

대상 설계 SHA-256: `97b28395ebde1ffd39598bd04c354d9e1d76152ed7c1d85bd47bf86e48690f6d`.

**HWP DocInfo의 좁은 압축 표현 예외: 진행 가능. D3는 설계상 해소됐다.** 현재 11절은 남은 입력이 0 bytes이거나 정확히 8-byte CRC32+ISIZE trailer이고 전체 해제 데이터의 CRC/길이와 일치할 때만 허용한다. 그 밖의 잔여/오류는 거부한다. FileHeader byte exact, DocInfo 전체 inflated bytes exact, 최종 원본 raw DocInfo 보존과 나머지 BodyText·값·서식 가드도 유지한다. 앞서 직접 확인한 외부 원본의 남은 8 bytes가 이 조건에 정확히 해당한다.

이 조항은 7절의 이전 DocInfo 압축 raw byte 동일 조건에 대한 명시적 보완으로 적용한다. 압축 해제한 전체 바이트가 다르면 표준 압축 차이로 간주하지 않는다. PDF 한 줄 청크/v2 및 SigFlags=0 수정 방향의 진행 판정도 유지한다.

새 실행 없이 11절 본문과 hash를 직접 재확인했다. 실제 구현에서는 정상 trailer, CRC/길이 1바이트 변조, 다른 잔여 길이, 해제 한계와 오류를 구분하고 원본 raw 스트림 보존을 재검사해야 한다. 현재 판정은 구현 진행이며 해당 생산 검사 통과를 의미하지 않는다.

## 재검토 5 · HWP 11절의 실제 DocInfo 검사

기준 설계는 위 `97b28395ebde1ffd39598bd04c354d9e1d76152ed7c1d85bd47bf86e48690f6d` 그대로다. 이번에 읽은 `lib/adapters/hwp-flow.mjs` SHA-256은 `209ff34a03f723d059a788295bb8aaa995b187cd3cd483da4eb6aafd123552a1`, `lib/adapters/hancom-runtime.mjs`는 `4fa342cc7182f08661e00b420c48f1d4824a4c3f97d379771502387cc215d636`이다. **11절의 좁은 압축 표현 예외 구현은 진행 가능**으로 판정한다. 전체 HWP 구현이나 원본 앱 화면을 이번 국소 검토로 재승인하는 것은 아니다.

`decodeHwpDocInfo`는 FileHeader 압축 flag에 따라 전체 stream을 읽고, raw/해제 결과에 32MiB 상한을 적용한다. 압축 입력의 실제 소비량 뒤에 남은 bytes는 0 또는 정확한 CRC32+ISIZE 8 bytes만 허용한다. CRC 구현은 자체 정수 table을 사용하여 새 Node 전용 `zlib.crc32`에 의존하지 않는다. `verifyHwpFlowChanges`는 FileHeader byte exact와 DocInfo 전체 해제 bytes exact를 먼저 확인하며 기존 BodyText 구조·허용 차이 검사를 유지한다. `createHwpFlowCandidate`는 원본 CFB를 읽어 승인된 BodyText section만 교체하므로 원본 raw DocInfo가 남는다.

별도 `node --input-type=module` 메모리 시험을 Node v25.9.0에서 실행하여 종료 코드 0을 확인했다. 같은 전체 payload에 대해 잔여 0과 정상 8-byte trailer는 성공했다. 잔여 1·7·9 bytes, 두 번째 deflate stream, CRC 1byte 변조와 ISIZE 1byte 변조는 모두 `E_PRESERVATION`이었다. 서로 다른 전체 payload와 FileHeader 1byte 변조도 `verifyHwpFlowChanges`에서 거부했다. 시험은 전체 라이브러리 테스트 모음 재실행이 아니며 32MiB 초과 부하나 Node 20 자체 실행은 포함하지 않았다. 해당 상한과 API 의존성은 코드로 확인했다.

외부 원본·준비본·`hwp-short-flow.hwp`·`hwp-long-flow.hwp`를 직접 읽어 네 파일의 FileHeader와 **압축 raw DocInfo**가 모두 exact임을 확인했다. 네 파일의 raw DocInfo는 3,311 bytes, SHA-256 `9abd98f5b281e782984cb521503405a3df1becb450b8a0777e677e53f037ebb7`이고, 해제 전체 16,390 bytes의 SHA-256은 `47912fc966a7caa82a0dbaf6ac2e8afda16abb445a2f868e072d2564804db760`이다. 출력 파일 해시는 short `f29c70d6d9f680bfc2967191d00e0bce8c7ad13ec5c100ba9ad9ac56840b2083`, long `c5915514ef3d7ab5841e6b582d2683fef227fce92e93a63500f6a4bf92125115`이다.

이 범위에서 새 차단 지적은 없다. 이후 DocInfo 허용 범위, raw 원본 이식 또는 자원 한계를 바꾸면 그 변경을 다시 검토해야 한다. PDF 11절의 실제 PF1/PF2 해소 결과는 별도 `pdf-flow-implementation-review.md` 재검토 1에 기록했다.
