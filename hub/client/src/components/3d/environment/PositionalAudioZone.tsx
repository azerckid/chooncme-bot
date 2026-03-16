"use client";

import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
    src: string;
    position: [number, number, number];
    refDistance?: number;
    maxDistance?: number;
    loop?: boolean;
    volume?: number;
}

/**
 * PositionalAudioZone — 거리 기반 볼륨 감쇠 오디오
 * scene_XX.json environment.bgm 필드 기반으로 SceneLoader가 마운트
 */
export function PositionalAudioZone({
    src,
    position,
    refDistance = 5,
    maxDistance = 30,
    loop = true,
    volume = 0.5,
}: Props) {
    const { camera } = useThree();
    const listenerRef = useRef<THREE.AudioListener | null>(null);
    const audioRef = useRef<THREE.PositionalAudio | null>(null);
    const loaderRef = useRef<THREE.AudioLoader>(new THREE.AudioLoader());

    useEffect(() => {
        const listener = new THREE.AudioListener();
        camera.add(listener);
        listenerRef.current = listener;

        const sound = new THREE.PositionalAudio(listener);
        sound.setRefDistance(refDistance);
        sound.setMaxDistance(maxDistance);
        sound.setLoop(loop);
        sound.setVolume(volume);
        sound.position.set(...position);

        loaderRef.current.load(src, (buffer) => {
            sound.setBuffer(buffer);
            sound.play();
        });

        audioRef.current = sound;

        return () => {
            sound.stop();
            sound.disconnect();
            camera.remove(listener);
        };
    }, [src]);

    return null;
}
