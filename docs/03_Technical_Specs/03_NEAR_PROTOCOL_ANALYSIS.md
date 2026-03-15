# NEAR Protocol 통합 검토
> Created: 2026-03-14
> Last Updated: 2026-03-16 (v0.4 완료 기준 통합 로드맵 업데이트)

---

> 상태: 검토 완료. v0.4 구현 완료 기준. Web3 통합은 v0.8+ 단계에서 점진적 도입 예정.

---

## 배경

CLAUDE.md에 "Bot ID는 미래에 Web3 지갑 주소로 교체 가능하도록 인터페이스를 추상화할 것"이라고 명시되어 있다. 이 문서는 NEAR Protocol을 구체적인 Web3 레이어 후보로 놓고 장단점을 분석하고, 최신 생태계 현황을 정리한다.

---

## Part 1. 최신 NEAR 기능 및 생태계 조사 (2024~2025)

### 1. NEAR AI 관련 최신 발표

#### NEAR AI Hub (구 NEAR AI, 현재 이전 중)
- NEAR Foundation이 2024년 말~2025년 초에 AI Agent 인프라를 공식 제품으로 출시
- `nearai` GitHub 레포지토리는 **2025년 10월 31일 종료 예정**으로 deprecated 처리됨
- 후속 플랫폼으로 **NEAR AI Private Chat**과 **NEAR AI Cloud**로 이전 중
  - NEAR AI Cloud: 에이전트·모델 호스팅, 분산 실행 인프라
  - NEAR AI Private Chat: 기밀 연산(TEE) 기반 프라이빗 AI 채팅

#### 핵심 구성 요소 (구 nearai 프레임워크 기준)
- **NEAR AI Hub**: 에이전트 등록, 모델 서빙, 에이전트 실행 중앙 플랫폼
- **Agent System**: 에이전트 빌드/실행 도구, 격리된 샌드박스 환경
- **Worker System**: 분산 잡 실행 및 스케줄링
- **TEE Runner**: 기밀 컴퓨팅 환경에서 에이전트·추론 실행
- **AWS Runner**: Lambda 기반 클라우드 에이전트 배포
- **Model Fine-tuning**: 언어 모델 커스터마이징 지원

#### "User-Owned AI" 비전
- NEAR의 공식 AI 전략 키워드
- 사용자가 자신의 AI 에이전트 데이터와 모델 가중치를 소유
- NEAR 계정으로 AI 에이전트 인증 및 소유권 관리
- 현재 docs.near.org 메인 섹션에 "AI Native Infrastructure" 카테고리 독립 운영 중

**참고 링크:**
- https://docs.near.org (AI Native Infrastructure 섹션)
- https://near.ai (NEAR AI 공식 사이트)
- https://github.com/nearai/nearai (deprecated, 2025-10-31 종료 예정)

---

### 2. NEAR Chain Abstraction

NEAR가 2024~2025년 가장 강력하게 밀고 있는 기술 방향. 복잡한 멀티체인 인프라를 개발자와 사용자에게 보이지 않게 추상화한다.

#### 핵심 3요소

**Chain Signatures (가장 중요)**
- NEAR 계정/스마트 컨트랙트가 외부 체인(Bitcoin, Ethereum, Solana 등)의 트랜잭션에 서명 가능
- `v1.signer` 컨트랙트가 서명 요청 수신 (payload, derivation path, domain ID)
- **MPC(Multi-Party Computation) 노드 8개**가 협력하여 단일 노드가 개인키를 갖지 않는 방식으로 서명
- Additive Key Derivation으로 하나의 NEAR 계정에서 여러 외부 체인 주소 파생 가능
- 지원 체인: Bitcoin, Ethereum, Solana, Cosmos, XRP, Aptos, Sui, Polygon, Arbitrum 등 모든 EVM 계열

**NEAR Intents**
- 사용자가 원하는 결과(의도)만 표현하면, Solver 네트워크가 최적 실행 경로를 경쟁적으로 찾아 처리
- 3단계: 인텐트 브로드캐스트 → Solver 경쟁 입찰 → Verifier 스마트 컨트랙트 온체인 검증·정산
- AI 에이전트가 인텐트를 직접 브로드캐스트하는 시나리오를 공식 문서에서 명시
- 단순 토큰 스왑을 넘어 실물 서비스 요청까지 확장 가능한 범용 크로스체인 마켓플레이스

