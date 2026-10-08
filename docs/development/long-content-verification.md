> 후속 재검증: 이 기록의 구조 검사 통과는 실제 서식 품질 합격을 의미하지 않습니다. 사용자가 지적한 표 분할·문단/항목 연결·PDF 별지 문제는 [서식 유지 재검증](layout-repair-verification.md)에서 수정·재판정했습니다.

# 외부 양식·장문 채우기 검증

검증일: 2026-10-08. macOS arm64, Node v25.9.0. 이 기록은 로컬 구현·테스트 결과이며 마켓 등록, 원격 게시, 모든 OS/원본 앱/호스트 대화의 동작 승인이 아니다.

## 최종 동작

`fill --overflow flow`는 지원되는 문단/표의 흐름을 허용하거나 PDF 별지를 추가한다. 기본 `preserve`는 기존 배치 정책을 유지한다. `--dry-run`도 메모리에서 후보 생성·내용/보존 검사를 실행하고 게시만 생략한다. 글자 수 제한은 유지하며 잘라내기·자동 축소로 성공을 만들지 않는다.

- DOCX: 선택 문단/행의 분할 제한, exact 높이를 조정한다. 기존 fixed의 가로 속성은 유지한다. AutoFit의 제한된 전환, 직접·상속 압축/줄바꿈 금지·세로쓰기·행 배치 예외 가드를 적용한다.
- HWPX: 검증된 수평 표의 앵커 패턴에서만 inline을 해제하고 선택/앵커 문단의 캐시를 갱신한다. 필요시 공유 문단 스타일을 복제한다.
- HWP: 균일 서식의 최상위 본문만 native 재배치하고 허용된 BodyText 차이를 원본 CFB에 이식한다. FileHeader와 최종 raw DocInfo는 보존한다. 압축 해제 내용이 완전히 같은 DocInfo의 압축 표현 차이만 허용한다. 정확한 중립 Scripts 외에는 거부한다.
- PDF: 원래 칸에 별지 참조를 저장하고, 추가 페이지에 원문 substring을 한 줄 단위의 실제 필드로 보관한다. v2 매핑·원문 해시·기본 appearance 재생성·폰트 크기·영역·순서를 검사한다. 빈 서명과 원래 페이지는 유지한다. 실제 서명/활성 콘텐츠는 거부한다.

## 외부 양식 결과

모두 가상 데이터로 선택 영역만 채웠다. 대표 장문은 6,596자, 시작 표식·001~080번 항목·끝 표식으로 구성했다. 다운로드 원본 4개는 SHA-256 동일성을 재확인했다. HWP의 원본 5쪽과 준비본 6쪽을 구분한다.

| 형식 | 원본/준비 | 짧은 값 | 장문 | 별도 표시 근거 |
|---|---:|---:|---:|---|
| HWP | 5 / 6쪽 | 6쪽 | 10쪽 | rhwp 전체 텍스트 좌표, 끝 표식 5쪽, 대표 PNG |
| HWPX | 18 / 18쪽 | 18쪽 | 33쪽 | rhwp 전체 텍스트 좌표, 001~080 확인, 끝 표식 21쪽, 대표 PNG |
| DOCX | 28 / 28쪽 | 28쪽 | 31쪽 | LibreOffice PDF, 전체 단어 좌표가 페이지 내부, 001~080/끝 표식 19쪽 |
| PDF | 2 / 원본 사용 | 2쪽 | 6쪽 | Poppler 단어 좌표가 페이지 내부, 162개 청크 exact, 끝 표식 6쪽, 대표 PNG |

HWPX 기존 경로는 장문을 저장해도 18쪽을 유지했고 7쪽에 페이지 밖 텍스트 좌표 4,624개가 있었다. 번호 표식은 001~005만 페이지 안에 있었고 끝 표식은 밖이었다. flow는 그 표를 이어지게 했다. DOCX 원본은 기존 경로에서도 31쪽으로 늘어났으므로 새 기능만의 성과라고 주장하지 않는다.

HWP는 아이템명 및 한 본문 문단을 준비했다. 원본의 빈 문단은 3pt여서 원본에 있던 12pt 글자 정의를 그 문단에만 지정했다. DOCX는 `Insert text` 3곳, HWPX는 한 행의 5개 셀에 명시적 표식을 넣었다. PDF는 기존 13개 텍스트 필드와 빈 서명 2개를 사용했다. 일반 빈칸 자동 추론이나 완성된 지원서 제출 시험은 아니다.

