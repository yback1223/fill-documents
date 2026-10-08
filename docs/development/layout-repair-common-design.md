# 서식 유지 수정 공통 계약

2026-10-08. 사용자의 기존 형식 유지/확장과 문서 목적에 맞춘 재시험 요구에 따른 공통 변경. 실제 서식의 국소 영역만 명시적으로 확장하며 기존 preserve 기본값은 유지한다.

## 입력과 API

- `fillDocument({ ..., layoutProfile })`, `inspectFile(path, skillRoot, { layoutProfile })`. CLI의 `fill`과 `inspect`에서 `--layout-profile FILE.json`을 추가한다. 새 옵션 없는 기존 호출은 그대로다.
- 프로필은 JSON plain object이며 공통 필수 값은 `version: 1`, `format: 'hwpx' | 'pdf'`, `templateSha256: 64자리 소문자 hex`이다. 원본/준비본의 현재 SHA-256과 일치해야 한다. 형식과 해시 불일치는 입력 변경/지원 오류로 종료한다. 함수/실행 문법은 받지 않는다.
- HWPX/PDF adapter가 각자의 허용 키와 중첩 스키마, 파일 내부 대상·좌표·구조를 검증한다. 다른 형식에 프로필을 조용히 무시하지 않는다.
- `flow` 이외의 채우기에 프로필을 지정하면 오류다. inspect는 프로필 구조를 읽어 필드를 안내할 수 있다. validate는 출력 파일의 저장 구조를 검증하며 원본 프로필의 hash를 출력 hash와 비교하지 않는다.
- 이번에는 등록 manifest에 새 프로필을 저장하는 기능을 추가하지 않는다. HWPX rows 프로필은 파일 경로+프로필 흐름만 지원하고 등록 ID와의 조합은 명시적 E_UNSUPPORTED로 안내한다. 기존 scalar manifest의 필수값/길이 제한을 프로필이 우회하게 만들지 않는다. PDF는 기존 필드 목록이 같으므로 동일 해시 등록 원본+명시 프로필을 허용하며 원래 manifest 대조를 유지한다.

## rows 입력

- 기존 text/checkbox 계약에 `rows` 필드를 추가한다. HWPX 프로필이 지정한 단일 반복 영역을 inspect가 `{ name, type:'rows', occurrences:1, maxRows, columns:[{name,type:'text',maxLength}] }`로 반환한다.
- 1~100행, 1~30열을 허용한다. 이름/중복/금지 이름 검사는 기존 규칙을 재사용한다. 모든 열은 필수 text이며 공란·제어문자·각 열 maxLength(1~10000 code point)를 검사한다. 비객체 행, 알 수 없는 열, 중첩 rows, checkbox 열은 받지 않는다.
- 입력은 `{ groupName: [{ columnName: '내용', ... }, ...], otherField: '내용' }`이다. 반복 영역 총 문자 수는 500,000 이하. 검증 후 새 null-prototype 객체로 복사하며 원 입력을 수정하지 않는다.
- 기존 일반 필드와 그룹 이름/열 이름이 혼동되지 않도록 반복 영역의 실제 scalar 표식은 adapter.inspect에서 감추고 그룹 하나로 노출한다. 반복 외부의 scalar 필드는 유지한다.
- 등록 manifest 비교는 기존 scalar 동작을 보존한다. rows 선언을 비교한다면 열 이름·type·발생 수·maxRows 구조까지 일치해야 한다. 기존 manifest를 자동 변경하지 않는다.

## 저장과 검증

- 기존 원본/기존 출력 덮어쓰기 금지, 새 경로 저장, 원본 변경 감지, dry-run의 전체 후보 생성·검증을 유지한다.
- `layoutProfile`이 없어도 HWP/DOCX 일반 흐름은 작동한다. PDF overflow는 새 명시 프로필을 요구하며 옛 범용 A4 별지는 더 이상 생성하지 않는다. 과거 v2 출력의 읽기·검증은 유지한다.
- 공통 회귀: 기존 scalar 입력, 올바른/잘못된 rows 입력, 불일치 프로필 형식/hash/version, dry-run 무파일, 새 프로필의 CLI 실행과 실제 후보 재읽기를 확인한다. 서식 품질은 실제 저장 결과 페이지 전체 렌더로 별도 검수한다.

생산 구현 전 독립 검토 대상. 이 문서는 구현·품질 합격을 뜻하지 않는다.
