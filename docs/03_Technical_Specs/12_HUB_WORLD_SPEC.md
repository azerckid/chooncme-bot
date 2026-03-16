# 허브 월드 완성 명세
> Created: 2026-03-16
> Last Updated: 2026-03-16

---

> 상태: 명세 작성 완료.
> 구현 대상: v0.10 (필수) → v0.11 (권장) → v0.12+ (선택)

---

## 1. 개요

씬 에디터(v0.9)로 공간을 구성한 뒤, 실제로 사람이 살 수 있는 허브가 되기 위해 필요한 추가 요소를 정의한다.

| 버전 | 분류 | 내용 |
| :--- | :--- | :--- |
| **v0.10** | 필수 | 플레이어 충돌 감지, 씬별 환경 설정, 씬 전환 로딩 화면 |
| **v0.11** | 권장 | 미니맵, 플레이어 프로필 클릭, 씬 이름 HUD |
| **v0.12** | 선택 | 모바일 가상 조이스틱, 공간 오디오 |
| **v0.13** | 선택 | 캐릭터 커스터마이징, 근거리 채팅, 카메라 모드 전환 |

---

## 2. v0.10 — 필수

### 2.1 플레이어 충돌 감지

**문제**: 씬 에디터로 건물을 배치해도 플레이어가 건물을 통과한다.

**원인**: 현재 충돌 감지는 Cannon.js 바닥면에만 적용. GLB 오브젝트에는 물리 바디가 없다.

**해결 방향**: Raycaster 기반 충돌 감지 (Cannon.js 확장보다 가벼움).

```
매 프레임 이동 전:
  → 이동 방향으로 Raycaster 발사
    → SceneObject 메쉬와 교차 확인
      → 교차 거리 < agentRadius(0.4) → 이동 차단
      → 교차 없음 → 이동 허용
```

| 항목 | 값 |
| :--- | :--- |
| 감지 방향 | 이동 벡터 방향 (전/후/좌/우 4방향) |
| 감지 거리 | `agentRadius` (기본 0.4, NavMesh 파라미터와 동일 값 사용) |
| 대상 메쉬 | SceneLoader로 로드된 SceneObject 메쉬 전체 |
| 제외 대상 | 바닥(Plane), 포털(PortalZone), 다른 플레이어 |

**구현 위치**: `hub/client/src/components/3d/character/Player.tsx` — 이동 로직 내 충돌 체크 추가.

---

### 2.2 씬별 환경 설정

**문제**: 씬마다 분위기가 달라야 하는데, 현재는 전역 조명/하늘 설정만 존재.

**해결**: `scene_XX.json`에 `environment` 필드 추가. 씬 로드 시 자동 적용.

```typescript
interface SceneEnvironment {
  sky: {
    preset: "city" | "sunset" | "dawn" | "night" | "forest" | "warehouse";
    // @react-three/drei Environment preset
  };
  fog?: {
    color: string;   // hex (예: "#c9d5e0")
    near: number;
    far: number;
  };
  ambient_light: {
    intensity: number;  // 기본 2.0
    color: string;      // hex (예: "#ffffff")
  };
  directional_light: {
    intensity: number;
    color: string;
    position: [number, number, number];
  };
  background_color?: string; // 하늘 없이 단색 배경 시 사용
}
```

씬 에디터에서 Environment 패널을 추가해 씬별로 설정하고 내보낸다.

---

### 2.3 씬 전환 로딩 화면

**문제**: 대형 GLB 씬 전환 시 화면이 멈추거나 깜빡임이 발생.

**해결**: 씬 전환 시 로딩 오버레이 표시 → GLB 로드 완료 후 페이드 인.

```
포털 진입
  → 페이드 아웃 (0.3초)
    → 로딩 오버레이 표시 ("씬 이름 로딩 중...")
      → 새 씬 GLB 프리로드
        → 로드 완료
          → 캐릭터 spawn_position에 배치
            → 페이드 인 (0.3초)
              → 로딩 오버레이 제거
```

| 항목 | 내용 |
| :--- | :--- |
| 로딩 UI | 중앙 씬 이름 + 분홍 스피너 |
| 타임아웃 | 10초 초과 시 "로딩 실패" 메시지 + 원래 씬 복귀 |
| 진행 상태 | Three.js `LoadingManager`의 `onProgress` 콜백으로 퍼센트 표시 |

---

## 3. v0.11 — 권장

### 3.1 미니맵

다중 씬 환경에서 현재 위치와 포털 방향을 2D 오버레이로 표시한다.

```
화면 우하단 고정 오버레이
  → 현재 씬의 2D 탑뷰 (씬 바운더리 박스 기준)
  → 내 캐릭터: 분홍 점
  → 다른 플레이어: 흰 점
  → 봇: 분홍 점 (작게)
  → 포털: 분홍 링 아이콘 + 목적지 씬 이름
```

