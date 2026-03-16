# 허브 씬 에디터 명세
> Created: 2026-03-16
> Last Updated: 2026-03-16

---

> 상태: 명세 작성 완료. 구현 대상: v0.9
> v0.9-rev1: 다중 씬 + 포털 시스템 + 서버 룸 구조 추가
> v0.9-rev2: NavMesh Bake 기능 추가

---

## 1. 개요

허브 3D 공간에 여러 씬(방)을 만들고 바닥, 건물, 오브젝트를 배치하기 위한 개발자 전용 씬 에디터.

GLB 파일을 임포트하고 위치/회전/크기를 조절하며, 포털을 배치해 씬 간 이동 경로를 설계한다.
완성된 씬들을 `scenes/` 폴더에 배치하면 허브 실행 시 자동으로 로드된다.

```
개발자
  → /editor 접속
    → 씬 1 생성 → GLB 배치 → 포털 배치 → scene_01.json 다운로드
    → 씬 2 생성 → GLB 배치 → 포털 배치 → scene_02.json 다운로드
    → manifest.json 다운로드 (씬 목록)
      → public/scenes/에 수동 배치
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

## 3. 다중 씬 구조

### 3.1 씬의 개념

씬(Scene)은 독립된 3D 방(Room)이다.

- 씬 안에 있는 플레이어는 **같은 씬의 플레이어만** 볼 수 있다
- 씬 간 이동은 **포털(Portal)**을 통해서만 가능하다
- 현재 어느 씬에 있는지는 채팅 시스템으로 공지된다 (예: "[씬 2] 봄 광장에 입장했습니다")

### 3.2 서버 수용량

```
씬당 플레이어 N명 → 초당 이벤트 수 = N × 20 × (N-1)

씬당 20명: 20 × 20 × 19 =  7,600 이벤트/sec
씬당 20명 × 20씬:         152,000 이벤트/sec  (서버 한계 근접)
씬당 20명 × 15씬:         114,000 이벤트/sec  (안정 운영 범위)
```

| 설정값 | 기본값 | 설명 |
| :--- | :--- | :--- |
| `MAX_PLAYERS_PER_SCENE` | 20 | 씬당 최대 플레이어 수 |
| `MAX_SCENES` | 20 | 서버가 관리하는 최대 씬 수 |

씬이 꽉 차면 입장 불가 메시지를 클라이언트에 전달한다.
서버 확장이 필요한 경우 Socket.io Redis Adapter로 수평 확장한다.

---

## 4. 씬 파일 구조

### 4.1 파일 레이아웃

```
hub/client/public/
└── scenes/
    ├── manifest.json       ← 씬 목록 + 메타데이터
    ├── scene_01.json       ← 씬 1 오브젝트 + 포털 정의
    ├── scene_02.json       ← 씬 2 오브젝트 + 포털 정의
    └── models/
        ├── bank.glb
        └── building_a.glb
```

### 4.2 manifest.json 스키마

```typescript
interface SceneManifest {
  version: string;          // "1.0"
  default_scene: string;    // 허브 최초 입장 시 씬 ID (예: "scene_01")
  scenes: SceneMeta[];
}

interface SceneMeta {
  id: string;               // 씬 식별자 (예: "scene_01")
  name: string;             // 표시 이름 (예: "중앙 광장")
  file: string;             // 씬 파일 경로 (예: "/scenes/scene_01.json")
  thumbnail?: string;       // 썸네일 이미지 경로 (선택)
}
```

```json
{
  "version": "1.0",
  "default_scene": "scene_01",
  "scenes": [
    { "id": "scene_01", "name": "중앙 광장", "file": "/scenes/scene_01.json" },
    { "id": "scene_02", "name": "봄 광장",   "file": "/scenes/scene_02.json" }
  ]
}
```

### 4.3 scene_XX.json 스키마

```typescript
interface SceneFile {
  version: string;          // "1.0"
  id: string;               // 씬 식별자
  name: string;             // 표시 이름
  exported_at: string;      // ISO timestamp
  objects: SceneObject[];   // 오브젝트 목록
  portals: Portal[];        // 포털 목록
  // 확장 필드: navmesh (§12.4), environment ([12_HUB_WORLD_SPEC] v0.10)
}

