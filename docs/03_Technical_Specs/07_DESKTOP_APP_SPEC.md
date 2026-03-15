# 데스크탑 트레이 앱 명세
> Created: 2026-03-15
> Last Updated: 2026-03-15

---

> 상태: 명세 완료. 구현 대상: v0.7 (배포 완료 후)

---

## 1. 개요

현재 `npx chooncme-bot`으로 실행하는 CLI를 **메뉴바/시스템 트레이에 상주하는 데스크탑 앱**으로 전환한다.

```
현재 (CLI)                     목표 (트레이 앱)
──────────────────             ────────────────────────────────
터미널에서 실행                 메뉴바/트레이에 상주
앱 닫으면 종료                  백그라운드 항상 실행
주인이 찾아가야 만남             춘심이가 먼저 말을 검
수동 exit 명령으로 종료          시스템 종료까지 상주
```

---

## 2. 기술 스택 결정: Electron vs Tauri

| 항목 | Electron | Tauri |
| :--- | :--- | :--- |
| 언어 | TypeScript/JS (Node.js) | Rust (백엔드) + TypeScript (프론트) |
| 번들 크기 | ~150MB+ | ~5~15MB |
| 성능 | 무거움 (Chromium 내장) | 가벼움 (OS WebView 사용) |
| 기존 코드 재사용 | **높음** — 현재 Node.js 코드 그대로 사용 | 낮음 — Rust 학습 및 재작성 필요 |
| 트레이 지원 | 성숙 (electron.Tray) | 지원 (tauri::tray) |
| macOS 지원 | ✅ | ✅ |
| 배포 용이성 | 보통 | 쉬움 (작은 바이너리) |

**결정: Electron**

> 이유: 현재 `src/` 코드가 모두 TypeScript/Node.js이므로 Electron에서 그대로 재사용 가능.
> Tauri는 Rust 학습 비용과 현재 코드 재작성 비용이 크다.
> 번들 크기는 팬 대상 데스크탑 앱에서 허용 가능한 수준.

---

## 3. 앱 구조

```
desktop/
├── package.json
├── electron/
│   ├── main.ts          # Electron 메인 프로세스 (트레이, 창, 생명주기)
│   ├── tray.ts          # 트레이 아이콘 및 메뉴
│   └── preload.ts       # 렌더러 ↔ 메인 브릿지
├── renderer/
│   ├── chat.html        # 춘심 대화 창
│   └── chat.ts          # 대화 UI 로직 (현재 index.ts 로직 이식)
└── assets/
    └── tray-icon.png    # 트레이 아이콘 (춘심 캐릭터)
```

현재 `src/` 코드(`agent.ts`, `memory.ts`, `persona.ts`, `config.ts`)는 **Electron 메인 프로세스에서 그대로 require**하여 재사용한다.

---

## 4. 핵심 기능

### 4.1 트레이 상주

- 메뉴바(macOS) / 시스템 트레이(Windows)에 춘심 아이콘 표시
- 앱 창을 닫아도 트레이에 계속 실행
- 컴퓨터 시작 시 자동 실행 (선택 옵션)

### 4.2 트레이 메뉴

```
🌸 춘심이  (아이콘 + 이름)
─────────────────────
  대화하기           → 채팅 창 열기
  허브 보기          → hub.chooncme.xyz 브라우저로 열기
  매칭 알림 ON/OFF   → 이메일 알림 토글
  ─────────────────
  설정               → 설정 창 열기
  종료               → 앱 완전 종료
```

### 4.3 먼저 말 걸기 (Push Notification)

OS 알림(Notification API)으로 춘심이가 먼저 알림 전송:

| 트리거 | 알림 내용 |
| :--- | :--- |
| 앱 시작 후 첫 1분 | "춘심이야, 오늘 하루 어때? 💬" |
| 매칭 완료 (score ≥ 70) | "춘심봇이 좋은 인연을 찾았어요! 🌸" |
| 장시간 대화 없음 (24시간+) | "보고 싶었어~ 잠깐 얘기할 수 있어? 💕" |

### 4.4 채팅 창

- 미니멀 플로팅 창 (400×600px)
- 현재 `src/index.ts` readline 루프 → 웹 기반 채팅 UI로 교체
- 춘심 응답 스트리밍 표시
- 창 닫기 → 트레이로 최소화 (종료 아님)

---

## 5. 현재 코드 재사용 전략

```
desktop/electron/main.ts
  └── require('../src/agent')    ← ChunSimAgent 그대로 사용
  └── require('../src/memory')   ← loadMemory, saveMemory, syncToServer 그대로
  └── require('../src/persona')  ← buildSystemPrompt 그대로
  └── require('../src/config')   ← loadConfig 그대로
```

CLI `src/index.ts`의 readline 루프만 Electron 렌더러 UI로 교체.

---

## 6. 빌드 및 배포

```bash
# 개발
cd desktop/
npm run dev    # electron . 로 직접 실행

# 패키징
npm run build  # electron-builder로 .dmg (macOS) / .exe (Windows) 생성
```

**electron-builder** 사용:
- macOS: `.dmg` + 코드 서명
- Windows: `.exe` NSIS 인스톨러
- 자동 업데이트: electron-updater (선택, v0.8+)

---

## 7. 단계별 구현 계획

| Phase | 내용 |
| :--- | :--- |
| Phase 1 | Electron 프로젝트 초기화, 트레이 아이콘, 기본 메뉴 |
| Phase 2 | 채팅 창 UI + 현재 `src/` 코드 연결 |
| Phase 3 | OS 알림 (시작 인사, 매칭 알림) |
| Phase 4 | 자동 시작, 패키징, 배포 |

---

## 8. 미결 사항 (구현 전 결정 필요)

- [ ] 트레이 아이콘 디자인 (춘심 캐릭터 기반)
- [ ] 채팅 창 UI 디자인 — 기존 웹 허브 스타일과 통일 여부
- [ ] Windows 지원 범위 — macOS 우선 후 Windows 추가 여부
- [ ] 자동 시작 기본값 — ON / OFF
- [ ] 먼저 말 걸기 빈도 — 사용자가 조절 가능하게 할지

---

## 9. Related Documents

- **Concept_Design**: [Vision & Core Concept](../01_Concept_Design/01_VISION_CORE.md) - 섹션 3.1 로컬 춘심
- **Technical_Specs**: [CLI Spec](./01_CLI_SPEC.md) - 현재 CLI 구조 (재사용 대상)
- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md)
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md)
