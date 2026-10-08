# DOCX·HWPX 형식 유지 보완 설계

2026-10-08. 상태: 설계 초안, 격리 실험 완료, 독립 검토 대기. 생산 코드는 수정하지 않았다. 담당 범위는 DOCX·HWPX adapter와 관련 검증이며 공통 API·CLI·필드·등록 계약은 총괄 소유다. 이 문서는 기존 `long-content-architecture.md`의 문단 수 동일 검사와 반복 행 제외 조항을 아래 명시 범위에서 대체하는 제안이다. 이전 XML 보존 검증은 실제 양식의 이어짐까지 입증하지 않았다.

## 1. 요구와 확인한 원인

| ID | 요구·출처 | 설계와 수용 조건 |
|---|---|---|
| XR1 | 사용자: 기존 형식을 유지하거나 확장하되 무너뜨리지 않는다 | 원본을 덮어쓰지 않고 폭·글꼴·글자 크기·정렬·비대상 내용·테두리를 유지한다. 변경은 명시 대상 문단/반복 영역과 필요한 흐름 속성에 한정한다. |
| XR2 | 재판정: DOCX 양쪽 맞춤 문단에 `w:br` 81개 | `flow`에서 입력 LF를 실제 문단 경계로 만든다. 원래 양쪽 맞춤을 유지하고 첫 문장/짧은 마지막 줄이 불필요하게 늘어나지 않는지 렌더로 확인한다. |
| XR3 | 재판정: HWPX 한 사업내용 셀이 15쪽, 왼쪽 4열 공백 | 반복 영역 프로필과 레코드 배열을 명시한다. 업무 하나는 행 하나이며, 한 행을 여러 페이지로 찢지 않는다. 설명이 한 페이지보다 크면 안전 거부한다. |
| XR4 | 재판정: 이어진 HWPX 쪽에 열머리글 없음 | 표의 첫 행부터 열머리글까지 연속 제목행으로 지정한다. 활동이 있는 모든 페이지에서 제목과 5개 열 제목을 확인한다. |
| XR5 | 총괄: 기존 빈 행 재사용, 초과 행 복제, 미사용 행 제거 | 프로필 `bodyRows` 안에서만 실제 레코드 개수만큼 행을 만든다. 첫·중간·마지막 경계 스타일을 보존한다. 범위 밖 문단/행은 건드리지 않는다. |
| XR6 | 사용자: 축소·요약으로 문제 숨기지 않음 | 텍스트/개행을 정확히 재구성하며 폰트 크기·장평·자간을 줄이거나 원문을 요약하지 않는다. 표 폭 확장도 하지 않는다. |

직접 읽은 원본과 기존 결과는 `../외부양식-장문테스트-20261008/`에 있다. 경로는 저장소 상위 폴더 기준이다.

- DOCX 원본 `eismea-application.docx`: 본문 전체 문단 index 480/488/493의 `Insert text`, 표 index 25/26/27. 모두 기존 fixed 1열 표이고 grid 폭 8527 twip, 들여쓰기 228 twip이다. 문단은 `jc=both`, 앞뒤 spacing 120 twip이고 입력 run은 9pt이다. 기존 긴 결과는 901개 문단을 그대로 유지하며 p480에 `w:br` 81개를 만든다. p488의 기존 `lastRenderedPageBreak`는 배치 캐시다.
- HWPX 원본 `moel-business-plan.hwpx`: section0의 표 index 11, id `1729651736`, 최상위 본문 문단 index 59에 있다. 31행/5열이며 0~3행은 제목·빈 간격·법인명·단위, 4행은 열 제목, 5~30행은 빈 업무행이다. 준비본은 첫 업무행 5개 셀에만 표식을 추가했다. `repeatHeader=1`이지만 모든 `tc/@header=0`이다.
- HWPX 표 폭은 46483 HWPUNIT, 업무행 열 폭은 `[7487,7487,9238,9238,13033]`이다. 행 5~29의 높이는 1951, 마지막 행 30은 1871이며 마지막 행의 borderFill ID가 다르다. 모든 업무 셀은 span 1×1, 직접 subList, 문단 하나/입력 run 하나다. `paraPrIDRef=46`은 CENTER/160% 줄간격, `charPrIDRef=14`는 11pt/장평100/자간0이다. 이 설정은 그대로 둔다.
- HWPX 기존 코드의 `pageBreak=CELL`은 셀 내부도 나누는 설정이다. 텍스트 저장·좌표가 페이지 안에 있는 것만 검사하면 다음 쪽의 비어 있는 동료 셀을 놓친다.

