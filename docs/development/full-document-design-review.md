# 전체 문서 작성 설계 독립 검토

검토일: 2026-10-08. 검토자는 설계·생산 코드를 작성하거나 수정하지 않았다. 이 기록만 배정된 경로에 작성했다.

## 대상과 판정

- 대상: `docs/development/full-document-architecture.md`
- 현재 검토한 SHA-256: `111aa5cb8e4e40bbf3a7206017048f9c9036ca10584dece568161af77bda526c`
- 판정: **진행 가능**
- 적용 범위: 전체 문서 조사·상태 관리 워크플로, 최소 coverage 계약, engine/CLI 연결, 사용자 노출 문구와 패키지 회귀 검사의 구현. 현재 설계에서 막히는 구현 범위는 없다.
- 최초 검토 해시 `4d0be0a3ce7cc25d796f12b37c225c8888d8a188d3560e2597b4f876bebd23c5`에서는 R1로 `수정 후 재검토`였다. 수정본의 7.3과 T12를 직접 읽어 반영을 확인했으며 R1을 설계 수준에서 닫았다. 실제 코드 수정·회귀 통과를 확인했다는 의미는 아니다.

원래 요구는 부모가 제공한 사용자 요구, 즉 사용자가 명시적으로 제외한 곳 외에는 문서 전체를 작성하고 HWP/HWPX/DOCX/PDF마다 완전히 작성된 예시 하나를 제공하는 것이다. 이번 검토는 그 요구와 대상 설계를 실제 소스에 대조했다. 네 최종 예시의 내용·렌더 품질을 인수 검수한 것은 아니다.

## 실제 확인 근거

| 기준 파일 | SHA-256 | 확인한 범위 |
| --- | --- | --- |
| `plugins/fill-documents/skills/fill-documents/lib/engine.mjs` | `83b65d38328dbe313272910bbcd0f2b833e9d2c4f5e3226113f6172d2dfbd486` | 전체. 지원 필드 검사, 후보 검증, 원본 재해시, 발행과 dry-run 분기 |
| `plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs` | `c74edba86476a4bf9a4e8d7bec481936843cd451434c854a5e12f7d121785fd6` | 전체. vendor 우선 로딩, 명령 응답, `ok`와 오류 코드 |
| `plugins/fill-documents/skills/fill-documents/SKILL.md` | `406616106e81538ea83fdbbd9419ae2fe319e9d4608b8b096cf6d7363fa3001c` | 전체. 필드 중심 워크플로와 생성 성공 표현 |
| `plugins/fill-documents/skills/fill-documents/lib/adapters/pdf.mjs` | `3d2f5aad97166df34d327ae05759999c63fd6666add255cc5e1668e3cac436bc` | 필드 발견, 서명 제외, 완료 경고, 저장 후 값 검사와 validate 경로 |
| `scripts/validate-package.mjs` | `8573c613bc9eebeb955697d8f31268c8116d77b1ba03aa0f7e812ce1801861b9` | 전체. 소스 해시, 두 배포 ZIP의 실제 CLI 호출, dry-run과 발행 검증 |

추가로 `lib/fields.mjs`, `lib/io.mjs`, DOCX/HWPX/HWP adapter의 발견·값 대조 경로, 기존 core/office-pdf 테스트의 관련 부분, `references/layout-profiles.md:74–82`를 읽었다. `fields.mjs:31–46`의 필수값 검사는 이미 발견된 필드에만 적용된다. DOCX의 표식 탐색, HWP의 최상위 문단 제한, PDF의 서명 필드 제외도 설계가 설명한 제한과 일치한다.

실제로 실행한 읽기 전용 재현 명령:

```sh
node fill-documents/plugins/fill-documents/skills/fill-documents/bin/fill-documents.mjs inspect fill-documents/tmp/pdf-layout-repair/production-builder-regenerated.pdf
```

종료 코드 `0`, `ok: true`, continuation 정보와 함께 `별지가 있는 완성 PDF입니다. 다시 채우려면 원본 서식을 사용하세요.` 경고를 반환했다. 입력 PDF 해시는 `0d957de38ca0a009687679ab43f98c471380f9428abd79e5547e355bd73faeb0`이다. 이 실행은 경고 경로의 존재를 확인한 것이며 해당 PDF의 모든 업무 항목이 미완성이라는 판단이나 전체 페이지 검수를 뜻하지 않는다.

`nl`, `sed`, `rg`, `shasum -a 256`으로 원문·위치·해시를 확인했다. 새 테스트, 빌드, 네 예시의 재작성·렌더 검수, 배포는 실행하지 않았다. Git 및 Computer Use는 사용하지 않았다.

## 우선순위별 지적

### R1 — P1, 설계 반영으로 해소: 기존 PDF 경고가 전체 완료 계약을 우회한다

