# 허브 씬 에디터 명세
> Created: 2026-03-16
> Last Updated: 2026-03-16

---

> 상태: 명세 작성 완료. 구현 대상: v0.9

---

## 1. 개요

허브 3D 공간에 바닥, 건물, 오브젝트를 배치하기 위한 개발자 전용 씬 에디터.

GLB 파일을 임포트하고 위치/회전/크기를 조절한 뒤 `scene.json`으로 내보낸다.
내보낸 파일을 `hub/client/public/`에 배치하면 허브 실행 시 자동으로 로드된다.

```
개발자
  → /editor 접속
    → GLB 드래그&드롭 또는 임포트 버튼
      → TransformControls로 배치/조절
        → scene.json 다운로드
          → public/models/, public/scene.json에 수동 배치
            → 허브 재시작 시 자동 로드
```

**핵심 원칙**: 유저가 접근할 수 없는 개발자 전용 경로(`/editor`). 별도 인증은 없으나 일반 허브 UI와 완전히 분리한다.

---

## 2. 접근 경로 및 분리 방식

| 항목 | 값 |
| :--- | :--- |
| 에디터 URL | `http://localhost:3001/editor` |
| 허브 URL | `http://localhost:3001` (기존 유지) |
| Next.js 라우트 | `hub/client/src/app/editor/page.tsx` |
| 공유 컴포넌트 | R3F Canvas, Chunsim 모델, Plane — 허브와 독립적으로 사용 |

허브 입장 화면(`page.tsx`)과 라우트가 완전히 분리되므로 기존 허브 코드에 영향이 없다.

---

## 3. 씬 파일 구조

### 3.1 scene.json 스키마

```typescript
interface SceneObject {
  id: string;                    // UUID (에디터 내부 식별자)
  name: string;                  // 표시 이름 (예: "NEAR_BANK", "BUILDING_A")
  src: string;                   // GLB 파일 경로 (예: "/models/bank.glb")
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] — 라디안
  scale: [number, number, number];    // [x, y, z]
}

interface Scene {
  version: string;               // "1.0"
  exported_at: string;           // ISO timestamp
  objects: SceneObject[];
}
```

### 3.2 예시

```json
{
  "version": "1.0",
  "exported_at": "2026-03-16T12:00:00.000Z",
  "objects": [
    {
      "id": "a1b2c3d4",
      "name": "NEAR_BANK",
      "src": "/models/bank.glb",
      "position": [0, 0, -12],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    },
    {
      "id": "e5f6g7h8",
      "name": "BUILDING_A",
      "src": "/models/building_a.glb",
      "position": [8, 0, 5],
      "rotation": [0, 0.785, 0],
      "scale": [2, 2, 2]
    }
  ]
}
```

---

## 4. 에디터 구성

### 4.1 레이아웃

```
┌─────────────────────────────────────────────┐
│  [SCENE EDITOR]  [Import GLB]  [Export JSON] [Load JSON] │  ← 상단 툴바
├──────────────────────────────┬──────────────┤
│                              │ Scene Objects│
│                              │ ─────────── │
│        3D Viewport           │ > NEAR_BANK  │
│    (R3F Canvas + Grid)       │ > BUILDING_A │
│                              │ > FLOOR_TILE │
│   [TransformControls 기즈모]  │              │
│                              │ ─────────── │
│                              │ Properties  │
│                              │ X: 0.00     │
│                              │ Y: 0.00     │
│                              │ Z: 0.00     │
│                              │ ...         │
└──────────────────────────────┴──────────────┘
```

### 4.2 3D 뷰포트

| 기능 | 구현 방법 |
| :--- | :--- |
| 카메라 조작 | `@react-three/drei` `OrbitControls` |
| 그리드 표시 | `@react-three/drei` `Grid` |
| 축 표시 | `@react-three/drei` `GizmoHelper` + `GizmoViewport` |
| 오브젝트 선택 | 클릭 시 `raycaster` 히트 감지 → 선택 상태 |
| 변환 기즈모 | `@react-three/drei` `TransformControls` |
| 변환 모드 전환 | 키보드 단축키 — `W`: translate, `E`: rotate, `R`: scale |

### 4.3 씬 오브젝트 패널 (우측)

- 로드된 오브젝트 목록 표시
- 클릭 시 해당 오브젝트 선택 (뷰포트와 동기화)
- 선택된 항목 하이라이트
- 삭제 버튼 (오브젝트 우측)
- 복제 버튼 (오브젝트 우측)

### 4.4 Properties 패널 (우측 하단)

선택된 오브젝트의 수치 직접 입력:

| 항목 | 입력 필드 |
| :--- | :--- |
| Name | 텍스트 |
| Position | X / Y / Z (소수점 2자리) |
| Rotation | X / Y / Z (도(degree) 단위 입력 → 라디안 변환) |
| Scale | X / Y / Z (기본값 1.0) |

### 4.5 그리드 스냅

- 기본 스냅 단위: 0.5
- 스냅 ON/OFF 토글 버튼 (툴바)
- TransformControls `translationSnap`, `rotationSnap`, `scaleSnap` 옵션 연동

---

## 5. GLB 임포트

### 5.1 방법

