# PDF 원래 양식 이어쓰기 설계

작성: 2026-10-08. 상태: **격리 실험 완료, 독립 설계 검토에서 진행 가능 회신 수신**. 생산 코드는 수정하지 않았다. 이 문서는 PDF 범위만 다룬다.

## 요구와 확인한 문제

부모가 전달한 사용자 요구는 기존 형식을 유지·확장하고, 레이아웃을 무너뜨리지 않으며, 해당 양식에 맞는 실제형 가상 내용으로 시험하는 것이다. 기존 PDF 결과의 문제는 큰 Message 칸이 별지 참조로 비고, 전혀 다른 A4 양식이 추가되며, 제품명·`field_<hash>`가 인쇄되고, 162개 한 줄 필드로 편집이 분절되는 점이다.

| ID | 요구·출처 | 이번 계약·수용 결과 |
|---|---|---|
| PDF-R1 | 원래 형식 유지·확장 | 원래 페이지의 기존 content stream bytes·순서, 크기, 회전과 원래 필드·서명 연결을 보존한다. 명시한 여백의 계속 안내만 별도 stream으로 추가하고 새 페이지는 명시한 원본 양식 페이지의 정적 배경을 같은 크기로 재사용한다. |
| PDF-R2 | 원래 큰 칸 활용 | 원래 필드 `/V`에 원문의 첫 청크를 넣고, 나머지만 새 페이지에 넣는다. 별지 참조만으로 대체하지 않는다. |
| PDF-R3 | 읽기·편집 가능한 결과 | 본문 청크는 페이지마다 하나의 multiline 필드다. 인쇄면에 제품명·내부 별칭·해시를 넣지 않는다. |
| PDF-R4 | 원문 exact·기존 AP 보존 가드 | 원래 필드와 새 필드의 `/V`를 순서대로 직접 결합한 값이 입력과 일치한다. 공백·개행 삽입/삭제, 축약, 자동 축소, 별도 숨은 원문을 사용하지 않는다. 기본 AP 재생성 후에도 지원 입력은 영역 안에 표시된다. |
| PDF-R5 | 기존 서명·활성 콘텐츠 정책 유지 | 실제 서명/XFA/활성 콘텐츠 거부를 유지한다. 빈 서명 필드·위젯·AP는 원래 두 개만 남는다. 추가 페이지에 실제 서명 또는 원래 위젯을 복제하지 않는다. |
| PDF-R6 | 양식에 맞는 실제형 가상 시험 | FEMA ICS 213의 사고명·수신/발신자·자원 요청·일시·회신을 갖춘 가상 훈련 자료로 생성·재생성·렌더를 확인한다. |

확인한 현재 코드: `plugins/fill-documents/skills/fill-documents/lib/adapters/pdf.mjs`, `pdf-flow.mjs`, `tests/pdf-flow.test.mjs`. 현재 v2는 원본을 참조 문구로 바꾸고 별도 A4에 한 줄 필드를 만든다. 원문·서명·원래 페이지 가드는 가치가 있으므로 새 레이아웃 계약에 연결해 유지한다.

외부 원본 `../외부양식-장문테스트-20261008/01-원본/fema-general-message.pdf`는 **Letter 612×792pt, 1쪽 양식 + 2쪽 작성 설명문**이다. Message는 `(40.6416, 367.189, 533.5584, 245.438)`pt, 10pt, 하나의 multiline 위젯이다. 입력 가능한 텍스트 13개와 빈 서명 2개가 모두 1쪽에 있다.

## 선택과 대안

**선택: 명시된 원본 페이지의 정적 배경 + 원래 칸부터 시작하는 raw 페이지 청크 + 페이지당 하나의 multiline 필드.** 기본 AP가 줄바꿈할 수 없는 긴 토큰은 `E_LAYOUT`으로 거부한다. 이 선택은 부모의 2026-10-08 추가 지시로 확인했다. 모든 문자열을 성공시키는 기존 한 줄 필드 우회보다 사용자가 요구한 형식·편집 단위를 우선하며, 실패를 숨기지 않는다.