| 항목 | 내용 |
| :--- | :--- |
| 크기 | 160×160px 고정 |
| 배경 | 반투명 블랙 (`rgba(0,0,0,0.6)`) |
| 업데이트 주기 | 100ms (위치 변경 시만) |
| 확대/축소 | 씬 크기에 맞게 자동 스케일 |
| 구현 방법 | HTML Canvas 2D (R3F 외부, CSS 절대 위치) |

---

### 3.2 플레이어 프로필 클릭

다른 캐릭터를 클릭하면 프로필 팝업이 뜨고 매칭 요청을 할 수 있다.

```
캐릭터 클릭 (raycaster 히트)
  → 프로필 팝업 표시
    → 닉네임 / 봇ID / 현재 씬 / 뱃지 목록
    → [매칭 요청] 버튼 → socket.emit("requestMatch", { bot_a_id, bot_b_id })
    → [닫기] 버튼
```

| 항목 | 내용 |
| :--- | :--- |
| 팝업 위치 | 클릭한 캐릭터 위 (`Html` drei 컴포넌트) |
| 봇 여부 표시 | 자율봇이면 "오프라인 봇" 배지 표시 |
| 매칭 요청 가능 조건 | 내 botId가 있고 상대도 botId가 있을 때만 버튼 활성화 |

---

### 3.3 씬 이름 HUD

씬 전환 후 현재 위치를 화면에 표시한다.

| 항목 | 내용 |
| :--- | :--- |
| 위치 | 화면 상단 중앙 |
| 표시 내용 | 씬 이름 (예: "중앙 광장") |
| 등장 방식 | 씬 전환 완료 시 페이드 인 → 3초 후 페이드 아웃 |
| 항시 표시 | HUD 좌측 패널에 현재 씬 이름 소형 텍스트로 유지 |

---

## 4. v0.12 — 선택 A

### 4.1 모바일 가상 조이스틱

**문제**: 현재 WASD 전용으로 모바일에서 이동 불가.

**해결**: 터치 감지 시 화면 좌측 하단에 가상 조이스틱 자동 표시.

```typescript
// 터치 디바이스 감지
const isTouchDevice = 'ontouchstart' in window;

// 조이스틱 구현: nipplejs 라이브러리 또는 직접 구현
// 조이스틱 출력 → keyPressed 상태에 매핑
```

| 항목 | 내용 |
| :--- | :--- |
| 라이브러리 | `nipplejs` (경량 가상 조이스틱) |
| 위치 | 화면 좌하단 고정 (터치 기기에서만 표시) |
| 출력 | 방향 벡터 → 기존 `keyPressed` 상태에 매핑 (코드 변경 최소화) |
| 카메라 조작 | 화면 우측 스와이프 → 카메라 회전 |

---

### 4.2 공간 오디오 (Spatial Audio)

가까운 플레이어일수록 소리가 크고, 멀수록 작아지는 거리 기반 오디오.

| 사운드 | 트리거 | 구현 |
| :--- | :--- | :--- |
| 배경음 | 씬 입장 시 | `scene_XX.json`의 `environment.bgm` 필드 |
| 발소리 | 플레이어 이동 중 | `useFrame`에서 이동 감지 시 재생 |
| 포털 진입음 | 포털 반경 진입 시 | `PortalZone` 컴포넌트 |
| 매칭 알림음 | `matchCompleted` 이벤트 | 관전 모드 연동 |

```typescript
// Three.js PositionalAudio — 거리 기반 볼륨 자동 감쇠
const sound = new THREE.PositionalAudio(audioListener);
sound.setRefDistance(5);      // 5 units 이내: 최대 볼륨
sound.setRolloffFactor(2);    // 거리에 따른 감쇠 계수
```

`scene_XX.json` 환경 필드 확장:

```json
"environment": {
  "bgm": "/scenes/audio/spring_plaza.mp3",
  "bgm_volume": 0.3
}
```

---

## 5. v0.13 — 선택 B

### 5.1 캐릭터 커스터마이징

**문제**: 모든 봇/플레이어가 동일한 춘심 모델을 사용해 구분이 어렵다.

**해결**: 색상 오버레이 또는 악세서리 레이어로 시각 구분.

| 항목 | 내용 |
| :--- | :--- |
| 구현 방식 | Three.js Material 색조(hue) 오버레이 (GLB 교체 없이) |
| 커스터마이징 항목 | 상의 색상, 하의 색상 (색상 피커) |
| 저장 위치 | 클라이언트 `~/.chooncme/config.json`에 `avatar_color` 추가 |
| 전달 방식 | `join` 이벤트에 `avatar_color` 포함 → 다른 클라이언트에 반영 |

---

### 5.2 근거리 채팅 (Proximity Chat)

