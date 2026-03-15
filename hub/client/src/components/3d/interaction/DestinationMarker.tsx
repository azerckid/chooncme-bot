"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";

export function DestinationMarker() {
    const targetPosition = useGameStore((state) => state.targetPosition);
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current || !ringRef.current) return;

        // 1. 위아래로 둥둥 떠다니는 애니메이션
        meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
        // 2. 빙글빙글 회전
        meshRef.current.rotation.y += 0.05;

        // 3. 바닥 링 확산 애니메이션
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
        ringRef.current.scale.set(scale, scale, 1);
    });

    if (!targetPosition) return null;

    return (
        <group position={[targetPosition.x, 0, targetPosition.z]}>
            {/* 중앙 마커 (역원뿔 형태) - 뒤집어서 꼭지점이 아래로 향하게 함 */}
            <mesh ref={meshRef} position={[0, 0.5, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.2, 0.5, 32]} />
                <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
            </mesh>

            {/* 바닥 물결 링 */}
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[0.3, 0.4, 32]} />
                <meshBasicMaterial color="#00ff88" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}
