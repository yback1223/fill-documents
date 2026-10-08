# DOCX/HWPX flow 독립 구현 검토

검토일: 2026-10-08. 검토자는 생산 구현·기존 테스트 작성에 참여하지 않았다. 설계의 D1/D2, DOCX 기존 fixed/새 AutoFit 구분, HWPX 정확 앵커 패턴을 기준으로 실제 출력 보존과 누락된 거부 조건을 검사했다. 원본·준비본·생산 코드·기존 테스트·Git은 변경하지 않았다. 실험 파일은 `.cache/xml-flow-review/`에만 생성했다.

## 현재 판정

**확인한 X1–X4는 수정됐고, 같은 7개 독립 반례/대조군 재실행이 모두 기대 결과를 반환했다.** 아래 최초 발견 기록은 수정 이유와 검증 이력을 보존한다. 외부 출력의 XML/내용 보존 판정은 통과이며, 실제 렌더 가시성은 별도 근거가 필요하다.

## 최초 판정과 발견 이력

**DOCX는 아래 네 지적을 수정한 뒤 해당 반례 재검증이 필요하다. HWPX의 확인한 XML 변경 범위와 외부 출력 보존은 통과했다.** 이 판정은 원래 앱의 페이지 표시·겹침·가로 잘림 검증을 대신하지 않는다. 전체 XML 테스트 56/56 결과는 전달받았으며 이 검토에서 반복 실행하지 않았다.

최초 반례 실행 시 파일 SHA-256:

| 파일 | SHA-256 |
|---|---|
| `lib/adapters/docx.mjs` | `e59959bca0694f4e563a75d76b15ea891472d997c1200e1537cf195d45db80a7` |
| `lib/adapters/docx-flow.mjs` | `24f3f280d85755d9b05832cb8f356069b3ba01075b5287f95e53a966f0143304` |
| `lib/adapters/hwpx.mjs` | `7b9b3b01b20c20a384ccc2b4822bd4cfd8b57a5791ed05466141a0b8b3000c25` |
| `lib/adapters/hwpx-flow.mjs` | `6a9cfde90b12fd9d440591e7be1fba91617435564878f151b45fd08fdc072f15` |
| `tests/xml-flow.test.mjs` | `b238142f7d1f16204ae0fc104dfda6e297871948a146aa38cff86d86f2fac31d` |

경로는 `plugins/fill-documents/skills/fill-documents/` 기준이다. Node v25.9.0에서 아래 실험을 실행했다.

## X1 · P1 · XML 별칭 속성에서 축소 스타일 상속 검사가 누락됨

`docx-flow.mjs`의 `val`, `stylesFor`는 속성 이름을 `w:val`, `w:styleId` 등 문자열로만 읽었다. Word namespace에 `x`라는 추가 별칭을 선언하고 `<w:rStyle x:val="Risk"/>`로 문자 스타일을 참조하면 실제 `Risk`의 `w:fitText=100`이 적용될 수 있지만 검사는 스타일 미지정으로 취급했다. `w:val="Risk"` 대조군은 `E_LAYOUT/text-compression`, `x:val="Risk"` 반례는 긴 값으로 flow 성공을 반환하고 축소 스타일 참조를 보존했다.