## 실제 명령과 독립 검토

- `npm test`: 168개 통과, 실패 0, 종료 코드 0.
- `npm run build`: 로컬 번들/스킬 ZIP/플러그인 ZIP 재생성, 종료 코드 0.
- `npm run validate`: 두 ZIP을 각각 추출하고 네트워크 및 자식 프로세스 실행을 차단한 상태에서 기본 서식 32건, 장문 flow 8건 통과. dry-run 무게시 및 출력·원본 해시 확인. 종료 코드 0.
- 외부 자료의 `scripts/run-flow.mjs`: 형식별 short/long 후보 생성·게시·재검사. `render-hancom.mjs`, `render-docx.py`, `render-pdf.py`, `audit-rendered.py`, `audit-final.py`로 별도 렌더/좌표/해시 검사.
- [독립 설계 및 HWP 검토](long-content-review.md), [PDF 구현 검토](pdf-flow-implementation-review.md), [DOCX/HWPX 구현 검토](xml-flow-implementation-review.md).

독립 검토에서 발견한 DOCX namespace 별칭, 행 예외/자식 순서, 세로쓰기 상속과 PDF SigFlags=0 및 기본 appearance 재생성 문제를 수정하고 원래 반례를 재실행했다. PDF에서는 기본 재생성 후에도 긴 무공백 문자열과 CRLF/빈줄 원문이 exact이며 실제 비어 있지 않은 줄이 영역 안에 있음을 확인했다. HWP는 압축 trailer 변조·다른 해제 내용·초과 크기와 허용되지 않은 레코드 차이를 거부하는 회귀를 포함한다.

외부 DOCX/HWPX short/long 4개는 독립적으로 문단 901/2450개 전체 exact 및 허용 변경 밖의 구조 보존을 대조했다. 최종 코드로 재생성한 모든 ZIP entry의 해제 데이터가 같은지도 확인했다. 한컴 좌표 검사는 실제 글꼴의 모든 glyph 경계/겹침 검사를 대신하지 않으므로 대표 페이지 시각 검토와 구분한다.

## 원본 출처

- [WICT 공모전 안내](https://wictcon.com/guide), 사업계획서/Business Model Canvas HWP. SHA-256 `6bf4e5f85bc34c7076e07a164283fe37fae504f5ae9883eb6c9a40940f0aff14`.
- [고용노동부 자료실](https://moel.go.kr/policy/policydata/view.do?bbs_seq=20260100025), 사업실적 및 사업계획 제출 양식 HWPX. SHA-256 `bb7215e1878b41349fd5ddc9c4fc32cb93f0d257cd576201285b30eb5547400e`.
- [EISMEA 공고](https://eismea.ec.europa.eu/funding-opportunities/calls-proposals/framework-partnership-agreement-representation-smes-consumers-environmental-interests-and-social_en), Application Form DOCX. SHA-256 `c0bd1c61dfff048473d967bbf241b4cba24fe8dcd9d9d0790bce941716aca10d`.
- [FEMA ICS Forms](https://training.fema.gov/emiweb/is/icsresource/icsforms/), ICS Form 213 General Message v3 PDF. 원본 전체 해시와 다운로드 URL은 로컬 `00-출처/downloads.json`에 기록했다.

외부 원본·입력값·결과·10쪽 PDF 보고서는 별도 로컬 `외부양식-장문테스트-20261008` 폴더에 있으며 공개 프로젝트/배포 ZIP에 포함하지 않았다. 자체 MIT 라이선스는 외부 원본에 적용하지 않는다.

## 미검증 및 지원 제외

실제 한컴·Word 앱, Windows/Linux, Claude/Codex 호스트의 대화 실행은 미검증이다. 본문/표의 렌더는 대체 글꼴과 렌더러에 따라 달라질 수 있다. HWP 표 셀/혼합 서식, 임의 HWPX 앵커, 스캔/일반 PDF 본문, 반복 업무 행 생성, 이미 별지가 붙은 PDF의 재채우기는 포함하지 않는다. 기관별 쪽수·문자 수·제출 규칙도 별도로 확인해야 한다.
