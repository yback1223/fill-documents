# 양식별 확장 프로필

프로필은 원본 파일의 SHA-256과 실제 입력 영역을 연결하는 JSON입니다. 임의 양식을 자동으로 이해하거나 기관의 제출 규정을 판단하는 기능이 아닙니다. 원본을 검토한 뒤, 새 페이지에도 유지해야 할 제목·열·문맥과 입력 범위를 지정합니다. 원본이 바뀌면 해시만 교체하지 말고 영역을 다시 확인하세요.

```sh
node SKILL_DIR/bin/fill-documents.mjs inspect template.hwpx --layout-profile profile.json
node SKILL_DIR/bin/fill-documents.mjs fill template.hwpx --layout-profile profile.json --overflow flow --data values.json --output completed.hwpx
```

`--dry-run`도 동일한 후보 생성과 검사를 수행합니다. 프로필은 `flow`와 함께 사용하며 입력 형식과 해시가 달라지면 거부합니다. 알려지지 않은 키를 무시하지 않습니다. 프로필의 좌표는 정적 잉크와 겹치지 않는지 별도로 렌더 검수해야 합니다.

## HWPX 반복 업무행

```json
{
  "version": 1,
  "format": "hwpx",
  "templateSha256": "현재 준비본의 소문자 SHA-256 64자리",
  "repeatRegions": [{
    "name": "activity_rows",
    "part": "Contents/section0.xml",
    "tableId": "실제 표의 고유 id",
    "headerRows": [0, 1, 2, 3, 4],
    "bodyRows": {"start": 5, "end": 30},
    "prototypeRow": 6,
    "insertBeforeRow": 30,
    "maxRows": 100,
    "columns": [
      {"name": "period", "column": 0, "maxLength": 10000},
      {"name": "location", "column": 1, "maxLength": 10000},
      {"name": "participants", "column": 2, "maxLength": 10000},
      {"name": "budget", "column": 3, "maxLength": 10000},
      {"name": "activities", "column": 4, "maxLength": 10000}
    ]
  }]
}
```

위 수치와 열 이름은 예시이며 다른 문서에 그대로 사용할 수 없습니다. 한 프로필에 반복 영역 하나를 지원합니다. 단일 업무행으로 줄일 때 원래 첫 행의 위쪽 선과 마지막 행의 아래쪽 선을 함께 보존할 수 없으면 거부합니다. 행 인덱스는 0부터 시작하며 `bodyRows.end`를 포함합니다. 제목행은 0부터 연속하고 바로 뒤에서 업무행이 시작해야 합니다. 첫 업무행에는 열마다 정확한 `{{열이름}}` 표식을 넣고, 나머지 업무행은 비워 둡니다. 중간 복제행과 마지막 경계행을 구별할 수 있도록 업무행 범위는 최소 3행이어야 합니다. 열 병합·세로 병합·중첩 표·복합 개체가 있는 업무 셀은 지원하지 않습니다.

```json
{
  "activity_rows": [
    {"period":"2027.01", "location":"가상 교육실", "participants":"24명", "budget":"1,200", "activities":"참여자 사전 면담과 교육 수준 진단을 실시한다."},
    {"period":"2027.02", "location":"가상 교육실", "participants":"24명", "budget":"1,800", "activities":"문서 작성 실습과 소그룹 피드백을 진행한다."}
  ]
}
```

각 객체가 업무 한 건입니다. 문자열 내 개행은 같은 업무의 설명이며 새 업무로 추정하지 않습니다. 열은 모두 필수 문자열이고, 행 수는 프로필 최대 100행 이내, 열은 최대 30개, 각 값은 최대 10,000자, 반복 입력 전체는 최대 500,000자입니다. 이것은 페이지 용량 보장이 아닙니다. 한 업무가 렌더 후 여러 페이지에 걸치면 출력하지 않습니다.

기존 첫·중간·마지막 행의 역할에 맞춰 재사용/복제하고 남는 빈 행을 제거합니다. 글꼴·열 폭을 줄이지 않으며 연속 제목행을 반복합니다. 반복 영역 밖의 일반 표식은 독립 필드로 남습니다. 이 버전의 HWPX 반복 프로필은 파일 경로로만 사용하며 등록 ID와 함께 사용하지 않습니다.

## PDF 원래 양식 이어쓰기

```json
{
  "version": 1,
  "format": "pdf",
  "templateSha256": "현재 원본의 소문자 SHA-256 64자리",
  "continuations": [{
    "field": "message",
    "sourcePage": 1,
    "repeatFields": ["incident", "recipient", "date"],
    "label": "Message continued",
    "labelBox": {"x":36,"y":766,"width":540,"height":16},
    "sourceFooterBox": {"x":36,"y":28,"width":540,"height":16},
    "footer": "Approval and reply apply on original form page 1.",
    "footerBox": {"x":36,"y":28,"width":540,"height":16}
  }]
}
```

필드 키는 `inspect`가 반환한 입력 키입니다. 페이지는 1부터 시작합니다. 좌표는 PDF의 왼쪽 아래를 원점으로 하는 pt 단위이며 이 예시는 Letter 크기를 가정합니다. 실제 서식의 머리말·꼬리말·서명·설명문 위치를 보고 안전한 여백을 정하세요. 자동 검사는 위젯과 표시 상자의 교차를 거부하지만 모든 정적 선·문구를 해석하지는 않습니다.

원래 칸을 먼저 채우고 남은 원문을 같은 정적 양식의 추가 페이지에 이어 씁니다. 원래 설명 페이지의 순서는 유지하며 추가 페이지는 문서 끝에 놓습니다. 첫쪽에는 실제 이어지는 페이지를 안내합니다. 추가 페이지마다 본문 필드는 하나이며 원래 본문 크기와 글자 크기를 유지합니다. 명시한 문맥만 반복하고 승인·회신·서명 필드를 임의로 복제하지 않습니다.

반복 문맥은 정적 표시입니다. 생성된 PDF의 원래 문맥을 수동 수정해도 새 페이지로 자동 동기화되지 않습니다. 검증 시 불일치를 거부하므로 원본과 수정한 입력 JSON으로 다시 생성하세요. 기본 appearance 재생성과 원문 연결은 검사하지만 모든 PDF 앱의 편집 줄바꿈을 보장하지 않습니다. 새 페이지의 접근성 구조 태그는 추가하지 않습니다.

원래 페이지의 그래픽 상태(q/Q)가 균형 잡혀 있어야 합니다. inline image(BI) 데이터는 안전하게 판독하지 못해 이어쓰기 배경으로 거부합니다. 일반 이미지 XObject는 지원합니다.

프로필 없는 넘침, 긴 무공백 토큰의 폭 초과, 부족한 안내 공간 등은 `E_LAYOUT`입니다. 원문을 자동 요약하거나 폰트를 축소하지 않습니다. 이전 v2 이어쓰기 결과의 읽기/검증은 유지하며 새 결과는 v3 매핑을 사용합니다.
