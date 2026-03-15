# Backlog
> Created: 2026-03-11 03:00
> Last Updated: 2026-03-16 (v0.8-hackathon 순서 앞당김)

---

## 현재 진행

없음. v0.4 완료. 전체 루프(대화→매칭→알림) 완성.

---

## ✅ 완료 — MVP v0.1 (2026-03-15)

### 환경 세팅
- [x] Node.js + TypeScript 프로젝트 초기화
- [x] Anthropic SDK 설치
- [x] tsconfig 설정
- [x] package.json bin 설정 (npx 실행)

### 핵심 구현
- [x] `persona.ts` — 춘심톡 CORE_CHUNSIM_PERSONA 이식
- [x] `agent.ts` — Claude API 연결, 대화 히스토리 관리
- [x] `memory.ts` — 세션 요약 저장/로드, System Prompt 주입 (`~/.chooncme/memory.json`)
- [x] `display.ts` — 터미널 출력 포맷 (춘심 이름 표시 등)
- [x] `index.ts` — readline 루프, 진입점

### 완료 기준 (DoD) — 전항목 통과
- [x] `npx chooncme-bot` 으로 실행
- [x] 춘심이와 터미널에서 대화 가능
- [x] 세션 내 대화 맥락 유지
- [x] 재실행 후에도 이전 대화 기억 (AI Memory)
- [x] exit / Ctrl+C 로 종료
- [x] QA 체크리스트 전항목 통과

---

## ✅ 완료 — v0.2 클라우드 에이전트 동기화 (2026-03-15)

### 서버 구현 (`server/`)
- [x] Express + TypeScript 서버 프로젝트 초기화
- [x] `POST /sync` — 로컬 클라이언트 프로파일 수신
- [x] `GET /agent/:botId` — 에이전트 프로파일 조회
- [x] `POST /agent/:botId/chat` — 클라우드 에이전트 대화 (오프라인 대리)
- [x] 인메모리 agentStore

### 클라이언트 연동 (`src/`)
- [x] `config.ts` — UUID Bot ID 생성/유지 (`~/.chooncme/config.json`)
- [x] `memory.ts` — `syncToServer()` 세션 저장 후 자동 전송
- [x] 서버 미실행 시 5초 타임아웃 후 조용히 무시

### 완료 기준 (DoD) — 전항목 통과
- [x] 클라이언트 종료 시 서버로 프로파일 자동 sync
- [x] `GET /agent/:botId` 로 프로파일 조회 가능
- [x] `POST /agent/:botId/chat` 으로 오프라인 대리 대화 가능
- [x] 서버 미실행 시 클라이언트 대화 영향 없음

---

## ✅ 완료 — v0.3-A 매칭 엔진 (2026-03-15)

### 서버 추가 (`server/`)
- [x] `store/hubStore.ts` — 허브 봇 등록/이탈/조회 (MatchCriteria 포함)
- [x] `store/matchStore.ts` — 매칭 결과 저장/조회/상태 업데이트
- [x] `engine/matchEngine.ts` — 하드 필터 + 봇-to-봇 대화 + Judge LLM 판정
- [x] `routes/hub.ts` — POST /hub/join, GET /hub/bots, POST /hub/leave
- [x] `routes/match.ts` — POST /match/start (비동기), GET /match/results/:botId

### 완료 기준 (DoD) — 전항목 통과
- [x] 허브 등록/이탈/목록 조회 정상 동작
- [x] 하드 필터 통과/탈락 판단 정확
- [x] 봇-to-봇 대화 MAX_TURNS=10 실행
- [x] Judge LLM 0~100 점수 + match_signals/mismatch_signals/summary 반환
- [x] 매칭 완료 결과 GET /match/results/:botId 조회 가능
- [x] notified=true (score >= 70) 자동 설정

---

## ✅ 완료 — v0.3-B 춘심 허브 (2026-03-15)

### 허브 서버 (`hub/server/`)
- [x] Mogame V2 Socket.io 서버 fork → TypeScript 재작성
- [x] join 이벤트: 매칭 엔진 `POST /hub/join` 자동 호출 (botId + criteria)
- [x] disconnect 이벤트: 매칭 엔진 `POST /hub/leave` 자동 호출
- [x] requestMatch 이벤트: `POST /match/start` 프록시
- [x] MATCH_ENGINE_URL 환경변수로 연결 설정, 미실행 시 조용히 무시

