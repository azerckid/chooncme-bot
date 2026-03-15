# 배포 명세
> Created: 2026-03-15
> Last Updated: 2026-03-15

---

> 상태: 명세 완료. 구현 대상: v0.6 (봇 자율 아바타 완료 후)

---

## 1. 개요

현재 모든 서비스가 `localhost`에서만 동작한다.
배포 단계에서는 팬이 실제 인터넷으로 접속 가능한 URL을 확보한다.

```
현재 (로컬)                    배포 후 (인터넷)
──────────────────             ──────────────────────────────────
localhost:3000  매칭 엔진  →   api.chooncme.xyz
localhost:5050  허브 서버  →   hub.chooncme.xyz (WebSocket)
localhost:3001  허브 클라  →   chooncme.xyz (Vercel)
npx chooncme-bot               npx chooncme-bot (서버 URL만 변경)
```

---

## 2. 서비스별 배포 대상

| 서비스 | 현재 위치 | 배포 플랫폼 | 이유 |
| :--- | :--- | :--- | :--- |
| `chooncme-server` (매칭 엔진) | `server/` | Railway | Node.js + 장시간 실행 + 저렴 |
| `chooncme-hub-server` (Socket.io) | `hub/server/` | Railway (별도 서비스) | WebSocket 지원 필수 |
| `chooncme-hub-client` (Next.js) | `hub/client/` | Vercel | Next.js 최적화 |
| `chooncme-bot` CLI | 사용자 로컬 | npm 패키지 배포 | 사용자가 설치 |

> **Vercel 대안**: Fly.io (WebSocket 지원 + 무료 티어 있음)
> **Railway 대안**: Render, Fly.io

---

## 3. 환경 변수

### 3.1 `chooncme-server` (매칭 엔진)

```env
ANTHROPIC_API_KEY=...          # Claude API 키 (필수)
PORT=3000                      # Railway가 자동 설정
SMTP_HOST=smtp.gmail.com       # 이메일 알림 (선택)
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

### 3.2 `chooncme-hub-server`

```env
PORT=5050
MATCH_ENGINE_URL=https://api.chooncme.xyz   # 매칭 엔진 주소
HUB_SERVER_URL=https://hub.chooncme.xyz     # 자기 자신 (botPresence용)
```

### 3.3 `chooncme-hub-client`

```env
NEXT_PUBLIC_SOCKET_URL=https://hub.chooncme.xyz   # 허브 서버 WebSocket
```

### 3.4 `chooncme-bot` CLI (사용자 설정)

```env
ANTHROPIC_API_KEY=...
```

`~/.chooncme/config.json`:
```json
{
  "botId": "uuid",
  "serverUrl": "https://api.chooncme.xyz",
  "ownerEmail": "fan@example.com"
}
```

---

## 4. 배포 절차

### STEP 1: Railway 프로젝트 생성

```bash
# Railway CLI 설치
npm install -g @railway/cli
railway login

# 매칭 엔진
cd server/
railway init    # 새 프로젝트 생성
railway up      # 배포

# 허브 서버
cd hub/server/
railway init
railway up
```

### STEP 2: Vercel 배포 (허브 클라이언트)

```bash
cd hub/client/
npx vercel --prod
# NEXT_PUBLIC_SOCKET_URL 환경변수 설정
```

### STEP 3: 도메인 연결 (선택)

Railway/Vercel에서 커스텀 도메인 설정:
- `api.chooncme.xyz` → Railway 매칭 엔진
- `hub.chooncme.xyz` → Railway 허브 서버
- `chooncme.xyz` → Vercel 허브 클라이언트

도메인이 없으면 Railway/Vercel 기본 제공 URL 사용 가능.

### STEP 4: npm 패키지 배포 (`chooncme-bot`)

```bash
cd /   # 루트 (src/ 포함)
npm publish --access public
```

팬이 다음 명령으로 설치:
```bash
npx chooncme-bot
```

---

## 5. CORS 설정

배포 후 클라이언트 도메인을 허브 서버 CORS에 등록:

```typescript
// hub/server/src/index.ts
const io = new Server(server, {
  cors: {
    origin: ["https://chooncme.xyz", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});
```

---

## 6. 헬스체크 & 모니터링

| 엔드포인트 | 역할 |
| :--- | :--- |
| `GET /health` (매칭 엔진) | Railway 헬스체크 |
| `GET /health` (허브 서버) | Railway 헬스체크 |

Railway는 `/health` 200 응답으로 서비스 상태를 판단한다. 두 서버 모두 이미 구현되어 있음.

---

## 7. 비용 예상 (Railway 기준)

| 서비스 | 월 예상 비용 |
| :--- | :--- |
| 매칭 엔진 서버 | $5 내외 (트래픽 적을 때) |
| 허브 서버 | $5 내외 |
| 허브 클라이언트 (Vercel) | 무료 (Hobby 플랜) |
| **합계** | **~$10/월** |

> Claude API 비용은 별도 (Bot-to-Bot 매칭 1회당 약 $0.01~0.05 추정)

---

## 8. 알려진 이슈

| 이슈 | 대응 |
| :--- | :--- |
| in-memory 저장소 → 서버 재시작 시 데이터 초기화 | DB 도입 전까지 Railway 자동 재시작 최소화 |
| WebSocket + Railway 유료 플랜 필요 여부 | Fly.io로 대체 가능 |
| Bot-to-Bot 대화 중 서버 재시작 | 매칭 상태 `failed`로 처리됨 (현재 허용) |

---

## 9. Related Documents

- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md)
- **Technical_Specs**: [CLI Spec](./01_CLI_SPEC.md) - serverUrl 설정
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md)
