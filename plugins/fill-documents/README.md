# Fill Documents

**문서 서식을 고르고, 제공한 내용으로 채우세요.**

Fill Documents is a free, open-source document filling skill by **yback**. It runs locally in Claude Code and Codex with Node.js 20 or later. Choose a template, provide the requested values, and receive a new document in the same format. The original template and existing output files are preserved.

HWP, HWPX, Word DOCX, PDF 형식의 공문·보고서·회의록·신청서 16종을 포함합니다. 기관 지정 양식이 아닌 자체 제작 기본 서식이며, 가상 예시 데이터로 동작을 확인할 수 있습니다. 지원되는 명시적 필드를 가진 사용자 서식도 등록해 재사용할 수 있습니다.

예를 들어 “fill-documents로 회의록 서식을 찾아 아래 내용으로 채워줘”라고 요청하세요. 스킬은 필요한 필드를 확인하고 누락된 사실은 사용자에게 묻습니다. 내용을 자동으로 만들어 사실처럼 채우지 않습니다.

## 지원 범위

- HWP 5: 균일한 글자 서식의 단순 본문 문단에 있는 고유 텍스트 필드.
- HWPX: 텍스트 태그와 같은 문단 안의 지원되는 누름틀.
- DOCX: 텍스트 태그, 분리된 텍스트 run과 반복 필드.
- PDF: AcroForm 텍스트 필드와 체크박스. 스캔 문서와 일반 PDF 본문의 임의 편집은 지원하지 않습니다.

암호화·서명·실행 동작, 지원하지 않는 구조와 보존할 수 없는 입력은 거부합니다. 모든 문서의 무손실 편집을 보장하지 않으며, 결과를 실제 사용 앱에서 확인해야 합니다. 한컴 및 Microsoft Word 원본 앱의 화면 배치는 아직 검증하지 않았습니다.

## 실행과 데이터

스킬은 포함된 Node.js CLI를 실행해 파일을 읽고 새 결과를 저장합니다. 실행용 JavaScript, gzip으로 압축한 한글 WASM 엔진, 한글 글꼴, 실제 바이너리 서식을 포함합니다. WASM은 메모리에서 압축을 풀어 실행하며 외부 엔진을 다운로드하지 않습니다. 일반 사용 시 npm 설치, 별도 서버, API 키가 필요하지 않습니다.

The local CLI does not upload documents, contact a service, run a package installer, or send telemetry. Input values may contain personal data supplied by the user. Results and registered templates remain on the local filesystem until the user removes them. The host AI application's own data handling and account requirements still apply. There are no in-product payments.

소스 코드를 함께 제공하며, 외부 엔진·글꼴의 원저작자와 라이선스를 유지합니다. 압축 엔진·서식·대형 코드 파일은 디렉터리 심사에서 사람이 검토할 수 있습니다.

[사용법과 설치](https://github.com/yback1223/fill-documents) · [지원](https://github.com/yback1223/fill-documents/blob/main/SUPPORT.md) · [개인정보 및 파일 처리](https://github.com/yback1223/fill-documents/blob/main/PRIVACY.md) · [이용 안내](https://github.com/yback1223/fill-documents/blob/main/TERMS.md)

자체 코드·서식은 MIT로 배포합니다. 외부 구성요소는 [원라이선스와 고지](skills/fill-documents/THIRD_PARTY_NOTICES.md)를 확인하세요.
