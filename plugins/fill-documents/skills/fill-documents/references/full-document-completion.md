# 문서 전체 작성과 검수

기본 작업 범위는 문서 전체입니다. 사용자가 명시적으로 제외한 항목 외의 모든 적용 작성란을 채웁니다. CLI가 발견한 표식 수를 전체 작성란 수로 사용하지 않습니다. 이 절차는 작성 에이전트의 책임이며, CLI는 아래 목록의 선언 일관성만 검사합니다.

## 원본 조사와 상태 기록

원본의 모든 페이지를 읽고 본문·일반 빈칸·표·안내 예문의 입력 부분·별첨·부록·서명/확인 영역을 조사합니다. 반복 표는 열과 실제 기록 수도 확인합니다. 고정 안내문·제목·장식 여백은 채울 칸이 아니지만, 페이지별 조사 기록에는 비대상인 이유를 남깁니다. 텍스트 추출에 없는 개체나 표는 렌더와 대조합니다.

각 작성란의 지시문에 포함된 하위 질문, 대상 기간, 필요한 성과·근거·산식을 함께 기록합니다. 문장이 있다는 이유만으로 채움 완료로 판정하지 않습니다. 과거 실적을 요구한 곳에 향후 계획만 쓰거나, 성과·성공 요인·확대 전략을 요구한 곳에 활동명만 나열하면 미완료입니다. 가상 예시는 일관된 가상 성과와 근거까지 작성하고, 실제 자료가 없는 실문서는 필요한 사실을 질문합니다. 전체 직원 수와 명단·투입인력, 총예산과 상세표처럼 서로 참조하는 답도 대조합니다.

| 상태 | 필요한 근거와 처리 |
| --- | --- |
| `filled` | 최종 저장 파일에서 해당 위치의 값이 다시 읽히고 표시가 맞아야 합니다. 입력 JSON 또는 표식 제거만으로 확정하지 않습니다. |
| `explicitly_excluded` | 해당 항목을 작성하지 말라는 사용자의 실제 지시를 연결합니다. 어렵거나 CLI가 지원하지 않는다는 이유는 제외 근거가 아닙니다. |
| `not_applicable` | 원본 적용 조건과 확인된 사실 또는 가상 설정으로 해당 없음이 성립해야 합니다. 서식 규칙에 따라 `해당 없음 — 이유`를 표시하거나 허용된 공란을 유지합니다. |
| `blocked` | 부족한 사실·미지원 편집·미검수·누락 첨부·권한 있는 서명 등 원인과 다음 행동을 기록합니다. 해결 가능한 독립 항목은 계속 작성합니다. |

실제 문서의 성명·등록번호·금액·날짜·승인·서명은 만들지 않습니다. 이미 받은 사실을 재사용하고 필요한 사실만 질문합니다. 가상 예시는 문서에 맞는 한 조직·사업·인물·일정·예산 설정을 사용하고, 모든 곳의 합계와 단위를 맞춥니다. 가상 서명·확인은 법적 효력이 없는 예시임을 표시하며 실제 전자서명 완료처럼 표현하지 않습니다.

작성란이 표식 밖에 있으면 원본을 보존한 준비본에 지원되는 표식을 추가하거나 해당 문서에서 검증된 허용 편집 수단으로 채웁니다. 입력칸을 숨기거나 보존 검사·글자 수 제한을 해제해서 통과시키지 않습니다. 해당 작업을 안전하게 수행할 수 없다면 원래 범위에 `blocked`로 유지합니다.

## 선택적 coverage JSON

`inspect`와 `fill`의 `--coverage FILE.json`은 작성 목록을 읽어 준비본 해시, 상태 근거와 발견 필드의 대응만 검사합니다. 목록의 누락이나 근거의 진실성을 인증하지 않습니다. `manifest.json`의 등록 필드 정의 또는 레이아웃 프로필과 별도 파일입니다.

```json
{
  "version": 1,
  "templateSha256": "<inspect가 반환한 실제 준비본 SHA-256 64자리>",
  "scope": "full",
  "slots": [
    {
      "id": "business.overview",
      "location": "원본 1쪽 / 사업 개요",
      "status": "filled",
      "evidence": { "kind": "fields", "fields": ["overview"] }
    },
    {
      "id": "appendix.budget",
      "location": "원본 5쪽 / 예산 별첨",
      "status": "filled",
      "evidence": { "kind": "external-review", "reference": "최종 표 셀 재읽기·렌더 검수 기록" }
    },
    {
      "id": "approval.signature",
      "location": "원본 2쪽 / 서명",
      "status": "blocked",
      "reason": "권한 있는 당사자의 서명이 필요함",
      "nextAction": "당사자가 서명한 최종 파일을 확인한다."
    }
  ]
}
```

예시 해시와 필드명은 실제 준비본 값으로 바꿉니다. `scope`를 생략하면 `full`입니다. `id`는 중복 없는 비어 있지 않은 문자열, `location`은 원본 위치, `status`는 위 네 상태 중 하나여야 합니다.