interface SceneObject {
  id: string;
  name: string;
  src: string;                           // "/scenes/models/bank.glb"
  position: [number, number, number];
  rotation: [number, number, number];    // 라디안
  scale:    [number, number, number];
}

interface Portal {
  id: string;
  position: [number, number, number];   // 포털 중심 위치
  radius: number;                       // 진입 감지 반경 (기본 1.5)
  target_scene: string;                 // 이동할 씬 ID
  spawn_position: [number, number, number]; // 도착 씬에서의 초기 위치
  label?: string;                       // 포털 위 표시 텍스트 (예: "봄 광장으로")
}
```

### 4.4 예시

```json
{
  "version": "1.0",
  "id": "scene_01",
  "name": "중앙 광장",
  "exported_at": "2026-03-16T12:00:00.000Z",
  "objects": [
    {
      "id": "a1b2c3d4",
      "name": "NEAR_BANK",
      "src": "/scenes/models/bank.glb",
      "position": [0, 0, -12],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1]
    }
  ],
  "portals": [
    {
      "id": "portal_01_to_02",
      "position": [14, 0, 0],
      "radius": 1.5,
      "target_scene": "scene_02",
      "spawn_position": [-12, 0, 0],
      "label": "봄 광장으로"
    }
  ]
}
```

---

## 5. 포털 시스템

### 5.1 포털 동작 흐름

```
플레이어가 포털 반경 안에 진입
  → 클라이언트: 포털 감지 (매 프레임 거리 체크)
    → 서버: socket.emit("changeScene", { targetScene, spawnPosition })
      → 서버: 현재 씬 룸에서 제거, 대상 씬 룸에 추가
        → 클라이언트: 씬 언로드 → 대상 씬 로드 → spawn_position에 배치
          → 채팅 공지: "[씬 이름]에 입장했습니다"
```

### 5.2 포털 시각 표현 (클라이언트)

| 요소 | 표현 |
| :--- | :--- |
| 포털 본체 | 반투명 원형 링 (분홍색 글로우) |
| 라벨 | `@react-three/drei` `Html` — 포털 위 텍스트 |
| 진입 감지 | 플레이어 위치와 포털 중심 간 거리 < radius |
| 진입 연출 | 0.3초 페이드 아웃 → 씬 전환 → 페이드 인 |

### 5.3 에디터에서 포털 추가

- 툴바의 [Add Portal] 버튼으로 포털 오브젝트 생성
- TransformControls로 위치 지정 (Y축 이동 잠금 — 바닥 고정)
- Properties 패널에서 `target_scene`, `radius`, `spawn_position`, `label` 설정
- 포털은 오브젝트 목록에서 별도 아이콘으로 구분

---

## 6. 서버 룸 시스템 (허브 서버 변경)

### 6.1 현재 구조 vs 변경 구조

```
현재:
  users: Record<socketId, User>  ← 모든 플레이어 단일 공간

변경:
  rooms: Record<sceneId, Record<socketId, User>>  ← 씬별 분리
```

### 6.2 변경 사항 (`hub/server/src/index.ts`)

```typescript
// 씬별 플레이어 관리
const rooms: Record<string, Record<string, User>> = {};

// join 이벤트: scene_id 추가 수신
socket.on("join", (data: {
  nickname: string;
  botId?: string;
  isBot?: boolean;
  criteria?: MatchCriteria;
  scene_id?: string;          // 추가 — 기본값: manifest.default_scene
}) => { ... })

// changeScene 이벤트: 씬 간 이동
socket.on("changeScene", (data: {
  target_scene: string;
  spawn_position: [number, number, number];
}) => {
  // 1. 현재 씬 룸에서 제거 → 해당 씬 플레이어들에게 playerLeft 전송
  // 2. 대상 씬 룸에 추가 → 해당 씬 플레이어들에게 playerJoined 전송
  // 3. 클라이언트에 sceneChanged 이벤트 전송
  // 4. 채팅 공지 전송
})