근거 코드: `lib/adapters/docx-flow.mjs`의 `fillDocxFlow`와 `docx.mjs`의 `paragraphs` 재검사, `hwpx.mjs`의 `replaceGroup`/문단 수 동일 검사, `hwpx-flow.mjs`의 `planHwpxFlow`, `lib/fields.mjs`, `lib/engine.mjs`, `lib/catalog.mjs`.

## 2. 대안과 선택

| 대안 | 비용·포기하는 점 | 판단 |
|---|---|---|
| DOCX `doNotExpandShiftReturn` 전역 추가 | 코드가 짧지만 모든 기존 문단의 호환성 설정을 바꾸고 논리 문단/목록은 그대로 한 덩어리다 | 선택하지 않음 |
| DOCX 양쪽 맞춤 해제·작은 글씨·줄 간격 축소 | 원본 서식을 바꾸며 원인을 감춘다 | 선택하지 않음 |
| DOCX 대상 문단을 입력 LF 기준 실제 문단으로 확장 | source→output 문단 대응 검사가 필요하다. 각 새 문단에 원래 spacing이 적용되어 쪽수가 늘 수 있다 | 선택 |
| HWPX 긴 문자열에서 개행을 추측하여 업무행 생성 | 개행이 새 업무인지 기존 업무의 설명인지 알 수 없다. 예산·참여 인원을 여러 번 계상할 위험이 있다 | 선택하지 않음 |
| HWPX 명시 반복 영역 + 레코드 배열 + 표/셀 원본 복제 | 입력을 구조화해야 한다. 프로필에 없는 행을 자동 추정하지 못한다 | 선택 |
| HWPX 긴 한 업무의 자동 continuation 행 생성 | 업무 식별/중복 예산 표기/계속 표시 규칙과 렌더 기반 청킹이 추가로 필요하다 | v1에서 제외, 안전 거부 |

재결정 조건은 실제 업무에서 한 레코드가 한 페이지를 넘거나, 원본 목록·책갈피·복합 입력 영역을 보존한 DOCX 다문단 입력이 필요한 경우다. 그때 업무 식별·목록 의미를 먼저 확정하고 해당 범위만 확장한다. 기존 shape 검사를 약하게 하여 통과시키지 않는다.

## 3. 공통 프로필·입력 계약

총괄과 합의한 경계: `fillDocument({..., layoutProfile})`, CLI `--layout-profile FILE`, adapter의 `context.layoutProfile`. `inspect FILE --layout-profile FILE`도 같은 검증을 거쳐 실제 입력 필드를 반환한다. `layoutProfile`은 실행 코드·XPath·외부 경로를 포함하지 않는 선언 데이터다. 알려지지 않은 키, 버전/형식 불일치, 범위/참조의 모호함은 실패시킨다.

```json
{
  "version": 1,
  "format": "hwpx",
  "templateSha256": "06492e1fec87ddffe074f01c2f2ae2aff0ebf95db4756707f70246d456be7e50",
  "repeatRegions": [{
    "name": "activity_rows",
    "part": "Contents/section0.xml",
    "tableId": "1729651736",
    "headerRows": [0, 1, 2, 3, 4],
    "bodyRows": { "start": 5, "end": 30 },
    "prototypeRow": 6,
    "insertBeforeRow": 30,
    "maxRows": 100,
    "columns": [
      { "name": "period", "column": 0, "maxLength": 10000 },
      { "name": "location", "column": 1, "maxLength": 10000 },
      { "name": "participants", "column": 2, "maxLength": 10000 },
      { "name": "budget", "column": 3, "maxLength": 10000 },
      { "name": "activities", "column": 4, "maxLength": 10000 }
    ]
  }]
}
```

이 hash는 현재 준비본의 대응 예시이며 다른 템플릿에 재사용하지 않는다.

