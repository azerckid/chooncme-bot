"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";
import * as THREE from "three";

/**
 * 니어기억은행 건물
 * 허브 맵 중앙 뒤쪽에 배치되는 랜드마크.
 * 캐릭터보다 큰 박스 + "NEAR BANK" 텍스트 + 초록 글로우.
 */
export function NearMemoryBank() {
  const bankGlowing = useGameStore((state) => state.bankGlowing);
  const lightRef = useRef<THREE.PointLight>(null);

  // 글로우 활성 시 펄스 애니메이션
  useFrame((_, delta) => {
    if (!lightRef.current) return;
    if (bankGlowing) {
      lightRef.current.intensity = 3 + Math.sin(Date.now() * 0.005) * 2;
    } else {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 2, delta * 2);
    }
  });

  return (
    <group position={[0, 0, -15]}>
      {/* 건물 본체 */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[6, 6, 4]} />
        <meshStandardMaterial
          color="#0f1a0f"
          emissive="#00ff88"
          emissiveIntensity={0.08}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* 지붕 */}
      <mesh castShadow position={[0, 6.2, 0]}>
        <boxGeometry args={[6.6, 0.4, 4.6]} />
        <meshStandardMaterial
          color="#0a150a"
          emissive="#00ff88"
          emissiveIntensity={0.15}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 왼쪽 기둥 */}
      <mesh castShadow position={[-2.5, 3, 2.1]}>
        <boxGeometry args={[0.4, 6, 0.4]} />
        <meshStandardMaterial color="#1a2e1a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* 오른쪽 기둥 */}
      <mesh castShadow position={[2.5, 3, 2.1]}>
        <boxGeometry args={[0.4, 6, 0.4]} />
        <meshStandardMaterial color="#1a2e1a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* 계단 */}
      <mesh receiveShadow position={[0, 0.15, 2.8]}>
        <boxGeometry args={[5, 0.3, 1.2]} />
        <meshStandardMaterial color="#111f11" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 글로우 포인트 라이트 (NEAR 이벤트 시 펄스) */}
      <pointLight
        ref={lightRef}
        position={[0, 4, 2.5]}
        color="#00ff88"
        intensity={2}
        distance={10}
      />

      {/* 전면 텍스트: NEAR BANK */}
      <Text
        position={[0, 4.2, 2.05]}
        fontSize={0.55}
        color="#00ff88"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#003322"
      >
        NEAR BANK
      </Text>

      {/* 전면 텍스트: 니어기억은행 */}
      <Text
        position={[0, 3.4, 2.05]}
        fontSize={0.32}
        color="#88ffcc"
        anchorX="center"
        anchorY="middle"
      >
        니어기억은행
      </Text>
    </group>
  );
}
