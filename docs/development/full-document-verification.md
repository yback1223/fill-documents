# 전체 문서 작성 기본값과 검증 결과

검증일: 2026-10-08

## 변경 결과

기존 지원 필드만 입력한 결과를 문서 전체의 완성으로 설명하지 않도록 작업 계약을 수정했다. 스킬은 원본의 본문·표·일반 빈칸·별첨·부록·확인란 전체를 조사하고, 적용 작성란을 모두 채우며, 최종 저장 파일과 전쪽 렌더를 대조한다. 사용자의 명시적 제외와 실제 비해당 사유만 인정한다. 실제 사실이 부족하거나 편집할 수 없는 항목은 미해결 상태로 남기고 후속 작업을 진행한다. 각 칸의 하위 질문·성과·대상 기간·근거와 직원 수 등 상호 참조까지 대조하며, 내용 없는 활동명 나열이나 계획으로 과거 실적 답변을 대신하지 않는다. 가상 예시는 서식에 맞는 일관된 자료를 사용하며 형식별 한 예시를 전달한다.

CLI의 필드 탐지는 전체 작성란 탐지가 아니다. `fieldDiscovery`가 이를 명시하고, `fill`은 `operation: field-fill`로 결과를 반환한다. 선택적 `--coverage`는 준비본 해시·목록 상태 근거·필드 대응의 일관성을 검사한다. 유효한 선언도 `requires-review`이며, `fullDocumentComplete`는 항상 false다. 필드 값을 실제 후보에서 재읽은 검사와 전체 문서의 완성을 구분했다. 기존 필수값·구조 보존·넘침 검사는 유지했다.

## 실제 사례에서 발견한 추가 오류

EISMEA 신청서의 장문 응답에서 탭 정지점 `w:pPr/w:tabs/w:tab`을 가시 탭 문자로 오독해 문단 분할 후 `E_PRESERVATION`이 발생했다. 가시 토큰을 Word run의 직접 자식에서 읽도록 두 파서를 수정했다. 정지점 서식은 삭제하지 않는다. [설계](docx-tabstop-design.md)와 [독립 설계·구현 검토](docx-tabstop-review.md)를 따랐다. 회귀 테스트 보조 도구의 같은 오독도 실제 Word 토큰 구조에 맞게 수정했다.

## 실행한 검사

| 검사 | 명령 | 결과 |
| --- | --- | --- |
| 전체 작성 범위 회귀 | `node --test plugins/fill-documents/skills/fill-documents/tests/coverage.test.mjs` | 작성자가 수정 전 핵심 2개 실패를 확인, 수정 후 전체 범위 검사 통과 |
| 탭 정지점 회귀 수정 전 | `node --test plugins/fill-documents/skills/fill-documents/tests/docx-tabstop.test.mjs` | 3개 중 2개가 실제 E_PRESERVATION으로 실패 |
| 탭 정지점 + XML flow 수정 후 | `node --test plugins/fill-documents/skills/fill-documents/tests/docx-tabstop.test.mjs plugins/fill-documents/skills/fill-documents/tests/xml-flow.test.mjs` | 103개 통과, 종료 0 |
| 최종 전체 테스트 | `npm test` | 282개 통과, 실패·건너뜀 0, 종료 0 |
| 최종 번들·ZIP 생성 | `npm run build` | 30개 구성요소, 스킬·플러그인 ZIP 2개 생성, 종료 0 |
| 최종 ZIP 독립 실행 | `npm run validate` | ZIP 2개, 서식 입력 32회·장문 흐름 8회 통과, 종료 0 |
| 스킬 frontmatter 검사 | `quick_validate.py plugins/fill-documents/skills/fill-documents` | Skill is valid, 종료 0 |

ZIP 검증은 한글이 포함된 별도 경로에서 압축을 풀고, 네트워크와 자식 프로세스 생성을 막은 상태로 수행했다. 지원 필드 범위/완료 상태, coverage의 유효·해시 오류 경로와 PDF 경고 문구도 실제 번들 CLI에서 검사했다. 빌드 메타데이터는 현재 소스 해시와 일치했다.

frontmatter 검사 첫 시도는 검증용 Python에 PyYAML이 없어 실행되지 않았다. 프로젝트 의존성을 변경하지 않고 임시 검증 디렉터리에 도구 의존성을 준비한 뒤 원래 검사기를 성공적으로 실행했다.

## 배포 파일

- `dist/fill-documents-plugin-0.1.0.zip`: SHA-256 `3978995ea40376e34f3e1bb22f52fffd990ef620a49627eb641598186ed39140`
- `dist/fill-documents-skill-0.1.0.zip`: SHA-256 `a6464ae5838d3b739d0c16dd06578d75b07b701826bce787fefaa54c05c60766`

## 판정 범위

소스와 로컬 배포 ZIP의 위 계약을 검증했다. 임의 문서에서 모든 작성란을 자동 탐지하는 기능을 구현한 것은 아니다. 서식별 준비, 미지원 영역의 검증된 별도 편집, 최종 전수 대조는 작성 워크플로의 책임이다. CLI의 성공이나 coverage 선언만으로 완성을 승인하지 않는다.

실제 문서 예시는 별도의 원본 대조·재열기·전쪽 렌더 검수 기록으로 판단한다. 한컴오피스/Microsoft Word 원생 앱 표시, Claude/Codex 호스트 전체 상호작용, 공식 마켓 제출·승인·게시를 이 검사 결과에 포함하지 않는다.