```json
{
  "activity_rows": [
    {
      "period": "2026.10.08",
      "location": "가상 시험실",
      "participants": "예시 12명",
      "budget": "예시 1,000",
      "activities": "첫 번째 가상 활동의 설명\n같은 업무의 두 번째 문단"
    }
  ]
}
```

- 배열 순서가 업무 순서다. 각 배열 요소가 업무 하나다. 문자열 내 LF는 같은 셀의 개행이지 새 레코드가 아니다. 빈 배열, 누락·초과 열, 객체 아닌 요소, 문자열 아닌 값은 거부한다. 모든 열은 기존처럼 필수다. 자동 복사·합계·추론을 하지 않는다.
- `inspect`는 프로필의 첫 업무행 표식을 `type:'text'` 5개로 노출하는 대신 `{name:'activity_rows',type:'rows',occurrences:1,maxRows:100,columns:[{name,type:'text',maxLength},...]}` 한 개로 노출한다. 영역 밖 표식은 기존 text 필드로 남긴다. 같은 이름의 scalar와 rows, 영역 간 충돌은 거부한다.
- `normalizeFields/checkValues`는 총괄이 `rows`를 추가한다. rows 1~100, 열 1~30, 각 문자열 최대10000 code point, rows 전체 텍스트 합계 최대500000 code point를 자원 상한으로 둔다. 이것은 페이지 용량이나 업무상 허용 길이의 보장이 아니다. CLI JSON 2MiB 제한은 유지한다. API 직접 호출도 동등한 검사를 한다.
- 이번에는 profile의 manifest 저장 기능을 추가하지 않는다. HWPX rows v1은 파일 경로+명시 profile만 지원하며 등록 ID+HWPX profile은 `E_UNSUPPORTED`로 실패하고 파일+profile 사용을 안내한다. 기존 scalar manifest 제약을 바꾸거나 무시하지 않는다. PDF는 필드 목록이 변하지 않아 등록 ID 지원을 유지하며 이는 XML 담당 범위 밖이다.
- 프로필은 입력 파일 전체 SHA-256에 묶는다. 표 ID가 유일하고 행/열 위치·첫 행 표식·나머지 빈 셀·스타일 참조·제목 prefix가 모두 실제 XML과 맞아야 한다. hash만 맞고 구조 검사를 생략하지 않는다.
- `repeatRegions`는 v1에서 정확히 한 항목이다. `headerRows`는 0부터 연속한 정수이며 마지막 값+1이 `bodyRows.start`다. bodyRows는 첫/중간/마지막 행이 구분되는 최소 3행의 유효 범위이며 `start < prototypeRow < end`, `insertBeforeRow === end`를 요구한다. 모든 인덱스는 원본 표의 범위 안이다. columns는 실제 colCnt와 같은 수이고 column 값은 중복 없이 0..colCnt-1을 모두 덮는다. 원본 bodyRows 밖에서 prototype을 가져오거나 범위 밖 행을 삭제할 수 없다.
- 프로필 반복 확장은 `overflow=flow`에서만 실행한다. `preserve`와 조합하면 명시 오류로 반환하고 옵션을 무시하지 않는다. 프로필 없는 기존 scalar 호출은 별도 경로다.

## 4. DOCX 실제 문단 확장

새 라이브러리나 문서 전체 재생성 없이 현재 source-offset XML patch를 유지한다. `preserve`의 기존 soft-break 동작은 호환을 유지한다. `flow`에서 값의 CRLF/CR을 LF로 정규화하고 **입력에서 생긴 LF만** 문단 경계로 만든다. 원본에 이미 있던 `w:br`, `w:cr`, 탭과 문단은 그대로 둔다.

