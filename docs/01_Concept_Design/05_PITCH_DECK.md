# Pitch Deck — CHOONCME BOT
> Created: 2026-03-16 00:00
> Last Updated: 2026-03-16

> 대상: BuidlHack 2026 Near AI 트랙 (마감: 2026-04-17 23:59 KST)
> 기준: 6 Global Rubric (Functionality / Impact / Novelty / UX / Open-source / Business Plan)

---

## 0. 한 줄 정의

> "AI Agent들이 NEAR 위에서 살고, 관계를 맺고, 소셜 그래프를 만든다."

---

## 1. 문제

사람들은 맞는 사람을 찾는 데 너무 많은 비용을 쓴다.

연인을 찾든, 팀원을 찾든, 들어갈 팀을 찾든 —
현재 매칭 서비스는 프로필로 사람을 고른다.
하지만 프로필은 나를 설명하지 못한다.

그리고 이 관계들은 모두 플랫폼 안에 갇혀 있다.
틴더가 사라지면 매칭 이력이 사라진다.
링크드인이 막히면 팀 빌딩 데이터가 사라진다.
관계 데이터의 주인은 플랫폼이지, 내가 아니다.

---

## 2. 솔루션

CHOONCME BOT은 AI Agent를 NEAR 위에 올린다.

```
나는 로컬에서 AI 봇과 대화한다.
봇은 나를 학습한다. 나의 언어, 관심사, 성향, 원하는 것.

봇은 NEAR에 등록된다. (registerBot)
봇은 3D 허브에서 다른 봇들과 만난다.
봇끼리 대화하며 궁합을 탐색한다. (Graph RAG)
어울린다 판단되면 — 매칭이 NEAR에 기록된다. (recordMatch)
주인에게 알림이 간다.
주인들이 실제로 만난다.
```

이것이 반복될수록 NEAR 위에 소셜 그래프가 쌓인다.
봇들의 관계망 — 누가 누구와 어울렸는가, 어떤 스킬이 어떤 팀과 맞았는가 —
이 데이터는 플랫폼이 아닌 체인 위에 살아있다.

**시스템 구조:**

```
[팬의 PC]                         [중앙 서버]
┌─────────────────┐               ┌──────────────────────────────────┐
│  로컬 클라이언트  │  ←─동기화─→  │  클라우드 에이전트                  │
│  (팬 ↔ 춘심이)   │               │  (오프라인 시 허브에서 대리 활동)    │
└─────────────────┘               │               │                  │
        ↑                         │               ↓                  │
     팬이 사용                     │         [허브 서버]               │
                                  │  (3D 공간 + 매칭 엔진 + NEAR)     │
                                  │               │                  │
                                  │               ↓                  │
                                  │         [알림 채널]               │
                                  │    (카카오톡 / 푸시 → 팬)         │
                                  └──────────────────────────────────┘
```

매칭 타입은 하나의 변수다. 엔진은 동일하다.

| 매칭 타입 | 찾는 것 |
|:---|:---|
| Partner | 연인/파트너 |
| Teammate | 함께 만들 사람 |
| Team | 들어갈 팀 |

---

## 3. 6 Global Rubric

### 3.1 Functionality — 실제로 돌아가는가?

NEAR 위에서 작동하는 AI Agent 시스템, 엔드투엔드 검증 완료 (2026-03-16 기준):

| 단계 | 구현 상태 |
|:---|:---|
| `npx chooncme-bot` 로컬 실행 | 완료 |
| 세션 AI Memory (재실행 후 기억 유지) | 완료 |
| 클라우드 에이전트 자동 sync | 완료 |
| 하드 필터 (지역/나이/관심사/매칭타입) | 완료 |
| Bot-to-Bot 대화 (MAX_TURNS=10) | 완료 |
| Judge LLM 궁합 점수 (0~100) | 완료 |
| score >= 70 시 이메일 알림 | 완료 |
| NEAR `registerBot` (testnet) | 완료 |
| NEAR `recordMatch` (testnet) | 완료 |
| 3D 허브 — 아바타 실시간 이동 | 완료 |
| 허브 — 니어기억은행 이동 애니메이션 | 완료 |
| 허브 — 뱃지 5종 + 관전 모드 | 완료 |

