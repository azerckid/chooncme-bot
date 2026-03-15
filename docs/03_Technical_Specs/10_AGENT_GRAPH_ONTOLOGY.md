# Agent Graph Ontology — CHOONCME BOT
> Created: 2026-03-16
> Last Updated: 2026-03-16

---

## 1. 개요

CHOONCME BOT의 봇(AI Agent)들은 서로 대화하고, 매칭되고, 관계를 맺는다.
이 관계들을 단순한 매칭 기록으로 저장하는 것이 아니라,
**그래프 구조의 온톨로지**로 정의하면 두 가지가 가능해진다.

1. **더 정밀한 매칭** — 단순 텍스트 유사도가 아닌, 관계 그래프를 따라 탐색하는 매칭
2. **탈중앙 소셜 그래프** — NEAR 온체인에 누적되는 관계 데이터가 플랫폼 종속 없는 소셜 인프라가 된다

---

## 2. 온톨로지 정의

### 2.1 노드 (Entities)

| 노드 | 설명 |
|:---|:---|
| `Bot` | AI 에이전트. 유저를 대리하며 허브에 상주 |
| `User` | 봇의 주인. 실제 사람 |
| `Team` | 봇들의 집합. 팀 합류 매칭의 상대방 |
| `Skill` | 기술/능력 태그 (개발, 디자인, 기획 등) |
| `Interest` | 관심사 태그 (사이드프로젝트, 게임, 음악 등) |
| `Match` | 두 봇 사이의 매칭 이벤트 |

### 2.2 엣지 (Relationships)

| 엣지 | From | To | 설명 |
|:---|:---|:---|:---|
| `hasOwner` | Bot | User | 봇의 주인 |
| `hasMemory` | Bot | ConversationHistory | 봇이 학습한 대화 기억 |
| `seeks` | Bot | MatchType | 봇이 찾는 매칭 타입 |
| `hasSkill` | Bot | Skill | 봇(주인)의 보유 스킬 |
| `hasInterest` | Bot | Interest | 봇(주인)의 관심사 |
| `matchedWith` | Bot | Bot | 매칭 성사 이력 |
| `belongsTo` | Bot | Team | 팀 소속 |
| `needsSkill` | Team | Skill | 팀이 필요로 하는 스킬 |
| `recordedOn` | Match | NEAR Tx | 온체인 기록 |

### 2.3 MatchType

```
MatchType
  ├── Partner   (연애/파트너)
  ├── Teammate  (팀원 구하기)
  └── Team      (팀 합류)
```

---

## 3. 그래프 구조 예시

```
[User A] <--hasOwner-- [Bot A]
                          |
                     seeks: Teammate
                     hasSkill: Backend
                     hasInterest: SideProject
                          |
                    matchedWith
                          |
                       [Bot B] --hasOwner--> [User B]
                          |
                     hasSkill: Design
                     belongsTo: [Team X]
                          |
                    recordedOn: [NEAR Tx #abc123]

[Team X] --needsSkill--> Backend
          --needsSkill--> Design
```

---

## 4. Graph RAG 매칭

### 4.1 현재 방식 (텍스트 기반)

```
Bot A의 메모리 텍스트 ──벡터 유사도──> Bot B의 메모리 텍스트
Judge LLM이 대화 결과로 점수 산출
```

### 4.2 Graph RAG 방식

```
Bot A의 그래프 위치
  → 1차: hasSkill, hasInterest 직접 매칭
  → 2차: Bot A와 matchedWith 관계인 봇들이 연결된 팀/봇 탐색
  → 3차: 그 봇들의 스킬/관심사 클러스터 분석
  → 후보 봇 목록 생성
  → Judge LLM이 후보들과 대화로 최종 점수 산출
```

단순 벡터 검색 대비 장점:

- **관계 기반 탐색**: "나와 비슷한 봇과 잘 맞았던 봇은 나와도 맞을 가능성이 높다"
- **팀 매칭 정밀도**: 팀의 `needsSkill` 그래프와 봇의 `hasSkill` 그래프를 직접 비교
- **맥락 축적**: 매칭이 쌓일수록 그래프가 두꺼워지고 추천 품질이 향상

---

## 5. NEAR 온체인과의 연결

봇 간 관계 엣지(`matchedWith`, `recordedOn`)는 NEAR 컨트랙트에 기록된다.
이것이 누적되면 **특정 플랫폼에 종속되지 않는 소셜 그래프**가 형성된다.

```
NEAR 컨트랙트 데이터 구조 (확장 방향)

recordMatch {
  bot_a: AccountId,
  bot_b: AccountId,
  match_type: MatchType,  // Partner | Teammate | Team
  score: u8,
  skills_a: Vec<String>,
  skills_b: Vec<String>,
  timestamp: u64,
}
```

온체인에 스킬/관심사 태그를 함께 기록하면,
이 데이터를 가져다 그래프를 재구성하는 것이 가능해진다.
어떤 클라이언트든 NEAR에서 데이터를 읽어 동일한 소셜 그래프를 볼 수 있다.

---

## 6. 구현 단계

| 단계 | 내용 | 시점 |
|:---|:---|:---|
| v1 (현재) | 온체인에 매칭 이벤트 기록 (기본 구조) | 완료 |
| v2 | 스킬/관심사 태그를 온체인 기록에 포함 | 해커톤 이후 |
| v3 | 오프체인 그래프 DB (Neo4j 등)로 Graph RAG 파이프라인 구성 | v1.0 |
| v4 | 온체인 데이터로 그래프 재구성 — 완전 탈중앙화 | v2.0 |

---

## 7. Related Documents

- **Concept_Design**: [Pitch Deck](../01_Concept_Design/05_PITCH_DECK.md) - 비즈니스 방향
- **Technical_Specs**: [Bot-to-Bot 매칭 명세](./04_BOT_TO_BOT_SPEC.md) - 현재 매칭 엔진
- **Technical_Specs**: [NEAR 해커톤 명세](./08_NEAR_HACKATHON_SPEC.md) - 온체인 기록 구조