1. 원본 문단을 텍스트·run 서식·기존 비텍스트 이벤트로 모델링한다. 표식이 여러 run에 걸쳐도 위치를 알아내며 삽입 텍스트는 기존 규칙대로 첫 표식 run의 `rPr`를 사용한다.
2. 전체 대상 문단을 한 번만 패치한다. 원래 접두 텍스트/run은 첫 새 문단에, 접미 텍스트/run은 마지막 새 문단에 남긴다. 문단 전체를 N번 복제하여 라벨·접미 문장을 반복하지 않는다. 한 문단의 여러 필드는 원래 순서대로 확장한다.
3. 각 새 문단은 원래 `pPr`의 글꼴·spacing·indent·정렬을 보존한다. 기존 `keepNext=0/keepLines=0` 국소 override는 유지한다. 원래 문단 시작의 `pageBreakBefore`는 첫 문단에만 적용하며 나머지는 직접 false로 둔다. 공유 styles/settings/numbering은 수정하지 않는다.
4. 최초 문단의 식별자는 유지하고 추가 문단의 `w14:paraId`는 유효하고 중복 없는 새 값으로 부여하거나 규격상 선택 속성을 생략한다. 캐시 `lastRenderedPageBreak`는 확장하는 대상에서만 제거한다. 원래 북마크·필드·변경추적 ID를 무작정 복제하지 않는다.
5. 입력의 선행/연속/후행 LF는 빈 문단을 포함해 보존한다. 입력 탭은 `w:tab`으로 유지한다. 문단 간 spacing은 원래 값이며 임의로 줄이지 않는다.

초기 지원은 현재의 안전한 본문/일반 표 셀 경계와 단순 텍스트 run에 한정한다. 다문단 확장에서 원본 또는 상속에 번호매기기/불릿 `numPr`, heading/outline, `sectPr`, 프레임, 복합 필드, 책갈피/주석 범위, 변경 추적, 하이퍼링크/SDT 등 의미 경계가 있으면 `E_LAYOUT`로 거부한다. 특히 목록 문단을 복제해 후속 목록 번호를 바꾸거나, 번호를 제거해 목록 의미를 바꾸지 않는다. 단일 줄 입력과 비대상 목록은 그대로 유지한다. 이 거부 범위는 외부 DOCX의 세 실제 입력 문단을 제외하지 않는다.

대상 목록 다문단 지원을 후속으로 추가하려면 `새 목록 항목`과 `현재 항목의 후속 문단`을 명시적으로 구분해야 한다. XML의 `numPr` 복제만으로 이 결정을 대신하지 않는다.

기존 `docx.mjs`의 문단 배열 동일 비교는 다음 대응 검사로 바꾼다. 원본 문단마다 출력 문단 범위를 정하고, 대상은 입력 개행 수에 맞는 정확한 N개 문단/원래 접두·접미를 가지며, 이 범위를 LF로 결합한 값이 예상 치환문과 정확해야 한다. 비대상 원본 문단은 1:1 순서/내용/서식을 유지한다. 바뀐 범위를 모두 평탄화한 전역 문자열 비교만으로 통과시키지 않는다.

## 5. HWPX 반복 행과 실패 경계

v1 반복 영역은 일반 수평 표, 고정 절대 폭, 직접 subList, rowspan/colspan 1×1 업무 셀, 각 셀의 문단 하나와 단순 run 하나로 시작한다. 첫 업무행의 셀 텍스트는 정확히 `{{columnName}}`, 그 밖의 bodyRows 셀은 비어 있어야 한다. 기존 자료가 있는 셀을 덮거나 삭제하지 않는다. 중첩 표, 셀 보호, 복합 누름틀·컨트롤·연결 subList·교차 참조, 세로 병합은 거부한다. 제목 행의 가로 병합은 원본 그대로 복제 없이 유지한다.

프로필 적용 순서는 **검증 → 행 선택/복제/축소 계획 → 값 삽입 → 국소 흐름 설정 → 재열기/렌더 경계 검사**다.