**OmniBridge**
- 토큰 팩토리 + 커스터디언 역할을 통합한 크로스체인 브릿지
- 네이티브 토큰과 브릿지 토큰을 단일 인터페이스로 관리

**참고 링크:**
- https://docs.near.org/build/chain-abstraction/chain-signatures
- https://docs.near.org/chain-abstraction/intents/overview

---

### 3. NEAR FastAuth / 계정 생성 UX 개선

#### 현황 (2025)
- 기존 FastAuth: 이메일 기반 NEAR 계정 생성/복구 SDK
- **현재 버전은 deprecated** 상태
- 신버전 개발 중: **MPC 기술 + Auth0 통합**으로 보안과 편의성 동시 향상 예정
- 핵심 UX 목표: 시드 구문 없이 이메일 인증만으로 NEAR 계정 생성

#### 계정 모델 (봇 ID 설계에 중요)
NEAR는 3가지 계정 타입을 네이티브 지원:
- **Named accounts**: `alice.near` 형태의 human-readable ID
- **Implicit accounts**: 개인키에서 파생된 64자리 해시 주소
- **Ethereum-compatible accounts**: Ethereum 지갑과 호환

추가 특징:
- **Access Key 분리**: FullAccess 키 vs FunctionCall 키를 별도 관리 → 봇이 제한된 권한으로만 동작 가능
- **Key Rotation**: 키가 노출되어도 교체 가능, 계정 영속성 유지
- 가스비가 센트의 수십분의 1 수준 → 봇이 빈번하게 트랜잭션을 보내도 경제적

**참고 링크:**
- https://docs.near.org/tools/fastauth-sdk

---

### 4. NEAR Intents (상세)

위 Chain Abstraction 섹션의 핵심 컴포넌트이므로 상세 정리:

| 구성 요소 | 역할 |
|-----------|------|
| Intent Layer | 사용자/AI 에이전트가 원하는 결과를 표현하는 인터페이스 |
| Solver Network | 오프체인 분산 Solver들이 인텐트 해결 방법을 경쟁적으로 제안 |
| Verifier Contract | 온체인에서 최종 실행을 검증하고 정산하는 스마트 컨트랙트 |

**AI 에이전트와의 연계:**
- 공식 문서에서 "AI agents broadcast intents"를 명시적으로 언급
- 에이전트가 자율적으로 최적의 토큰 스왑, 체인 간 자산 이동 등을 실행 가능
- 춘심봇 맥락: 봇이 매칭 조건을 인텐트로 표현하고, Solver가 최적 매칭 상대를 찾는 구조로 응용 가능

**참고 링크:**
- https://docs.near.org/chain-abstraction/intents/overview

---

### 5. NEAR DA (Data Availability)

#### 개요
- NEAR Protocol의 블록체인 레이어와 분리된 모듈식 데이터 가용성 레이어
- 다른 체인의 L2 롤업이 저렴하게 데이터를 게시하는 용도

#### 작동 원리
1. Blob 데이터를 256바이트 청크로 분할 → Merkle 트리 생성
2. 전체 데이터를 블록체인 상태(state)가 아닌 풀 노드에 ~3일 보관
3. Light Client가 Merkle 증명으로 데이터 포함 여부 검증

#### 주요 특징
- Polygon CDK, Optimism OP Stack, Arbitrum Nitro 통합 지원
- 비용이 매우 저렴한 이유: 샤드당 대용량 블록 공간 + 암호학적 오버헤드 없음 (4MB 할당 = 4MB 실사용)
- NEAR 자체적으로 동적 리샤딩(Nightshade)으로 확장 → 별도 롤업 불필요

**춘심봇 관련성:** 직접적 관련성 낮음. 대화 데이터 저장 인프라로는 부적합(3일 보존). 장기 데이터는 IPFS 또는 중앙 스토리지와 병행 필요.

**참고 링크:**
- https://docs.near.org/build/chain-abstraction/data-availability

---

### 6. AI x Web3 관련 NEAR 생태계 프로젝트