// playerMove, chat 이벤트: 같은 씬 내 플레이어에게만 브로드캐스트
```

### 6.3 씬 만원 처리

```typescript
const MAX_PLAYERS_PER_SCENE = parseInt(process.env.MAX_PLAYERS_PER_SCENE || '20');

// changeScene 요청 시 대상 씬 인원 확인
if (Object.keys(rooms[targetScene] ?? {}).length >= MAX_PLAYERS_PER_SCENE) {
  socket.emit("sceneFull", { scene_id: targetScene });
  return;
}
```

### 6.4 서버의 scene_id 정책

- 서버는 `manifest.json`을 읽지 않는다. 클라이언트가 `join`/`changeScene` 시 보낸 `scene_id`를 그대로 룸 키로 사용한다.
- 유효한 씬 ID 집합을 서버가 검증하지 않으므로, 클라이언트는 반드시 자신이 로드한 `manifest.json`의 `scenes[].id` 및 `default_scene`만 사용해야 한다.
- 룸 개수는 `MAX_SCENES`(기본 20)로 제한할 수 있으며, 그 초과 시 새 룸 생성 차단 정책은 선택 구현이다.

---

## 7. 에디터 구성

### 7.1 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ [씬 1: 중앙 광장 v] [+ 씬 추가]  [Import GLB] [Add Portal] [Export] [Load] │
├──────────────────────────────────┬───────────────────┤
│                                  │ Objects / Portals │
│                                  │ ─────────────── │
│          3D Viewport             │ > NEAR_BANK       │
│      (R3F Canvas + Grid)         │ > BUILDING_A      │
│                                  │ P portal_01       │
│   [TransformControls 기즈모]     │                   │
│                                  │ ─────────────── │
│   [포털: 분홍 링 표시]            │ Properties        │
│                                  │ Name: NEAR_BANK   │
│                                  │ X / Y / Z         │
│                                  │ RX/ RY/ RZ        │
│                                  │ SX/ SY/ SZ        │
└──────────────────────────────────┴───────────────────┘
```

### 7.2 씬 탭 관리 (상단 툴바)

- 드롭다운으로 편집할 씬 전환
- [+ 씬 추가] 버튼 → 이름 입력 → 빈 씬 생성
- 씬 이름 더블클릭 → 이름 변경
- 씬 삭제 (다른 씬에서 이 씬을 가리키는 포털이 있으면 경고)

### 7.3 3D 뷰포트

| 기능 | 구현 방법 |
| :--- | :--- |
| 카메라 조작 | `OrbitControls` |
| 그리드 표시 | `Grid` |
| 축 표시 | `GizmoHelper` + `GizmoViewport` |
| 오브젝트 선택 | 클릭 → raycaster 히트 → 선택 |
| 변환 기즈모 | `TransformControls` |
| 변환 모드 전환 | `W`: translate, `E`: rotate, `R`: scale |
| 포털 표시 | 반투명 분홍 원형 링 + 라벨 |

### 7.4 Properties 패널

오브젝트 선택 시:

| 항목 | 입력 |
| :--- | :--- |
| Name | 텍스트 |
| Position X/Y/Z | 소수점 2자리 |
| Rotation X/Y/Z | 도(degree) 단위 입력 → 라디안 변환 |
| Scale X/Y/Z | 기본값 1.0 |

포털 선택 시 추가 항목:

| 항목 | 입력 |
| :--- | :--- |
| Target Scene | 씬 ID 드롭다운 |
| Radius | 진입 감지 반경 (기본 1.5) |
| Spawn Position X/Y/Z | 도착 지점 좌표 |
| Label | 포털 위 텍스트 |

### 7.5 그리드 스냅

- 기본 스냅 단위: 0.5
- 스냅 ON/OFF 토글 (툴바)
- TransformControls `translationSnap`, `rotationSnap`, `scaleSnap` 연동

