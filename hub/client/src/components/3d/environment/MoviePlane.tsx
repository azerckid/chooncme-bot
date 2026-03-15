"use client";

import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { ThreeElements } from "@react-three/fiber";
import { useGameStore } from "@/store/useGameStore";

// 단순하고 견고한 비디오 월 컴포넌트
export function MoviePlane(props: ThreeElements["mesh"]) {
    const isStarted = useGameStore((state) => state.isStarted);

    // 비디오 엘리먼트 생성 (한 번만)
    const [video] = useState(() => {
        if (typeof window === "undefined") return null;
        const v = document.createElement("video");
        v.src = "/tomboy.mp4";
        v.crossOrigin = "anonymous";
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        return v;
    });

    useEffect(() => {
        if (!video || !isStarted) return;

        const playVideo = async () => {
            try {
                video.muted = false;
                video.volume = 0.3;
                await video.play();
            } catch (err) {
                video.muted = true;
                await video.play();
            }
        };
        playVideo();

        return () => {
            video.pause();
        };
    }, [video, isStarted]);

    if (!video) return null;

    return (
        // 16:9 비율 고정 (32 x 18 크기)
        <mesh {...props} scale={[32, 18, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide}>
                <videoTexture
                    attach="map"
                    args={[video]}
                    colorSpace={THREE.SRGBColorSpace}
                />
            </meshBasicMaterial>
        </mesh>
    );
}
