# 긴 내용 채우기 설계

작성일: 2026-10-08. 상태: [독립 설계 검토](long-content-review.md) 및 11절 보완안 검토 완료. 최종 구현에는 11절의 HWP 압축 표현·PDF 한 줄 청크 계약을 적용한다. 기존 계약은 [architecture.md](architecture.md), 실제 실행 결과와 한계는 [검증 기록](long-content-verification.md)을 따른다. 초기 실험과 최종 검증은 구분해서 읽는다.

## 1. 요구와 선택

사용자가 명시한 필드에 긴 내용을 넣으면 전체 내용을 보존하면서 본문과 표의 높이가 늘고, 뒤의 문단·행이 밀리며, 필요한 페이지로 이어져야 한다. 글자를 줄이거나 내용을 잘라 맞추지 않는다. 원본과 출력은 다른 파일이며 기존 출력 덮어쓰기, 비대상 텍스트·서식 변경, 업무 양식 전체 재작성은 계속 금지한다.

공통 옵션은 `--overflow preserve|flow` 하나를 추가한다. 기본 `preserve`는 기존 동작을 유지한다. `flow`는 **값을 넣는 필드의 컨테이너에 한해서** 아래 형식별 확장 규칙을 적용한다. 긴 값이라는 이유로 다음 입력 필드나 다음 업무 행에 내용을 넘기지 않는다. 같은 값의 표시 공간을 확장한다. 반복 레코드의 새 행 생성, 임의의 빈칸 추측, 일반 PDF 본문 편집은 이번 범위에 없다.

| 형식 | `preserve` | `flow` 구현 선택 | 검증 수준 |
|---|---|---|---|
| DOCX | 현재 문단 내 치환 | 선택 문단·행의 줄/쪽 흐름을 허용하는 제한적 XML 변경 | 구조·값·비대상 보존, 실제 페이지 수는 렌더러 필요 |
| HWPX | 현재 XML 치환 | 선택 본문·표의 흐름 제약을 검사하고 허용된 속성만 변경 | 구조·값·비대상 보존 및 rhwp 페이지/좌표 보조 검사 |
| HWP | 기존 제한적 kordoc 패치 | 균일 서식 본문에 rhwp 직접 치환, 안전한 BodyText 변경만 원본 CFB에 이식 | 원시 레코드 차이·값·서식·재열기 후 rhwp 페이지/좌표 검사 |
| AcroForm PDF | 상자 초과를 오류로 반환 | 원래 칸에는 별지 참조, 추가 페이지의 청크 필드에 전체 값 저장 | 청크 재구성 exact 검사, 모든 청크의 크기 검사, 원래 페이지 보존 |

`maxLength`는 업무/자원 제약이고 페이지 용량이 아니다. `flow`가 manifest의 제한 또는 PDF `/MaxLen`을 해제하지 않는다. 현재 공통 상한 10,000 code point는 유지해도 이번 6,596자/8,000자 실험이 가능하다. 내장 서식의 본문 제한을 바꾸려면 생성기·manifest·PDF MaxLen을 같은 의미로 변경하고 버전을 올린다. 제출 안내의 쪽수/글자수 제한도 자동으로 무시하지 않는다.

## 2. 현재 코드에서 확인한 공백

경로는 `plugins/fill-documents/skills/fill-documents/` 기준이다.

| 코드 | 현재 동작과 한계 |
|---|---|
| `lib/fields.mjs:13,31`, `lib/adapters/hancom-utils.mjs:37` | 기본/최대 10,000자, manifest가 더 작으면 먼저 거부한다. 길이 검증만으로 페이지에 들어간다고 판단할 수 없다. |
| `lib/engine.mjs:68` | dry-run은 adapter 실행 전 반환한다. PDF dry-run 성공 뒤 실제 채우기는 표시 영역 초과로 실패하는 차이를 재현했다. |
| `lib/adapters/docx.mjs:121,171` | `linebreaks:true`로 문단 내부 줄바꿈을 넣고 같은 문단 배열의 값만 검사한다. 고정 행 높이와 텍스트 상자의 잘림을 판별하지 않는다. |
| `lib/adapters/hwpx.mjs:110,133` | 선택 문단의 linesegarray를 제거하지만 표의 페이지 나눔·배치 속성은 유지한다. 문단 수를 같게 검사한다. |
| `lib/adapters/hwp.mjs:79,84` | 본문 고유 필드·균일 글자서식만 지원한다. 문단 수와 스타일은 검사하지만 현재 kordoc 패치로 만든 긴 연속문장은 실제 줄바꿈이 되지 않는 사례가 있다. |
| `lib/adapters/pdf.mjs:126,213,243` | 실제 폰트 크기에서 상자 초과를 거부하고 전체 페이지 수 동일을 강제한다. 이어쓰기 경로가 없다. |
| `tests/office-pdf.test.mjs:228` | PDF overflow 거부가 현재 기대 동작이다. 이번에는 preserve 회귀를 유지하고 flow 성공 검사를 추가해야 한다. |

현재 내장 DOCX는 본문이 2열 표 안에 있고 `trHeight atLeast` 및 `cantSplit`을 사용한다. `cantSplit`을 항상 잘림으로 판단하면 안 된다. Word 표준은 한 페이지보다 큰 행이 필요하면 다음 페이지로 계속될 수 있다고 설명한다. 실제 위험은 `exact` 높이, 고정 상자, 배치 제약과의 조합이다. [Microsoft: 행 높이](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.tablerowheight?view=openxml-3.0.1), [Microsoft: CantSplit](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.cantsplit?view=openxml-3.0.1)

## 3. 실제 격리 실험

경로: `.cache/long-content-probes/architect/`. Node v25.9.0, macOS, 현재 고정 의존성으로 실행했다. 이 실행 환경의 결과를 Windows/Linux 또는 한컴/Word 앱에서의 결과로 확대하지 않는다.

