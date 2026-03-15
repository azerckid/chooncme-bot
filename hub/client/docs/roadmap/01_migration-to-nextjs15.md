# 01_migration-to-nextjs15.md

이 문서는 기존 React 프로젝트(v18)를 최신 Next.js 15(App Router) 및 React 19 환경으로 마이그레이션하기 위한 상세 로드맵을 정의합니다.

## 1. 개요 (Overview)
기존 프로젝트는 `react-scripts`와 `styled-components`를 사용하여 구축되었습니다. 3D 메타버스 환경의 성능 최적화와 최신 웹 표준 준수를 위해 프레임워크 및 스타일링 시스템을 전면 교체합니다.

## 2. 주요 아키텍처 변화 (Core Architecture Changes)
- **Framework**: Create React App (Webpack) -> Next.js 15 (Turbopack/App Router)
- **Styling**: styled-components -> Tailwind CSS v4 (Zero-runtime)
- **State Management**: Recoil -> Zustand (Lightweight & Performance focused)
- **Type System**: JavaScript -> TypeScript (Stability)
- **3D Utilities**: @react-three/fiber & drei (Latest versions)

## 3. 새로운 폴더 구조 (Proposed Folder Structure)
```text
/
├── app/                      # Next.js App Router (루트)
│   ├── layout.tsx            # 전역 레이아웃 및 Providers
│   ├── page.tsx              # 메타버스 메인 월드
│   └── globals.css           # Tailwind v4 설정
├── components/               # 재사용 컴포넌트
│   ├── 3d/                   # R3F 전용 (Character, Environment, Interaction)
│   ├── ui/                   # shadcn/ui (HUD, Interface)
│   └── providers/            # Client Context Providers
├── hooks/                    # 커스텀 훅 (Input, Socket 연동)
├── store/                    # Zustand Store
├── lib/                      # 유틸리티 (Socket Singletons, Constants)
├── public/                   # 3D 에셋 (.glb, .ogg, .mp4)
└── types/                    # TypeScript 인터페이스
```

## 4. 상세 로드맵 (Detailed Roadmap)

### Phase 1: 기반 구축 (Foundation) - ✅ 완료
- Next.js 15 (v15.1.0) 초기화 완료
- TypeScript 및 Tailwind CSS v4 환경 구성 완료

### Phase 2: 인프라 마이그레이션 (Infrastructure) - ✅ 완료
- **Zustand** 기반 전역 상태 관리 구축 완료
- **Socket.io** 클라이언트 싱글톤 모듈 작성 완료
- **useKeyboard** 커스텀 훅 마이그레이션 완료

### Phase 3: 3D 환경 및 에셋 마이그레이션 (3D Assets) - ✅ 완료
- 조명 시스템 고도화 및 어두움 현상 해결
- 비디오 텍스처(`MoviePlane`) 및 브라우저 오디오 정책 우회 로직 구현

### Phase 4: 캐릭터 시스템 및 물리 엔진 (Character & Physics) - ✅ 완료
- `Michel` 캐릭터 모델 및 애니메이션 연동 완료
- `Controls` 와 카메라 동기화 최적화 완료

### Phase 5: 프리미엄 UI 및 최종 폴리싱 (Premium UI) - ✅ 완료
- `shadcn/ui` 기반 채팅 시스템(`ChatSystem.tsx`) 구현 및 Socket.io 연동
- 에셋 로딩용 Loader(`Loader.tsx`) 디자인 개선 및 `useProgress` 연동
- 실시간 조명 제어 패널(`LightingControlPanel`) 추가

### Phase 6: 멀티플레이어 동기화 (Multiplayer Sync) - 🔄 진행 중
- **Goal**: Socket.io를 활용한 실시간 다중 사용자 인터랙션 구현
- **Steps**:
  - [x] Node.js + Socket.io 게임 서버 구축 (별도 프로젝트 분리)
  - [x] Client-Server 소켓 연결 설정 (Port 5050)
  - [x] Zustand를 통한 접속자 상태(User List) 관리
  - [x] 타 유저 렌더링용 `OtherPlayer` 컴포넌트 구현
  - [x] 실시간 위치/회전 동기화 (Lerp Interpolation 적용)
  - [ ] 채팅 시스템 Socket.io 연동 (기존 UI w/ Server)

## 5. 기대 효과 (Expected Outcomes)
- **로딩 성능**: Next.js의 스트리밍 및 최적화된 에셋 서빙으로 초기 로딩 속도 향상
- **런타임 성능**: Zero-runtime CSS(Tailwind)와 가벼운 상태 관리(Zustand)로 프레임 드랍 최소화
- **유지 보수**: TypeScript 적용으로 코드 안정성 및 협업 효율 증대