서버: Render 배포 완료 (`chooncme-bot.onrender.com`)
컨트랙트: `chooncme.testnet` 배포 완료

---

### 3.2 Impact — TAM과 생태계 기여

**타겟 시장:**

사람과의 연결이 필요한 모든 사람이 타겟이다.

- 1차: AI 컴패니언 유저 — 이미 AI와 대화하는 사람들
- 2차: 매칭 서비스 유저 — 연애, 사이드 프로젝트 팀원, 커뮤니티
- 3차: 빌더/크리에이터 — 함께 만들 사람을 찾는 사람들

첫 번째 유저 그룹은 춘심 팬덤(X/Twitter 기반 글로벌 33,000+)이다.
캐릭터 IP를 교체하면 동일한 구조가 어떤 커뮤니티에도 적용된다.

**NEAR 생태계 기여:**

> NEAR 위에 살아있는 AI 소셜 그래프

지금까지 AI Agent는 앱 안에 갇혀 있었다.
CHOONCME BOT은 AI Agent를 NEAR 위에 올린다.

에이전트끼리의 연결은, 인간이 관계를 맺는 방식을 재설계한다.
에이전트끼리의 연결은 새로운 소셜 인터페이스다 — 인간이 아닌, 데이터가 먼저 악수하는.

Agent가 태어나는 곳 — NEAR.
Agent가 관계를 맺는 곳 — NEAR.
Agent들의 소셜 그래프가 쌓이는 곳 — NEAR.

이 그래프는 특정 플랫폼이 사라져도 남는다.
누구든 NEAR에서 읽어 활용할 수 있다.
NEAR가 AI Agent들의 사회적 토대가 된다.

---

### 3.3 Novelty — 없던 조합인가?

기존 범주별 비교:

| 범주 | 기존 서비스 | CHOONCME BOT의 차이 |
|:---|:---|:---|
| AI 컴패니언 | Character.ai, 춘심톡 | 로컬 상주 + NEAR 위에 존재하는 Agent |
| 소셜 매칭 | 틴더, 링크드인, 팀 빌딩 플랫폼 | AI 봇이 먼저 궁합 탐색, 관계가 온체인에 |
| 온체인 소셜 | Lens Protocol, Farcaster | 매칭 행위 + Agent 관계 그래프 자체가 온체인 |
| 메타버스 허브 | Decentraland, Zepeto | NEAR 연동 AI Agent 자율 상주 |

이 네 가지를 하나의 흐름으로 연결한 서비스는 현재 없다.

**Agent Graph Ontology:**

봇들 사이의 관계는 그래프 온톨로지로 정의된다.

```
[Bot A] --seeks: Teammate
         --hasSkill: Backend
         --matchedWith--> [Bot B] --hasSkill: Design
                                   --belongsTo: [Team X]
                                   --recordedOn: NEAR Tx

[Team X] --needsSkill: Backend
```

매칭 탐색은 이 관계 그래프를 따라 이루어진다 (Graph RAG).
매칭이 쌓일수록 그래프가 두꺼워진다.
두꺼워진 그래프는 더 정밀한 매칭을 만든다.
이 모든 것이 NEAR 위에서 일어난다.

---

### 3.4 UX — 성능이 체감되는가?

데모에서 "와" 소리가 나는 장면:

1. `npx chooncme-bot` 한 줄 → AI와 대화 시작
2. 대화 종료 → 허브 화면에서 내 봇 아바타가 자동으로 니어기억은행 건물로 걸어감
3. 뱅크 건물이 포인트 라이트로 글로우 펄스 → NEAR 인증 뱃지 추가
4. 두 봇 매칭 시작 → 허브 공지 배너 → score 85 결과 팝업
5. 두 봇이 나란히 뱅크로 이동 → NEAR Explorer에서 tx 실시간 확인

추상적인 블록체인이 눈에 보이는 Agent의 행동으로 변환된다.
NEAR 위에서 AI들이 관계를 맺는 장면이 실시간으로 펼쳐진다.

---

### 3.5 Open-source — 다른 빌더가 쓸 수 있는가?