| 입력/방법 | 관찰 |
|---|---|
| 내장 report-hwp 원본 경로 → 현재 공통 engine, 연속문장 2,000자/8,000자 | 값·서식·스트림 검사 통과, 원본 hash 동일. 문단 11개 유지. rhwp 페이지는 모두 1쪽. |
| 같은 경로, 명시 LF를 포함한 8,000자 | 문단 11개 유지, rhwp 1→8쪽. 이 문단 수 유지 자체가 페이지 확장의 장애는 아니다. |
| 위 연속문장에 `reflowLinesegs()` 추가 | 반환 0, 1쪽 그대로. |
| NanumGothic fontkit 폭측정 콜백을 초기화 전에 등록 | 콜백 호출 0회, 결과 동일. 콜백 등록만으로 현재 경로를 고쳤다고 주장할 수 없다. |
| 원본에 rhwp `replaceAll`로 8,000자 치환 → export → 재열기 | export 전 페이지 수 1, 재열기 후 4. 전체 값 exact, contentLoss 0. 전체 글자/문단 서식과 비대상 텍스트 동일. 마지막 표식이 4쪽에 있고 모든 run이 페이지 폭 안에 있다. |
| 위 rhwp 결과의 BodyText만 원본 CFB에 이식 | 스트림 5→5, 비본문 바이트 동일, 문단 11→11, 서식 동일, 재열기 4쪽. |
| 자체 DOCX의 행 높이를 exact로 만든 뒤 120줄/2,531자 | 현재 fill 성공, 문단 수 5→5, exact 높이 그대로. 렌더 성공의 근거가 아니다. |
| 자체 HWPX 표에 120줄/2,531자 | 현재 fill 성공, rhwp 1→3쪽. 표 설정은 그대로다. 페이지 수만으로 셀 전체 내용의 가시성을 증명하지는 않는다. |
| 24pt 높이 자체 PDF에 같은 120줄 | dry-run 성공, 실제 fill은 `E_FIELDS`로 거부. |

재현 명령:

```sh
node .cache/long-content-probes/architect/probe.mjs
FILL_PROBE_METRICS=fontkit node .cache/long-content-probes/architect/probe.mjs
node .cache/long-content-probes/architect/followup.mjs
node .cache/long-content-probes/architect/graft-body.mjs
```

보고서: `report-default.json`, `report-fontkit.json`, `direct-rhwp-replace.json`, `direct-rhwp-preservation.json`, `grafted-rhwp-replace.json`, `hwp-record-diff-details.json`. 원시 레코드 비교 결과 대상 문단은 tag 66/67/69만, 후속 문단은 tag 69의 수직 위치만 달라졌다. 일부 상세 비교는 격리 Node 명령으로 수행했고 해당 JSON에 결과를 남겼다.

## 4. 공통 실행/실패 계약

`fillDocument`에 `overflow = 'preserve'`를 추가하고 adapter context로 전달한다. CLI의 열거값을 검사하고 알 수 없는 값을 거부한다. 우선 별도 layout JSON, 플러그인별 옵션, 외부 렌더 서비스는 도입하지 않는다.

1. 기존 방식으로 파일 서명·활성 콘텐츠·필드·업무 길이·출력 경로를 검사한다.
2. 대상 필드별 컨테이너와 수정 가능 범위를 분석한다. `flow`를 지정해도 위치가 불명확하거나 아래 지원 범위 밖이면 오류다.
3. 메모리에서 전체 결과를 생성하고 같은 결과를 재열어 값/보존/배치 검사를 수행한다.
4. `dryRun`도 3까지 실행하되 파일을 발행하지 않는다. 동일 원본·값·옵션에 대한 후보 생성/검증 오류를 실제 fill과 같게 반환한다. 기존 출력·부모 디렉터리는 미리 확인할 수 있지만, 발행 시 경합·디스크 부족·hardlink 실패까지 dry-run이 보장하지는 않는다.
5. 모든 검사 성공 후 기존 원본 재해시·원자적 새 파일 발행을 실행한다. 실패하면 출력 파일을 남기지 않는다.

기존 `E_FIELDS`, `E_UNSUPPORTED`, `E_PRESERVATION`을 유지한다. 배치 자체를 안전하게 확장할 수 없는 경우 `E_LAYOUT`과 `{field, region, reason}`을 추가한다. `reason`은 fixed-container, unsupported-anchor, ambiguous-field, unrepresentable-reference, no-progress 등의 짧은 기계 판독값을 사용한다. 본문 내용을 오류에 넣지 않는다.

exact의 줄바꿈 의미도 기존 호환을 유지한다. DOCX/HWP/HWPX는 기존처럼 CRLF/CR을 LF로 정규화한 값과 대조한다. PDF 원문 substring과 청크 재구성은 CRLF까지 원문 그대로 대조한다. 모든 형식이 같은 byte-exact 보장을 제공한다고 표시하지 않는다.

반환값에 다음처럼 변경과 검증 수준을 명시한다. 실제 페이지 수를 얻지 못한 DOCX는 숫자를 추정하지 않는다.

```json
{
  "layout": {
    "policy": "flow",
    "strategy": "native",
    "changedContainers": [{ "field": "activities", "region": "table-cell", "changes": ["allow-page-split"] }],
    "pagination": { "source": "rhwp", "before": 18, "after": 23, "status": "engine-checked" }
  },
  "visualValidation": "not-performed"
}
```

위 숫자는 응답 형태 예시이며 외부 문서 실측값이 아니다. 필요하면 `inspect`에 field별 `region` 및 `flowSupport`를 덧붙인다. 기존 이름/타입/횟수 계약은 유지한다.

## 5. DOCX의 본문·표 확장

값의 LF는 기존처럼 실제 줄바꿈으로 보존한다. 긴 단어의 자동 줄바꿈과 페이지 나눔은 문서 엔진이 담당하며 임의 글자 수로 페이지를 나누지 않는다. 뒤의 문단·행은 같은 흐름 안에서 이동한다. 다른 업무 행을 만들거나 기존 문단 전체를 재생성할 필요는 없다.

