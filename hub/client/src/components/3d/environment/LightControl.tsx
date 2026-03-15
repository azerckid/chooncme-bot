"use client";

import React from "react";
import { Environment, Sky } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";

export function LightControl() {
    const lighting = useGameStore((state) => state.lighting);

    return (
        <group>
            {/* 
        전체적인 공간감을 위한 Sky 추가
      */}
            {lighting.skyEnabled && (
                <Sky sunPosition={[-60, 100, 50]} />
            )}

            {/* 
        Environment 추가: 
        주변 사물의 반사(Reflection)와 전역 조명(Global Illumination)을 담당
      */}
            <Environment preset={lighting.environmentPreset as any} />

            {/* 전역 환경광: 그림자를 완화하고 전체적인 기본 밝기를 제공 */}
            <ambientLight intensity={lighting.ambientIntensity} color="#ffffff" />

            {/* 주광 (태양): 강력한 세기로 주 피사체를 밝힘 */}
            <directionalLight
                intensity={lighting.directionalIntensity}
                position={[-60, 100, 50]}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={300}
                shadow-camera-left={-100}
                shadow-camera-right={100}
                shadow-camera-top={100}
                shadow-camera-bottom={-100}
            />

            {/* 보조광 (반대편): 그림자 영역이 검게 죽지 않도록 파란색 필 라이트 추가 */}
            <directionalLight
                intensity={lighting.directionalIntensity * 0.3}
                position={[60, 50, -50]}
                color="#cce0ff"
            />

            {/* 헤미스피어 라이트: 하늘과 땅에서 오는 부드러운 빛을 시뮬레이션 */}
            <hemisphereLight
                args={["#ffffff", "#444444", lighting.hemisphereIntensity]}
                position={[0, 50, 0]}
            />

            {/* 플레이어 주변을 밝히는 포인트 라이트 */}
            <pointLight
                position={[0, 20, 0]}
                intensity={lighting.pointIntensity}
                distance={100}
                color="#ffffff"
            />
        </group>
    );
}