---

## 8. GLB 임포트

### 8.1 방법

| 방법 | 동작 |
| :--- | :--- |
| 드래그&드롭 | 뷰포트 위에 GLB 파일을 드롭 |
| Import 버튼 | `<input type="file" accept=".glb">` 다이얼로그 |

### 8.2 처리 흐름

```
GLB 파일 선택
  → FileReader → ArrayBuffer → URL.createObjectURL(blob)
    → useLoader(GLTFLoader, tempUrl)
      → 씬 중앙(0, 0, 0)에 초기 배치
        → 오브젝트 목록에 추가
```

내보내기 시 `src` 필드에 `/scenes/models/{파일명}.glb` 기록.
개발자가 직접 `public/scenes/models/`에 GLB 파일을 복사한다.

### 8.3 GLB 로드 실패 처리

- 로드 실패 시 에러 토스트 표시
- 실패한 오브젝트는 목록에서 제외

---

## 9. 내보내기 / 불러오기

### 9.1 내보내기

[Export] 버튼 클릭 시 두 파일을 순차 다운로드:

1. **`scene_XX.json`** — 현재 편집 중인 씬 (오브젝트 + 포털)
2. **`manifest.json`** — 전체 씬 목록 (모든 씬 탭 정보 포함)

### 9.2 불러오기

[Load] 버튼 → `manifest.json` 선택 → 연결된 모든 씬 파일 순차 로드.
GLB가 없는 오브젝트는 반투명 박스 플레이스홀더로 표시.

- **manifest 유효성**: `default_scene`이 `scenes[].id` 중 하나인지 검사한다. 아니면 에러 토스트 또는 첫 번째 씬을 기본값으로 사용한다.
- **스키마 검증**: 프로젝트 원칙상 Zod 사용. 불러오기 및 런타임 씬 로드 시 `manifest.json`·`scene_XX.json`을 Zod 스키마로 검증하는 것을 권장한다.

### 9.3 배포 시 scenes 폴더 구성

에디터에서 내보낸 뒤 허브 클라이언트에 반영하는 순서: (1) `manifest.json`을 `public/scenes/`에 저장, (2) 각 `scene_XX.json`을 동일 경로에 저장, (3) 씬에서 참조하는 GLB 파일을 `public/scenes/models/`에 수동 복사. 이후 허브 클라이언트 재시작(또는 새로고침) 시 반영된다.

---

## 10. 허브 런타임 씬 로드

### 10.1 최초 입장

```
허브 클라이언트 시작
  → fetch('/scenes/manifest.json')
    → manifest.default_scene 씬 파일 로드
      → 오브젝트 렌더링 + 포털 렌더링
        → socket.emit("join", { ..., scene_id: default_scene })
```

`manifest.json`이 없으면 기존 하드코딩 씬 그대로 동작 (하위 호환). 런타임에서 manifest·씬 파일 로드 시 Zod 스키마 검증 권장 (§9.2).

### 10.2 씬 전환 (포털 진입)

```
매 프레임: 플레이어 위치 ↔ 포털 위치 거리 체크
  → 반경 안에 진입
    → 0.3초 페이드 아웃
      → socket.emit("changeScene", { target_scene, spawn_position })
        → 서버 응답 "sceneChanged"
          → 새 씬 파일 로드 + 오브젝트/포털 렌더링
            → spawn_position에 캐릭터 배치
              → 페이드 인
                → 채팅 공지: "[봄 광장]에 입장했습니다"
```

### 10.3 씬 전환 중 다른 플레이어 처리

- 씬 전환 중 이동 입력 무시 (블로킹)
- 대상 씬이 만원이면 "씬이 꽉 찼습니다" 메시지 표시 후 전환 취소

---

## 11. 파일 구조