| 대안 | 장점 | 문제·선택 |
|---|---|---|
| 현재 A4/한 줄 필드 유지 | 무공백도 raw 청크로 나눌 수 있음 | 원래 칸·양식·편집 요구 불충족. 채택하지 않음. |
| 원본 페이지를 `copyPages`로 그대로 복사 | 겉모양이 같아 보임 | 위젯과 빈 서명 객체까지 복제된다. 실험에서 orphan 위젯 15개, 서명 객체 4개. 채택하지 않음. |
| `embedPage`에 원본 페이지를 그대로 전달 | 새 페이지의 눈에 보이는 위젯은 없음 | 내부 page copier가 annotation 객체도 가져온다. 실험에서 숨은 서명 객체가 4개가 되어 기존 가드가 거부. 그대로 사용하지 않음. |
| custom AP에만 문자 단위 줄바꿈 | raw `/V`와 초기 화면 유지 가능 | 일반 `updateAppearances(font)`에서 긴 토큰 잘림 재발. 채택하지 않음. |
| `/V`에 강제 개행 삽입 + 원문 별도 저장 | 한 필드·일반 AP로 임의 입력 가능 | 사용자가 편집하는 값과 원문이 달라지고 원문 계약이 바뀜. 부모가 배제함. |
| 명시한 정적 원본 배경 + 기본 AP의 안전한 raw 청크 | 원래 모양·원문·편집·재생성을 함께 유지 | 긴 무공백 토큰, 일반 추론 불가능한 양식은 명시 실패. 선택함. |

긴 URL·식별자·무공백 한국어가 필수인 과업이 새로 생기면, 이 제한을 숨기지 말고 원문/표시값 계약부터 다시 결정한다. 글자 크기 축소나 수십 개 필드로의 묵시적 대체는 하지 않는다.

## 명시적 이어쓰기 설정

외부 양식의 의미를 필드 위치나 영어 이름만으로 추론하지 않는다. 특히 승인자·회신자·서명 주변 값을 일반 문맥처럼 반복하지 않는다. 다음과 같은 **원본 페이지 반복 설정**을 별도 JSON 입력으로 받는다. 부모가 공통 경로를 `fillDocument({ ...layoutProfile })`, CLI `--layout-profile FILE`, `context.layoutProfile`로 확정했다. 엔진/CLI/공통 fields 수정은 root 소유다.

```json
{
  "version": 1,
  "format": "pdf",
  "templateSha256": "e745a3a7b78bea3295e33b1efbc291011a9b78bdd1c937115c8c5301e7b9454f",
  "continuations": [
    {
      "field": "<inspect가 반환한 Message 입력 키>",
      "sourcePage": 1,
      "repeatFields": ["<Incident 키>", "<To 키>", "<From 키>", "<Subject 키>", "<Date 키>", "<Time 키>"],
      "label": "Message continued",
      "labelBox": {"x": 36, "y": 766, "width": 540, "height": 16},
      "sourceFooterBox": {"x": 36, "y": 28, "width": 540, "height": 16},
      "footer": "Approval and reply apply on original form page 1.",
      "footerBox": {"x": 36, "y": 28, "width": 540, "height": 16}
    }
  ]
}
```

