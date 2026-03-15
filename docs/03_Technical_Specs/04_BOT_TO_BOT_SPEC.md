# Bot-to-Bot 상호작용 명세
> Created: 2026-03-15
> Last Updated: 2026-03-15

---

> 상태: 기획 완료. 구현 대상: v0.3 (Hub 연결 단계).

---

## 1. 개요

허브에 모인 춘심봇들이 자율적으로 대화하며 주인 간 궁합을 판단하는 메커니즘.
LLM과 LLM이 직접 프롬프트를 주고받는 Multi-Agent 구조이므로 **무한 루프 방지**와 **결론 강제**가 핵심 설계 과제다.

---

## 2. 대화 흐름

```
[하드 필터 통과]
      ↓
봇 A (춘심_A) ←→ 봇 B (춘심_B)   최대 N턴 대화
      ↓
[Judge LLM 개입]                   매 턴 또는 대화 종료 후
      ↓
{ score: 0~100, reason: "..." }
      ↓
임계값 초과 시 → 주인들에게 알림
```

---

## 3. 무한 루프 방지 — 3중 제어

### 3.1 턴 수 제한 (Hard Stop)

```
MAX_TURNS = 10  (기본값, 설정 변경 가능)
```

- 10턴 초과 시 대화를 강제 종료하고 Judge 호출
- 대화가 길어질수록 연산 비용 증가 → 짧고 집중된 대화 유도

### 3.2 타임아웃 (Per-Turn)

```
TURN_TIMEOUT_MS = 10_000  (턴당 10초)
SESSION_TIMEOUT_MS = 120_000  (세션 전체 2분)
```

- 한 턴에서 응답이 없으면 강제 다음 턴 진행
- 전체 세션 타임아웃 초과 시 Judge 호출 후 종료

### 3.3 조기 종료 (Early Exit)

- Judge가 매 짝수 턴마다 중간 점수를 산출
- 점수가 `MATCH_THRESHOLD(80점)` 초과 또는 `MISMATCH_THRESHOLD(20점)` 미만이면 즉시 종료
- 시간과 비용 절약

---

## 4. Judge LLM

봇 A-B 대화와 별개로, 제3의 LLM 호출이 최종 판정을 담당한다.

### 4.1 역할

- 봇끼리의 대화 전체를 보고 궁합 점수와 이유를 산출
- 봇들이 스스로 "어울린다/아니다"를 판단하게 하면 환각 위험 → Judge가 분리된 시각 제공

### 4.2 Judge 프롬프트 구조

```
시스템:
  너는 두 사람의 궁합을 평가하는 심판이다.
  아래는 두 춘심봇이 각자의 주인을 대표해 나눈 대화다.
  대화 내용을 바탕으로 두 주인의 궁합 점수(0~100)와 판단 근거를 JSON으로 반환해라.

  출력 형식:
  {
    "score": number,
    "confidence": "high" | "medium" | "low",
    "match_signals": string[],
    "mismatch_signals": string[],
    "summary": string
  }

입력:
  [봇 A-B 대화 전문]
```

### 4.3 Judge 호출 시점

| 시점 | 조건 |
| :--- | :--- |
| 짝수 턴마다 | 중간 점수 산출 (조기 종료 판단용) |
| 최종 턴 후 | 최종 판정 |
| 타임아웃 발생 시 | 강제 최종 판정 |

---

## 5. 봇 프로파일 공개 범위

봇 A가 봇 B에게 공개하는 정보는 **요약 프로파일만** (원본 대화 로그 불가).

```typescript
interface BotProfile {
  personality_summary: string;   // "밤형, 게임 좋아함, 공감형 대화 선호"
  interest_tags: string[];       // ["게임", "음악", "일상토크"]
  conversation_style: string;    // "짧게 자주 / 장문 서술형"
  activity_time: string;         // "주로 자정 이후"
  // 원본 대화 내용, 개인 식별 정보 포함 금지
}
```

---

## 6. 환각(Hallucination) 방지

| 위험 | 대응 |
| :--- | :--- |
| 봇이 없는 정보를 지어내서 상대에게 전달 | 봇은 프로파일 범위 내 정보만 발화하도록 시스템 프롬프트 제한 |
| 두 봇이 서로 동조하며 점수를 과장 | Judge는 대화와 분리된 독립 LLM 호출로 중립성 확보 |
| 대화가 주제에서 벗어남 | Judge 중간 점검 시 이탈 감지 → 턴 강제 종료 |

---

## 7. 매칭 결과 전달

```typescript
interface MatchResult {
  bot_a_owner_id: string;
  bot_b_owner_id: string;
  score: number;             // 0~100
  confidence: string;
  match_signals: string[];
  summary: string;
  matched_at: string;        // ISO timestamp
}
```

- `score >= 70` → 주인들에게 매칭 제안 알림 발송
- `score < 70` → 기록만 보관, 알림 없음
- 알림 채널: v0.4에서 카카오톡 / Push 연동

---

## 8. 설정값 요약

| 파라미터 | 기본값 | 설명 |
| :--- | :--- | :--- |
| `MAX_TURNS` | 10 | 봇 간 최대 대화 턴 수 |
| `TURN_TIMEOUT_MS` | 10,000 | 턴당 응답 대기 최대 시간 |
| `SESSION_TIMEOUT_MS` | 120,000 | 전체 세션 최대 시간 |
| `MATCH_THRESHOLD` | 80 | 이 점수 이상이면 즉시 매칭 종료 |
| `MISMATCH_THRESHOLD` | 20 | 이 점수 이하이면 즉시 불일치 종료 |
| `NOTIFY_THRESHOLD` | 70 | 이 점수 이상이면 주인에게 알림 |

---

## 9. 구현 단계

| 버전 | 내용 |
| :--- | :--- |
| v0.1~v0.2 | 해당 없음 (단일 봇, 단일 사용자) |
| **v0.3** | Bot-to-Bot 대화 엔진 구현, Judge LLM, 매칭 알림 |
| v0.4 | 알림 채널 연동 (카카오톡 / Push) |

---

## 10. Related Documents

- **Concept_Design**: [Vision & Core Concept](../01_Concept_Design/01_VISION_CORE.md) - 섹션 3.3 봇 대리 매칭
- **Concept_Design**: [User Pattern Collection](../01_Concept_Design/04_USER_PATTERN_COLLECTION.md) - 봇 프로파일 재료
- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) - 허브 서버 구조
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - 구현 작업 목록