- 위치: 설계 `5.3`의 145–152행, 구현 범위 `7`의 169–174행, `lib/adapters/pdf.mjs:223–230`, `references/layout-profiles.md:78`.
- 상황과 반례: 본문 필드에 이어쓰기가 발생한 PDF가 정적 미작성 칸 또는 처리되지 않은 서명 영역을 남긴 채 저장될 수 있다. `inspect`는 continuation 메타데이터가 있다는 이유만으로 이를 “완성 PDF”라고 부른다. 새 설계대로 `completion.fullDocumentComplete: false`를 추가해도 기존 경고를 유지하면 같은 응답이 전체 미확인과 완성을 동시에 표현한다. 위 CLI 실행으로 현재 경고가 실제 출력됨을 확인했다.
- 요구 근거: FD2는 필드 처리 성공과 전체 완성을 분리한다. 설계 5.3은 CLI가 `complete`를 발급하지 않는다고 규정한다. 현재 7장의 필수 수정 목록은 coverage, engine/CLI, SKILL/formats에 집중되어 이 adapter 경고와 관련 안내 문구를 명시하지 않는다.
- 영향: `ok`나 경고를 자연어로 요약하는 호출자가 사용자에게 미검수 결과를 다시 완성본으로 전달할 수 있다. 이번 과업에서 고치려는 오판이 다른 출력 경로로 남는다.
- 구체적 수정: 설계의 구현 범위에 CLI/adapter/연결 안내의 전체 완료 표현 검색과 교정을 넣는다. PDF 경고는 예를 들어 “이어쓰기 페이지가 생성된 PDF입니다. 다시 채우려면 원본 서식을 사용하세요.”로 한정한다. `references/layout-profiles.md`의 같은 표현도 “생성된 PDF” 등으로 맞춘다. adapter 편집 기능을 확대할 필요는 없다.
- 검증: 정적 미작성 항목 또는 빈 서명 필드가 있는 continuation PDF를 `inspect`하고, 완료 상태와 모든 사용자 노출 경고가 전체 완성을 주장하지 않는지 대조한다. 소스 실행과 두 배포 ZIP 실행 모두 확인한다. JSON 완료 필드만 검사하면 이 반례를 놓친다.
- 재검토 결과: 수정본 `full-document-architecture.md:172`가 CLI와 모든 adapter의 사용자 표시 문구 검사, PDF 경고 교정, 완료 정보와의 일관성을 구현 범위로 지정했다. `:194`의 T12가 생성된 이어쓰기 PDF의 실제 inspect 회귀를 명시한다. 기존 T11 및 7.6의 배포 ZIP 검사와 연결되므로 설계 수준에서 해소됐다. 관련 `layout-profiles.md` 안내도 구현 중 함께 정리한다. 실제 문자열 교정과 회귀 통과는 이후 구현 검증에서 별도로 확인한다.

## 차단하지 않는 판단과 구현 조건

1. **최소 구조는 타당하다.** 별도 서비스나 자동 전칸 탐지 엔진 없이 작은 일관성 검사기와 기존 adapter를 유지한다. 자동 검증의 한계를 좁게 표시하고 실제 원본 조사를 스킬 책임으로 두므로 이번 요구에 비해 과도한 구조가 아니다.
2. **`ok: true`와 미완료는 양립할 수 있다.** `ok`를 명령/필드 처리 성공으로 고정하고 모든 명령의 완료 범위를 함께 전달하면 모순이 아니다. 목록 없음·blocked는 `incomplete`, 선언이 일관돼도 `requires-review`, 두 경우 모두 전체 완료 false라는 계약은 임의 목록 축소·가짜 제외 선언이 자동 완료로 승격되는 것을 막는다. 목록의 진실성을 검증했다는 의미로 해석해서는 안 된다.
3. **사실 미확인과 미지원 영역을 남길 수 있어야 한다.** 설계의 blocked 정책은 올바르다. 이것은 최종 예시를 미완성으로 끝내도 된다는 승인과 다르다. 네 최종 예시는 실제 원본·최종 해시·전체 항목·렌더 결과가 연결된 별도 증거가 필요하다.
4. **실패 순서를 정확히 구현한다.** 6장의 “adapter 실행 전”은 단계 구분이 필요하다. 버전·해시·객체 구조는 `adapter.inspect` 전에, 발견 필드와의 대응 검사는 inspect 뒤이되 `adapter.fill`과 발행 전에 수행한다. `engine.mjs:39–41`에서 adapter만이 실제 발견 필드를 반환하므로 모든 대응 검사를 inspect보다 먼저 할 수는 없다. 이는 설명의 정밀화이며 새 계층을 추가할 이유가 아니다.
5. **dry-run의 근거 범위를 유지한다.** `engine.mjs:88`의 dry-run은 후보만 검증하고 발행하지 않는다. 후보 필드 재읽기 수를 제공하더라도 발행된 최종 파일의 검수나 외부 검수 완료로 표시하지 않아야 한다. 출력 파일 재읽기와 해시 연결은 실제 발행·최종 검수 단계에서만 성립한다.
6. **사용자 작성 문자열을 안전한 로그라고 가정하지 않는다.** 설계 6장의 자유 형식 location/reason에는 민감한 내용이 들어갈 수 있다. 정상 완료 정보와 오류 로그의 노출 범위를 구분하고 오류 로그에는 통제된 원인 코드·안전한 식별자만 사용하는 방향이 적절하다. 이 검토는 운영 보안 전체 검증이 아니다.

## 재검토 범위

현재 수정본의 R1 관련 범위 재검토는 끝났다. 원본 전쪽 조사·명시적 제외·해당 없음의 사실 근거·외부 검수 선언 분리·최종 해시 연결이라는 핵심 계약이 구현 중 바뀌면 그 부분을 다시 검토한다. 이 판정은 구현 완료, 네 예시의 인수 통과, 운영 보안·성능 검증 또는 배포 승인이 아니다.
