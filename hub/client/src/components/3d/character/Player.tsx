"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";
import { useGameStore } from "@/store/useGameStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { Chunsim } from "./Chunsim";
import { Controls } from "./Controls";

interface PlayerProps {
    nickname?: string;
}

export function Player({ nickname }: PlayerProps) {
    const modelRef = useRef<THREE.Group>(null);
    // ...

    // Initialize keyboard controls
    useKeyboard();

    const keyPressed = useGameStore((state) => state.keyPressed);
    const playerPosition = useGameStore((state) => state.playerPosition);
    const action = useGameStore((state) => state.action);
    const setAction = useGameStore((state) => state.setAction);
    const isAutoMoving = useGameStore((state) => state.isAutoMoving); // 자동 이동 상태 구독

    // Physics body (currently purely for collision if needed, but movement is manual in original)
    const [refCannon] = useBox(() => ({
        mass: 1,
        position: [0, 1, 0], // Starting height
    }));

    useFrame(() => {
        // Check if any movement keys are pressed
        const isMoving = keyPressed["w"] || keyPressed["a"] || keyPressed["s"] || keyPressed["d"];

        if (isMoving) {
            if (action !== "Run") setAction("Run");
        } else if (!isAutoMoving) {
            // 키보드 이동도 아니고 자동 이동도 아닐 때만 Idle 전환
            if (action !== "Idle") setAction("Idle");
        }

        // Sync model position with store position
        if (modelRef.current) {
            modelRef.current.position.set(
                playerPosition.x,
                playerPosition.y,
                playerPosition.z
            );
        }
    });

    return (
        <>
            <group ref={modelRef}>
                <Chunsim action={action} />
                <Html distanceFactor={10} position={[0, 2, 0]} center>
                    <div className="px-3 py-1 bg-teal-500/80 text-white rounded-lg text-sm font-bold backdrop-blur-sm border border-white/20 whitespace-nowrap shadow-xl">
                        {nickname || "Guest"}
                    </div>
                </Html>
            </group>
            <Controls model={modelRef} />
        </>
    );
}
