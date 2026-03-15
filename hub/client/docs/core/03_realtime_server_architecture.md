# 03_realtime_server_architecture.md

## 1. 개요 (Overview)
본 문서는 메타버스 프로젝트의 핵심 기능인 **실시간 상호작용(Real-time Interaction)**을 구현하기 위한 서버 아키텍처 전략과 기술 스택 선정 배경을 정의합니다.

## 2. 분리형 서버 아키텍처 도입 배경 (Why Separate Server?)

### A. 기술적 한계 극복 (Serverless Limitations)
- 현재 Front-end가 배포될 **Next.js/Vercel 환경**은 Serverless(FaaS) 기반입니다.
- Serverless는 요청 처리 후 인스턴스가 즉시 종료되므로, WebSocket과 같은 **지속적 연결(Persistent Connection)**을 유지하는 데 부적합합니다.
- 따라서, 연결을 끊지 않고 데이터를 지속적으로 중계할 수 있는 **Stateful Node.js Server**가 별도로 필요합니다.

### B. 성능 최적화 및 역할 분리 (Performance)
| 구분 | Front-end Client (Next.js) | Back-end Game Server (Node.js) |
| :--- | :--- | :--- |
| **주 역할** | 3D 렌더링, UI/UX, 에셋 로딩, 입력 처리 | 위치 좌표 중계, 채팅 브로드캐스팅, 접속 상태 관리 |
| **데이터 특성** | 정적 에셋(이미지, 모델), 1회성 API 요청 | 초고빈도 데이터 패킷 (초당 30~60회 좌표 동기화) |
| **부하 영향** | 클라이언트 GPU/CPU 자원 사용 | 서버 I/O 및 네트워크 대역폭 사용 |

- 위치 동기화 데이터는 트래픽이 매우 높습니다. 이를 웹 서버와 분리함으로써, 게임 로직 부하가 웹사이트 접속 속도에 영향을 주지 않도록 격리합니다.

## 3. 기술 스택 선정 및 대안 분석 (Technical Decision Record)

왜 **Node.js + Socket.io**가 최선의 선택인가?

### A. 선정 이유 (Best Pragmatic Choice)
1.  **언어 통일성 (TypeScript Synergy)**:
    - Frontend(Next.js)와 Backend(Game Server) 모두 TypeScript를 사용하여 **타입 정의(Interfaces)를 공유**할 수 있습니다.
    - 데이터 구조 불일치로 인한 런타임 에러를 방지하고 개발 생산성을 극대화합니다.
2.  **적절한 성능 (Performance Fit)**:
    - 0.001초를 다투는 FPS 게임이 아닌 **소셜 메타버스** 환경에서는 Socket.io의 오버헤드가 사용자 경험에 지장을 주지 않습니다.
    - Redis Adapter를 활용하면 수평 확장(Scale-out)도 용이합니다.
3.  **안정성 (Stability)**:
    - 자동 재접속(Reconnection), 룸(Room) 관리 등 복잡한 네트워크 예외 처리가 기본 내장되어 있어 안정적인 서비스 구축이 가능합니다.

### B. 대안 비교 (Alternatives Consideration)
- **Golang / Rust**: 동시 접속자가 10만 명 이상일 경우 유리하나, 현재로서는 개발 속도와 유지보수성 측면에서 TypeScript 스택이 우위입니다.
- **WebRTC**: P2P 통신으로 서버 비용이 절약되나, 보안(Cheating) 취약점과 클라이언트 부하(Mesh Network) 문제로 제외합니다.
- **SaaS (Photon/Liveblocks)**: 초기 구축은 쉬우나, 유저 증가 시 비용 폭증 및 로직 커스터마이징 제약이 있어 제외합니다.

## 4. 제안 아키텍처 (Proposed Architecture)

### System Design
```
[User Client A] <─── WebSocket (Socket.io) ───> [User Client B]
       │                                            │
       │ (1) Connect & Auth                         │
       ▼                                            ▼
[ Front-end Server (Next.js 15) ]       [ Game Server (Node.js + Socket.io) ]
- UI Rendering (React 19)               - Real-time Relay (Broadcasting)
- Asset Hosting (Vercel CDN)            - Room Management (Namespace)
- Authentication (NextAuth)             - Chat History (Redis/Memory)
```

### Tech Stack for Game Server
- **Runtime**: Node.js (LTS Version)
- **Framework**: Express.js (가벼운 HTTP 래핑)
- **Real-time Engine**: Socket.io (WebSocket 프로토콜 추상화 및 룸 관리)
- **Language**: TypeScript (Type Safety for Packets)
- **Deployment**: AWS EC2, Railway, or Heroku (Long-running process 지원)

## 5. 구현 로드맵 (Implementation Plan)

### Step 1: 프로젝트 셋업
- 별도의 저장소 또는 `packages/server` 형태의 모노레포 구조 생성.
- `package.json`, `tsconfig.json` 등 기본 Node.js + TypeScript 환경 구성.

### Step 2: 핵심 로직 구현
- **Connection**: 클라이언트 접속 처리 및 고유 ID(Socket ID) 할당.
- **Position Sync**: `playerMove` 이벤트 수신 시, 해당 룸의 다른 유저들에게 좌표 `broadcast`.
- **User Management**: 접속/해제(`disconnect`) 시 유저 목록 관리 및 클라이언트에 알림.

### Step 3: 데이터 최적화 (Optimization)
- **Tick Rate 조정**: 서버가 클라이언트에 데이터를 보내는 빈도를 조절하여(예: 30fps) 대역폭 절약.
- **Data Compression**: JSON 대신 경량화된 데이터 구조 사용 고려.

## 5. 결론
이러한 **이원화된 아키텍처(Dual Architecture)**는 메타버스 서비스의 표준이며, 향후 대규모 사용자를 수용하기 위한 필수적인 기반입니다. Next.js는 최고의 웹 경험을, Socket Server는 최고의 실시간 경험을 제공하는 데 각각 집중하게 됩니다.