- 이 스키마의 최상위 키는 `version`, `format`, `templateSha256`, `continuations` 네 개다. 모두 필수이며 알 수 없는 키를 거부한다. `continuations`는 1~1,000개이고 같은 `field`를 중복 지정할 수 없다. 원래 필드가 지금 넘치지 않더라도 이후 같은 서식에 사용할 설정은 허용한다.
- entry의 필수 키는 `field`, `sourcePage`, `repeatFields`, `label`, `labelBox`, `sourceFooterBox`다. 선택 키 `footer`와 `footerBox`는 함께 지정한다. 나머지 키를 거부한다. `field`/`repeatFields`는 inspect 입력 키, `sourcePage`는 1-based 정수다. `repeatFields`는 중복 없는 배열이며 모두 본문과 같은 sourcePage의 한 위젯 텍스트 필드여야 한다.
- `label`은 1~80자, `footer`는 1~240자의 유효한 한 줄 문자열이다. 실제 공간 적합성은 뒤에 붙일 부분 번호·출처 문구를 포함해 9pt로 검사한다. 모든 box는 유한한 `x,y,width,height`만 허용하고 width/height는 양수다. page crop 안에 있어야 한다. `labelBox`/`footerBox`는 원본 양식의 모든 위젯 사각형과 다른 표시 box를 피한다. `sourceFooterBox`도 **서명·회신을 포함한 원래 페이지의 모든 위젯**, 같은 sourcePage를 사용하는 다른 entry의 sourceFooterBox와 교차하면 실패한다.
- 본문 사각형, 글자 크기·정렬·색은 해당 원래 위젯에서 가져온다. 새 A4 크기나 임의의 큰 본문 상자는 만들지 않는다. 반복 페이지도 sourcePage의 MediaBox/CropBox를 따른다.
- `templateSha256`는 파일 전체를 묶는다. 공통 엔진이 원본 `inspectDocument` 시점에 버전/형식/hash를 검증하고 adapter가 스키마·페이지·필드 연결을 대조한다. 다른 원본에 설정을 재사용하면 `E_TEMPLATE_CHANGED`로 실패한다. 후보 `validate`는 원본 context를 받더라도 **출력 bytes를 이 원본 hash와 비교하지 않는다**. 독립 validate는 저장된 v3 매핑과 구조를 검사한다.
- `field`와 `repeatFields`는 실제 입력 별칭에 매핑하고, 원래 이름을 변경하지 않는다. alias/hash는 설정·내부 매핑에서만 사용한다. `label`은 사람이 읽을 별도 문자열이다.
- 첫 구현은 **하나의 페이지에 하나의 위젯을 가진 수평 multiline 본문**으로 제한한다. 여러 페이지에 공유된 필드, 회전된 위젯/페이지, 비표준 좌표 원점, 페이지 밖 위젯은 레이아웃을 추정하지 않고 실패한다. 기존 `preserve` 및 짧은 값 채우기 지원을 이 제한으로 줄이지 않는다.
- 반복 문맥은 명시한, 넘치지 않는 일반 텍스트 필드만 허용한다. 본문 자신, 다른 넘치는 필드, 서명, 읽기 전용 특수 필드를 넣으면 설정 오류다. 원본 승인자·회신·서명은 새 페이지에 채우지 않는다.
- 새 페이지의 문맥 값은 고정 인쇄 내용이다. 독립 `/V`나 원래 필드의 추가 위젯으로 만들지 않는다. 원래 필드에 값을 채우고 생성한 normal AP를 Form XObject로 새 페이지의 같은 사각형에 그리는 방식으로 값·스타일·범위를 재사용한다. 위젯 dictionary 자체는 참조하지 않는다. 원래 입력값이 유일한 편집 원천이며 새 본문만 독립 multiline 필드다. 첫 구현은 AP BBox/Matrix가 수평 위젯에 맞게 해석 가능한 경우로 제한한다.
- label/footer/source 안내는 설정된 여백에만 그린다. 문자 집합·범위·겹침을 확인한다. 제품명·내부 키는 자동으로 붙이지 않는다. source 안내는 사람용 label과 실제 첫 추가 페이지 번호로 구성하고 원래 `/V`에는 넣지 않는다. 배경 정적 잉크와의 충돌 여부는 자동 필드 교차 검사만으로 증명되지 않으므로 해당 설정의 대표 렌더 검증이 필요하다.
- `overflow=flow`이고 실제 overflow가 있으나 유효한 설정이 없으면 `E_LAYOUT`(`continuation-template-required`)로 실패한다. 일반 A4로 묵시적 대체하지 않는다. 설정이 없어도 짧은 값·기존 preserve 경로는 그대로 가능하다.
- 기존 `engine.fillDocument`는 `context.manifest`를 전달하지만 CLI의 별도 레이아웃 설정 입력은 없다. 확정한 `--layout-profile` JSON → `fillDocument({layoutProfile})` → `context.layoutProfile` 경로를 root가 함께 구현한다. `inspect`에도 같은 profile을 전달할 수 있게 한다. 테스트 전용 `context` 인자로만 끝내면 사용자 요구의 완료가 아니다.

별도의 이미 작성된 continuation PDF를 불러오는 일반 template engine은 이번 범위가 아니다. 현재 원본 페이지 반복 설정으로 해소할 수 없는 양식은 실패하고 별도 설계한다.

## 페이지와 객체의 소유권

1. 원본 입력을 기존 `loadPdf`와 활성 콘텐츠/서명 검사로 먼저 검증한다. 검사 전에 위험 객체를 지워서 허용하지 않는다.
2. 원본 문서가 결과 문서다. 원래 페이지·AcroForm·서명 객체를 새 문서로 재구축하지 않는다.
3. 배경용으로 같은 입력을 별도 donor 문서에 연다. 대상 페이지의 상속 Resources/MediaBox/CropBox/Rotate를 명시화하고, **Type/Contents/Resources/MediaBox/CropBox/Rotate만 가진 페이지**를 만든다. 원본 결과 문서의 페이지를 sanitize하지 않는다.
4. donor의 Annots, Parent, StructParents, Tabs, 추가 동작·식별 사전 등을 page copier에 전달하지 않는다. `copyPages` 후 Annots를 지우는 방식은 이미 복제된 간접 객체가 남으므로 불충분하다.
5. 정적 페이지만 `embedPage`로 Form XObject로 가져와 같은 크기의 새 페이지에 1:1로 그린다. 별도 donor와 화이트리스트를 사용해야 원래 페이지의 `normalizedEntries()` 같은 라이브러리 변형도 결과 원본에 영향을 주지 않는다.
6. 새 페이지에는 새 본문 필드 하나만 `createTextField`/`addToPage`로 만들고, `/P`는 그 새 페이지, `AcroForm.Fields`는 새 필드, Annots는 새 위젯을 가리키게 한다. 원래 본문의 Kids나 원래 서명의 Kids에 연결하지 않는다.
7. 저장 후 모든 위젯이 정확히 해당 필드·페이지에 연결되고 중복·orphan이 없음을 검증한다. 서명 객체 수뿐 아니라 원래 서명 field/widget dictionary, AP stream bytes와 SigFlags를 비교한다. 활성 콘텐츠 검사를 다시 수행한다.