- bodyRows 안에서 첫 행, 기존 중간 행, 마지막 행을 역할별로 보존한다. n이 기존보다 작으면 필요한 앞쪽 행과 원래 마지막 경계행을 사용하고 미사용 빈 행만 제거한다. n이 크면 기존 중간 행을 쓰고 부족분만 `prototypeRow`에서 복제하여 원래 마지막 행 앞에 넣는다. n=1에서는 첫 행의 위쪽 경계와 마지막 행의 아래쪽 경계가 모두 맞아야 한다. 이 양식처럼 마지막 행 borderFill이 바닥선만 다를 때 기존 마지막 borderFill을 재사용한다. 다른 배경/대각선/좌우/위쪽 선이 달라 한 행에 안전하게 합칠 수 없다면 v1은 거부한다.
- 실제 선택된 기존 행의 높이·margin·paragraph/run 스타일·정렬을 유지한다. 원래 데이터와 같은 폰트로 내용 때문에 높이가 늘어나는 것은 허용한다. 복제한 중간 행은 원본 prototype의 최소 크기와 borderFill을 갖는다. 행 수를 맞추기 위해 폰트/폭을 바꾸지 않는다.
- 새 표 `rowCnt`, 모든 영향받는 `cellAddr.rowAddr`, 추가/삭제한 행 뒤에 있는 범위 밖 행의 주소만 새 물리 위치에 맞게 변경한다. 업무행이 범위 밖 행과 span으로 연결되면 거부한다. `cellAddr.colAddr`, width/colSpan, 표 width, 위치 offset, 좌우 margin, 페이지 크기는 바꾸지 않는다.
- 표의 저장 높이는 남은/추가된 행의 선언 높이 합으로 갱신한다. 이것은 렌더 후 실제 높이를 예측하는 값이 아니다. 최초 원본의 선언 높이와 행 높이 합이 맞지 않는 구조는 별도 해석 없이 지원하지 않는다.
- 해당 표의 기존 검증된 anchor만 `treatAsChar=0`으로 하고 `pageBreak=TABLE`로 바꾼다. **TABLE이어도 매우 큰 행은 renderer가 다시 나눌 수 있으므로 속성 검사만으로 완료하지 않는다.** `headerRows`는 0부터 연속이고 업무행 앞에서 끝나야 한다. 이 모든 셀의 `header=1` 및 표 `repeatHeader=1`을 기록한다. 열머리글만 중간에서 선택하는 프로필은 거부한다.
- 바뀐 업무 문단과 표 anchor의 `linesegarray`를 제거한다. 제목의 텍스트와 문단·글자 서식은 그대로 유지한다. 원본이 반복해서 쓰는 문단 id `2147483648`을 고유 식별자로 취급하지 않는다. 참조를 가진 실제 컨트롤 ID가 들어 있는 복제 영역은 v1에서 거부한다.

재열기 후 원본 표 anchor를 section 최상위 문단 index/control index로 다시 찾고, 번들된 rhwp `getPageControlLayout`의 `row`로 각 업무행의 페이지 집합을 구한다. `getPageTextLayout`와 셀 좌표를 함께 대조해 내용이 있어야 하는 행·셀의 누락과 수평/수직 영역 이탈을 검사한다. 제목 행은 반복을 허용하고 업무행은 페이지 집합 크기가 정확히 1이어야 한다. 첫/중간/마지막 업무행과 헤더가 동일 페이지 경계 안에 있어야 한다. API가 행을 식별하지 못하면 검사 불능으로 실패한다.

한 업무행이 두 페이지 이상이거나 한 페이지에 표시되지 않으면 `E_LAYOUT {field,region,recordIndex,reason:'record-requires-continuation'}`. 원문·고객 데이터는 오류에 넣지 않는다. 한 업무 문자열을 자동으로 여러 업무로 나누거나, 계속 행마다 금액을 복사하지 않는다. 사용자가 의미를 정한 연결 규칙이 없는 v1은 이 거부가 정상 동작이다.

총괄이 2026-10-08 확정한 보완: 프로필 없는 scalar HWPX flow에서도 **다열 업무행의 여러 쪽 분할**은 `E_LAYOUT`로 실패한다. 실제로 둘 이상의 셀로 구성된 대상 행에 한정해 위 row→page 검사를 적용하고, 반복 영역이 없다는 이유로 장문 한 필드를 여러 업무행으로 자동 전환하지 않는다. 이 경로는 기존 `CELL` 속성을 그대로 두고, 여러 페이지로 갈라졌다는 실제 검증 결과에 따라 `repeat-profile-required`로 거부한다. 한 셀로 전체 폭을 쓰는 본문형 행, 단일열 본문형 표, 일반 본문 문단의 자연스러운 흐름까지 일괄 거부하지 않는다. `preserve`에도 이 새 흐름 정책을 적용하지 않는다. 명시 rows profile의 거대 단일 업무행은 여전히 `record-requires-continuation`으로 거부한다.