지원 시작점은 본문 `w:p`, 아래 조건을 만족하는 일반 `w:tbl`의 셀이다. 먼저 실제 적용되거나 적용될 수 있는 축소·줄바꿈 속성을 검사한 뒤 선택 문단과 직접 조상 행에 한해서 다음을 수행한다.

- 행 높이가 exact면 값은 유지하고 `hRule=atLeast`로 바꾼다. auto/atLeast는 유지한다.
- 페이지를 넘길 선택 행에 직접 `cantSplit=false`를 적용하고, 필요한 경우 선택 문단의 `keepLines`/`keepNext`를 직접 false로 지정한다. 공유 style 정의를 바꾸지 않는다. 속성 생략이 스타일의 true를 다시 상속하지 않도록 한다.
- 셀 병합, 테두리, 라벨, 글자 크기, 폰트, 번호, 제목행 반복과 선언된 grid 열 너비는 유지한다. AutoFit 표는 아래 조건에서만 명시된 grid를 고정할 수 있다. 해당 행의 다른 셀 높이가 함께 늘어나는 것은 의도한 레이아웃 효과다.
- 고정 텍스트 상자, 떠 있는 표(`tblpPr`), 세로쓰기, 중첩 표, 대상에 걸친 세로 병합 등 첫 구현에서 안전하게 다루지 못하는 컨테이너는 `E_LAYOUT`이다. 문서 다른 위치에 그런 요소가 있다는 이유만으로 지원 가능한 본문까지 거부하지는 않는다.

### 축소·줄바꿈 속성의 거부 조건

- 대상 셀의 `w:tcFitText`가 활성 또는 대상 치환에 쓰이는 run의 유효 속성에 `w:fitText`가 있으면 `E_LAYOUT`이다. 기존 축소 의도를 조용히 해제하지 않는다. `fitText`는 on/off와 다른 폭 지정 속성이므로 `val=0`을 임의로 false로 해석하지 않는다.
- 대상 셀의 `w:noWrap`가 활성인 경우도 `E_LAYOUT`이다. 이번 구현은 false로 바꾸는 복구 동작을 제공하지 않는다. 원래 셀을 변경한 별도 준비본을 사용해야 한다.
- 검사는 직접 속성만 보지 않는다. docDefaults, 사용 중인 문단/문자/표 스타일의 basedOn 체인, 해당 셀에 적용 가능한 조건부 표 스타일 및 run 속성을 확인한다. 텍스트가 여러 run에 걸친 필드이면 치환값을 받을 모든 run을 검사한다. 참조 누락·순환·지원하지 않는 조건부 적용 등으로 유효 속성을 확정하지 못하면 `E_LAYOUT`이다.
- 완전한 스타일 cascade를 구현하지 않은 초기 구현은 **도달 가능한 스타일 체인의 잠재적 활성 선언을 보수적으로 거부**할 수 있다. 이 경우 direct false가 있다는 사실만으로 상속된 true를 안전하게 덮었다고 단정하지 않는다. 어떤 도달 가능한 선언에도 위험 속성이 없거나 올바르게 해석한 유효 값이 명확한 false일 때만 통과시킨다. 무관한 다른 스타일·셀·run의 선언은 이 거부 범위에 포함하지 않는다.

이는 셀/문자 간격을 조정하는 속성이 글자 크기 숫자를 바꾸지 않고도 축소 요구에 어긋날 수 있기 때문이다. [Microsoft: TableCellFitText](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.tablecellfittext?view=openxml-3.0.1), [Microsoft: NoWrap](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.nowrap?view=openxml-3.0.1)

### AutoFit와 선언된 grid 폭

`tblW type=auto`와 `tblLayout type=autofit`은 구분하고 다음 두 경로를 분리한다.

- **이미 유효 layout이 fixed인 표:** 기존 `tblLayout`, `tblW`, `tblGrid`, `tcW`, `tblInd`와 나머지 가로 배치 속성을 그대로 둔다. 텍스트와 앞서 허용한 행 높이·문단/행의 페이지 흐름 속성만 변경한다. 아래의 새 AutoFit 변환용 grid/가용 본문 폭 가드를 적용하지 않는다. 다만 tcFitText/noWrap/run fitText와 상속 검사, 중첩·떠 있는 표·세로쓰기·대상 세로 병합 등 앞서 정한 위험 가드는 계속 적용한다. 유효 layout을 확정하지 못하면 이 경로로 통과시키지 않는다.
- **AutoFit을 새로 fixed로 전환하는 표:** 아래 1–5를 **모두** 충족할 때만 선택 표에 국소 `tblLayout=fixed`와 `tblW=dxa(grid 합)`을 기록한다. 조건을 만족하지 못하면 기존 fixed 경로로 우회하지 않고 `E_LAYOUT`이다.