원본은 tagged PDF이지만 이 방식은 **새 페이지의 구조 태그를 확장하지 않는다**. 원래 태그 트리는 보존하고, 복제된 구조 ID를 새 페이지에 거짓 연결하지 않는다. 새 페이지를 tagged/접근성 완성으로 주장하지 않는다.

## 원래 2쪽 설명문과 읽기 순서

가장 작은 변경은 **원래 두 페이지를 같은 순서·물리 번호로 보존하고 3쪽부터 추가**하는 것이다. 새 페이지의 label은 `Message continued · part 2 of 3 · original form page 1`처럼 본문 순서와 출처를 알린다. 2쪽 설명문을 이어쓰기 배경으로 오인하지 않는다. 원본에 다른 설명문이나 첨부 페이지가 있어도 sourcePage를 명시해야 한다.

이 선택은 기존 절대 페이지 참조와 보존 검사를 유지하지만, 본문 읽기 사이에 설명문이 놓이는 비용이 있다. `after-source-page` 삽입은 더 자연스러울 수 있으나 원래 물리 페이지 번호·page labels·목적지 계약과 보존 검사 변경이 필요하다. 이번 최소 범위에는 넣지 않는다.

부모가 첫쪽의 눈에 보이는 계속 안내도 필요하다고 확정했다. **원래 `/V`는 raw prefix만** 담고, `sourceFooterBox`에 `Message continues on page 3`처럼 실제 다음 위치를 인쇄한다. 이로 인해 기존의 “전체 Contents 배열 불변”은 다음과 같이 좁게 확장한다.

1. 기존 모든 content stream bytes와 상대 순서를 그대로 보존한다. 삭제·교체·기존 stream 내부 편집은 금지한다.
2. source 페이지의 Resources와 Font/XObject/ExtGState 하위 dictionary를 먼저 복제하여 다른 원래 페이지의 공유 리소스에 변경이 전파되지 않게 한다. 원래 바인딩을 바꾸지 않고 안내용 font 바인딩만 추가한다.
3. 원래 content를 둘러싸는 알려진 `q`/`Q` wrapper와, 자체 `q`/`Q` 안에서 그리는 안내 stream만 추가할 수 있다. 이전 stream의 CTM/clip/글꼴 상태를 그대로 상속하여 여백 위치가 바뀌면 안 된다. 정상적인 그래픽 상태 균형을 전제로 하며 비정상 원본은 성공을 가정하지 않는다.
4. 변경 계획에서 허용한 wrapper/안내 stream의 ref·bytes·순서를 기록하고 저장 후 정확히 대조한다. 단순히 “원래 stream이 어딘가 남아 있다”는 부분집합 검사만으로 임의 stream 추가를 통과시키지 않는다. 안내 없는 원래 페이지는 기존 전체 snapshot 동일 검사다.
5. 원래 Annots의 ref·순서와 모든 서명은 변하지 않는다. 새 안내는 field·annotation이 아니므로 추가 편집 탭이나 위젯 연결을 만들지 않는다.

격리 실험에 이 변형을 반영했다. 원래 1쪽에 q/Q/안내 총3개 stream이 추가되고 원래 stream bytes·순서는 보존되며, 2쪽 전체 snapshot과 서명·Annots는 동일했다. 기본 AP 재생성 후에도 이 결과를 재확인했다.

## 원문 분할과 appearance 계약