## 6. 보존·실패·복구 계약

표식을 값으로 치환하는 기존 검사에 더해, 원본→출력 문단/행 매핑을 검증한다. 매핑에 포함되지 않은 내용·run 속성·문단 속성·테두리는 동일해야 한다. HWPX `header.xml`은 필요한 기존 keep 속성의 국소 복제 외에는 바꾸지 않으며 새 행을 위해 글자/문단/테두리 정의를 다시 생성하지 않는다. DOCX styles/numbering/settings와 두 형식의 이미지·relationship·메타데이터 등 비대상 ZIP entry는 해제 bytes가 동일해야 한다.

모든 검사와 dry-run은 동일 후보를 메모리에서 만들고 검증한다. 성공 후에만 현재 원본 hash 재검사 및 기존 원자적 신규 파일 발행을 한다. profile/template mismatch는 `E_TEMPLATE_CHANGED`, 입력 배열/열/길이 오류는 `E_FIELDS`, unsupported shape는 `E_LAYOUT`, 결과 누락/허용 밖 변화는 `E_PRESERVATION`이다. 실패하면 기존 원본/출력은 그대로이고 신규 결과를 남기지 않는다. 같은 원본·프로필·입력 재시도는 같은 논리 결과를 만들며 ZIP timestamp까지 byte 동일하다는 보장은 하지 않는다.

결과는 `layout.changedContainers`에 입력 레코드 수, 재사용/복제/제거 행 수, 헤더 범위와 적용 전략을 반환하고 `pagination.source='rhwp'`와 검증한 표/행 범위를 표시한다. DOCX 실제 페이지 수는 adapter가 계산하지 않는다. rhwp 레이아웃 검증을 한컴·Word 원래 앱의 표시 통과로 쓰지 않는다.

## 7. 실제 격리 실험

격리 경로: `/var/folders/m6/sn7g4ntx035ccty6hzzlxtrm0000gn/T/fill-documents-layout-design-__bn6x0p/`. `probe.py`, `render.mjs`, `structure.json`, `render-hwpx.json`, `row-audit.json`에 결과를 남겼다. 생산 adapter를 수정하거나 원본을 저장하지 않았다.

| 실험 | 실제 관찰 | 해석 범위 |
|---|---|---|
| DOCX 긴 결과의 p480/p488를 LF별 실제 문단으로 분리 | 901→983개 문단, profile 82개 문단, 입력 LF에 의한 br 0, 값 결합 exact | 단순 외부 입력 문단의 구조 가능성. 복합 run/목록 일반 구현 증거는 아님 |
| HWPX 80개 업무행, header는 row4만 | 구조 검사 통과, 31쪽. 첫 활동 쪽 이후 제목·열머리글 없음 | 중간 머리글 지정만으로 실패하는 직접 반례 |
| HWPX 80개 업무행, header row0~4, CELL | 구조 검사 통과, 34쪽, 모든 활동 쪽에 제목/열머리글. 그러나 13개 업무행이 2페이지에 걸침 | 헤더만 추가하면 빈 동료 셀 조각 문제는 남음 |
| 같은 80개 업무행, header row0~4, TABLE | 구조 검사 통과, 37쪽. 활동은 7~26쪽, 80개 활동/장소 표식 각각 한 번, 80개 업무행 모두 단일 페이지, 관측한 셀 사각형의 물리 페이지 이탈 0 | TABLE+실제 행 경계 검사의 지원 가능성. 표 폭/열 폭/폰트/정렬 유지 |
| 한 업무에 전체 긴 설명, header row0~4, TABLE | 구조 검사 통과해도 업무행 5가 8~24쪽 17페이지에 걸침 | 거대 한 업무의 안전 거부가 필요하다는 직접 근거 |
| HWPX 3개 업무만 남기고 미사용 bodyRows 제거, 마지막 경계행 보존, TABLE | 5개 헤더+3개 업무=8행, 구조 검사 통과, 원본과 같은 18쪽, 활동 3개/장소 3개 모두 7쪽 | 명시 영역 안 빈 행 제거와 마지막 경계행 보존의 지원 가능성 |
| DOCX 동일 NanumGothic fallback 설정으로 전/후 렌더 | 기존31쪽→실제 문단32쪽. 새 첫 문장이 16쪽 x90.9~249.25pt에 자연스럽게 표시됨. 새 16쪽 PNG 직접 확인 | 글꼴 크기·정렬 유지하에 soft-break 확장 원인을 제거한 대표 화면. 원래 Word 앱 검증은 아님 |

