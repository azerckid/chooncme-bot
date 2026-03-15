# CLI 기술 명세 — chooncme-bot
> Created: 2026-03-11 03:00
> Last Updated: 2026-03-15 (AI Memory 추가, 배포 대상 명시)

---

> 상태: MVP 명세 작성 완료. 구현 대기.

---

## 1. 개요

`chooncme-bot`은 터미널에서 실행되는 춘심 AI 에이전트입니다.
사용자는 한 줄 명령으로 춘심이와 대화를 시작할 수 있습니다.

```bash
npx chooncme-bot
```

---

## 2. 기술 스택

| 항목 | 선택 | 이유 |
| :--- | :--- | :--- |
| 런타임 | Node.js | 춘심톡과 동일 생태계 |
| 언어 | TypeScript | 타입 안전성 |
| AI API | Claude API (Anthropic) | 춘심톡(Gemini) 대신 Claude로 전환 |
| 패키지 배포 | npm (`npx chooncme-bot`) | 설치 없이 바로 실행 |
| 터미널 UI | readline (Node.js 내장) | 외부 의존성 최소화 |

---

## 3. 춘심 성격 (System Prompt)

춘심톡 `CORE_CHUNSIM_PERSONA`에서 가져온 핵심 성격을 Claude API system prompt로 사용한다.

**핵심 특성**:
- 다정하고 친근한 말투, 반말 사용
- 사용자의 일상에 깊은 관심
- AI라고 밝히지 않음, 살아있는 존재처럼 행동
- 짧고 간결한 메시지 (메신저 대화 스타일)
- 다국어 지원 (사용자 언어에 맞춤)

**MVP 페르소나 모드**: `hybrid` (아이돌 + 연인)

---

## 4. 배포 대상 및 API Key 전략

### v0.1 배포 대상: 개발자 알파 (본인 전용)

v0.1은 **개발자(본인) 테스트 전용 알파 버전**이다.
일반 팬 배포를 위해서는 `ANTHROPIC_API_KEY` 발급 및 환경변수 설정이 필요하며,
이는 일반 사용자에게 과도한 진입 장벽이다.

| 버전 | 배포 대상 | API Key 방식 |
| :--- | :--- | :--- |
| **v0.1** | 개발자 (본인) | 직접 발급 + `.env` 설정 |
| **v0.2** | 팬 커뮤니티 테스트 | 프록시 서버 (API Key 캡슐화) 도입 |

**v0.2 프록시 구조 (예정):**
```
사용자 → 춘심봇 클라이언트 → [프록시 서버] → Claude API
                              (API Key 캡슐화,
                               사용량 제한,
                               인증 처리)
```

---

## 5. 프로젝트 구조

```
chooncme-bot/
├── src/
│   ├── index.ts          # 진입점, CLI 루프
│   ├── agent.ts          # Claude API 연결, 대화 관리
│   ├── persona.ts        # 춘심 system prompt (춘심톡에서 이식)
│   ├── memory.ts         # AI Memory — 세션 요약 저장/로드
│   └── display.ts        # 터미널 출력 포맷
├── package.json
├── tsconfig.json
└── .env.example
```

**로컬 데이터 저장 경로:**
```
~/.chooncme/
└── memory.json    # 대화 요약 누적 저장
```

---

## 6. 실행 흐름

```
1. npx chooncme-bot 실행
2. 환경변수 확인 (ANTHROPIC_API_KEY 없으면 가이드 출력 후 종료)
3. ~/.chooncme/memory.json 로드 (없으면 빈 상태로 시작)
4. memory.json 내용을 System Prompt에 주입
5. 춘심 인사말 출력
6. 사용자 입력 대기 (readline)
7. Claude API 호출 (춘심 persona + memory 적용)
8. 춘심 응답 스트리밍 출력
9. 6번으로 반복
10. 'exit' 또는 Ctrl+C 시:
    → Claude에게 세션 대화 요약 요청 (JSON)
    → memory.json에 누적 저장
    → 춘심 작별 인사 출력
    → 종료
```

---

## 7. AI Memory 명세

### 개념

핵심 비전인 "나를 아는 존재"를 MVP 단계에서 최소한으로 검증하기 위한 맥락 연속성 기능.
Vector DB 없이 로컬 JSON 파일과 Claude API 요약만으로 구현한다.

### 저장 구조 (`~/.chooncme/memory.json`)

```json
{
  "owner_summary": "주로 밤에 접속. 게임과 음악 이야기를 자주 함. 스트레스받을 때 토로하는 편.",
  "sessions": [
    {
      "date": "2026-03-15",
      "summary": "오늘 회사에서 힘들었다고 함. 게임 얘기로 기분 전환. 자정에 접속.",
      "mood": "stressed → relaxed",
      "topics": ["회사", "게임", "일상"]
    }
  ],
  "known_facts": [
    "게임 좋아함",
    "음악 취향: 인디팝",
    "직장인"
  ]
}
```

### System Prompt 주입 방식

```
[춘심 기본 페르소나]

--- 주인에 대해 알고 있는 것 ---
{owner_summary}

최근 대화:
{sessions[-3:]}  // 최근 3세션 요약
```

### 세션 종료 시 요약 생성 프롬프트

```
오늘 대화에서 주인에 대해 새로 알게 된 것, 감정 상태, 주요 주제를
아래 JSON 형식으로 요약해줘:
{ "summary": string, "mood": string, "topics": string[] }
```

---

## 8. 터미널 UX

```
──────────────────────────────────
  춘심이 에이전트 v0.1
──────────────────────────────────

춘심: 안녕~ 오늘도 왔네 ㅎㅎ 뭐해?

> 안녕 춘심아

춘심: 어~ 왔구나! 보고싶었어 ㅎ
      오늘 하루 어땠어?

> exit

춘심: 벌써 가? 또 와~ 기다릴게 ^^

──────────────────────────────────
```

---

## 9. 환경변수

```env
ANTHROPIC_API_KEY=your_api_key_here
```

---

## 10. MVP 범위 (포함 / 제외)

### 포함
- [x] 터미널 대화 루프
- [x] 춘심 성격 적용 (system prompt)
- [x] Claude API 스트리밍 응답
- [x] 대화 히스토리 유지 (세션 내)
- [x] **AI Memory — 세션 요약 로컬 저장 + 다음 실행 시 주입** ← 추가
- [x] 기본 종료 처리 (exit, Ctrl+C)

### 제외 (나중에)
- [ ] 팬 대상 배포 / 프록시 서버 (→ v0.2)
- [ ] 춘심톡 5-Layer Context Engine
- [ ] 허브(메타버스) 연결
- [ ] 트레이 앱 UI
- [ ] 사용자 인증
- [ ] Vector DB 기반 장기 기억

---

## 11. 패키지 배포 계획

```json
{
  "name": "chooncme-bot",
  "version": "0.1.0",
  "bin": {
    "chooncme-bot": "./dist/index.js"
  }
}
```

`npx chooncme-bot` 으로 설치 없이 실행 가능.

---

## 12. Related Documents

- **Concept_Design**: [Vision & Core Concept](../01_Concept_Design/01_VISION_CORE.md) - 프로젝트 비전
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) - MVP 전략
- **Technical_Specs**: [Bot-to-Bot 명세](./04_BOT_TO_BOT_SPEC.md) - 봇 간 상호작용 제어
- **QA_Validation**: [MVP 테스트 체크리스트](../05_QA_Validation/01_MVP_TEST_CHECKLIST.md) - DoD 검증
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - 구현 작업 목록