```
hub/client/
├── src/
│   ├── app/
│   │   └── editor/
│   │       └── page.tsx              # 에디터 진입점 (/editor 라우트)
│   └── components/
│       ├── editor/
│       │   ├── EditorCanvas.tsx      # R3F Canvas + OrbitControls + Grid
│       │   ├── EditorToolbar.tsx     # Import / Add Portal / Export / Snap
│       │   ├── SceneTabBar.tsx       # 씬 탭 관리 (추가/전환/삭제)
│       │   ├── ScenePanel.tsx        # 오브젝트+포털 목록 + Properties
│       │   ├── SceneObjectItem.tsx   # 오브젝트 렌더링 + TransformControls
│       │   └── PortalItem.tsx        # 포털 렌더링 + TransformControls
│       └── 3d/
│           ├── SceneLoader.tsx       # 런타임 씬 로더 (manifest → 씬 파일)
│           └── PortalZone.tsx        # 포털 시각 + 진입 감지
├── public/
│   └── scenes/
│       ├── manifest.json
│       ├── scene_01.json
│       ├── scene_02.json
│       └── models/
│           ├── bank.glb
│           └── building_a.glb
```

---

## 12. NavMesh Bake

### 12.1 개요

씬에 건물/장애물을 배치한 뒤 [Bake NavMesh] 버튼을 누르면, 씬의 모든 메쉬를 분석해서 캐릭터가 걸을 수 있는 영역(NavMesh)을 자동 계산한다. 결과는 씬 파일에 포함되어 런타임 봇 이동 경로에 활용된다.

사용 엔진: `recast-navigation-js` — Recast/Detour(Unity/Unreal과 동일한 업계 표준)의 WebAssembly 포트. 브라우저에서 직접 실행된다.

### 12.2 Bake 흐름

```
에디터에서 GLB 오브젝트 배치 완료
  → [Bake NavMesh] 버튼 클릭
    → 씬 내 모든 SceneObject의 Three.js Mesh geometry 수집
      → recast-navigation-js WASM으로 NavMesh 계산
        → 결과를 파란 반투명 메쉬로 뷰포트에 시각화
          → scene_XX.json의 navmesh 필드에 직렬화하여 포함
```

### 12.3 Bake 파라미터

에디터 UI에서 조절 가능한 파라미터:

| 파라미터 | 설명 | 기본값 |
| :--- | :--- | :--- |
| `cellSize` | NavMesh 해상도 (작을수록 정밀, 느림) | 0.3 |
| `cellHeight` | 수직 해상도 | 0.2 |
| `agentHeight` | 캐릭터 키 | 1.8 |
| `agentRadius` | 캐릭터 반경 (장애물 여유 거리) | 0.4 |
| `agentMaxClimb` | 오를 수 있는 최대 계단 높이 | 0.4 |
| `agentMaxSlope` | 걸을 수 있는 최대 경사 (도) | 45 |

### 12.4 scene_XX.json 확장 스키마

```typescript
interface SceneFile {
  // ... 기존 필드 유지
  navmesh?: NavMeshData;   // Bake 완료 시 포함, 없으면 봇 랜덤 이동 유지
}

interface NavMeshData {
  baked_at: string;                  // ISO timestamp
  params: NavMeshBakeParams;         // Bake에 사용된 파라미터
  vertices: number[];                // Float32Array 직렬화 (x,y,z 반복)
  indices: number[];                 // 삼각형 인덱스
}
```

### 12.5 에디터 시각화

| 상태 | 표현 |
| :--- | :--- |
| Bake 전 | NavMesh 없음 |
| Bake 중 | 툴바에 "Baking..." 스피너 |
| Bake 완료 | 걸을 수 있는 영역: 파란 반투명 메쉬 오버레이 |
| NavMesh 초기화 | [Clear NavMesh] 버튼으로 제거 |

GLB 오브젝트를 추가/이동/삭제하면 기존 NavMesh가 무효화되었음을 툴바에 경고 표시 ("NavMesh 갱신 필요").

### 12.6 런타임 봇 이동 연동

허브 서버의 `botPresenceService`가 씬 파일에 `navmesh`가 있으면 NavMesh 기반 경로로 이동하고, 없으면 기존 랜덤 이동을 유지한다.

