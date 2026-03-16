"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Html } from "@react-three/drei";
import { PortalZone } from "./PortalZone";

interface SceneObject {
    id: string;
    name: string;
    src: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

interface Portal {
    id: string;
    position: [number, number, number];
    radius: number;
    target_scene: string;
    spawn_position: [number, number, number];
    label?: string;
}

interface SceneFile {
    version: string;
    id: string;
    name: string;
    objects: SceneObject[];
    portals: Portal[];
}

interface SceneManifest {
    version: string;
    default_scene: string;
    scenes: { id: string; name: string; file: string }[];
}

function GLBObject({ obj }: { obj: SceneObject }) {
    const gltf = useLoader(GLTFLoader, obj.src);
    return (
        <primitive
            object={gltf.scene.clone()}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
        />
    );
}

function FallbackBox({ obj }: { obj: SceneObject }) {
    return (
        <mesh position={obj.position} scale={obj.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#6b6b9b" opacity={0.5} transparent wireframe />
        </mesh>
    );
}

interface SceneLoaderProps {
    onChangeScene?: (targetScene: string, spawnPosition: [number, number, number]) => void;
}

export function SceneLoader({ onChangeScene }: SceneLoaderProps) {
    const [manifest, setManifest] = useState<SceneManifest | null>(null);
    const [sceneData, setSceneData] = useState<SceneFile | null>(null);
    const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);

    // manifest 로드
    useEffect(() => {
        fetch("/scenes/manifest.json")
            .then((r) => r.json())
            .then((m: SceneManifest) => {
                setManifest(m);
                return m;
            })
            .then((m) => loadScene(m.default_scene, m))
            .catch(() => {
                // manifest 없으면 기존 하드코딩 씬 유지
            });
    }, []);

    const loadScene = async (sceneId: string, m?: SceneManifest) => {
        const mfst = m ?? manifest;
        if (!mfst) return;
        const meta = mfst.scenes.find((s) => s.id === sceneId);
        if (!meta) return;
        try {
            const res = await fetch(meta.file);
            const data: SceneFile = await res.json();
            setSceneData(data);
            setCurrentSceneId(sceneId);
        } catch {
            console.error("씬 로드 실패:", meta.file);
        }
    };

    const handlePortalEnter = (targetScene: string, spawnPosition: [number, number, number]) => {
        onChangeScene?.(targetScene, spawnPosition);
        loadScene(targetScene);
    };

    if (!sceneData) return null;

    return (
        <>
            {/* 오브젝트 렌더링 */}
            {sceneData.objects.map((obj) => (
                <Suspense key={obj.id} fallback={<FallbackBox obj={obj} />}>
                    <GLBObject obj={obj} />
                </Suspense>
            ))}

            {/* 포털 렌더링 */}
            {sceneData.portals.map((portal) => (
                <PortalZone
                    key={portal.id}
                    portal={portal}
                    onEnter={handlePortalEnter}
                />
            ))}
        </>
    );
}
