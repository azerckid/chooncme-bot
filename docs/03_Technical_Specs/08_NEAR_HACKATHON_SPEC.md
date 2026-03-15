# NEAR 해커톤 구현 명세 (BuidlHack 2026)
> Created: 2026-03-16
> Last Updated: 2026-03-16

---

> 상태: 명세 완료. 구현 대상: v0.8-hackathon (v0.5~v0.7 앞당겨 진행).

---

## 1. 배경

**BuidlHack 2026** (주최: LUDIUM / BAS)의 **Near AI 트랙** ($5,000) 제출을 위해 원래 v0.8로 예정된 NEAR 연동을 앞당긴다.

| 항목 | 내용 |
| :--- | :--- |
| 해커톤 | BuidlHack 2026 |
| 트랙 | Near AI |
| 상금 | $5,000 (Near AI 트랙) / $6,000 (General 트랙) |
| 제출 마감 | 2026-04-17 23:59 KST |
| 최종 피치 | 2026-04-18 |
| 제출 채널 | Ludium Portal |
| 공식 사이트 | https://www.buidlkorea.com/buidlhack2026 |

### 공식 일정

| 날짜 | 이벤트 | 비고 |
| :--- | :--- | :--- |
| ~~2026-03-11~~ | ~~Kickoff AMA~~ | ~~완료~~ |
| 2026-03-12 ~ 04-14 | 스폰서 워크숍 (온라인) | Near AI 워크숍 참석 권장 |
| **2026-04-14** | **Builder Day** (오프라인) | 중간 점검 — 3주차 작업 완료 목표 |
| **2026-04-17** | **제출 마감** 23:59 KST | Ludium Portal 제출 |
| **2026-04-18** | **최종 피치 데이** | 심사 발표 |

### 로드맵 순서 조정

```
기존:  v0.5 → v0.6 → v0.7 → v0.8(NEAR)
변경:  v0.8-hackathon(NEAR) → v0.5 → v0.6 → v0.7
```

NEAR 연동(v0.8)은 v0.5~v0.7과 기술적으로 독립적이므로 v0.4 위에서 바로 구현 가능하다.

---

## 2. 구현 범위

### In Scope (해커톤 필수)

| # | 항목 | 근거 |
| :- | :--- | :--- |
| 1 | `near-sdk-js` 스마트 컨트랙트 — 봇 등록 + 매칭 결과 기록 | NEAR_ANALYSIS Part 4 ✅ |
| 2 | NEAR 테스트넷 배포 | 데모 필수 |
| 3 | `near-api-js v7` 서버 연동 — 매칭 결과 온체인 제출 | NEAR_ANALYSIS Part 7 |
| 4 | Bot ID ↔ `.near` 계정 연결 (선택적 흐름) | NEAR_ANALYSIS Part 4 ✅ |

### Out of Scope (해커톤 이후)

| 항목 | 이유 |
| :--- | :--- |
| NEAR Intents 매칭 브로드캐스트 | 구현 복잡도 높음, v0.9로 유지 |
| NEAR Social 봇 프로필 저장 | 우선순위 낮음 |
| FastAuth 신버전 온보딩 | 아직 미출시 |
| 메인넷 배포 | 테스트넷으로 충분 |
| 팬덤 경제 (토큰) | v0.8+ 원래 일정 유지 |

---

## 3. 스마트 컨트랙트 설계 (`contracts/`)

### 3.1 디렉토리 구조

```
contracts/
├── src/
│   └── contract.ts        # near-sdk-js 컨트랙트
├── package.json
└── tsconfig.json
```

### 3.2 컨트랙트 인터페이스

```typescript
// 봇 등록
@call({})
registerBot({ botId, ownerAccount, ownerSummary }: {
  botId: string;
  ownerAccount: string;   // .near 계정 (선택, 미설정 시 UUID 유지)
  ownerSummary: string;   // 성장 데이터 요약 (개인정보 제외)
}): void

// 매칭 결과 기록
@call({})
recordMatch({ matchId, botAId, botBId, score, summary }: {
  matchId: string;
  botAId: string;
  botBId: string;
  score: number;          // Judge LLM 점수 (0~100)
  summary: string;        // 매칭 요약 (match_signals)
}): void

// 봇 조회
@view({})
getBot({ botId }: { botId: string }): BotRecord | null

// 봇의 매칭 이력 조회
@view({})
getMatchHistory({ botId }: { botId: string }): MatchRecord[]
```

