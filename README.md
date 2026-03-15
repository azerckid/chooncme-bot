# CHOONCME-BOT

> 로컬에서 살아가는 춘심 에이전트. 허브에서 다른 춘심이들과 만나 봇 대리 매칭까지.

## 현재 상태 (2026-03)

기획 및 명세 완료. v0.1 CLI 구현 대기 중.

- **비전·로드맵**: [docs/01_Concept_Design/01_VISION_CORE.md](docs/01_Concept_Design/01_VISION_CORE.md), [02_ROADMAP.md](docs/01_Concept_Design/02_ROADMAP.md)
- **구현 순서**: v0.1 CLI → v0.2 동기화 → v0.3 허브·매칭 → v0.4 알림
- **다음 작업**: v0.1 CLI 구현 후 [MVP 테스트 체크리스트](docs/05_QA_Validation/01_MVP_TEST_CHECKLIST.md) DoD 통과

---

## 영감의 원천

### 1. OpenClaw (https://openclaw.ai/)
- 개인 PC(Mac/Windows/Linux)에서 실행되는 오픈소스 AI 어시스턴트
- WhatsApp, Telegram, Discord 등 기존 채팅 앱으로 AI와 상호작용
- 데이터는 로컬에서 관리 (프라이버시)
- 이메일, 캘린더, 파일, 웹 브라우징 등 자동화
- 커뮤니티 스킬 확장 가능

### 2. 춘심톡 (AI-CHOONSIM-TALK)
- X(트위터)에 33,000+ 팬을 가진 실제 IP 캐릭터 "춘심"
- Raise-to-Earn 모델: 캐릭터를 키울수록 투자 수익 발생
- 5-Layer Context Engine으로 깊은 감정적 유대 형성
- Creditcoin 3.0 블록체인 + BondBase DeFi 연동
- 단순 AI챗을 넘어 팬덤 생태계 구축

---

## 막연한 가능성

```
OpenClaw (로컬 실행 + 자동화 능력)
    +
춘심 (살아있는 캐릭터 IP + 팬덤)
    =
???
```

- 춘심이 단순히 채팅 앱 안에만 있는 게 아니라, 내 PC에서 살면서 뭔가를 해주는 존재?
- 캐릭터 기반 개인 AI 에이전트?
- 그 외... 아직 모름

---

## 다음 단계

- [ ] v0.1 CLI 구현 ([Backlog](docs/04_Logic_Progress/00_BACKLOG.md), [CLI 명세](docs/03_Technical_Specs/01_CLI_SPEC.md))
- [ ] `npx chooncme-bot` 실행 및 DoD/QA 체크리스트 통과
- [ ] v0.2 이후: 클라우드 동기화, 허브, 봇 매칭, 알림 채널