1. 선택 표에 단 하나의 유효 `tblGrid`가 있고 모든 `gridCol w:w`가 양의 정수 twip이다. 비어 있는 grid, 중복 정의, 0/음수/비수치 폭, 변경 추적이 남아 유효 grid가 모호한 경우는 거부한다.
2. 선택 표의 모든 행이 같은 grid를 빠짐없이 덮고 셀의 양수 `gridSpan` 합이 grid 열 수와 같다. 초기 구현은 gridBefore/gridAfter와 세로 병합을 포함한 모호한 행을 거부한다. 각 셀의 `tcW`는 dxa이며 해당 span의 grid 폭 합과 정확히 같아야 한다. 불일치 셀 폭을 자동으로 다시 쓰지 않는다.
3. `tblW`는 생략, auto의 0, 또는 grid 전체 합과 같은 dxa만 허용한다. percentage/pct, nil, auto의 비정상 값, grid와 다른 dxa는 `E_LAYOUT`이다. 고정하기로 한 표는 `tblW=dxa(grid 합)`을 함께 명시하며, 이것도 허용된 표 단위 변경으로 보고한다.
4. 새 AutoFit 변환에서는 선택 표의 가로 공간을 확정할 수 있어야 한다. 초기 구현은 수평 단일 본문 열, 양수 page width와 비음수 좌우 margin, 명확한 left/start 정렬 및 비음수 dxa indent, 셀 간격 0으로 제한한다. grid 합+indent가 가용 본문 폭 안이어야 한다. 다단/우좌 방향/비표준 위치 또는 가용 폭을 확정할 수 없는 section은 새 변환을 거부한다. 이 계산은 기존 fixed 표를 거부하거나 그 폭을 줄이는 근거로 재사용하지 않는다.
5. 문서의 `growAutofit`는 전역으로 지우지 않는다. 설정이 활성이어도 선택 표를 명시적 fixed로 만들고 위 정합 검사를 통과한 경우에만 지원한다. 최종 유효 layout이 AutoFit에 남거나 해석 불명이면 거부한다. `growAutofit`가 꺼져 있다는 사실만으로 폭 안전을 인정하지 않는다.

새 전환의 계약은 **출력의 선언된 grid 폭을 고정하는 것**이다. 입력 AutoFit 표가 Word/다른 뷰어에서 실제로 어떤 폭으로 표시됐는지와 같다고 보장하지 않는다. 기존 fixed 경로는 **이미 있던 가로 배치를 보존하는 것**이며 임의의 fixed 서식에 일반적인 가로 가시성을 보장하지 않는다. 본문 여백을 넘는다는 계산과 물리적 페이지 밖으로 잘린다는 판단도 같지 않다. 두 경로 모두 긴 무공백 한글/영문과 실제 외부 양식의 렌더에서 수평 넘침·인접 셀 변경을 별도로 확인한다. [Microsoft: TableLayout](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.tablelayout?view=openxml-3.0.1), [Microsoft: GrowAutofit](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.growautofit?view=openxml-3.0.1)

준비된 EU 양식을 다시 읽은 결과 profile/objectives/relevance의 선택 표 3개는 모두 이미 `tblLayout=fixed`, grid 1열=8527twip, 각 `tcW=dxa(8527)`이었다. profile/relevance의 `tblW=auto(0)`는 AutoFit layout의 증거가 아니다. 독립 검토자는 세 표의 indent=228twip, 해당 section의 가용 본문 폭=8731twip을 확인했다. `8527+228=8755`는 24twip 크지만 이는 새 가용 폭 가드가 기존 사례를 제외한다는 증거이며 실제 잘림의 증거가 아니다. 세 표는 앞선 위험 가드를 통과하면 **기존 fixed 경로의 지원 대상**이고 폭/indent/tblW를 원래대로 유지한다. 임의 허용오차를 추가하거나 폭을 줄여 맞추지 않는다. 이번 세 표의 긴 값 가로 가시성은 기존 baseline 관찰에 더해 새 flow 출력의 실제 렌더로 확인한다.

검증은 같은 문단 배열의 exact 값 검사에 XML 변경 허용 목록을 추가한다. 텍스트 치환, 선택 문단/행의 앞서 허용한 페이지 흐름 속성, **새 AutoFit 전환 조건을 통과한 표에만** `tblLayout`/`tblW` 변경을 허용한다. 기존 fixed 표의 가로 배치 속성과 모든 경로의 `tblGrid`, `tcW`, `tcFitText`, `fitText`, `noWrap`, 공유 styles/settings는 이번 flow가 변경하지 않는다. 형식에 맞는 엔진 없이 DOCX 파일 내부 속성이나 `docProps/app.xml`의 캐시 페이지 수만으로 실제 쪽수를 선언하지 않는다.

## 6. HWPX의 본문·표 확장

원본 ZIP/XML을 직접 패치한다. 기존 split-run 처리와 선택 문단의 linesegarray 제거는 유지하고 Markdown 재생성은 사용하지 않는다.

본문에서는 선택 문단의 줄/쪽 보호 속성을 확인한다. 필요하면 공유 `paraPr`을 복제하여 새 ID로 선택 문단만 참조하게 하고 `keepLines`/`keepWithNext`를 해제한다. 원래 공유 정의나 무관한 문단을 수정하지 않는다. 실제 ID/참조 무결성을 검사한다.

표에서는 선택 필드의 직접 조상 표에 대해서만 다음 정책을 적용한다.

- 초기 표 변환은 검증된 패턴에만 한정한다. 표는 `textWrap=TOP_AND_BOTTOM`, **이미** `pageBreak=CELL`, `noAdjust=0`, 크기는 `widthRelTo=ABSOLUTE`, `heightRelTo=ABSOLUTE`, `protect=0`이어야 한다. 셀은 수평이고 `subList lineWrap=BREAK`여야 한다. `pageBreak=NONE/TABLE`을 추정으로 CELL로 바꾸는 경로는 이번 승인 대상에서 제외한다.
- 앵커는 `flowWithText=1`, `allowOverlap=0`, `holdAnchorAndSO=0`, `vertRelTo=PARA`, `horzRelTo=COLUMN`, `vertAlign=TOP`, `horzAlign=LEFT`, 두 offset=0을 모두 명시적으로 만족해야 한다. 이 조건과 기존 `treatAsChar=1`을 확인한 표에서만 `treatAsChar=0`으로 바꾸고 **표의 앵커 문단** 및 편집 셀 문단의 줄배치 캐시를 갱신한다. 빠진 값에 편리한 기본값을 가정하거나 다른 앵커로 확대하지 않는다. 기존 block 표의 별도 변환 없이 치환하는 경로와도 구분한다.
- 표 너비·열/행/셀 개수·span·테두리·라벨·그림은 유지한다. `cellSz height`를 전부 0으로 만들지 않는다. 기존 높이를 최소 크기로 유지하면서 실제 엔진이 확장해야 한다. 크기 보호/세로쓰기/중첩/대상 세로 병합은 초기 지원에서 거부한다.
- linesegarray는 편집 문단의 캐시다. 별도 고정 높이를 가진 표나 셀에서 이를 지웠다는 사실만으로 overflow 해결을 판정하지 않는다.