### 허브 클라이언트 (`hub/client/`)
- [x] Mogame V2 클라이언트 fork
- [x] 춘심 허브 브랜딩 (Michel→Chunsim, teal→pink 테마)
- [x] 입장 화면: 닉네임 + botId + 지역 + 관심사 입력 필드
- [x] useSocket: join 시 botId + criteria 함께 전송
- [x] useGameStore: myBotId, myCriteria 상태 추가

### 완료 기준 (DoD)
- [x] 허브 서버 빌드 성공 (TypeScript)
- [x] 허브 클라이언트 Next.js 빌드 성공
- [x] 두 서버 동시 실행 및 health 응답 확인
- [x] 매칭 엔진 연동 동작 확인

---

## ✅ 완료 — v0.4 알림 채널 (2026-03-15)

### 서버 추가 (`server/`)
- [x] `services/notificationService.ts` — 알림 발송 추상화 (SMTP/콘솔 자동 전환)
- [x] `AgentProfile.owner_email` 필드 추가
- [x] `POST /sync` — owner_email 수신 및 저장
- [x] `POST /match/start` — score ≥ 70 시 양쪽 주인에게 자동 알림

### 클라이언트 (`src/`)
- [x] `config.ts` — ownerEmail 필드 추가
- [x] `memory.ts` — syncToServer에 ownerEmail 전달

### 완료 기준 (DoD)
- [x] score ≥ 70 매칭 시 양쪽 주인 이메일로 알림 발송
- [x] SMTP 미설정 시 콘솔 출력 (개발 모드) 확인
- [x] 알림 본문: 점수 / match_signals / summary / 허브 URL 포함

---

## 다음 구현 예정 (명세 완료)

> **순서 변경**: BuidlHack 2026 Near AI 트랙 (제출 마감 2026-04-17) 참가를 위해
> v0.8-hackathon(NEAR 연동)을 v0.5~v0.7 앞에 먼저 진행한다.
> 명세: [08_NEAR_HACKATHON_SPEC.md](../03_Technical_Specs/08_NEAR_HACKATHON_SPEC.md)

### v0.8-hackathon — NEAR 연동 (BuidlHack 2026)
> 명세: [08_NEAR_HACKATHON_SPEC.md](../03_Technical_Specs/08_NEAR_HACKATHON_SPEC.md)
> 기간: 2026-03-17 ~ 2026-04-17

**1주차 (3/17~3/23) — 계정 생성 + 스마트 컨트랙트**
- [ ] NEAR CLI 설치 (`npm install -g near-cli`)
- [ ] `chooncme.testnet` 계정 생성 (`near create-account chooncme.testnet --useFaucet`)
- [ ] `chooncme-server.testnet` 계정 생성 (`near create-account chooncme-server.testnet --useFaucet`)
- [ ] `contracts/` 디렉토리 초기화 (near-sdk-js v2.0)
- [ ] `registerBot()` — 봇 등록 컨트랙트 메서드
- [ ] `recordMatch()` — 매칭 결과 기록 컨트랙트 메서드
- [ ] `getBot()`, `getMatchHistory()` — 조회 메서드
- [ ] NEAR 테스트넷 배포 (`chooncme.testnet`)
- [ ] FunctionCall 키 생성 (`chooncme-server.testnet` → `registerBot`, `recordMatch`만 허용)

**2주차 (3/24~3/30) — 서버 연동**
- [ ] `server/src/services/nearService.ts` — near-api-js v7 연동
- [ ] `server/.env` — NEAR 환경변수 4개 추가
- [ ] `POST /sync` → `registerBotOnChain()` 연결
- [ ] `POST /match/start` score ≥ 70 → `recordMatchOnChain()` 연결
- [ ] NEAR 미설정 시 silent skip 처리

**3주차 (3/31~4/6) — 클라이언트 + 배포 + 통합 테스트**
- [ ] `src/config.ts` — `nearAccount?: string` 필드 추가
- [ ] `src/index.ts` — 최초 실행 시 `.near` 계정 입력 프롬프트 (건너뛰기 가능)
- [ ] `src/memory.ts` — `syncToServer`에 `nearAccount` 전달
- [ ] 매칭 엔진 서버 Railway 배포 (공개 URL 확보) ← 데모 필수
- [ ] NEAR Explorer에서 트랜잭션 조회 확인 (DoD)

**4주차 (4/7~4/17) — 데모 + 제출**
- [ ] 데모 시나리오 전체 1회 완주 (배포 환경 기준)
- [ ] 피치 자료 준비
- [ ] Ludium Portal 제출 (마감: 2026-04-17 23:59 KST)

