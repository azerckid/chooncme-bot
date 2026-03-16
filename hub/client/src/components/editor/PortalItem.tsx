"use client";

import React, { useRef } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useEditorStore, Portal } from "@/store/useEditorStore";

interface Props {
    portal: Portal;
    isSelected: boolean;
}

export default function PortalItem({ portal, isSelected }: Props) {
    const groupRef = useRef<THREE.Group>(null!);
    const { select, updatePortal, snapEnabled, snapValue } = useEditorStore();

    const handleChange = () => {
        if (!groupRef.current) return;
        const pos = groupRef.current.position;
        updatePortal(portal.id, {
            position: [pos.x, pos.y, pos.z],
        });
    };

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        select(portal.id, "portal");
    };

    return (
        <>
            <group ref={groupRef} position={portal.position} onClick={handleClick}>
                {/* 분홍 링 */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[portal.radius, 0.08, 16, 64]} />
                    <meshStandardMaterial
                        color="#ff6eb4"
                        emissive="#ff6eb4"
                        emissiveIntensity={isSelected ? 1.5 : 0.6}
                        transparent
                        opacity={0.85}
                    />
                </mesh>
                {/* 내부 반투명 디스크 */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[portal.radius, 64]} />
                    <meshStandardMaterial
                        color="#ff6eb4"
                        transparent
                        opacity={0.12}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                {/* 라벨 */}
                {portal.label && (
                    <Html center position={[0, portal.radius + 0.5, 0]}>
                        <div style={{
                            color: "#ff6eb4",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            background: "rgba(0,0,0,0.6)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                        }}>
                            {portal.label}
                        </div>
                    </Html>
                )}
            </group>

            {isSelected && (
                <TransformControls
                    object={groupRef}
                    mode="translate"
                    translationSnap={snapEnabled ? snapValue : null}
                    onObjectChange={handleChange}
                />
            )}
        </>
    );
}