- 모든 본문·문맥·label에 기존 문자 집합·제어 문자·MaxLen 검사를 적용한다. 원래 필드 MaxLen은 원문 전체에 적용한다. 여러 페이지로 제한을 우회하지 않는다.
- 먼저 원문 전체를 해당 기본 font/size/width로 `layoutMultilineText`해 가시 줄 폭을 확인한다. 단일 토큰 때문에 칸 폭보다 큰 줄이 생기면 분할 전에 `E_LAYOUT`(`unbreakable-run`)으로 실패한다. 뒤에서 그 토큰을 여러 페이지 한 줄로 쪼개 성공시키지 않는다.
- 원래 필드부터 같은 스타일로 담을 수 있는 최대 연속 prefix를 찾는다. 기존 공백·줄바꿈 경계에서 나누며, CRLF·UTF-16 surrogate·grapheme 내부를 자르지 않는다. 원문에서 문자를 삽입·삭제하지 않는다. 양쪽 경계의 공백도 직접 `/V`에 남는다.
- 각 후보를 실제 기본 `layoutMultilineText` 결과와 똑같은 inset, border, alignment, fontSize로 검사한다. 마지막 빈 줄은 glyph가 없으므로 실제 가시 경계 검사와 원문 보존을 구분한다. blank line 자체의 높이는 다음 가시 줄 배치에 반영한다.
- 너비뿐 아니라 descent 포함 아래 경계와 위 경계를 확인한다. 진행 불가, 256 추가 페이지 초과, 전체 4096쪽 초과 등 기존 제한은 유지한다.
- 원래 필드에는 청크 0, 새 페이지들에는 청크 1..n을 하나씩 넣는다. 각각 `enableMultiline`, 기존 크기의 고정 fontSize, 기본 `updateAppearances(font)`를 사용한다. 전용 custom AP에 의존하지 않는다.
- 재열기 후 같은 기본 AP 재생성 → 저장 → 재열기를 검증한다. 실제 입력 청크·fontSize·geometry·원문 hash가 동일하고 가시 줄이 필드 내부여야 한다.
- 설치된 pdf-lib는 CRLF를 두 구분 문자로 계산한다. 이번 안은 raw 값을 바꾸지 않고 그 실제 높이로 페이지를 계산한다. 보이는 줄 간격이 문서 앱과 같다는 보장은 하지 않는다.
- 보장 범위는 번들 `pdf-lib@1.17.1` 기본 AP 재생성이다. 모든 PDF 뷰어가 편집 후 동일하게 줄바꿈한다는 주장은 하지 않는다. 특히 `/DA`의 글꼴 해석·AcroForm 리소스를 사용하는 다른 뷰어의 편집 동작은 별도 실제 앱 검증 과업이다.

## v3 매핑·검증

v2의 참조문구/여러 줄 필드 매핑과 의미가 달라지므로 `FillDocumentsFlow.Version = 3`으로 쓴다. v2 결과는 기존 독해·검증을 유지하되 새 writer는 v3만 쓴다. 완성 결과 재채우기 거부는 유지한다.

필요한 entry 정보는 `origin`, `sourceName`, `originalPages`, `sourcePage`, `prefixLength`, `chunkFields`, `chunkPages`, `addedPages`, `fontSize`, `length`, `sha256`, 검증된 template 설정 식별자와 본문 geometry다. 첫 청크는 source field에 있으므로 `chunkFields`에는 **추가 필드만** 넣는다.

인계 보완: 반복 문맥은 정적 AP이므로 결과 PDF의 원래 문맥 필드를 수동 수정해도 새 페이지로 자동 전파되지 않는다. 이를 숨은 동기화로 약속하지 않는다. v3 `repeatContexts`에 명시한 각 문맥의 sourceName, 원래 값 hash, 실제 사용한 AP stream hash 및 새 페이지 XObject binding을 기록한다. validate는 현재 source 값과 기록이 같은지, 각 새 페이지가 기록한 AP를 참조하는지 검사하고 불일치 시 `E_PRESERVATION`으로 실패해야 한다. 문맥을 바꾸려면 원본과 수정한 입력으로 다시 생성한다. source 위젯의 동일 값 AP를 정상 재생성하는 것 자체를 거부하지 않으며, 값과 정적 복사본의 연결을 검사한다.

검증 순서:

1. Version/입력 크기·배열 길이·범위를 검사한다. 출처 alias와 실제 sourceName을 다시 대조한다.
2. 원래 source가 하나의 지원 multiline 위젯이고 설정된 원래 페이지에 있는지 확인한다. `source.getText().length === prefixLength > 0`이어야 한다.
3. 추가 페이지는 원래 페이지 수 뒤에 연속이고 중복이 없어야 한다. `chunkFields.length === chunkPages.length === addedPages.length`이며 페이지마다 하나만 존재한다. 내부 새 이름은 sourceName hash와 순번으로 충돌 없이 만들되 인쇄하지 않는다.
4. 새 field는 하나의 위젯·새 페이지 하나와만 연결된다. 새 body rect/fontSize가 source 계약과 일치하고, 페이지 MediaBox/CropBox/회전도 template과 일치한다.
5. `source.getText() + chunkFields.map(getText).join('')`가 길이·SHA-256와 일치하고, fill 직후에는 실제 입력과도 직접 비교한다. 별도 숨은 원문으로 검증하지 않는다.
6. 원래 페이지 stream/box/rotation과 원래 fields의 이름·타입·MaxLen·위젯 연결, 서명 field/widget/AP/SigFlags를 원본 snapshot과 대조한다. source 안내 페이지는 위의 정확한 추가 stream 계획만 예외로 허용한다. 새 필드는 `originalFields` 비교에서만 제외한다.
7. 모든 새 field와 원래 prefix의 기본 AP layout 경계를 검사한다. 기존 원문·AP·활성 콘텐츠 가드를 통과하지 않으면 결과를 내보내지 않는다.