| 방법 | 동작 |
| :--- | :--- |
| 드래그&드롭 | 뷰포트 위에 GLB 파일을 드롭 |
| Import 버튼 | 파일 선택 다이얼로그 (`<input type="file" accept=".glb">`) |

### 5.2 처리 흐름

```
GLB 파일 선택
  → FileReader로 ArrayBuffer 읽기
    → URL.createObjectURL(blob)로 임시 URL 생성
      → useLoader(GLTFLoader, tempUrl)로 3D 로드
        → 씬 중앙(0, 0, 0)에 초기 배치
          → 오브젝트 목록에 추가
```

임시 URL은 에디터 세션 동안만 유효. scene.json 내보내기 시 `src` 필드에 파일명(`/models/{파일명}.glb`)을 기록하고, 개발자가 직접 `public/models/`에 GLB 파일을 복사한다.

### 5.3 GLB 로드 실패 처리

- 로드 실패 시 콘솔 경고 + 에디터 UI에 에러 토스트 표시
- 실패한 오브젝트는 목록에서 제외

---

## 6. 내보내기 / 불러오기

### 6.1 내보내기 (Export JSON)

```typescript
// scene.json 생성 → 브라우저 다운로드
const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// <a download="scene.json"> 트리거
```

### 6.2 불러오기 (Load JSON)

- `<input type="file" accept=".json">` 으로 기존 scene.json 로드
- 로드된 오브젝트를 `src` 경로(`/models/*.glb`)로 다시 fetch하여 렌더링
- 경로의 GLB가 없으면 "모델 없음" 플레이스홀더(반투명 박스) 표시

---

## 7. 허브 씬 로드 (런타임)

허브 클라이언트 시작 시 `public/scene.json` 자동 로드:

```typescript
// hub/client/src/components/3d/SceneLoader.tsx
// 1. fetch('/scene.json') — 파일 없으면 조용히 무시
// 2. SceneObject[] 파싱
// 3. 각 오브젝트를 <SceneObject> 컴포넌트로 렌더링
```

`public/scene.json`이 없으면 현재 허브와 동일하게 동작 (하위 호환).

---

## 8. 파일 구조

```
hub/client/
├── src/
│   ├── app/
│   │   └── editor/
│   │       └── page.tsx          # 에디터 진입점 (/editor 라우트)
│   └── components/
│       ├── editor/
│       │   ├── EditorCanvas.tsx  # R3F Canvas + OrbitControls + Grid
│       │   ├── EditorToolbar.tsx # Import / Export / Snap 토글
│       │   ├── ScenePanel.tsx    # 오브젝트 목록 + Properties 패널
│       │   └── SceneObjectItem.tsx # 단일 오브젝트 렌더링 + TransformControls
│       └── 3d/
│           └── SceneLoader.tsx   # 허브 런타임 scene.json 로더
├── public/
│   ├── scene.json                # 에디터 내보내기 결과 (배치 후)
│   └── models/                  # GLB 파일 보관
│       ├── bank.glb
│       └── building_a.glb
```

---

## 9. 의존성

에디터 구현에 추가로 필요한 패키지:

| 패키지 | 용도 | 설치 여부 |
| :--- | :--- | :--- |
| `@react-three/drei` | TransformControls, OrbitControls, Grid, GizmoHelper | 기설치 |
| `three` | GLTFLoader, raycaster | 기설치 |
| `uuid` | 오브젝트 ID 생성 | 확인 필요 |

추가 설치 불필요 — 허브 클라이언트 기존 의존성으로 구현 가능.

---

## 10. 개발 단계

| 단계 | 내용 |
| :--- | :--- |
| **v0.9-A** | `/editor` 라우트 + 기본 뷰포트 (OrbitControls, Grid, GizmoHelper) |
| **v0.9-B** | GLB 임포트 (드래그&드롭 + 버튼) + TransformControls |
| **v0.9-C** | 씬 패널 (목록, 선택, 삭제, 복제) + Properties 수치 입력 |
| **v0.9-D** | scene.json 내보내기/불러오기 + 그리드 스냅 |
| **v0.9-E** | 허브 런타임 SceneLoader (scene.json 자동 로드) |

---

## 11. 알려진 한계 (v0.9 기준)

| 한계 | 이유 | 해결 시점 |
| :--- | :--- | :--- |
| GLB를 서버에 자동 업로드 불가 | 브라우저 보안 정책 | 서버 파일 업로드 API 추가 시 |
| 서버 재시작 없이 씬 반영 불가 | public/ 정적 파일 방식 | Hot-reload 또는 API 기반 동적 로드 도입 시 |
| 인증 없음 | 개발 전용 도구 | 배포 환경에서 IP 제한 또는 기본 인증 추가 |
| Undo/Redo 없음 | 복잡도 | v0.9 이후 |

---

## 12. Related Documents

- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) - 전체 시스템 구성 및 허브 서버 구조
- **Technical_Specs**: [Hub Experience Spec](./09_HUB_EXPERIENCE_SPEC.md) - 허브 공간 경험 설계 (배치 대상 오브젝트 맥락)
- **Technical_Specs**: [Bot Presence Spec](./05_BOT_PRESENCE_SPEC.md) - 봇 자율 아바타 (씬에 상주하는 봇)
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - v0.9 구현 항목