### 3.3 데이터 구조

```typescript
interface BotRecord {
  botId: string;
  ownerAccount: string;
  ownerSummary: string;
  registeredAt: number;   // block timestamp
}

interface MatchRecord {
  matchId: string;
  botAId: string;
  botBId: string;
  score: number;
  summary: string;
  recordedAt: number;     // block timestamp
}
```

---

## 4. 서버 연동 (`server/src/services/nearService.ts`)

### 4.1 역할

- `near-api-js v7`로 테스트넷 컨트랙트 호출
- `POST /sync` 완료 시 → `registerBot()` 호출
- `POST /match/start` score ≥ 70 시 → `recordMatch()` 호출

### 4.2 환경변수 추가

```env
# server/.env
NEAR_NETWORK=testnet                          # testnet | mainnet
NEAR_CONTRACT_ID=chooncme.testnet             # 배포된 컨트랙트 계정
NEAR_ACCOUNT_ID=chooncme-server.testnet       # 서버 서명 계정
NEAR_PRIVATE_KEY=ed25519:...                  # FunctionCall 키 (제한된 권한)
```

### 4.3 주요 함수

```typescript
// nearService.ts
export async function registerBotOnChain(profile: AgentProfile): Promise<void>
export async function recordMatchOnChain(result: MatchResult): Promise<void>
export function isNearConfigured(): boolean   // 환경변수 미설정 시 false → silent skip
```

**미설정 시 동작**: NEAR 환경변수가 없으면 기존 흐름(이메일 알림)만 실행, 오류 없이 무시.

---

## 5. Bot ID ↔ `.near` 계정 연결

### 흐름

```
팬 최초 실행 시:
  config.json에 nearAccount 필드 없음 → UUID Bot ID로 동작 (기존과 동일)

팬이 .near 계정 입력 시 (선택):
  config.json: { "botId": "uuid", "nearAccount": "fan123.near" }
  POST /sync 시 nearAccount도 서버 전송
  서버 → registerBot({ botId: uuid, ownerAccount: "fan123.near", ... })
```

### UX 구조 확정: 서명 없는 텍스트 입력 (소유권 주장 방식)

`.near` 계정 입력은 **지갑 앱 연동이나 서명(Signature) 과정 없이 단순 텍스트 스트링만 입력받는다.**

```
팬이 입력: "fan123.near"  ← 텍스트 입력만
                ↓
서버가 대납 서명: chooncme-server.testnet 키로 트랜잭션 서명
                ↓
온체인 기록: "botId X의 주인이 fan123.near라고 주장한다 (claim)"
```

| 항목 | 내용 |
| :--- | :--- |
| **입력 방식** | CLI 텍스트 입력 (지갑 앱 불필요) |
| **서명 주체** | 서버 (`chooncme-server.testnet`) — 팬이 서명하지 않음 |
| **온체인 의미** | 소유권 주장 (claim), 소유권 암호학적 증명 (proof)이 아님 |
| **UX 충돌** | 없음 — 팬은 지갑 설치/시드 구문 불필요 |
| **한계** | 타인의 .near 계정명을 입력해도 막을 수 없음 (해커톤 범위에서는 허용) |
| **개선 시점** | v0.9+ — 팬이 직접 지갑 서명으로 소유권 증명 (proof) 방식으로 전환 |

> 해커톤 데모에서는 "투명한 온체인 기록"의 가치를 보여주는 것이 목적이므로 claim 방식으로 충분하다.

### 클라이언트 변경 최소화

- `src/config.ts`: `nearAccount?: string` 필드 추가
- `src/index.ts`: 최초 실행 시 `.near` 계정 입력 프롬프트 (건너뛰기 가능, 텍스트 입력만)
- `src/memory.ts`: `syncToServer`에 `nearAccount` 전달

---

## 6. 배포 범위 (해커톤 기준)

해커톤 데모는 **동작하는 라이브 데모**가 필요하다. 전체 v0.6 배포가 아닌 최소 범위만 진행한다.

