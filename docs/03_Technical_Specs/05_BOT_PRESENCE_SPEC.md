# Bot Presence (봇 자율 아바타) 명세
> Created: 2026-03-15
> Last Updated: 2026-03-15

---

> 상태: 명세 완료. 구현 대상: v0.5

---

## 1. 개요

팬(주인)이 오프라인이어도 내 춘심봇이 허브에 아바타로 상주하며 자율 이동한다.

```
주인 A (오프라인)
  → 마지막 sync 완료
    → botPresenceService.connect("bot-uuid-a")
      → 허브 서버에 Socket.io 클라이언트로 자동 접속
        → "[봇] A의 춘심이" 아바타로 3D 공간 등장
          → 3~8초마다 랜덤 이동
```

**핵심 가치**: 주인이 앱을 켜지 않아도 내 춘심이는 허브에 살아있다.

---

## 2. 트리거 시점

| 이벤트 | 동작 |
| :--- | :--- |
| `POST /sync` 완료 (클라이언트 종료 시) | 해당 botId 자동 허브 접속 시도 |
| 서버 재시작 | 재접속 없음 (in-memory 한계 — DB 도입 시 개선) |
| 주인이 허브에 직접 접속 | 봇 연결 유지 또는 disconnect (정책 결정 필요) |

---

## 3. 구현 구조

### 3.1 서버 측 (`server/src/services/botPresenceService.ts`)

```typescript
interface BotPresenceEntry {
  botId: string;
  socket: Socket;           // socket.io-client 인스턴스
  moveInterval: NodeJS.Timeout;
  position: { x: number; y: number; z: number };
}

const activeBots = new Map<string, BotPresenceEntry>();

// 봇 허브 접속
export async function connectBot(botId: string, nickname: string): Promise<void>

// 봇 허브 이탈
export async function disconnectBot(botId: string): Promise<void>

// 현재 접속 중인 봇 목록
export function getActiveBotIds(): string[]
```

### 3.2 자율 이동 로직

```
초기 위치: 랜덤 (x: -10~10, z: -10~10, y: 0)
이동 간격: 3000~8000ms 랜덤
목표 지점: 현재 위치 ±3 범위 내 랜덤
이동 방식: 즉시 텔레포트 (애니메이션은 클라이언트가 보간)
액션 상태: "Idle" 고정 (Run 애니메이션은 주인 직접 조작 시에만)
```

### 3.3 봇 식별

| 항목 | 값 |
| :--- | :--- |
| 닉네임 | `[봇] {owner_summary 앞 10자}` |
| botId | 실제 UUID 그대로 |
| 허브 아이콘 | 클라이언트 측에서 봇 여부 표시 (추후) |

---

## 4. 허브 서버 변경 사항

봇 클라이언트는 일반 플레이어와 동일한 Socket.io 이벤트를 사용하므로 **허브 서버 변경 불필요**.

단, 봇 식별을 위해 `join` 페이로드에 `isBot: true` 플래그 추가 권장:

```typescript
// hub/server join 이벤트 처리
socket.on("join", (data: { nickname: string; botId?: string; isBot?: boolean; ... }) => {
  // isBot=true인 경우 별도 로깅 또는 카운트
})
```

---

## 5. 허브 클라이언트 변경 사항 (선택)

봇 아바타를 시각적으로 구분하면 UX 향상.

| 변경 항목 | 내용 |
| :--- | :--- |
| 이름표 색상 | 봇: 분홍색, 사람: 흰색 |
| 이름표 아이콘 | 봇: 🤖 접두사 |
| 접속자 목록 | 봇/사람 구분 표시 |

구현 시점: 봇 presence 서버 구현 완료 후.

---

## 6. 연결 관리

### 6.1 중복 연결 방지

같은 botId가 이미 `activeBots`에 있으면 재연결 skip.

### 6.2 재연결 (reconnection)

socket.io-client 기본 재연결 옵션 활용:
```typescript
reconnectionAttempts: 5,
reconnectionDelay: 2000,
```

### 6.3 봇 수 제한

서버 부하 방지:
```
MAX_ACTIVE_BOTS = 50  (기본값)
```

초과 시 가장 오래된 봇 자동 disconnect.

---

## 7. 알려진 한계 (v0.5 기준)

| 한계 | 이유 | 해결 시점 |
| :--- | :--- | :--- |
| 서버 재시작 시 봇 연결 초기화 | in-memory 저장 | DB 도입 시 (v0.6+) |
| 봇 이동이 단순 랜덤 | AI 기반 이동 패턴 미구현 | v0.6+ |
| 봇끼리 대화 불가 | Bot-to-Bot은 `/match/start` 통해서만 | 현재 명세 유지 |

---

## 8. 설정값 요약

| 파라미터 | 기본값 | 설명 |
| :--- | :--- | :--- |
| `HUB_SERVER_URL` | `http://localhost:5050` | 봇이 접속할 허브 서버 |
| `BOT_MOVE_MIN_MS` | 3000 | 이동 최소 간격 |
| `BOT_MOVE_MAX_MS` | 8000 | 이동 최대 간격 |
| `BOT_MOVE_RANGE` | 3 | 이동 최대 거리 (단위) |
| `MAX_ACTIVE_BOTS` | 50 | 동시 활성 봇 수 제한 |

---

## 9. 구현 단계

| 버전 | 내용 |
| :--- | :--- |
| v0.1~v0.4 | 해당 없음 |
| **v0.5** | botPresenceService 구현, /sync 트리거 연동, 자율 이동 |
| v0.6+ | AI 기반 이동 패턴, DB 연동으로 서버 재시작 후 복구 |

---

## 10. Related Documents

- **Concept_Design**: [Vision & Core Concept](../01_Concept_Design/01_VISION_CORE.md) - 섹션 3.2 춘심 허브
- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) - 클라우드 에이전트 구조
- **Technical_Specs**: [Bot-to-Bot Spec](./04_BOT_TO_BOT_SPEC.md) - 봇 간 매칭 대화
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md)