**문제**: 현재 채팅은 전체 브로드캐스트. 씬이 여러 개 생기면 노이즈가 심해진다.

**해결**: 채팅 발신 시 같은 씬 + 반경 15 units 이내 플레이어에게만 전달.

```
chat 이벤트 수신
  → 발신자 위치 기준 15 units 이내 플레이어 필터
    → 필터된 플레이어에게만 emit
```

전체 공지가 필요한 경우: `/all 메시지` 접두사로 씬 전체 브로드캐스트 유지.

---

### 5.3 카메라 모드 전환

| 모드 | 설명 | 전환 키 |
| :--- | :--- | :--- |
| 3인칭 (기본) | 현재 방식 — 캐릭터 뒤에서 추적 | `V` |
| 1인칭 | 캐릭터 눈 높이에서 전방 시점 | `V` (토글) |
| 자유 카메라 | OrbitControls 해제, WASD로 카메라 이동 (에디터 시점) | `F` |

---

## 6. scene_XX.json 최종 확장 스키마

v0.10~v0.13 전체 반영 시 스키마:

```typescript
interface SceneFile {
  version: string;
  id: string;
  name: string;
  exported_at: string;
  objects: SceneObject[];
  portals: Portal[];
  navmesh?: NavMeshData;       // v0.9-I
  environment?: SceneEnvironment; // v0.10
}

interface SceneEnvironment {
  sky: {
    preset: "city" | "sunset" | "dawn" | "night" | "forest" | "warehouse";
  };
  fog?: { color: string; near: number; far: number };
  ambient_light: { intensity: number; color: string };
  directional_light: { intensity: number; color: string; position: [number, number, number] };
  background_color?: string;
  bgm?: string;          // v0.12 — 오디오 파일 경로
  bgm_volume?: number;   // v0.12 — 0.0 ~ 1.0
}
```

---

## 7. 파일 구조 (전체 완성 시)

```
hub/client/
├── src/
│   ├── app/
│   │   └── editor/page.tsx
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorCanvas.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── SceneTabBar.tsx
│   │   │   ├── ScenePanel.tsx
│   │   │   ├── SceneObjectItem.tsx
│   │   │   ├── PortalItem.tsx
│   │   │   └── EnvironmentPanel.tsx   # v0.10 추가
│   │   ├── 3d/
│   │   │   ├── SceneLoader.tsx
│   │   │   ├── PortalZone.tsx
│   │   │   ├── SceneEnvironment.tsx   # v0.10 추가
│   │   │   └── character/
│   │   │       ├── Player.tsx         # v0.10 충돌 감지 추가
│   │   │       └── OtherPlayer.tsx    # v0.11 클릭 프로필 추가
│   │   └── ui/
│   │       ├── Minimap.tsx            # v0.11 추가
│   │       ├── SceneNameHUD.tsx       # v0.11 추가
│   │       ├── PlayerProfilePopup.tsx # v0.11 추가
│   │       ├── SceneLoadingOverlay.tsx # v0.10 추가
│   │       └── VirtualJoystick.tsx    # v0.12 추가
└── public/
    └── scenes/
        ├── manifest.json
        ├── scene_01.json
        ├── scene_02.json
        ├── models/
        │   └── *.glb
        └── audio/                     # v0.12 추가
            └── *.mp3
```

---

## 8. 의존성

| 패키지 | 용도 | 버전 | 설치 위치 |
| :--- | :--- | :--- | :--- |
| `nipplejs` | 가상 조이스틱 | ^0.10 | hub/client |
| `@types/nipplejs` | 타입 정의 | ^0.10 | hub/client |

---

## 9. 구현 로드맵

```
v0.9  씬 에디터 + 포털 + NavMesh Bake
  ↓
v0.10 플레이어 충돌 감지 + 씬별 환경 설정 + 씬 전환 로딩 화면
  ↓
v0.11 미니맵 + 플레이어 프로필 클릭 + 씬 이름 HUD
  ↓
v0.12 모바일 가상 조이스틱 + 공간 오디오
  ↓
v0.13 캐릭터 커스터마이징 + 근거리 채팅 + 카메라 모드
```

---

## 10. Related Documents

- **Technical_Specs**: [Scene Editor Spec](./11_SCENE_EDITOR_SPEC.md) - 씬 에디터, 다중 씬, 포털, NavMesh Bake
- **Technical_Specs**: [Hub Experience Spec](./09_HUB_EXPERIENCE_SPEC.md) - 니어기억은행, 뱃지, 관전 모드
- **Technical_Specs**: [Bot Presence Spec](./05_BOT_PRESENCE_SPEC.md) - 봇 자율 아바타 (NavMesh 런타임 경로 연동)
- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) - 전체 시스템 구성
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - v0.10~v0.13 구현 항목
