# Backlog
> Created: 2026-03-11 03:00
> Last Updated: 2026-03-15

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
- [ ] `memory.ts` — 세션 요약 저장/로드, System Prompt 주입 (`~/.chooncme/memory.json`). 저장 필드는 [User Pattern Collection](../01_Concept_Design/04_USER_PATTERN_COLLECTION.md) §3.1(v0.1 수집 항목)과 정합성 유지
- [ ] `display.ts` — 터미널 출력 포맷 (춘심 이름 표시 등)
- [ ] `index.ts` — readline 루프, 진입점

### 완료 기준 (DoD)
- [ ] `npx chooncme-bot` 으로 실행
- [ ] 춘심이와 터미널에서 대화 가능
- [ ] 세션 내 대화 맥락 유지
- [ ] **재실행 후에도 이전 대화 기억 (AI Memory)**
- [ ] exit / Ctrl+C 로 종료
- [ ] QA 체크리스트 전항목 통과 → `05_QA_Validation/01_MVP_TEST_CHECKLIST.md`

---

## 미래 버전 아이디어 (v0.2+)

### 라이프 패턴 수집 — 칸반 보드
> 아이디어 출처: 2026-03-14 기획 대화

**개념**: 태스크 관리 칸반 보드를 제공해서 사용자의 라이프 패턴을 수동적으로 수집.
대화 데이터(주관적)와 행동 데이터(객관적)를 결합해 정확한 사용자 프로파일 형성.

- [ ] 칸반 보드 UI 설계 (웹 대시보드 또는 TUI)
- [ ] 라이프 패턴 데이터 스키마 정의 (카테고리, 완료율, 활동 시간대, 반복 패턴)
- [ ] 패턴 분석 엔진 — 칸반 행동 데이터 → 성향 벡터 변환
- [ ] 춘심 AI 프로파일에 패턴 데이터 반영
- [ ] 매칭 알고리즘에 라이프 패턴 지표 통합

> 참고: `docs/01_Concept_Design/01_VISION_CORE.md` 섹션 3.4

---

## 완료

없음.

---

## Related Documents

- **Technical_Specs**: [CLI 기술 명세](../03_Technical_Specs/01_CLI_SPEC.md) - 구현 명세
- **Technical_Specs**: [Bot-to-Bot 명세](../03_Technical_Specs/04_BOT_TO_BOT_SPEC.md) - v0.3 봇 간 상호작용
- **QA_Validation**: [MVP 테스트 체크리스트](../05_QA_Validation/01_MVP_TEST_CHECKLIST.md) - DoD 검증
- **Concept_Design**: [Roadmap](../01_Concept_Design/02_ROADMAP.md) - 전체 로드맵