#### 공식 NEAR AI 방향
- **NEAR AI Cloud**: 에이전트·모델 호스팅 플랫폼 (구 NEAR AI Hub 후속)
- **NEAR AI Private Chat**: TEE 기반 프라이빗 AI 대화 서비스

#### 생태계 프로젝트 (awesomenear.com 기준)
- **AIverse** (aiverse.co.in): No-Code AI/AR/VR 앱 생성·연결 플랫폼, AI + 메타버스 융합 마켓플레이스 (춘심봇과 방향성 유사)

#### 주목할 트렌드
- NEAR Foundation의 공식 전략 문서에서 "AI Agent + Chain Abstraction" 조합을 핵심 사용 사례로 명시
- Multi-chain Trustless Agent: 문서에서 직접 예시로 든 빌드 대상
- docs.near.org의 메인 페이지 구성 자체가 AI Native Infrastructure를 독립 카테고리로 운영 (2024 이후 변경)

---

### 7. NEAR JavaScript/TypeScript SDK 최신 버전

#### near-api-js (프론트엔드/Node.js 클라이언트 SDK)

| 버전 | 출시일 | 주요 변경 |
|------|--------|-----------|
| **v7.2.0** | 2025-03-08 | Buffer → Uint8Array 교체 (Web 표준 API 호환), secp256k1을 @noble/curves로 교체 |
| v7.1.1 | 2025-02-13 | 버그 수정 |
| v7.1.0 | 2025-02-04 | 기능 추가 |
| **v7.0.0** | 2025-01 | 여러 `@near-js/*` 패키지를 단일 tree-shakeable `near-api-js`로 통합 |

**v7.0.0 주요 변경점:**
- 분산되어 있던 `@near-js/*` 패키지들을 `near-api-js` 하나로 통합 (import 경로 단순화)
- 강타입 RPC 에러 (`rpc-errors` sub-path)
- `nep413` 모듈: 메시지 서명·검증
- 유틸리티 함수: `teraToGas`, `gigaToGas`, `yoctoToNear`, `nearToYocto`
- `parseSeedPhrase` 메서드 추가
- Account 생성자에서 RPC URL 문자열 직접 수용
- Multi-key signer 지원

**설치:**
```bash
npm install near-api-js
```

**참고 링크:**
- https://github.com/near/near-api-js/releases

#### near-sdk-js (스마트 컨트랙트 개발 SDK)

| 버전 | 출시일 | 주요 변경 |
|------|--------|-----------|
| **v2.0.0** | 2024-06-07 | Borsh 직렬화, TypeDoc 문서 생성, Promise API `build()` 메서드, Alt BN128 암호학 |
| **v1.0.0** | 2024-03-01 | 안정화 릴리즈, FT Standard 및 Storage Management 내장, 가스·스토리지 벤치마크 |
| v0.7.0 | 2024-01-26 | Monorepo(Turborepo), UTF-8 스토리지, ABI CLI 생성, Windows/WSL2 지원 |

**핵심 특징:**
- TypeScript로 NEAR 스마트 컨트랙트 작성 가능 (프로젝트 스택과 일치)
- 레퍼런스 문서: https://near.github.io/near-sdk-js/

**설치:**
```bash
npm install near-sdk-js
```

**참고 링크:**
- https://github.com/near/near-sdk-js/releases
- https://docs.near.org/tools/sdk

---

### 8. NEAR 스마트 컨트랙트에서 AI 연동

#### 현실적 구조
스마트 컨트랙트 자체에서 LLM 추론은 불가능하다. 실제 구조는 다음과 같다:

```
[오프체인 AI 추론 (Claude API)]
       ↕
[NEAR 스마트 컨트랙트] ← 결과 기록, 상태 관리, 소유권 증명
```

#### 컨트랙트에서 AI 연동 패턴

1. **Oracle 패턴**: 오프체인 AI가 결과를 생성 → Oracle이 컨트랙트에 제출 → 컨트랙트가 검증·저장
2. **TEE 패턴**: NEAR AI TEE Runner에서 AI 에이전트 실행 → 결과의 무결성을 TEE 증명으로 검증
3. **Intent 패턴**: AI 에이전트가 Intent를 생성·브로드캐스트 → Solver가 실행 → Verifier 컨트랙트 정산