---

### v0.5 — 봇 자율 아바타 (v0.8-hackathon 이후)
> 명세: [05_BOT_PRESENCE_SPEC.md](../03_Technical_Specs/05_BOT_PRESENCE_SPEC.md)

- [ ] `server/src/services/botPresenceService.ts` — socket.io-client로 허브 자동 접속
- [ ] POST /sync 완료 시 botPresence 자동 트리거
- [ ] 봇 자율 이동 (3~8초 간격, 랜덤 waypoint)
- [ ] `isBot: true` 플래그 허브 서버/클라이언트 반영
- [ ] MAX_ACTIVE_BOTS 제한 (기본 50)
- [ ] (선택) 허브 클라이언트 봇 시각 구분 — 이름표 색상/아이콘 (명세 §5)

### v0.6 — 배포 (v0.8-hackathon 이후)
> 명세: [06_DEPLOYMENT_SPEC.md](../03_Technical_Specs/06_DEPLOYMENT_SPEC.md)

- [ ] Railway — `chooncme-server` (매칭 엔진) 배포
- [ ] Railway — `chooncme-hub-server` (Socket.io 허브) 배포
- [ ] Vercel — `chooncme-hub-client` (Next.js) 배포
- [ ] npm publish — `chooncme-bot` 패키지 공개
- [ ] 도메인 + CORS 설정
- [ ] 환경변수 설정 가이드 작성

### v0.7 — 데스크탑 트레이 앱 (Electron) (v0.8-hackathon 이후)
> 명세: [07_DESKTOP_APP_SPEC.md](../03_Technical_Specs/07_DESKTOP_APP_SPEC.md)

- [ ] Electron 프로젝트 초기화 (`desktop/`)
- [ ] 트레이 아이콘 + 메뉴 (대화하기 / 허브 보기 / 종료)
- [ ] 채팅 창 UI + `src/` 코드 연결
- [ ] OS 알림 (시작 인사, 매칭 알림, 장기 미접속 알림)
- [ ] 자동 시작 설정
- [ ] macOS .dmg 패키징

---

## 미래 버전 아이디어 (미명세)

### 라이프 패턴 수집 — 칸반 보드
> 아이디어 출처: 2026-03-14 기획 대화

**개념**: 태스크 관리 칸반 보드를 제공해서 사용자의 라이프 패턴을 수동적으로 수집.
대화 데이터(주관적)와 행동 데이터(객관적)를 결합해 정확한 사용자 프로파일 형성.

- [ ] 칸반 보드 UI 설계 (웹 대시보드 또는 TUI)
- [ ] 라이프 패턴 데이터 스키마 정의 (카테고리, 완료율, 활동 시간대, 반복 패턴)
- [ ] 패턴 분석 엔진 — 칸반 행동 데이터 → 성향 벡터 변환
- [ ] 춘심 AI 프로파일에 패턴 데이터 반영
- [ ] 매칭 알고리즘에 라이프 패턴 지표 통합

> 참고: `docs/01_Concept_Design/01_VISION_CORE.md` 섹션 3.4

---

## 완료

- **v0.1 MVP** — 2026-03-15. 로컬 CLI + AI Memory.
- **v0.2** — 2026-03-15. 클라우드 에이전트 서버 + 자동 sync.
- **v0.3-A** — 2026-03-15. 매칭 엔진 (허브 API + 하드 필터 + Bot-to-Bot + Judge LLM).
- **v0.3-B** — 2026-03-15. Mogame fork → 춘심 허브 (3D 웹 + Socket.io + 매칭 엔진 연동).
- **v0.3-C** — 2026-03-15. 허브 실제 구동 확인 (3D 입장 + Socket.io 연동 + hub/bots 등록 검증).
- **v0.4** — 2026-03-15. 알림 채널 (이메일 / 콘솔 개발 모드, SMTP 환경변수로 전환 가능).

---

## Related Documents

- **Technical_Specs**: [CLI 기술 명세](../03_Technical_Specs/01_CLI_SPEC.md) - 구현 명세
- **Technical_Specs**: [Bot-to-Bot 명세](../03_Technical_Specs/04_BOT_TO_BOT_SPEC.md) - v0.3 봇 간 상호작용
- **QA_Validation**: [MVP 테스트 체크리스트](../05_QA_Validation/01_MVP_TEST_CHECKLIST.md) - DoD 검증
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) - 전체 로드맵