`inspect`는 추가 내부 필드를 일반 입력에서 숨기되 v3 이어쓰기 정보를 반환한다. 원본 `fields` 목록과 각 페이지의 실제 편집 필드를 혼동하지 않는다. `validate`의 현재 비어 있지 않은 AP 검사는 임의로 변조된 AP가 `/V`와 시각적으로 같은지까지 증명하지 않으므로 보고 문구를 그 범위로 제한한다.

## 실패와 복구

| 상황 | 결과·복구 |
|---|---|
| 설정 없음/필드·페이지 불일치/불가 geometry | `E_LAYOUT`, 원래 파일·기존 출력 보존. 양식에 맞는 명시 설정을 제공한다. |
| 원본 hash 불일치 | `E_TEMPLATE_CHANGED`, 설정을 현재 원본과 재검토한다. |
| 긴 무공백 토큰·설정된 label이 칸보다 큼 | `E_LAYOUT`, 부분 결과 미게시. 입력 자체의 업무상 표현 또는 양식 변경이 필요하며 자동 축소하지 않는다. |
| 실제 서명/XFA/활성 콘텐츠 | 기존 `E_UNSUPPORTED`, 서명 또는 보안 상태를 우회하지 않는다. |
| 원문·서명·페이지·widget 연결 불일치 | `E_PRESERVATION`, 임시 후보 폐기. 원본에서 재시도한다. |
| 저장 실패 | 기존 `E_ENGINE`/게시 계층 실패. 원본·기존 출력에 덮어쓰지 않는다. |
| 완성 이어쓰기 PDF 재입력 | 기존 재채우기 거부. 원본과 원래 JSON을 사용한다. 수동 편집 후 hash가 달라지면 `validate`가 실패하는 정책도 유지한다. |

동시성은 파일 게시 계층이 소유한다. PDF adapter는 메모리 후보만 반환하며, 이 변경이 별도 파일 갱신·외부 전송·백그라운드 작업을 만들지 않는다. `dry-run`도 같은 후보 생성·검증을 수행하고 게시만 생략한다.

## 구현 순서

1. 이 설계의 독립 검토에서 확정된 `layoutProfile` 스키마, sourceFooterBox와 정확한 추가 stream 범위, append 순서를 확인한다.
2. `pdf-flow.mjs`에 기본 AP 기반 안전한 raw prefix/page 분할과 긴 토큰 거부를 구현한다. `pdf.mjs`의 fit 계산과 font/geometry 규칙을 공유하여 미세한 inset 차이를 없앤다.
3. 명시 설정 검증, 별도 정적 donor 생성, 새 페이지 한 필드 생성, 반복 문맥 인쇄를 연결한다. 모든 overflow를 먼저 계획하여 반복 문맥에 다른 overflow가 들어가는 경우를 잡는다.
4. v3 writer/reader 및 v2 호환 reader, 원래 prefix 포함 exact 재구성, 페이지·위젯·서명 보존 검사를 연결한다.
5. root가 `--layout-profile` JSON에서 실제 엔진/CLI로 도달하게 연결한다. 기본 양식용 profile을 제공할 경우 해당 설정·대표 렌더도 검증한다.
6. 아래 회귀와 FEMA 실제형 가상 예제를 다시 생성한다. API 단위 검사 통과만으로 사용자용 CLI나 시각 검증 완료를 주장하지 않는다.

## 검증 시나리오