#### near-sdk-js로 구현 가능한 것
- 봇 등록 및 소유권 기록
- 매칭 결과 온체인 저장
- 성장 지표(친밀도, 대화 횟수) 요약 기록
- Access Key 관리로 봇에 제한된 권한만 부여
- FunctionCall 키로 특정 컨트랙트 메서드만 호출 가능하도록 제한

---

### 9. NEAR Social / BOS (Blockchain Operating System) 현황

#### NEAR Social (social.near)
- 메인넷 컨트랙트 주소: `social.near`
- 탈중앙화 소셜 데이터 스토어 (key-value 구조)
- NEAR 계정 ID가 최상위 키 → 각 계정이 자신의 데이터 소유 및 비용 부담
- `set()` / `get()` / `keys()` API로 읽기·쓰기
- 와일드카드 패턴 지원: `*/widget/*` 으로 모든 계정의 위젯 조회 가능
- 권한 시스템: `grant_write_permission()`으로 특정 계정/키에 쓰기 권한 위임
- GitHub: https://github.com/NearSocial/social-db

#### BOS (Blockchain Operating System)
- 2023년 발표된 NEAR의 탈중앙화 프론트엔드 비전
- NEAR Components: 블록체인에 저장된 React-like 컴포넌트
- 진입점: https://near.social / dev.near.org

#### 2025 현황 평가
- BOS/NEAR Components 관련 문서 경로가 여러 곳에서 404 반환 중 → 문서 재편 진행 중으로 추정
- NEAR Foundation의 현재 공식 포커스는 BOS보다 **Chain Abstraction + AI Agent** 에 더 집중
- NEAR Social 컨트랙트 자체는 여전히 운영 중이며, 소셜 데이터 레이어로 활용 가능

**춘심봇 관련성:**
- 봇 프로필, 성장 데이터, 매칭 이력을 `social.near`에 저장하면 탈중앙화 데이터 레이어로 활용 가능
- 다른 춘심봇들이 `*/chunsim/profile/**` 같은 패턴으로 서로의 데이터를 쿼리하는 구조 구현 가능

---

### 10. NEAR 그랜트 프로그램 현황

#### 현재 운영 중인 그랜트/펀딩 채널

| 프로그램 | 대상 | 특징 | 링크 |
|----------|------|------|------|
| **Protocol Rewards** | 개발 활동 지표가 높은 프로젝트 | 메트릭 기반 투명한 보상 | nearprotocolrewards.com |
| **DevHub Grants** | 개발 도구 및 인프라 | 개발자 지원 중심 | dev.near.org/devhub.near/widget/app |
| **Potlock** | 임팩트 프로젝트 | 기부 + 매칭 펀딩 라운드 | app.potlock.org |
| **Meta Pool Grants** | DeFi, 교육, TVL, 브랜드 | Meta Pool 생태계 성장 초점 | docs.metapool.app |

#### 주요 변화 (2024~2025)
- 과거의 단일 NEAR Foundation Grants 프로그램 → 분산형 여러 채널로 재편
- Protocol Rewards: 실제 온체인 활동(개발 커밋, 사용자 증가)에 연동된 메트릭 기반 보상으로 전환
- AI + Web3 조합 프로젝트에 대한 생태계 관심 높음

**춘심봇 지원 가능성:**
- AI Agent + 팬덤 매칭 + NEAR 통합이라는 조합은 Protocol Rewards, DevHub Grants 지원 조건에 부합할 수 있음
- 한국어 팬덤 대상 Web3 온보딩 UX 프로젝트로 포지셔닝 가능

---

## Part 2. 장점 (기존 분석 유지)

### 1. 봇 ID = NEAR 계정 (가장 큰 시너지)

- `chunsim_fan123.near` 같은 human-readable account ID가 봇 ID로 자연스럽게 맞아 떨어짐
- 현재 설계(UUID → 나중에 Web3 주소 교체)를 NEAR가 가장 깔끔하게 충족
- 계정 = 소유자 = 봇 ID가 하나의 개념으로 통합됨

### 2. 춘심이 소유권 증명

- 성장 데이터(대화 횟수, 친밀도 레벨 등)를 온체인에 기록 → "내 춘심이"가 진짜 팬의 소유물이 됨
- 팬이 플랫폼을 떠나도 데이터가 사라지지 않음
- NFT로 춘심이 자체를 민팅하면 양도·거래도 가능