```
scene_XX.json 로드
  → navmesh 있음:
      → @recast-navigation/core로 NavMesh 초기화
        → 목적지 선택 시 NavMesh.computePath(현재위치, 목적지)
          → 경로(waypoint 배열) 반환
            → 순차적으로 이동 (장애물 우회)
  → navmesh 없음:
      → 기존 랜덤 이동 유지 (하위 호환)
```

경로 계산은 서버(`botPresenceService`)에서 수행한다. `@recast-navigation/core`는 Node.js에서도 실행된다.

---

## 13. 의존성

| 패키지 | 용도 | 설치 위치 | 설치 여부 |
| :--- | :--- | :--- | :--- |
| `@react-three/drei` | TransformControls, OrbitControls, Grid, GizmoHelper, Html | hub/client | 기설치 |
| `three` | GLTFLoader, raycaster | hub/client | 기설치 |
| `uuid` | 오브젝트/포털 ID 생성 | hub/client | 확인 필요 |
| `@recast-navigation/three` | NavMesh Bake + Three.js 시각화 | hub/client | 신규 설치 필요 |
| `@recast-navigation/core` | NavMesh 경로 계산 (런타임) | server | 신규 설치 필요 |

---

## 14. 개발 단계

| 단계 | 내용 |
| :--- | :--- |
| **v0.9-A** | `/editor` 라우트 + 기본 뷰포트 (OrbitControls, Grid, GizmoHelper) |
| **v0.9-B** | GLB 임포트 (드래그&드롭 + 버튼) + TransformControls |
| **v0.9-C** | 씬 패널 (목록, 선택, 삭제, 복제) + Properties 수치 입력 |
| **v0.9-D** | 포털 추가 + Properties (target_scene, radius, spawn_position, label) |
| **v0.9-E** | 씬 탭 관리 (다중 씬 생성/전환) |
| **v0.9-F** | manifest.json + scene_XX.json 내보내기/불러오기 + 그리드 스냅 |
| **v0.9-G** | 허브 런타임: SceneLoader + PortalZone + 씬 전환 연출 |
| **v0.9-H** | 허브 서버: rooms 룸 시스템 + changeScene 이벤트 + 씬 만원 처리 |
| **v0.9-I** | NavMesh Bake: 에디터 Bake UI + 시각화, scene_XX.json navmesh 필드 내보내기 |
| **v0.9-J** | NavMesh 런타임: botPresenceService NavMesh 경로 기반 이동 (장애물 우회) |

---

## 15. 알려진 한계 (v0.9 기준)

| 한계 | 이유 | 해결 시점 |
| :--- | :--- | :--- |
| GLB를 서버에 자동 업로드 불가 | 브라우저 보안 정책 | 서버 파일 업로드 API 추가 시 |
| 서버 재시작 없이 씬 반영 불가 | public/ 정적 파일 방식 | 동적 로드 API 도입 시 |
| 에디터 인증 없음 | 개발 전용 도구 | 배포 시 IP 제한 또는 기본 인증 추가 |
| Undo/Redo 없음 | 복잡도 | v0.9 이후 |
| 씬 수평 확장 불가 | 단일 서버 in-memory | Socket.io Redis Adapter 도입 시 |

---

## 16. Related Documents

- **Technical_Specs**: [System Architecture](./02_SYSTEM_ARCHITECTURE.md) - 전체 시스템 구성 및 허브 서버 구조
- **Technical_Specs**: [Hub Experience Spec](./09_HUB_EXPERIENCE_SPEC.md) - 허브 공간 경험 설계 (배치 대상 오브젝트 맥락)
- **Technical_Specs**: [Bot Presence Spec](./05_BOT_PRESENCE_SPEC.md) - 봇 자율 아바타 (씬에 상주하는 봇)
- **Logic_Progress**: [Backlog](../04_Logic_Progress/00_BACKLOG.md) - v0.9 구현 항목