한컴 공식 도움말은 글자처럼 취급된 표와 전체 세로쓰기 표에서 여러 쪽 지원이 적용되지 않으며 페이지 밖 내용이 표시/인쇄되지 않을 수 있다고 설명한다. 따라서 엔진에서 페이지 수가 증가하더라도 실제 가시성은 별도로 확인한다. [한컴: 여러 쪽 지원](https://help.hancom.com/hoffice/webhelp/9.0/ko_kr/hwp/table/tableattribute/table(many).htm)

독립 검토자는 위 패턴인 외부 표 id `1729651736`의 실험본을 직접 재렌더했다. 실험본 SHA-256은 `b3370c1b266ce6f5dd923e469a0b2990f708bbf9aad1f0eb1c36c6775b53cb26`이며, rhwp 33쪽 전체에서 text y가 페이지 높이 밖인 항목이 없고 끝 표식은 21쪽 안, 나머지 4개 짧은 값은 7쪽 안에 있었다. 이 근거는 text/tspan을 연결한 텍스트와 **수직 좌표** 검사다. 수평 폭·전체 겹침·한컴 앱의 최종 표시를 증명하지 않는다. 표 id 자체를 하드코딩하지 않고 위 정확한 속성 패턴과 기존 구조 가드로 지원 범위를 정한다. [독립 검토의 직접 실행 기록](long-content-review.md)

## 7. HWP의 제한적 native flow

고유 표식·최상위 본문 문단·균일 글자서식이라는 기존 범위를 유지한다. 혼합 서식, 표/글상자 내부 필드는 이번 경로로 지원한다고 표시하지 않는다.

1. 원본을 읽어 기존 안전 검사, 대상 문단 매핑 및 스타일 snapshot을 만든다.
2. `replaceAll('{{name}}', exactValue, true)`를 사용하고 반환 `ok=true`, count가 기대 횟수와 같은지 확인한다. 값에 다른 필드 표식이 들어가지 못한다는 기존 검사를 유지한다.
3. `exportHwpWithReport`의 contentLoss가 0인지 확인한다. export 전 pageCount는 신뢰하지 않는다.
4. export의 FileHeader와 DocInfo가 원본과 byte-identical이어야 한다. 다르면 이식하지 않고 실패한다. 변환된 문서 전체로 원본을 대체하지 않는다.
5. BodyText 레코드 차이를 검사한다. 대상 문단의 텍스트·문자 수·줄배치와, 같은 흐름의 후속 문단의 줄배치 수직 위치만 허용한다. 비대상 문단의 텍스트/속성/컨트롤/수평 위치 변경은 거부한다. 무관한 section은 동일해야 한다. 최소 레코드 경계 파싱은 크기·레벨·확장 길이·개수 한계를 검사하고, 이해하지 못한 차이를 허용하지 않는다.
6. 검증된 BodyText section만 **원본 CFB**에 이식한다. 원본 스트림 이름 집합과 나머지 모든 스트림 bytes를 유지한다. rhwp가 새로 만든 PrvText나 제거한 보조 스트림을 반영하지 않는다.
7. 최종 후보를 다시 열어 전체 값, 문단 수, 글자/문단 서식, 비대상 텍스트, contentLoss, 스트림 보존을 다시 검사한다. 페이지 수와 대상 run 좌표의 문서 밖 넘침, 마지막 글자의 위치를 기록한다.

이 경로의 실제 성공 근거는 자체 report-hwp의 8,000자 연속문장 1→4쪽뿐이다. 모든 HWP 문서에 성공한다고 확대하지 않는다. LF 8,000자의 기존 1→8쪽 경로도 회귀 검사를 유지한다. 현재 rhwp 콜백 등록만으로 자동 줄바꿈 문제가 해결됐다는 증거는 없다. [rhwp 패키지 API/제약](https://www.npmjs.com/package/@rhwp/core)

### 빈 기본 Scripts의 좁은 취급

외부 `wict-business-plan.hwp`는 FileHeader flags=1이며 다음 두 Scripts 스트림이 자체 생성한 빈 문서의 스트림과 압축 바이트까지 같았다. `external-hwp-scripts.json`에 원본 hash와 비교 근거를 기록했다.

| 스트림 | 압축 해제한 정확한 값 |
|---|---|
| `Scripts/JScriptVersion` | 8 bytes: `0100000000000000` |
| `Scripts/DefaultJScript` | 20 bytes: `00000000000000000000000000000000ffffffff` |

이 **이름 집합·확장 크기·payload가 모두 정확히 일치하는 조합**만 중립 기본 메타데이터로 분류하는 예외를 검토할 수 있다. 문자열 검색으로 함수가 안 보인다는 이유, 짧다는 이유, 빈 이벤트 함수처럼 보인다는 이유로 허용하지 않는다. 추가 스트림·다른 바이트·해제 실패·스크립트 활성 flag는 계속 거부한다. 스크립트를 실행하거나 원본에서 지워서 통과시키지 않는다. 허용된 중립 스트림도 그대로 보존한다. 이 예외는 후속 본문/스타일/컨트롤 보존 검사까지 통과한다는 보장은 아니다.

## 8. PDF의 영구적인 별지 구조

PDF는 원래 칸이 페이지 밖으로 자연스럽게 흐르지 않는다. `flow`의 overflow 필드만 원래 `/V`를 짧은 `별지 N쪽 참조`로 바꾸고, 추가 페이지의 실제 텍스트 필드에 전체 값을 나누어 저장한다. `/V`에 긴 값을 숨겨 놓고 AP만 참조로 그리는 방식은 채택하지 않는다. 뷰어가 AP를 다시 만들 때 잘림이 되살아나기 때문이다.

이는 **PDF flow에만 적용하는 명시적 검증 계약 확장**이다. 원래 칸의 raw 값과 입력값이 같다는 검사는 preserve 및 overflow 없는 필드에는 계속 적용한다. 이어쓰기 필드는 `chunkField[0].getText() + ... + chunkField[n].getText() === originalInput`을 exact-value 조건으로 삼는다. 참조 문구는 원문 내용으로 계산하지 않는다.

별지는 일반 A4 세로 페이지로 만들고, 원래 필드 라벨/이름·원래 페이지 번호·별지 순번을 표시한다. 기관 양식을 복제하지 않는다. 새 별지의 본문 영역에는 `continuation_<stableId>_<n>`이라는 실제 writable multiline AcroForm 필드를 만든다. 여러 overflow 필드는 원본 필드 순서대로 처리하고 필드마다 새 별지에서 시작한다. 폰트는 배포한 NanumGothic을 포함하며 기존 필드에서 확인한 읽을 수 있는 크기 또는 명시된 기본 크기를 고정한다. 용량에 맞추어 자동 축소하지 않는다.

페이지 나눔 알고리즘:

1. 원래 `/MaxLen`과 공통 길이 검사는 먼저 수행한다. 업무 제한 초과를 별지로 우회하지 않는다.
2. 기존 fixed-font bounds 검사에 들어가는 값은 그대로 채운다. 넘치는 값만 별지 계획을 만든다.
3. 실제 폰트 폭과 줄 높이로 사용 가능한 폭/높이를 계산한다. Unicode grapheme 경계와 CRLF 한 쌍을 끊지 않는 원문 substring 경계를 선택한다. 공백·빈 줄·후행 줄바꿈을 버리지 않는다. 긴 연속 한글/영문도 글자 경계에서 다음 줄로 보낸다.
4. 청크를 추가할 때마다 substring offset이 앞으로 진행하고, 최종 offset이 원문 길이와 같아야 한다. 한 글자도 들어가지 않으면 무한 반복 대신 `E_LAYOUT`이다.
5. 각 청크 필드의 `/V`에 원문 substring을 저장하고 동일 폰트로 AP를 만든다. 모든 청크에 현재 bounds 검사와 glyph 검사를 적용한다. 표시용 줄바꿈 계산과 저장 원문을 혼동하지 않는다.
6. 별지 수를 확정한 뒤 원래 모든 widget의 참조 문구가 실제 bounds와 MaxLen 안에 들어가는지 확인한다. 들어가지 않으면 실패한다.
7. 재열기 후 원래 페이지 개수+계획한 추가 페이지 수, 청크 필드 참조·순서·값, 재구성한 exact 값, 원래 페이지 content streams/비대상 필드/빈 서명 필드 보존을 검사한다.

응답에는 `continuations: [{origin, sourceName, originalPages, chunkFields, addedPages}]`를 반환한다. 같은 매핑을 버전 있는 비실행 PDF 전용 dictionary에도 보관하여 결과 파일만 다시 검사할 수 있게 한다. 필드명/페이지 참조/순서/길이를 검증하고 존재하지 않는 필드나 중복/순환 매핑은 거부한다. 숨은 원문 복제본을 별도로 저장할 필요는 없다. 생성된 별지 결과를 다시 채우는 기능은 이번에는 거부해 중복 별지가 생기지 않게 한다. inspect/validate는 매핑을 이해해 논리 필드와 재구성 검사 결과를 표시한다.

pdf-lib는 사용자 정의 field appearance와 페이지 추가를 제공하지만 재흐름 엔진은 아니다. 페이지 나눔과 exact 청크 계약은 이 프로젝트가 구현·검사해야 한다. [PDFTextField API](https://pdf-lib.js.org/docs/api/classes/pdftextfield), [PDFDocument API](https://pdf-lib.js.org/docs/api/classes/pdfdocument)

### 외부 PDF의 이름·빈 서명 호환성

범위가 좁으므로 별지 구현과 같은 PDF 변경으로 검토하되 별도 테스트로 승인한다.

- 기존 규칙에 맞는 source field name은 그대로 쓴다. 공백/숫자 시작 등 지원 JSON 이름 규칙 밖의 이름은 원래 PDF 이름을 변경하지 않고 `field_<sourceNameHash>` 별칭을 반환한다. alias 충돌은 검출하고 더 긴 hash로 해결하거나 실패한다. `sourceName`도 inspect 결과에 제공한다.
- 빈 signature 필드는 `/V`가 없거나 null이고 서명 객체/ByteRange/DocMDP가 없어야 한다. 입력 목록에서 제외하고 필드·widget을 그대로 통과시킨다. 타입이 signature라고 일괄 삭제하거나 사용 가능한 text field로 바꾸지 않는다.
- AcroForm `/SigFlags`가 생략되거나 0인 일반 경우와, 빈 서명란을 알리는 **정확한 정수 1 또는 3**을 구분한다. 1/3은 전체 서명 필드를 열거해 모두 유효 `/V`가 없음/null임을 확인하고, 문서에 실제 signature dictionary·ByteRange·DocMDP 또는 허용하지 않은 서명/권한 구조가 없을 때만 허용한다. 다른 bit 조합·비정수·해석 불명·하나라도 non-null `/V`이면 거부한다. 이름만 빈 서명처럼 보이는 객체를 예외로 삼지 않는다. 허용된 SigFlags와 모든 빈 서명 필드의 AP/widget은 원래대로 보존한다.
- 서명된 문서, XFA, JavaScript/외부 실행 동작, 암호화, 첨부 객체 거부는 유지한다. 빈 서명 지원이 활성 콘텐츠 필터 해제를 뜻하지 않는다.
- 테스트는 valid name 유지, alias 안정성/충돌, 원본 이름으로 값 저장, SigFlags 1/3의 빈 서명 보존, 하나라도 실제 값이 있는 서명·알 수 없는 flag·활성 문서 거부를 각각 포함한다. 단순히 FT를 Sig로 바꾼 빈 필드를 실제 서명 거부 fixture로 재사용하지 않는다. 독립 검토자는 실제 FEMA 원본의 SigFlags=1과 `/V` 없는 Signature_19/Signature_20을 확인했지만, 해당 원본의 새 flow 성공은 별도 시험 대상이다.

## 9. 외부 양식과 인수 시나리오

원본 위치는 `/Users/yback_illusionist/AI/chatgpt/skill/외부양식-장문테스트-20261008/01-원본/`이다. 이 설계 작업에서 공개 원본을 다시 배포하거나 원본을 수정하지 않았다. 준비본과 입력값은 총괄 작업의 `02-준비본/`, `03-입력값/`에 있다. 출처 URL/다운로드 시점/hash는 외부 실험 기록을 따른다. 이 문서는 공개 파일이라는 사실을 재배포 허가로 간주하지 않는다.

직접 구조를 확인한 원본:

- `moel-business-plan.hwpx`: 표 31개, 행 439개, 셀 2,226개. 표 pageBreak CELL 19개/NONE 12개, 모든 표 treatAsChar=1. 원본 엔진 18쪽은 총괄 기록이다. pageBreak 하나만 바꾸는 구현의 반례로 사용한다.
- `eismea-application.docx`: 표 55개, 행 214개, 셀 398개, 텍스트 상자 2개, floating table 1개, 세로 병합 요소 2개. 선택 셀과 무관한 복잡 요소가 보존되는지 검사한다.
- `wict-business-plan.hwp`: 현재 안전 필터는 Scripts 존재로 거부한다. 중립 payload 일치 확인까지 수행했고, 복잡 문서 채우기 성공은 아직 주장하지 않는다.
- FEMA ICS213 PDF의 alias/빈 signature 필요성은 총괄 전달 사항이며 이 설계 작업에서 원본 PDF를 직접 검사한 결과는 아니다.

설계 작성 직후 총괄이 추가로 공유한 baseline: 외부 DOCX는 현재 구현만으로 LibreOffice 렌더가 28→31쪽이 되었고 6,596자 끝 표식이 보였다. 따라서 이미 native flow가 가능한 영역은 속성 변경을 최소화해야 한다. 외부 HWPX baseline은 rhwp 18쪽이고 XML exact 검사는 통과했다. 이후 독립 검토자가 SVG의 text/tspan을 연결해 확인한 결과, baseline 7쪽에는 text y가 페이지 높이를 넘는 항목이 4,624개 있었고, 80개 번호 항목 중 화면 안은 5개였다. 위 6절의 좁은 앵커 변환 실험본은 33쪽 전체 수직 범위와 끝 표식을 확인했다. SVG 원문에 긴 문자열이 없다는 사실만으로 표시 누락을 추정한 것이 아니다. 기록은 외부 작업폴더 `04-결과/`, `05-검증/hancom-renders/`, `05-검증/experiments/` 및 독립 검토 문서에 있다. DOCX 렌더는 총괄 실행, HWPX 재렌더/좌표 확인은 독립 검토자 실행이며 설계자가 원본 앱에서 재검증한 결과는 아니다.

구현 후 검증은 다음을 구분해 기록한다.

1. **공통 회귀:** preserve 기존 테스트, missing/unknown/길이 오류, 원본 hash 동일, 기존 출력 거부, dry-run/실제 fill의 같은 후보 생성/검증 실패, 발행 경합·I/O 오류 별도 검사, 실패 시 출력 없음.
2. **값 경계:** 0/1줄 경계, 정확히 맞는 값과 한 grapheme 초과, 6,596자 80줄, 8,000자 연속문장, 공백 없는 한글/영문, 연속 빈 줄·CRLF·이모지·XML 기호. 입력/청크 재구성에 임의 trim이나 손실이 없어야 한다.
3. **DOCX/HWPX:** 선택한 표/문단만 변경, 다음 행의 라벨과 원래 후속 문단 보존, 선언된 grid/병합/번호/이미지 보존, 위험 컨테이너 명확한 오류. DOCX 직접/상속 tcFitText·fitText·noWrap 및 불명확 스타일은 두 경로 모두 오류다. 새 AutoFit 전환은 안전한 grid와 가용 폭을 검사하고 growAutofit가 켜진 경우도 같은 가드를 적용하며, pct/불일치/0 grid를 거부한다. 기존 fixed인 EU 세 표는 가용 본문 폭의 단순 초과로 거부하지 않고 기존 가로 속성이 그대로인지 검사한다. 두 경로의 긴 무공백 값은 실제 렌더에서 가로 표시를 확인한다. HWPX는 정확 앵커 패턴의 성공과 단일 속성을 바꾼 반례의 거부를 확인한다. prepared DOCX의 profile/objectives/relevance 및 HWPX의 period/location/participants/budget/activities를 실제 채운다.
4. **HWP:** 연속문장 8,000자의 재열기 페이지 증가·끝 표식·원시 레코드 허용 차이·contentLoss0; mixed-style과 비대상 컨트롤 변경 거부; 중립 Scripts의 1 byte 변조/추가 스트림/활성 flag 거부.
5. **PDF:** overflow 없는 경로 회귀, 1/여러 별지, 여러 원필드/반복 widget, alias 필드, 빈 서명 유지. 원래 페이지 content streams와 비대상 field value가 같고 모든 청크가 렌더 bounds 안에 있어야 한다. 저장 후 재열기/appearance 재생성 후에도 청크 구조와 전체 값은 유지되어야 한다.
6. **실제 표시:** 한컴·Word 또는 허용된 렌더러의 페이지별 결과로 잘림·겹침·누락·빈 페이지를 확인한다. rhwp/별도 렌더러의 관찰과 원본 앱 확인을 구분한다. 좌표/페이지 수/텍스트 추출만으로 원본 앱의 시각 검증 완료를 선언하지 않는다.

## 10. 구현 순서와 파일 경계

1. 공통 `engine.mjs`/CLI에 overflow 전달, 같은 생성 검사를 수행하는 dry-run, 결과 layout metadata를 넣는다. `fields.mjs`는 업무 길이 정책을 유지한다.
2. DOCX/HWPX adapter에 선택 컨테이너 분석과 국소 flow 변경을 넣는다. 유틸은 각 포맷에만 필요한 최소 코드로 둔다.
3. HWP adapter와 한글 helper에 직접 치환/레코드 차이 검사/원본 CFB 이식, 정확한 중립 Scripts 예외를 넣는다. 기존 preserve 경로를 함께 검증한다.
4. PDF adapter에 alias/빈서명 passthrough, 청크 페이지화와 매핑 검증을 넣는다. 기존 PDF preserve 검사를 약화하지 않는다.
5. 형식별 테스트와 외부 준비본 실행 기록을 추가하고, 마지막에 배포 bundle을 다시 만들어 동일 시나리오를 검증한다. 소스 성공만으로 번들 성공을 선언하지 않는다.

순수 XML 플래그 설정만으로 모든 문서의 쪽나눔을 보장하는 대안은 채택하지 않는다. 전체 문서를 Markdown 등으로 재작성하는 대안도 비대상 보존 요구에 맞지 않는다. 외부 앱 자동화에 의존하면 지금의 독립 CLI 배포 조건이 달라지므로 이번 핵심 구현에는 넣지 않는다. 좁은 flow 계약이 실제 외부 양식에 부족한 경우, 실패 사례의 컨테이너/원시 레코드와 렌더 근거를 확보한 뒤 지원 범위를 다시 결정한다.

## 11. 구현 중 발견한 보존 경계 보완안 · 독립 재검토 대상

### HWP DocInfo의 압축 표현

외부 HWP를 무편집 native export하면 압축 DocInfo는 3,311→3,187 bytes로 달라지지만, 압축을 푼 전체 16,390 bytes는 완전히 같다. 양쪽 SHA-256은 `47912fc966a7caa82a0dbaf6ac2e8afda16abb445a2f868e072d2564804db760`이며 외부 시험 폴더의 `05-검증/hwp-preparation.json`에 기록돼 있다. FileHeader와 모든 본문 참조/스타일은 별도 검사를 유지한다.

제안: FileHeader는 계속 byte-exact이며, DocInfo는 압축 여부를 FileHeader에서 읽고 **압축 해제한 전체 바이트가 exact**인지 검사한다. 해제 크기는 기존 자원 상한으로 제한한다. 남은 압축 데이터는 0 bytes 또는 정확한 8-byte CRC32+ISIZE trailer가 전체 해제 데이터와 일치하는 경우에만 허용하고, 그 밖의 잔여 데이터/오류는 거부한다. 레코드 일부나 의미상 같음만으로 통과시키지 않는다. 최종 출력에는 native DocInfo를 쓰지 않고 **원본의 압축 DocInfo 바이트를 그대로 유지**한다. BodyText 허용 차이·글자/문단 서식·전체 값·비대상 스트림 보존은 그대로 유지한다. 이는 압축 표현 차이만 허용하며 스타일 변경 허용이 아니다.

### PDF 일반 appearance 재생성

독립 검토에서 긴 무공백 문자열이 한 페이지짜리 `/V`에 저장되면 기본 `updateAppearances(font)`가 단어 단위로만 줄바꿈하여 가로로 넘치는 반례가 나왔다. 전용 appearance 함수를 다시 부르는 테스트만으로 일반 재생성을 검증했다고 할 수 없다.

제안: 별지의 실제 AcroForm 청크를 **시각적 한 줄 단위**로 나눈다. 각 `/V`는 원문의 연속 substring이며 grapheme/CRLF 경계에서만 나눈다. 실제 줄바꿈 문자는 바로 앞 청크 또는 해당 빈 줄 청크에 포함하고 임의 soft newline을 원문에 삽입하지 않는다. 각 청크에는 최대 한 줄의 비어 있지 않은 텍스트와 뒤따르는 실제 newline만 들어간다. 빈 줄도 원문·수직 간격을 보존한다. 청크 필드는 서로 겹치지 않는 충분한 고정 높이와 고정 글자 크기를 가지며 한 줄의 모든 glyph가 기본 appearance에서도 영역 안에 들어가야 한다. trailing newline에서 생기는 빈 줄은 표시할 glyph가 없으며 내용 손실로 취급하지 않는다.

페이지는 줄 청크가 가용 본문 높이를 넘기기 전에 추가한다. 원문 결합 exact·원래 필드의 별지 참조·원래 페이지/빈 서명 보존 계약은 유지한다. 매핑 schema는 version 2로 하고 `chunkFields`와 같은 길이의 `chunkPages`를 두며 `addedPages`에는 중복 없는 실제 페이지 목록을 둔다. 전체 청크/페이지 순서·위치·유일성 및 원문 hash를 재읽기한다. 출력 뒤 **기본** `field.updateAppearances(font)`로 재생성하여 모든 비어 있지 않은 줄의 glyph bounds를 확인하는 회귀를 추가한다. 전용 appearance로만 재생성하는 테스트는 이 회귀를 대신하지 못한다.

PDF `/SigFlags 0`은 서명 필드가 없어도 일반 PDF로 허용한다. 1/3은 기존대로 실제 서명 값/서명 객체가 없고 빈 서명 필드가 확인될 때만 허용한다. 실행 콘텐츠·실제 서명 거부를 약화하지 않는다.
