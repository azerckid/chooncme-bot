# 🎮 캐릭터 이동 시스템 확장 설계 (Character Movement Enhancement)

본 문서는 기존 **WASD** 키보드 이동 방식에 더해 **화살표 키(Arrow Keys)** 지원과 **마우스 클릭 이동(Point-to-Click)** 기능을 추가하기 위한 기술 설계 문서입니다.

---

## 📌 1. 개요 (Overview)

### 목표
1.  **키보드 접근성 강화**: 왼손(WASD)뿐만 아니라 오른손(화살표 키)으로도 이동 가능하도록 지원.
2.  **마우스 조작 지원**: MOBA(예: 롤, 디아블로) 게임처럼 바닥을 클릭하여 해당 지점으로 캐릭터를 이동.

### 기술적 제약 사항
- **중복 입력 처리**: 키보드 입력과 마우스 이동이 동시에 발생할 경우, **키보드 입력을 우선**으로 처리하고 마우스 이동을 취소(Cancel)한다.
- **상태 관리**: 마우스 이동 시 '목표 지점(Target Position)'과 '이동 중 상태(IsMovingToTarget)'를 전역(Store) 또는 로컬에서 관리해야 한다.

---

## 🛠 2. 기능 상세 및 구현 로직

### A. 화살표 키 지원 (Arrow Key Support)

기존 `useKeyboard` 훅을 수정하여 입력된 키 이벤트를 매핑합니다.

- **Mapping Logic**:
    - `ArrowUp`    → `w`
    - `ArrowDown`  → `s`
    - `ArrowLeft`  → `a`
    - `ArrowRight` → `d`
- **구현 위치**: `src/hooks/useKeyboard.ts`
- **방식**: 이벤트 리스너 내부에서 `event.key`를 감지할 때 별칭(Alias)으로 변환하여 `keyPressed` 상태를 업데이트합니다.

### B. 마우스 클릭 이동 (Click-to-Move / Raycasting)

Three.js의 Raycaster를 활용하여 바닥(Plane) 클릭 지점을 감지하고 캐릭터를 이동시킵니다.

#### 1. 상태 관리 (Store Update)
`useGameStore.ts`에 다음 상태를 추가합니다.

```typescript
interface GameState {
  // ... 기존 상태
  targetPosition: THREE.Vector3 | null; // 이동할 목표 지점
  isAutoMoving: boolean;                // 현재 마우스 클릭으로 이동 중인지 여부
  
  // Actions
  setTargetPosition: (pos: THREE.Vector3 | null) => void;
  // ...
}
```

#### 2. 클릭 감지 및 시각적 피드백 (Interaction & Visual Feedback)
`src/components/3d/environment/Plane.tsx` (바닥) 클릭 이벤트를 처리하고 마커를 표시합니다.

- **이벤트**: `onClick={(e) => moveTo(e.point)}`
- **동작**: 클릭된 지점의 3D 좌표(`e.point`)를 받아 Store의 `targetPosition`을 업데이트합니다.
- **마커 표시 (필수)**:
    - `src/components/3d/interaction/DestinationMarker.tsx` 컴포넌트 신규 생성.
    - Store의 `targetPosition`이 존재할 때만 렌더링.
    - **동작**: 바닥 클릭 시 마커 표시 -> 캐릭터 이동 -> 도착 시 Store에서 `targetPosition`을 `null`로 초기화 -> 마커 자동 소멸.

#### 3. 이동 로직 (Movement Logic)
`src/components/3d/character/Player.tsx`의 `useFrame` 내부 로직을 확장합니다.

**알고리즘 순서:**
1.  **키보드 입력 감지**: 키 입력(`WASD` or 화살표)이 있으면 `isAutoMoving`을 `false`로 끄고 `targetPosition`을 `null`로 초기화 (수동 조작 우선).
2.  **자동 이동 처리** (`isAutoMoving === true` 일 때):
    - 현재 위치와 목표 위치 사이의 **방향 벡터(Direction Vector)** 계산.
    - `Math.atan2`를 사용하여 캐릭터 회전(Quaternion) 처리.
    - 속도만큼 목표 방향으로 위치 업데이트.
    - **도착 판정**: 목표 지점과의 거리(Distance)가 임계값(예: 0.1) 이내면 이동 종료 (`Idle` 상태로 전환).

---

## 📂 3. 수정 파일 목록

| 파일 경로 | 수정 내용 |
| :--- | :--- |
| `src/hooks/useKeyboard.ts` | 화살표 키 입력을 WASD 입력으로 변환 매핑 |
| `src/store/useGameStore.ts` | `targetPosition`, `isAutoMoving` 상태 및 액션 추가 |
| `src/components/3d/environment/Plane.tsx` | 바닥 클릭 시 `setTargetPosition` 호출 (Raycasting) |
| `src/components/3d/character/Player.tsx` | `useFrame` 내부에 목표 지점 이동 로직 및 회전 계산 추가 |

---

## 📅 4. 구현 단계 (Implementation Steps)

1.  **Step 1**: `useGameStore`에 목표 지점 이동 관련 상태(State) 정의.
2.  **Step 2**: `useKeyboard` 훅 수정하여 화살표 키 지원 추가.
3.  **Step 3**: `Plane.tsx`에 클릭 이벤트 핸들러 추가.
4.  **Step 4**: `Player.tsx`에 벡터 연산 및 자동 이동 로직 구현.
5.  **Step 5**: 테스트 (키보드 이동 테스트 → 마우스 이동 테스트 → 이동 중 키보드 입력 시 취소 테스트).