- **짧은 값:** preserve/flow 모두 페이지 추가 없이 기존 필드에 exact. 설정 유무로 기존 짧은 경로가 달라지지 않는다.
- **FEMA 대표 장문:** 앞부분이 원래 Message 칸에 보이고 원래 Reply/일시/서명란은 유지된다. 첫쪽 여백의 안내가 실제 추가 페이지를 가리키고 모든 정적 잉크/위젯을 피한다. 추가 페이지는 Letter와 같은 원본 배경·명시 문맥, 1개 body field. 2쪽 설명문은 동일한 2쪽이다. 내부 제품명·별칭은 인쇄면에 없다.
- **원문 경계:** 한국어·영문 혼합, 연속 공백, leading/trailing space, CR/LF/CRLF, 연속 빈 줄, 마지막 개행. 청크 결합 direct exact. 경계가 CRLF/grapheme을 분리하지 않는다.
- **재생성:** 저장본을 열고 원래 prefix 및 새 body에 기본 `field.updateAppearances(font)` 적용 후 다시 저장/렌더. 실제 AP 가시 줄의 폭·위/아래 경계, 맨 끝 문장을 확인한다.
- **긴 토큰 음성:** `'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(100)` 같은 기본 AP 불가 입력은 `E_LAYOUT`; preserve/flow 모두 부분 결과나 미승인 변형을 게시하지 않는다. 실제 문단 양성 시험과 분리한다.
- **객체 연결:** raw copy/embed 반례를 회귀로 잡는다. 정적 donor만 사용했을 때 원래 signature 객체·빈값·AP가 그대로이며 새 signature 객체, orphan 위젯, source Kids 변경이 없다.
- **불지원 배치:** multi-widget, 회전/비표준 원점, 부족한 label 여백, 반복 문맥의 overflow, 두 overflow 필드의 중복 페이지/field 이름은 계획 단계에서 명시 실패하거나 정의된 독립 페이지 묶음으로 처리한다.
- **매핑 변조:** prefix/청크 값·순서·페이지·크기·글자 크기·sourceName 변경, 중복 이름·누락 페이지를 거부한다. v2 결과의 기존 검증과 재채우기 거부는 유지한다.
- **실행 경로:** 실제 CLI 설정 JSON → dry-run/실제 fill → standalone validate까지 확인한다. 출력 실패 시 원본 hash·기존 출력 보존도 확인한다.

## 직접 실행한 격리 실험과 근거

실험 소유 경로: `tmp/pdf-layout-repair/`. 생산 코드와 원본은 수정하지 않았다.

- `node tmp/pdf-layout-repair/experiment.mjs`: **종료 0**, Node v25.9.0, pdf-lib 1.17.1. 결과 `experiment-report.json`.
- raw `copyPages`: fields 15, page widgets `[15,0,15]`, orphan 15, signature objects 4. 기존 inspect가 `E_UNSUPPORTED`로 거부했다.
- raw `embedPage`: page widgets `[15,0,0]`이나 signature objects 4. 기존 inspect가 `E_UNSUPPORTED`로 거부했다. 보이지 않는 객체 복제도 실제 문제다.
- whitelist donor + 같은 양식: 가상 원문 **3,828자**, 원래 칸 **1,591자**, 3쪽 **1,521자**, 4쪽 **716자**. 원문 exact. 전체 fields 17(원래15+새2), page widgets `[15,0,1,1]`, orphan 0, signature objects 2. 명시 문맥 여섯 필드의 normal AP를 XObject로 재사용하는 경로도 같은 스크립트에 구현해 재실행했다.
- 기본 AP 재생성·저장·재열기 후 각 청크 actual AP text operation 수는 20/20/8, 최대 줄 폭은 526.66/530.34/528.06pt로 유효 폭 531.5584pt 안이다. 원래 모든 content stream hash/순서/box/rotation/annotation refs와 원래 서명 dictionary/widget/AP bytes가 모두 같다. 1쪽에는 위에서 허용한 안내·wrapper 3개 stream만 추가되었고 2쪽은 전체 snapshot이 같다. 기존 inspect도 성공했다.
- 한국어/공백/CRLF **2,198자** 경계 실험: raw 청크8개 exact, fits 전부 true, CRLF 분리 없음. 이 부수 입력의 PDF 저장·렌더는 아직 실행하지 않았으므로 대표 FEMA와 같은 수준의 시각 증거로 세지 않는다.
- 무공백 영문 2,600자는 실험 분할 함수가 **`E_LAYOUT`**으로 거부했다. 이 새 거부 정책의 생산 adapter 연결은 아직 구현되지 않았다.
- `pdftoppm -r 90 -png tmp/pdf-layout-repair/same-form-regenerated.pdf tmp/pdf-layout-repair/same-form-regenerated`: **종료 0**. 1쪽·3쪽 PNG를 직접 열어 원래 칸 사용과 같은 양식 이어쓰기를 확인했다.
- `pdftotext -bbox ...`와 `pdftotext -layout ...`: **각 종료 0**. Python 표준 XML 파서로 전4쪽의 단어가 페이지 밖으로 나간 경우0을 확인했다(`render-report.json`). 페이지 내부라는 사실만으로 모든 field간 겹침/실제 뷰어 편집을 증명하지 않는다.