[W3C XML Namespaces](https://www.w3.org/TR/REC-xml-names/)에서 속성의 의미는 namespace URI와 local name으로 결정된다. 이 별칭은 다른 속성이 아니다. 위험 속성뿐 아니라 style/type/width 등 이번 가드가 읽는 Word 속성을 namespace 기준으로 읽거나, 해석하지 못하는 표현을 명시적으로 거부해야 한다. 속성 갱신 시 기존 별칭을 유지하여 같은 namespace 속성을 중복 생성하지 않아야 한다. 이 실험은 축소 설정의 잘못된 허용을 증명하며 실제 렌더 축소량은 측정하지 않았다.

## X2 · P1 · 행별 AutoFit 예외를 기존 fixed 경로가 무시함

`fixedWidth`는 표의 `tblPr/tblLayout=fixed`를 읽자마자 반환했다. 대상 행에 `<w:tblPrEx><w:tblLayout w:type="autofit"/></w:tblPrEx>`가 있는 반례도 flow 성공이고 예외 AutoFit이 그대로 남았다. [Microsoft의 TablePropertyExceptions 설명](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.tablepropertyexceptions?view=openxml-3.0.1)은 이 속성이 해당 행에 표의 `tblPr` 대신 적용된다고 명시한다. 최종 유효 layout이 fixed인 경우만 허용하는 설계 조건과 맞지 않는다.

최소 수정은 행의 layout·폭·배치 예외를 확인하여 지원 밖인 예외를 좁게 거부하는 것이다. 표가 fixed라는 사실만으로 `tblPrEx`를 무시하면 안 된다. 실제 인접 셀의 폭 증가량은 이 구조 실험에서 측정하지 않았다.

## X3 · P2 · 새 trPr 삽입 위치가 CT_Row 순서를 위반함

무해한 음영만 있는 `tblPrEx`와 셀을 가진 행에서 `trPr`가 생략된 경우, `propertyEdit`가 새 `trPr`를 행의 맨 앞에 넣었다. 실제 출력의 자식 순서는 `trPr, tblPrEx, tc, tc`였다. [Microsoft Open-XML-SDK의 스키마 원자료](https://raw.githubusercontent.com/dotnet/Open-XML-SDK/main/data/schemas/schemas_openxmlformats_org_wordprocessingml_2006_main.json)의 `w:CT_Row/w:tr`는 `Sequence(tblPrEx?, trPr?, cell content)`이다. 해당 particle은 `.cache/xml-flow-review/table-row-schema.json`에 저장했다.

기존 예외 뒤, 셀 앞에 삽입해야 한다. 현재 adapter의 XML well-formed 검사만으로 이 순서 위반은 검출되지 않는다. 원래 앱의 문서 복구 안내 발생 여부는 검사하지 않았다.

## X4 · P1 · 세로쓰기 별칭과 본문 section 상속을 잘못 허용함

`risk`와 section 검사에서 수평으로 허용한 `lr`은 [Microsoft TextDirectionValues](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.textdirectionvalues?view=openxml-3.0.1)의 `BottomToTopLeftToRight2010` 값이다. 대상 셀의 `textDirection=lr`은 성공했으며 `tbRl` 대조군만 거부됐다. 수평 별칭은 `tb`이다.

또한 직접/스타일 방향이 없는 최상위 본문 문단에서 부모 section에 `textDirection=tbRl`이 있으면 flow 성공을 반환했다. [Microsoft TextDirection 설명](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.textdirection?view=openxml-3.0.1)은 문단/스타일에 방향이 없을 때 section을 상속한다고 명시한다. 해당 문단에 적용되는 section의 방향까지 검사해야 한다. 무관한 section의 세로쓰기 때문에 문서 전체를 거부하는 방식은 피해야 한다. 이 지적 역시 지원 밖 방향의 허용에 관한 것으로, 렌더 잘림 발생을 추정해 보고하지 않는다.

## 실제 외부 출력 보존 검사

`외부양식-장문테스트-20261008/02-준비본`과 `04-결과/*-flow.*`, `03-입력값`을 독립 Python `zipfile`/`ElementTree`로 비교했다. 변경 허용 범위만 정규화한 전체 XML 트리, 모든 문단의 예상 치환 텍스트, 나머지 ZIP entry의 실제 bytes를 검사했다. 대상 문단 안의 run 텍스트/줄바꿈은 전체 문단 exact 검사와 run 서식 구조 검사를 조합했다. XML prefix와 속성 순서의 byte 비교가 아닌 namespace 기준 구조 비교임을 구분한다.

| 출력 | 실제 검사 결과 |
|---|---|
| DOCX short/long | 각각 901개 문단 전체 치환값 exact. 대상 3문단/3행의 텍스트·keepNext/keepLines·cantSplit·허용 높이 외 구조 변화 없음. 모든 `tblPr/tblGrid/tcPr` 구조 보존. ZIP 변경 entry는 `word/document.xml` 하나. |
| HWPX short/long | 각각 2450개 문단 전체 치환값 exact. 대상 5문단의 텍스트/캐시, 앵커 1문단 캐시, 선택 표의 `treatAsChar` 외 구조 변화 없음. width·cellSz·span·테두리·비대상 내용 보존. ZIP 변경 entry는 `Contents/section0.xml` 하나. header·그림 등 나머지 entry bytes 동일. |

준비 DOCX SHA-256은 `8ce7a14c23e7ccf519efb3526cd77f35d48658a516eae0e1a7c36bd1f0d5e1a3`, 준비 HWPX는 `06492e1fec87ddffe074f01c2f2ae2aff0ebf95db4756707f70246d456be7e50`이다. 출력별 SHA-256과 문단/행/표 index는 `.cache/xml-flow-review/external-audit-results.json`에 있다.

## 실행 및 제한

다음 명령은 모두 종료 코드 0이었다. 첫 두 명령의 0은 실험 실행 완료이며 지적한 입력이 올바르게 거부됐다는 뜻이 아니다.

```sh
node .cache/xml-flow-review/probes.mjs
node .cache/xml-flow-review/vertical-probes.mjs
python3 .cache/xml-flow-review/audit-external.py
```

공식 스키마는 Python 표준 `urllib.request`로 읽고 TableRow particle만 추출했다. 외부 저장소의 Git 작업은 하지 않았다. 이 검토는 UI 자동화·렌더 실행·원래 한컴/Word 앱 검수·배포를 수행하지 않았다. 따라서 HWPX 기존 잘림의 실제 해소, 모든 페이지 겹침 부재, 긴 무공백 문자열의 가로 가시성은 별도 렌더 검증 근거가 필요하다.

## 수정 후 독립 재검증

생산 수정은 별도 구현 담당자가 수행했다. 검토자는 수정 코드를 읽고 처음 사용한 `.cache` 반례 스크립트 두 개를 다시 실행했다. 최초 결과는 `probe-results-before.json`, `vertical-results-before.json`과 `before/`에 보존했으며 현재 결과는 `probe-results.json`, `vertical-results.json`이다.

검토한 수정본 SHA-256:

- `docx-flow.mjs`: `0a06b7779ed3cff60894ac4a6a978f620c4a1ffede9457ed3c460c5e9eda4030`
- `xml-flow.test.mjs`: `ad7d8af5c54ab045f5df37a877141e23ba5908e6a004c767ea0b9a61d39b756a`
- 나머지 세 adapter 파일은 위 최초 해시와 동일하다.

| 지적 | 직접 재실행 결과 | 판정 |
|---|---|---|
| X1 | `w:val`과 동등한 `x:val` 문자 스타일 모두 `E_LAYOUT/text-compression`. Word 속성 읽기를 namespace URI/local name으로 통일하고 갱신 시 기존 QName을 유지하는 것을 코드에서 확인. | 해결 |
| X2 | 대상 행의 `tblPrEx/tblLayout=autofit`이 `E_LAYOUT/unsupported-row-exception`. 허용되는 외관 예외만 별도 보존. | 해결 |
| X3 | 음영 예외를 보존하면서 출력 자식 순서가 `tblPrEx, trPr, tc, tc`. | 해결 |
| X4 | `lr`, `tbRl` 대상 셀 및 세로쓰기 section을 상속하는 본문이 모두 `E_LAYOUT/vertical-text`. 문단 자신이 가진 section 정의도 찾도록 변경됨. | 해결 |

수정 테스트에는 별칭으로 쓰인 기본 스타일/폭/section 크기, 안전한 별칭 속성 갱신, 위험/무해한 행 예외, 수평 `lrTb/tb`와 세로 방향들, 대상 section 및 무관한 뒤 section의 구분이 추가됐다. 전체 XML 86/86은 구현자의 실행 보고이며 검토자의 독립 재실행 수치와 섞지 않는다. 검토자가 실행한 7개 원래 사례에 대한 별도 Python assertion도 종료 코드 0이었다.

최종 코드에 이전 외부 출력 검증을 적용할 수 있는지도 별도로 확인했다. `node .cache/xml-flow-review/recheck-external.mjs`로 준비 DOCX/HWPX와 short/long JSON 네 조합을 현재 adapter로 메모리 재생성했다. 네 결과 모두 기존 검증 출력과 ZIP entry 이름 집합 및 **모든 entry의 해제 bytes가 동일**했고 명령 종료 코드 0이었다. 전체 ZIP 파일 SHA-256까지 같다는 주장은 하지 않는다. 재생성 결과와 기존 ZIP 전체 해시는 달랐으며 결과는 `external-recheck-results.json`에 분리해 기록했다. 따라서 위 전체 문단 exact/허용 XML 변경/비대상 entry 보존 근거는 이 수정본의 외부 네 조합에도 유효하다.

확인한 범위에는 미해결 구현 지적이 없다. 원래 앱의 열기·인쇄, DOCX/HWPX 실제 전체 페이지 가시성·겹침·수평 넘침은 이 검토자의 실행 범위 밖이다. 별도 렌더 작업의 결과를 이 문서의 구조 검증과 합쳐 최종 인수 판단해야 한다.