- GitHub 레포: public 공개, fork 가능
- 매칭 엔진 (`matchEngine.ts`): 매칭 타입 변수만 바꾸면 어떤 유즈케이스에도 적용
- NEAR 컨트랙트 (`contracts/`): `registerBot` / `recordMatch` 구조를 다른 AI Agent 프로젝트에서 재사용
- Agent Graph Ontology: 온톨로지 스키마 공개 — 다른 프로젝트가 동일한 소셜 그래프 레이어를 쌓을 수 있음
- 허브 서버/클라이언트: Mogame V2 fork 기반, 구조 공개

NEAR 위에 AI Agent 소셜 그래프를 구축하려는 모든 빌더가 이 구조를 참조할 수 있다.

---

### 3.6 Business Plan — 수익 모델

**핵심 경로:**

```
Agent가 NEAR 위에서 관계를 맺는다
  → 매칭 성사
  → 주인들에게 알림
  → 허브 내 실제 채팅 연결
  → 채팅 사용 시 NEAR 마이크로페이먼트
```

**추가 수익 방향 (v1.0+):**

| 모델 | 내용 |
|:---|:---|
| 마이크로페이먼트 | 매칭 채팅 연결 시 NEAR 소액 결제 |
| Raise-to-Earn | 봇 활동(매칭 횟수, 뱃지 누적)에 따른 NEAR 보상 |
| 프리미엄 구독 | 고급 매칭 조건, 다중 매칭 타입 동시 운용 |
| 플랫폼 라이선스 | 다른 커뮤니티가 동일 구조 사용 시 라이선스 수익 |

---

## 4. 3분 피치 스크립트 (참고용)

```
[문제 — 30초]
사람들은 맞는 사람을 찾는 데 너무 많은 비용을 씁니다.
그리고 그 관계 데이터는 모두 플랫폼 안에 갇혀 있습니다.
플랫폼이 사라지면 관계도 사라집니다.
관계 데이터의 주인은 내가 아닙니다.

[솔루션 — 60초]
CHOONCME BOT은 AI Agent를 NEAR 위에 올립니다.
봇은 나를 학습하고, NEAR에 등록되고,
3D 허브에서 다른 봇들과 만나 궁합을 탐색합니다.
연인을 찾든, 팀원을 찾든, 들어갈 팀을 찾든 — 엔진은 동일합니다.
매칭이 성사되면 NEAR에 기록됩니다.
이것이 반복되면 NEAR 위에 소셜 그래프가 쌓입니다.
Agent들의 관계망이 체인 위에 살아남습니다.

[데모 — 60초]
(라이브 데모: 봇 등록 → NEAR 등록 → 허브 아바타 → 매칭 → NEAR Explorer tx 확인)

[임팩트 — 30초]
AI Agent들이 NEAR 위에서 살고, 관계를 맺고, 소셜 그래프를 만듭니다.
첫 번째 커뮤니티는 춘심 팬덤 33,000명입니다.
NEAR가 AI Agent들의 사회적 토대가 됩니다.
```

---

## 5. 3 Investor Lenses (참고)

| Lens | 내용 |
|:---|:---|
| **Leverage** | 유저가 늘수록 봇이 늘고 → NEAR 위 소셜 그래프가 두꺼워지고 → 매칭 품질이 높아지고 → 더 많은 유저가 온다 |
| **Realistic Money Flow** | Agent 매칭 성사 → 채팅 연결 → NEAR 마이크로페이먼트 |
| **Defensibility** | NEAR 위에 누적된 Agent Graph — 데이터가 쌓일수록 어떤 경쟁자도 복제할 수 없는 소셜 인프라가 된다 |

---

## 6. Related Documents

- **Concept_Design**: [Vision & Core Concept](./01_VISION_CORE.md) - 프로젝트 비전 및 핵심 아이디어
- **Concept_Design**: [Roadmap](./02_ROADMAP.md) - 단계별 실행 계획
- **Technical_Specs**: [NEAR 해커톤 명세](../03_Technical_Specs/08_NEAR_HACKATHON_SPEC.md) - NEAR 연동 전체 설계
- **Technical_Specs**: [허브 경험 명세](../03_Technical_Specs/09_HUB_EXPERIENCE_SPEC.md) - 데모 시나리오 §8
- **Technical_Specs**: [Agent Graph Ontology](../03_Technical_Specs/10_AGENT_GRAPH_ONTOLOGY.md) - 그래프 온톨로지 설계
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - 구현 완료 항목
