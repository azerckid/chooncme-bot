"use client";

import React, { useRef, useEffect } from "react";
import { useLoader, ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { useEditorStore, SceneObject } from "@/store/useEditorStore";

interface Props {
    obj: SceneObject;
    isSelected: boolean;
    onChanged?: () => void;
}

function GLBMesh({ src, fallback }: { src: string; fallback?: boolean }) {
    try {
        const gltf = useLoader(GLTFLoader, src);
        return <primitive object={gltf.scene.clone()} />;
    } catch {
        return (
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#6b6b9b" wireframe />
            </mesh>
        );
    }
}

function FallbackBox() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6b6b9b" opacity={0.6} transparent wireframe />
        </mesh>
    );
}

export default function SceneObjectItem({ obj, isSelected, onChanged }: Props) {
    const groupRef = useRef<THREE.Group>(null!);
    const { select, updateObject, transformMode, snapEnabled, snapValue } = useEditorStore();

    // TransformControls 변경 → store 업데이트
    const handleChange = () => {
        if (!groupRef.current) return;
        const pos = groupRef.current.position;
        const rot = groupRef.current.rotation;
        const sc = groupRef.current.scale;
        updateObject(obj.id, {
            position: [pos.x, pos.y, pos.z],
            rotation: [rot.x, rot.y, rot.z],
            scale: [sc.x, sc.y, sc.z],
        });
        onChanged?.();
    };

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        select(obj.id, "object");
    };

    return (
        <>
            <group
                ref={groupRef}
                position={obj.position}
                rotation={obj.rotation}
                scale={obj.scale}
                onClick={handleClick}
            >
                <React.Suspense fallback={<FallbackBox />}>
                    <GLBMesh src={obj.src} />
                </React.Suspense>
            </group>

            {isSelected && (
                <TransformControls
                    object={groupRef}
                    mode={transformMode}
                    translationSnap={snapEnabled ? snapValue : null}
                    rotationSnap={snapEnabled ? Math.PI / 12 : null}
                    scaleSnap={snapEnabled ? 0.1 : null}
                    onObjectChange={handleChange}
                />
            )}
        </>
    );
}