### 3. 매칭 알고리즘 투명성

- 봇 매칭 로직을 스마트 컨트랙트로 구현 → 조작 불가, 검증 가능
- "왜 이 사람과 매칭됐나"를 온체인에서 누구나 확인 가능
- 중앙 운영자의 신뢰 문제 해소

### 4. TypeScript 스마트 컨트랙트 (`near-sdk-js`)

- 프로젝트 기술 스택(TypeScript)과 동일한 언어로 컨트랙트 작성 가능
- Solidity 대비 학습 곡선이 낮음
- 기존 코드베이스와 언어적 일관성 유지

### 5. NEAR AI 생태계 방향성 일치

- NEAR Foundation이 현재 AI Agent + Web3 방향으로 강하게 드라이브 중
- AI 에이전트 인프라 구축 흐름과 프로젝트 방향이 겹침
- 생태계 그랜트/파트너십 기회 가능성

### 6. 저렴한 수수료 + 빠른 피널리티

- 이더리움 대비 극히 낮은 트랜잭션 비용 → 일상적인 봇 이벤트 기록에 현실적
- ~2초 피널리티 → 실시간 허브 이벤트 기록에 활용 가능
- 샤딩(Nightshade)으로 확장성 확보

---

## Part 3. 단점 (기존 분석 유지)

### 1. UX 마찰 (가장 큰 리스크)

- 일반 팬에게 "NEAR 지갑 만드세요" 요구 시 이탈률 급증 우려
- 춘심 팬층이 Web3 친화적인지 아직 검증되지 않음
- `npx chooncme-bot` 한 줄 실행 vs 지갑 설치·시드 구문 관리 — 온보딩 경험이 완전히 달라짐
- FastAuth 신버전이 아직 출시 전 → 이메일 기반 원활한 온보딩 대기 중

### 2. AI 추론은 여전히 오프체인

- 스마트 컨트랙트 위에서 LLM 추론 불가
- 실제 구조: **온체인 기록 + 오프체인 AI(Claude API)** 혼합 구조
- "탈중앙화 AI"가 아닌 "탈중앙화 데이터 레이어 + 중앙화 AI" 형태

### 3. 대화 데이터 저장 비용

- 대화 전체를 온체인 저장하는 것은 비현실적
- NEAR DA도 ~3일만 보존 → 영구 저장 불가
- 해시/요약본만 온체인, 실데이터는 IPFS나 중앙 DB와 혼용 → 구조 복잡도 증가

### 4. 구현 복잡도 급증

- MVP v0.1은 단순 터미널 CLI인데, Web3 레이어 추가 시 구현 복잡도가 몇 배로 증가
- 컨트랙트 배포, 키 관리, 트랜잭션 서명, 테스트넷/메인넷 환경 관리 등 새로운 개념 학습 필요

### 5. 한국 팬덤 컨텍스트

- 한국에서는 카카오(카이아, 구 클레이튼)가 NEAR보다 훨씬 친숙
- 규제 불확실성: 토큰/NFT 관련 국내 규제 변동 가능성
- NEAR 생태계 규모가 이더리움, 솔라나 대비 작음

### 6. nearai 프레임워크 불안정 (신규 발견)

- NEAR AI 공식 에이전트 프레임워크가 2025-10-31 종료 예정
- 후속 플랫폼(NEAR AI Cloud)으로 전환 중이지만 아직 API/SDK 안정화 미확인
- NEAR AI 도구에 의존하는 컴포넌트를 만들면 마이그레이션 리스크 존재

---

## Part 4. 기능별 NEAR 필요성 매핑 (업데이트)