HWPX TABLE 출력 8쪽 PNG를 직접 보아 제목·법인명·단위·5열 머리글 및 네 업무행의 대응을 확인했다. 검증자가 임의로 짧게 줄인 데이터가 아니라 기존 긴 시험의 80개 설명을 각 명시 업무에 넣었다. 페이지 총수나 일부 PNG만으로 전체 glyph 겹침 부재를 주장하지 않는다. 최초 80행 실험은 미사용행이 없으므로 총괄의 미사용행 제거 결정과 같은 결과다. 짧은 3행의 제거 변형은 `hwpx-3-trimmed-table.hwpx`로 별도 검사했다. 원본 borderFill 58/59/60과 61/62/63을 읽어 바닥선 외 속성이 같은 것도 직접 확인했다.

실행 명령은 `python3 <tmp>/probe.py`, `node <tmp>/render.mjs`, `node --input-type=module`의 원본/행 좌표 검사, `soffice --headless --convert-to pdf --outdir <tmp> <candidate.docx>`, `pdfinfo`, `pdftotext`, `pdftoppm`이다. 완료한 명령의 종료 코드는 0이다. 첫 DOCX 렌더는 로컬 글꼴 구성 때문에 한글 glyph가 빠져 실제 보기 통과로 사용하지 않는다. 이후 동일 후보와 기존 결과를 같은 NanumGothic fallback 설정으로 재렌더하여 한글을 확인했다. 결과는 `<tmp>/font-renders/{docx-real-paragraphs.pdf,docx-long-flow.pdf,new16.png,compare.json}`이다.

## 8. 구현 순서·실제 변경 파일

1. 총괄: `lib/fields.mjs`, `lib/engine.mjs`, `bin/fill-documents.mjs`에 strict profile 전달·rows 검증·inspect 연결. profile 없는 호출과 기존 원자적 발행 계약을 유지한다. 새 profile을 catalog에 저장하는 기능은 추가하지 않는다.
2. XML 담당: `lib/adapters/docx-flow.mjs`에 문단 단위 event patch/안전 거부, `docx.mjs`에 source→output 문단 범위 대조를 넣는다. 원래 폭/축소/상속 가드는 유지한다.
3. XML 담당: `lib/adapters/hwpx-repeat.mjs` 한 파일에 profile의 XML 해석·행 계획/적용·보존/행 경계 검증을 모은다. 범용 template engine으로 추상화하지 않는다. `hwpx.mjs`의 inspect/fill이 이 경로를 선택하며, `hwpx-flow.mjs`는 프로필 허용 표의 TABLE/헤더 변경과 일반 flow 변경이 중복되지 않게 한다.
4. XML 담당: `tests/xml-flow.test.mjs`에 DOCX 회귀를 갱신하고 `tests/hwpx-repeat.test.mjs`에 반복 프로필/행 안전 검사를 추가한다. 외부 문서 원본은 공개 저장소에 넣지 않고 자체 최소 fixture로 재현한다.
5. 총괄: 사용법·기존 long-content 문서의 지원 범위/실패 판정 갱신, 필요한 bundle 재생성, 외부 자료 재시험 및 최종 검증 기록. XML 담당은 총괄의 최종 기록을 직접 바꾸지 않는다.

## 9. 검증 시나리오와 남은 항목