| 항목 | 해커톤 전 필요 | 이유 |
| :--- | :---: | :--- |
| NEAR 컨트랙트 → 테스트넷 | ✅ 필수 | NEAR 사용 증명 |
| 매칭 엔진 서버 → Railway | ✅ 필수 | 피치 데이 실시간 데모 안정성 |
| 허브 서버 → Railway | 선택 | 데모에 허브 포함 시 |
| 허브 클라이언트 → Vercel | 선택 | 데모에 3D 허브 포함 시 |
| npm publish | ❌ 불필요 | 해커톤 후 v0.6에서 진행 |
| 커스텀 도메인 | ❌ 불필요 | Railway/Vercel 기본 URL로 충분 |

> 매칭 엔진 서버 Railway 배포는 v0.6 전체 배포의 선행 작업이 되므로, 해커톤 후 v0.6에서 재활용 가능.

---

## 7. 타임라인 (4주)

| 주차 | 기간 | 작업 | 마일스톤 |
| :--- | :--- | :--- | :--- |
| **1주차** | 3/17~3/23 | 컨트랙트 작성 + 테스트넷 배포 | |
| **2주차** | 3/24~3/30 | `nearService.ts` 구현 + 서버 연동 | |
| **3주차** | 3/31~4/13 | 클라이언트 nearAccount 연결 + Railway 배포 + 통합 테스트 | **4/14 Builder Day** (전체 흐름 동작 목표) |
| **4주차** | 4/14~4/17 | 데모 시나리오 완주 + 피치 자료 준비 + 제출 | **4/17 제출 마감** → **4/18 피치** |

---

## 8. 데모 시나리오 (피치용)

```
1. npx chooncme-bot 실행
   → 팬이 .near 계정(fan123.near) 입력 (선택)
   → 춘심이와 대화 (AI Memory)

2. 종료 시 자동 sync
   → 서버: registerBot() 온체인 호출
   → NEAR Explorer: bot 등록 트랜잭션 확인 가능

3. 두 봇 매칭 시작
   → Bot-to-Bot 대화 → Judge LLM score ≥ 70
   → 서버: recordMatch() 온체인 호출
   → NEAR Explorer: 매칭 결과 공개 확인

4. 주인에게 이메일 알림 발송
   → "내 춘심이가 매칭됐어요 — 온체인에서 결과 확인: explorer.near.org/..."
```

**핵심 메시지**: "매칭이 투명하다. 중앙 서버가 아닌 블록체인에 기록된다."

---

## 9. 알려진 제약

| 제약 | 대응 |
| :--- | :--- |
| NEAR 개인키 서버 관리 | FunctionCall 키만 사용 (컨트랙트 특정 메서드만 호출 가능), FullAccess 키 사용 안 함 |
| 테스트넷 안정성 | 테스트넷 장애 시 nearService 자동 skip, 기존 기능 영향 없음 |
| 팬이 .near 계정 없을 경우 | nearAccount 없이도 UUID로 동작 (온보딩 마찰 없음) |
| 컨트랙트 스토리지 비용 | 테스트넷 NEAR 무료 충전 (faucet) |
| **서버 가스비 고갈** | 테스트넷 Faucet 200 NEAR 지급 / 트랜잭션 1회 ~0.001 NEAR / 데모 스케일(수백 회)에서는 고갈 불가. 잔액 확인: `near state chooncme-server.testnet` (NEAR CLI). 해커톤 기간 내 수동 관리로 충분. |
| `.near` 계정 소유권 미검증 | 타인 계정명 입력 가능 (claim 방식 한계). 해커톤 범위에서는 허용. v0.9+에서 지갑 서명 방식으로 전환 예정. |

---

## 10. 구현 완료 기준 (DoD)

- [ ] 컨트랙트 테스트넷 배포 완료 (`chooncme.testnet`)
- [ ] `POST /sync` → `registerBot()` 온체인 호출 확인
- [ ] `POST /match/start` score ≥ 70 → `recordMatch()` 온체인 호출 확인
- [ ] NEAR Explorer에서 두 트랜잭션 조회 가능
- [ ] 매칭 엔진 서버 Railway 배포 완료 (공개 URL 확보)
- [ ] NEAR 환경변수 미설정 시 기존 기능 정상 동작 확인
- [ ] 데모 시나리오 처음부터 끝까지 1회 완주 (배포 환경 기준)

---

## 11. Related Documents

- **Technical_Specs**: [NEAR Protocol 통합 검토](./03_NEAR_PROTOCOL_ANALYSIS.md) — Part 4 구현 근거, Part 7 SDK 버전
- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) — 웹3 인증 설계 원칙
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) — 전체 버전 순서
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) — 구현 작업 목록
