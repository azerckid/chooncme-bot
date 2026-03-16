"use client";

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Chunsim } from "./Chunsim";
import { useGameStore } from "@/store/useGameStore";

interface OtherPlayerProps {
    id: string;
    position: { x: number; y: number; z: number };
    action?: string;
    nickname?: string;
    botId?: string;
    isBot?: boolean;
}

export function OtherPlayer({ id, position, action = "Idle", nickname, botId, isBot = false }: OtherPlayerProps) {
    const botBadges = useGameStore((state) => state.botBadges);
    const badges = botId ? (botBadges[botId] ?? []) : [];
    const groupRef = useRef<THREE.Group>(null);
    const [currentAction, setCurrentAction] = useState(action);
    const actionRef = useRef(action); // useFrame 내 비교를 위한 Ref

    // Lerp (Linear Interpolation)를 위한 목표 위치
    const targetPosition = useRef(new THREE.Vector3(position.x, position.y, position.z));

    useEffect(() => {
        // 목표 위치 업데이트
        targetPosition.current.set(position.x, position.y, position.z);

        if (!groupRef.current) return;
        const currentPos = groupRef.current.position;
        const dist = currentPos.distanceTo(targetPosition.current);

        // 거리가 너무 멀면(텔레포트 등) 즉시 이동 (초기 렌더링 포함)
        if (dist > 5) {
            groupRef.current.position.copy(targetPosition.current);
        }

        // useEffect 내의 애니메이션 로직 제거 -> useFrame으로 이동
    }, [position.x, position.y, position.z]);

    // 초기 렌더링 시 위치 강제 설정 (깜빡임/사라짐 방지)
    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.position.set(position.x, position.y, position.z);
        }
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // 1. 부드러운 위치 보간 (Interpolation)
        groupRef.current.position.lerp(targetPosition.current, delta * 15);

        // 2. 이동 방향 바라보기 (LookAt)
        const currentPos = groupRef.current.position;
        const lookTarget = new THREE.Vector3(targetPosition.current.x, currentPos.y, targetPosition.current.z);
        const distSq = currentPos.distanceToSquared(lookTarget);

        if (distSq > 0.001) {
            groupRef.current.lookAt(lookTarget);
        }

        // 3. 거리 기반 애니메이션 상태 업데이트 (Run vs Idle)
        const distToTarget = currentPos.distanceTo(targetPosition.current);
        const newAction = distToTarget > 0.1 ? "Run" : "Idle";

        if (actionRef.current !== newAction) {
            actionRef.current = newAction;
            setCurrentAction(newAction);
        }
    });

    return (
        <group ref={groupRef}>
            <Chunsim action={currentAction} />

            {/* 닉네임 + 뱃지 표시 */}
            <Html distanceFactor={12} position={[0, 2.4, 0]} center>
                <div className="flex flex-col items-center gap-1">
                    {badges.length > 0 && (
                        <div className="flex gap-1">
                            {badges.map((b) => (
                                <div
                                    key={b.id}
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-lg"
                                    style={{ backgroundColor: b.color + "33", border: `1px solid ${b.color}`, color: b.color }}
                                    title={b.label}
                                >
                                    {b.emoji}
                                </div>
                            ))}
                        </div>
                    )}
                    <div
                        className="px-2 py-1 backdrop-blur-md rounded-md text-[10px] font-bold font-mono shadow-lg whitespace-nowrap"
                        style={isBot
                            ? { background: "rgba(236,72,153,0.18)", color: "#f9a8d4", border: "1px solid rgba(236,72,153,0.35)" }
                            : { background: "rgba(0,0,0,0.60)", color: "rgba(255,255,255,0.90)", border: "1px solid rgba(255,255,255,0.10)" }
                        }
                    >
                        {isBot ? "🤖 " : ""}{nickname || id.slice(0, 5)}
                    </div>
                </div>
            </Html>
        </group>
    );
}