- DOCX: 첫/중간/마지막 줄과 연속·선행·후행 LF, CRLF, tab, 한글/긴 영문, split-run 표식, 동일 문단 여러 필드, 고정 접두/접미, 비대상 다른 서식 run을 검증한다. 새 문단 수/텍스트/서식/ID와 비대상 문단 순서, 원래 table width를 함께 대조한다. 목록·heading·field/SDT·range marker가 걸리는 다문단은 의도한 오류이며, 비대상 목록 numbering XML은 exact여야 한다.
- HWPX: n=1/3/기존 capacity/초과/100, 누락/초과/비문자열 열, hash mismatch, 중복 ID 선택, 잘못된 header prefix, 보호/중첩/병합, 이미 값 있는 행, 처음과 마지막 경계 호환 불가를 검사한다. 필요한 n개만 존재하고 행 주소 연속/col coverage/참조가 유효하며, 값과 순서·표 폭·열 폭·정렬·글자 속성이 유지되어야 한다.
- HWPX 실제 rhwp: 80개 업무 모두 정확히 한 페이지에 존재, 각 활동 페이지에서 헤더 5행, 좌우 각 셀/텍스트가 원래 경계 안. 한 업무의 거대 문자열은 `record-requires-continuation`, 신규 파일 없음. TABLE 설정을 CELL로 바꾼 반례도 실제 13개 행 분할을 잡아야 한다.
- 프로필 없는 scalar HWPX: 다열 대상 행의 장문 페이지 분할은 `repeat-profile-required`와 신규 파일 없음, 같은 다열 행의 짧은 입력은 기존 성공, 단일열 본문형 표/전체폭 한 셀 행은 자연스러운 흐름이 유지되어야 한다. 무관한 다른 행의 분할을 대상 행의 오류로 오인하지 않는다.
- dry-run/실제 fill 동일 입력 오류, 기존 출력 충돌, 원본 변경 경쟁을 공통 검사로 유지한다. 저장된 최종 파일을 다시 읽은 결과로 검증한다.
- 실제 한컴·Word 앱, Windows/Linux, 실제 제출 규칙은 이번 격리 검증으로 확인하지 않았다. 최대100행/500k 상한의 실측 처리시간·메모리 보장도 없다. 이 수치를 성능 검증값으로 쓰지 않는다.

등록 ID+HWPX profile은 총괄 결정에 따라 v1에서 명시 거부한다. DOCX 다문단 목록 등의 안전 거부와 명시 rows profile은 독립 검토자가 아래 이전 hash에서 진행 가능으로 판정했다. 뒤에 확정한 프로필 없는 다열 업무행 분할 거부는 변경 범위만 추가 검토한 뒤 구현한다.

독립 검토 이력: `pdf_continuation_design`가 SHA-256 `aee4cb50bb417d3fa30c546a1cd79738e13a373d5900652ad495b3cf31a4fb33`의 DOCX 단순영역 다문단·HWPX 파일+단일 rows profile에 대해 진행 가능을 반환했다. 검토자는 별도 읽기 전용 명령으로 80행 TABLE의 복수쪽 행 0/머리글 누락 0, 3행 축소본, 거대 한 행의 17쪽 분할, DOCX 983문단과 시작/끝 1개 및 두 PNG를 직접 확인했다. 이는 생산 구현/전체 회귀/모든 glyph/원래 앱/최대 부하의 검증 완료가 아니다.

공식 근거: [Microsoft의 soft line break와 양쪽 맞춤 설명](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.donotexpandshiftreturn?view=openxml-3.0.1), [한컴의 제목 셀 첫 행 포함 조건](https://help.hancom.com/hoffice/webhelp/9.0/en_us/hwp/table/tableattribute/table(cellattribute).htm), [한컴 표 나눔/제목행 반복 설명](https://help.hancom.com/hoffice100/en-US/Hwp/table/tableattribute/table(table).htm), [한컴 HWPML의 Table/Cell 분할 정의](https://cdn.hancom.com/link/docs/한글문서파일형식3.0_HWPML_revision1.2.pdf). 마지막 자료는 HWPML 설명이며 HWPX 지원 판단에는 실제 원본·rhwp 실험을 함께 사용했다.


실제 양식 확인 보완: 첫 업무행 border 55/56/57의 topBorder는 DOUBLE_SLIM, 마지막 61/62/63은 DASH여서 이 양식의 단일 업무행은 기존 정책대로 incompatible-single-row-border로 거부한다. 중간 58~60과 마지막 61~63은 바닥선 차이이며, 첫 행까지 바닥선만 다르다고 일반화하지 않는다. 3/12/80행 경로와 독립된 제한이다.