- `filled`: `evidence.kind`가 `fields`이면 비어 있지 않은 `fields` 배열을 사용합니다. **발견 필드 전부가 정확히 한 번** 연결되어야 하며 중복·미지·누락 필드를 거부합니다. 한 필드가 문서 여러 곳에 반복되는 경우 그 모든 위치는 작성 목록과 최종 검수 기록에서 추적하되, CLI 필드 연결은 한 번만 둡니다. `external-review`는 비어 있지 않은 `reference`가 필요하며 외부 작업의 선언으로만 집계됩니다. 참조 문자열을 CLI가 열거나 실행하지 않습니다.
- `explicitly_excluded`: `evidence: { "kind": "user-instruction", "reference": "해당 항목 제외를 요청한 실제 사용자 지시" }`가 필요합니다.
- `not_applicable`: `evidence: { "kind": "applicability", "condition": "원본 적용 조건", "reason": "확인된 사실에 따른 비대상 이유" }`가 필요합니다.
- `blocked`: 비어 있지 않은 `reason`과 `nextAction`이 필요합니다.
- `scope: "partial"`: 최상위에 `scopeEvidence: { "kind": "user-instruction", "reference": "부분 작성 요청" }`를 추가합니다. 제외된 항목도 목록에 남기고 결과를 “요청 범위 작성”으로 설명합니다.

목록의 상태는 호출자 선언입니다. 실행 전 `fields` 근거의 `filled`는 의도한 상태이며, 후보의 저장·재읽기 검사 후에만 `fieldVerification`에 반영됩니다. 최종 파일의 실제 값을 확인한 뒤 작성 기록을 확정합니다. 추가 `verified: true` 같은 플래그로 자동 완료를 얻을 수 없습니다. 민감한 사실과 검수 기록은 로컬에 두고 공개 저장소나 지원 로그에 넣지 않습니다. 목록 오류에는 제어된 원인 코드와 슬롯 인덱스만 표시하고 자유 문구를 되풀이하지 않습니다.

이 기능은 부분 필드 채우기를 추가하지 않습니다. 사용자가 기존 CLI 필드를 제외하라고 했더라도 필수값 검사에 공백을 통과시킬 수 없습니다. 제외 영역을 그대로 보존하는 검증된 준비 방법이나 별도 허용 편집이 필요합니다. 반복 행의 행·열 검사와 원본 보존·넘침 검사도 그대로 적용됩니다.

```sh
node "SKILL_DIR/bin/fill-documents.mjs" inspect "/absolute/prepared.docx" --coverage "/absolute/coverage.json"
node "SKILL_DIR/bin/fill-documents.mjs" fill "/absolute/prepared.docx" --data "/absolute/values.json" --output "/absolute/filled.docx" --coverage "/absolute/coverage.json"
```

준비본이 바뀌면 해시와 해당 목록을 재검토합니다. 해시 불일치는 `E_TEMPLATE_CHANGED`, 목록 오류는 `E_COVERAGE`이며 채운 파일을 발행하지 않습니다. 옵션이 없거나 유효한 목록에 미해결 항목이 있어도 지원 필드의 중간 결과는 만들 수 있습니다. 이 파일을 완성본처럼 전달하고 끝내지 않습니다.

## 반환 정보와 최종 인수

| 반환 | 의미 |
| --- | --- |
| `ok: true`, `operation: "field-fill"` | 요청한 필드 처리가 성공했습니다. 전체 작성 완료가 아닙니다. |
| `fieldDiscovery.scope: "explicit-fields"` | `inspect`가 지원되는 명시 필드만 찾았습니다. `fullDocumentInventory`는 false입니다. |
| `completion.status: "incomplete"` | 목록이 없거나 `blocked`가 있습니다. |
| `completion.status: "requires-review"` | 목록 선언과 필드 연결은 일관되지만 원본 전체·최종 파일 대조가 필요합니다. |
| `completion.fullDocumentComplete: false` | CLI는 전체 작성란 탐지·전쪽 렌더 검수를 하지 않으므로 항상 false입니다. |
| `counts.externallyDeclaredFilledSlots` | 외부 작성·검수 선언 수입니다. 자동 검증 수가 아닙니다. |
| `fieldVerification.source: "candidate-reread"` | 기존 adapter가 후보 파일의 필드 값을 재읽었습니다. `verifiedFields`는 발견 필드 수이며 전체 작성란 수가 아닙니다. |
| `validate`의 `operation: "structure-validation"` | 구조 검사만 수행했습니다. `verificationScope`는 `structure-only`입니다. |

`--dry-run`도 후보를 생성·검사하지만 `publication: "not-attempted"`이며 최종 출력 해시가 없습니다. 실제 발행 결과의 `outputSha256`을 원본·준비본 해시와 함께 최종 검수 기록에 연결합니다. 이후 편집하면 새 최종 해시로 영향받은 값과 전쪽 배치를 다시 검수합니다.

최종 인수는 원본 전체 목록과 저장된 결과를 직접 대조해 판단합니다. 모든 적용 항목·반복 기록·첨부를 확인하고, 전쪽 렌더에서 잘림·겹침·공란 양식·잔여 예문을 검사하며, 이름·예산·일정·단위가 일치해야 합니다. 자동 성공·선언 목록·표식 0개 중 어느 것도 이 검수를 대신하지 않습니다.

기본 전달은 형식별 검수된 예시 하나입니다. 비교본은 각 원본과 예시의 모든 페이지에 각각 **원본 템플릿**, **가상 작성 예시**를 눈에 띄게 표시하고 목차·책갈피에서 구분합니다. 표시는 원래 문서 영역을 가리지 않는 바깥 여백에 둡니다. 사용자 요청이 없으면 짧은/긴 중간 버전을 최종 예시로 여러 개 섞지 않습니다.
