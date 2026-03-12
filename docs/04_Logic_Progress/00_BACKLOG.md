# Backlog
> Created: 2026-03-11 03:00
> Last Updated: 2026-03-11 03:00

---

## 현재 진행

없음. 구현 시작 대기 중.

---

## 예정 작업 — MVP v0.1

### 환경 세팅
- [ ] Node.js + TypeScript 프로젝트 초기화
- [ ] Anthropic SDK 설치
- [ ] tsconfig 설정
- [ ] package.json bin 설정 (npx 실행)

### 핵심 구현
- [ ] `persona.ts` — 춘심톡 CORE_CHUNSIM_PERSONA 이식
- [ ] `agent.ts` — Claude API 연결, 대화 히스토리 관리
- [ ] `display.ts` — 터미널 출력 포맷 (춘심 이름 표시 등)
- [ ] `index.ts` — readline 루프, 진입점

### 완료 기준
- [ ] `npx chooncme-bot` 으로 실행
- [ ] 춘심이와 터미널에서 대화 가능
- [ ] 세션 내 대화 맥락 유지
- [ ] exit / Ctrl+C 로 종료

---

## 완료

없음.

---

## Related Documents

- **Technical_Specs**: [CLI 기술 명세](../03_Technical_Specs/01_CLI_SPEC.md) - 구현 명세
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) - 전체 로드맵