격리 결과물: `same-form-initial.pdf`, `same-form-regenerated.pdf`, `same-form-regenerated-1.png`~`-4.png`, `fictional-values.json`. 실제 inspect 별칭에 맞춘 `fema-profile.json`, `fema-values.json`도 생성했다. 대표 장문과 입력은 가상 훈련임을 본문에 명시했다. 이 실험 파일에는 최종 v3 매핑을 아직 쓰지 않았으므로 제품 완성본이 아니다.

라이브러리 근거: 로컬 `node_modules/pdf-lib/cjs/api/text/layout.js:71`은 공백 기반 분할 불가 시 큰 원문 줄을 그대로 반환하며, `api/form/appearances.js:212`의 기본 제공자가 이를 사용한다. `api/PDFDocument.js:1145`의 embedPages는 별도 context 페이지를 먼저 copier로 복사하고, `core/PDFObjectCopier.js:42`는 page의 Parent만 자동 제거한다. 따라서 donor Annots는 호출 전에 제외해야 한다.

공식 API의 [PDFDocument copyPages/embedPage](https://pdf-lib.js.org/docs/api/classes/pdfdocument)와 [PDFTextField updateAppearances](https://pdf-lib.js.org/docs/api/classes/pdftextfield#updateappearances)도 확인했다. API 설명만으로 annotation 안전성이나 긴 토큰 성공을 가정하지 않았으며, 위 로컬 설치본과 실행 결과로 판정했다.

## 남은 결정·한계와 인계

| 항목 | 영향·해소 방법 | 그동안 가능한 범위 |
|---|---|---|
| 공통 입력 경로의 실제 구현 | `--layout-profile`/`context.layoutProfile`로 확정. root가 연결하고 adapter가 위 PDF 스키마·원본 hash를 검증 | adapter 분할·정적 donor·v3 검증은 진행 가능 |
| 첫쪽 `계속` 표식의 추가 stream 구현·독립 검토 | 필요성은 부모 확정. 기존 bytes·순서 보존+알려진 wrapper/안내만 허용하고 공유 resource 격리·정적 잉크 렌더 확인 | 격리 실험 성공, 생산 검증 연결 필요 |
| 원래 설명문을 2쪽에 둘지 | 최소안은 append. 즉시 뒤 삽입이 필요하면 원래 페이지 identity 기반 검증·page labels/목적지 영향 재검토 | append는 실험 근거 있음 |
| 새 페이지 구조 태그·다른 뷰어 편집 | 별도 접근성/실제 앱 검증, 현재 성공 주장 범위 밖 | pdf-lib 기본 AP·Poppler 렌더 검증 가능 |
| v2 호환 reader의 회귀 | Version별 읽기 검증 분리, 기존 v2 결과 검증 fixture 확보 | 새 writer는 v3만 설계 가능 |

독립 검토자 `/root/continuation_design`가 2026-10-08 대상 본문 SHA-256 `67365184ca575b53c202f69b063dd7d6eeb154e06ca82ff03cdd620c30640374`에 **진행 가능**을 회신했다. 검토자는 별도 read-only Node 실행으로 원본/현재 격리 결과를 직접 대조하여 원문 3,828자 exact, 원래8개 stream 보존+허용3개 추가, 2쪽 동일, 원래15필드+새2필드, 서명 dictionary/widget/AP exact를 확인했고 1쪽 PNG도 직접 확인했다. 이 문단과 상태/예제 파일 목록은 그 회신 뒤 추가한 기록이다.

이는 설계·격리 가능성 판정이다. v3 writer/reader, 실제 CLI·생산 구현, 다른 뷰어 편집은 아직 검증하지 않았다. 다음 단계는 명시된 범위의 생산 구현과 해당 검증이며 자신의 설계에 자체 통과 판정을 대신 붙이지 않는다.


구현 중 추가 검토: 원래 content stream의 순서를 결합한 q/Q 상태 균형을 검사한다. literal/hex string·name·주석은 연산자로 세지 않는다. inline image(BI)는 이 판독 경로가 지원하지 않아 E_LAYOUT으로 거부하고 일반 이미지 XObject는 허용한다. 부모가 이 보수적 제한을 승인했으며 생산 회귀에서 불균형/inline image 거부와 일반 XObject 수용을 확인했다. repeatContexts 단락도 부모가 별도로 읽고 진행 승인했다.
