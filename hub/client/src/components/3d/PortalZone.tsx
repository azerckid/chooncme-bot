"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";
import * as THREE from "three";

interface Portal {
    id: string;
    position: [number, number, number];
    radius: number;
    target_scene: string;
    spawn_position: [number, number, number];
    label?: string;
}

interface PortalZoneProps {
    portal: Portal;
    onEnter: (targetScene: string, spawnPosition: [number, number, number]) => void;
}

export function PortalZone({ portal, onEnter }: PortalZoneProps) {
    const triggered = useRef(false);
    const ringRef = useRef<THREE.Mesh>(null!);
    const myPosition = useGameStore((s) => s.playerPosition);
    const [glowIntensity, setGlowIntensity] = useState(0.6);

    useFrame((_, delta) => {
        // 링 회전 애니메이션
        if (ringRef.current) {
            ringRef.current.rotation.z += delta * 0.5;
        }

        // 플레이어 위치 ↔ 포털 거리 체크
        if (!myPosition || !portal.target_scene) return;
        const px = myPosition.x - portal.position[0];
        const pz = myPosition.z - portal.position[2];
        const dist = Math.sqrt(px * px + pz * pz);

        if (dist < portal.radius && !triggered.current) {
            triggered.current = true;
            setGlowIntensity(2.0);
            onEnter(portal.target_scene, portal.spawn_position);
            // 쿨다운 후 리셋
            setTimeout(() => { triggered.current = false; setGlowIntensity(0.6); }, 3000);
        }
    });

    return (
        <group position={portal.position}>
            {/* 링 */}
            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[portal.radius, 0.08, 16, 64]} />
                <meshStandardMaterial
                    color="#ff6eb4"
                    emissive="#ff6eb4"
                    emissiveIntensity={glowIntensity}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* 내부 반투명 디스크 */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[portal.radius, 64]} />
                <meshStandardMaterial
                    color="#ff6eb4"
                    transparent
                    opacity={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 라벨 */}
            {portal.label && (
                <Html center position={[0, portal.radius + 0.6, 0]}>
                    <div style={{
                        color: "#ff6eb4",
                        fontSize: "13px",
                        fontFamily: "monospace",
                        background: "rgba(0,0,0,0.7)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        border: "1px solid rgba(255,110,180,0.3)",
                    }}>
                        {portal.label}
                    </div>
                </Html>
            )}

            {/* 포인트 라이트 */}
            <pointLight color="#ff6eb4" intensity={glowIntensity * 2} distance={portal.radius * 3} />
        </group>
    );
}
