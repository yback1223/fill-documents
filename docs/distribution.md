# 배포와 공식 마켓 제출

사용자 확정 정보: 게시자 표시명 **yback**, GitHub 계정 **yback1223**, 자체 코드·서식 **MIT**, 지원 가능한 모든 국가, 무료, 제품 내 결제 없음. 다크 모드 아이콘을 함께 제공한다. 개인 연락처는 공개 소스·배포 ZIP에 넣지 않고 필요한 신청 화면에 사용한다.

## 배포 구조

- `plugins/fill-documents/`: portable Agent Plugins 1.0 + Claude/Codex 호환 manifest.
- `.claude-plugin/marketplace.json`: Claude Code 자체 marketplace.
- `.agents/plugins/marketplace.json`: Codex 자체 marketplace.
- `dist/fill-documents-plugin-0.1.0.zip`: 단일 플러그인 디렉터리.
- `dist/fill-documents-skill-0.1.0.zip`: 독립 스킬 디렉터리.

공통 CLI·WASM·글꼴·서식·외부 라이선스를 포함한다. MCP 서버, OAuth, 앱 바인딩 또는 제품 내 결제는 없다. 이 ZIP에는 `node_modules`, `.app.json`, 사용자 자료를 넣지 않는다.

Claude 디렉터리의 파일당 5 MiB 상한에 맞춰 JavaScript를 ESM으로 분할하고 WASM을 gzip으로 포함한다. 가장 큰 파일은 압축 엔진 4,383,889 바이트다. 플러그인 폴더 자체에 README와 LICENSE가 있다. 바이너리 서식·압축 엔진과 256 KiB를 넘는 코드는 여전히 사람이 검토하는 대상으로 안내되므로, 크기 검사를 통과했다고 심사 승인을 뜻하지 않는다.

## 공식 디렉터리

GitHub 자체 marketplace에 공개하는 것과 각 서비스가 운영하는 공식 디렉터리의 심사·승인은 별개다. 준비된 manifest나 ZIP을 공식 등록 완료로 표시하지 않는다.

OpenAI 공식 제출에는 실제 게시자 인증, 공개 웹/지원/개인정보/약관 URL 확인, 저장된 개발자명과 국가 설정 확인, 현재 정책·법적 확인이 필요하다. skills-only 패키지에는 연결 서버용 OAuth 테스트나 MCP 테스트 케이스가 없다. 법적 확인은 권한 있는 게시자가 실제 화면에서 완료해야 한다.

Claude Code의 자체 marketplace는 저장소 URL로 추가할 수 있다. Anthropic 디렉터리 신청 경로는 [개발자 포털](https://claude.ai/directory/manage)이며 유료 Claude 계정과 해당 계정의 게시 권한이 필요하다. 이 신청을 `claude-plugins-official` 등재와 동일시하지 않는다. 공식 marketplace 등재는 Anthropic 파트너 담당자를 통한 별도 경로로 안내되어 있다. 검토 상태는 반환된 결과로만 기록한다.

OpenAI 신청 경로는 [Plugins 대시보드](https://platform.openai.com/plugins)다. 업로드 후 자동 검사를 확인하고 실제 인증한 개인·사업자 명의 및 정책 확인을 거쳐 심사를 신청한다.

현재 온라인 제출·심사·승인 상태는 최종 실행 기록에서 확인한다. 인증이나 신청을 실행하지 않았다면 미제출로 유지한다.

## 온라인 실행 기록

- 2026-10-08: 첫 공개 커밋 `0d3c1f1`을 `main`에 푸시했다. 저장소는 PUBLIC이며 원격 기본 브랜치는 `main`이다.
- README·지원·개인정보·이용 안내·두 marketplace 파일을 인증 없는 HTTP 요청으로 읽고 로컬 내용과 같음을 확인했다. manifest의 웹사이트·지원·개인정보·약관 URL도 HTTP 200과 프로젝트·게시자 내용을 확인했다.
- 공개 저장소의 `9f5d4cf`를 새 임시 경로에 복제해 npm 설치 없이 `doctor`와 보고서 4개 형식의 채우기·원본 보존을 확인했다.
- 실행 코드와 검사기 커밋 `9a7c25e`의 [GitHub Actions](https://github.com/yback1223/fill-documents/actions/runs/37729210480)가 성공했다. Ubuntu Node 20·22, Windows Node 22, macOS Node 22에서 각각 setup, 63개 테스트, build, ZIP 32회 검사가 모두 통과했다.
- 공식 디렉터리 포털 작업 시작 전 상태: 업로드·심사 신청·승인·게시를 아직 하지 않았다. GitHub 공개와 자체 marketplace 배포만으로 공식 등재를 주장하지 않는다.

공식 근거:

- [OpenAI plugin build](https://developers.openai.com/plugins/build/plugins)
- [OpenAI submission](https://developers.openai.com/plugins/deploy/submission)
- [Claude plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)
- [Claude publish and distribute](https://code.claude.com/docs/en/plugins/publish)
- [Claude pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist)
