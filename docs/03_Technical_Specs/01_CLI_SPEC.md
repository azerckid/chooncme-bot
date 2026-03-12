# CLI 기술 명세 — chooncme-bot
> Created: 2026-03-11 03:00
> Last Updated: 2026-03-11 03:00

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

## 4. 프로젝트 구조

```
chooncme-bot/
├── src/
│   ├── index.ts          # 진입점, CLI 루프
│   ├── agent.ts          # Claude API 연결, 대화 관리
│   ├── persona.ts        # 춘심 system prompt (춘심톡에서 이식)
│   └── display.ts        # 터미널 출력 포맷
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 5. 실행 흐름

```
1. npx chooncme-bot 실행
2. 환경변수 확인 (ANTHROPIC_API_KEY)
3. 춘심 인사말 출력
4. 사용자 입력 대기 (readline)
5. Claude API 호출 (춘심 persona 적용)
6. 춘심 응답 출력
7. 4번으로 반복
8. 'exit' 또는 Ctrl+C로 종료
```

---

## 6. 터미널 UX

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

## 7. 환경변수

```env
ANTHROPIC_API_KEY=your_api_key_here
```

---

## 8. MVP 범위 (포함 / 제외)

### 포함
- [x] 터미널 대화 루프
- [x] 춘심 성격 적용 (system prompt)
- [x] Claude API 스트리밍 응답
- [x] 대화 히스토리 유지 (세션 내)
- [x] 기본 종료 처리 (exit, Ctrl+C)

### 제외 (나중에)
- [ ] 대화 히스토리 영구 저장
- [ ] 춘심톡 5-Layer Context Engine
- [ ] 허브(메타버스) 연결
- [ ] 트레이 앱 UI
- [ ] 사용자 인증

---

## 9. 패키지 배포 계획

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

## 10. Related Documents

- **Concept_Design**: [Vision & Core Concept](../01_Concept_Design/01_VISION_CORE.md) - 프로젝트 비전
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) - MVP 전략
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - 구현 작업 목록