| 기능 | NEAR 필요성 | 비고 |
|------|:-----------:|------|
| 봇 ID / 소유권 증명 | ✅ 핵심 시너지 | NEAR account = 봇 ID, named account 활용 |
| 매칭 결과 기록 | ✅ 투명성 가치 있음 | near-sdk-js 컨트랙트로 구현 |
| 성장 데이터 소유권 | ✅ 선택적 | 요약본만 온체인, 상세는 NEAR Social |
| NEAR Intents 매칭 | 🔶 흥미로운 아이디어 | v0.3+ 에이전트가 인텐트로 매칭 요청 |
| Chain Signatures | 🔶 선택적 | 멀티체인 지원 시 필요 |
| 팬덤 경제 (토큰 인센티브) | 🔶 선택적 | v0.8+ 고려 |
| NEAR Social 데이터 | 🔶 선택적 | 봇 프로필/이력 저장 용도 |
| AI 대화 자체 | ❌ 불필요 | 오프체인이어야 함 (Claude API) |
| 실시간 허브 인터랙션 | ❌ 부적합 | 너무 느리고 비쌈 |
| 알림 시스템 | ❌ 불필요 | 별도 채널 사용 (KakaoTalk 등) |
| 대화 데이터 전체 저장 | ❌ 불가 | NEAR DA는 3일 보존, 온체인 비용 과다 |

---

## Part 5. 통합 시점 제안 (업데이트)

Web3를 초기부터 강제하면 팬층 진입 장벽이 너무 높아진다. **점진적 도입**이 현실적이다.

### 현재까지 완료된 단계 (Web3 없이)

```
✅ v0.1  로컬 CLI (UUID Bot ID, ID 인터페이스 추상화)
✅ v0.2  클라우드 에이전트 + 자동 sync
✅ v0.3  허브 서버 + 매칭 엔진 (Bot-to-Bot + Judge LLM)
✅ v0.4  알림 채널 (이메일/콘솔)
```

### NEAR 통합 로드맵 (향후)

```
v0.5~v0.7  →  Web3 없이 기능 완성
               - v0.5: 봇 자율 아바타 (허브 자동 상주)
               - v0.6: 배포 (Railway + Vercel + npm)
               - v0.7: 데스크탑 트레이 앱 (Electron)

v0.8      →  NEAR 선택적 연동 시작 (FastAuth 신버전 출시 후)
               - NEAR 지갑 연결 시 Bot ID를 account ID로 승격
               - near-api-js v7.x로 계정 연동
               - 성장 데이터 요약본 온체인 기록 (near-sdk-js v2.0 컨트랙트)
               - UUID 사용 기존 사용자 마이그레이션 경로 제공

v0.9      →  NEAR 본격 통합
               - 봇 매칭 결과 컨트랙트 기록 (투명성)
               - NEAR Intents 실험: 봇이 매칭 인텐트 브로드캐스트
               - NEAR Social에 봇 프로필 저장
               - 팬덤 경제 레이어 설계

v1.0+     →  고급 기능
               - Chain Signatures로 멀티체인 지원 (필요시)
               - NEAR AI Cloud 연동 탐색
```

---

## Part 6. 결론 (업데이트)

NEAR의 방향성(AI + Web3, User-Owned AI)이 프로젝트와 매우 잘 맞고, TypeScript 스택 호환성도 좋다 (near-api-js v7, near-sdk-js v2).

특히 주목할 점:
1. **NEAR Intents + AI Agent 조합**은 봇 간 매칭을 탈중앙화하는 흥미로운 아키텍처를 제공함
2. **near-sdk-js v2.0** 출시로 TypeScript 스마트 컨트랙트 개발이 안정화됨
3. **NEAR AI 생태계 자체가 재편 중** (nearai deprecated, NEAR AI Cloud로 이전) → 안정화 대기 필요
4. **FastAuth 신버전 미출시** → 이메일 기반 원활한 온보딩이 아직 준비 안 됨

중장기적으로 매력적인 선택이지만, 팬층 UX 검증 전 Web3 의존성을 초기에 도입하는 것은 리스크가 크다. **MVP v0.1은 Web3 없이, Bot ID 인터페이스만 추상화해두고 진행**한다. 현재 로드맵 기준으로는 **v0.1~v0.7은 Web3 없이 진행하며, v0.8에서 NEAR 선택 연동을 검토**한다.

---

## Related Documents

- **Concept_Design**: [Vision & Core Concept](../01_Concept_Design/01_VISION_CORE.md) — 프로젝트 비전 및 봇 ID 소유권 개념
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) — 전체 버전 로드맵 및 Web3 도입 시점
- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) — 웹3 인증 설계 원칙 및 봇 ID 추상화
