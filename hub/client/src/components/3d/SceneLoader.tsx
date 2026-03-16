"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { PortalZone } from "./PortalZone";
import { SceneEnvironment, SceneEnvironmentConfig } from "./SceneEnvironment";
import { registerColliders, clearColliders } from "@/lib/colliderRegistry";

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
    environment?: SceneEnvironmentConfig;
}

interface SceneManifest {
    version: string;
    default_scene: string;
    scenes: { id: string; name: string; file: string }[];
}

// ── GLB 오브젝트 컴포넌트 ────────────────────────────────────────────────────

function GLBObject({
    obj,
    onMeshReady,
}: {
    obj: SceneObject;
    onMeshReady: (meshes: THREE.Mesh[]) => void;
}) {
    const gltf = useLoader(GLTFLoader, obj.src);
    const groupRef = useRef<THREE.Group>(null!);

    useEffect(() => {
        if (!groupRef.current) return;
        const meshes: THREE.Mesh[] = [];
        groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) meshes.push(child);
        });
        onMeshReady(meshes);
    }, [gltf, onMeshReady]);

    return (
        <group
            ref={groupRef}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
        >
            <primitive object={gltf.scene.clone()} />
        </group>
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

// ── SceneLoader ──────────────────────────────────────────────────────────────

interface SceneLoaderProps {
    onChangeScene?: (targetScene: string, spawnPosition: [number, number, number]) => void;
    onSceneLoaded?: (sceneName: string) => void;
    onPortalsChanged?: (portals: { id: string; position: [number, number, number]; radius: number }[]) => void;
}

export function SceneLoader({ onChangeScene, onSceneLoaded, onPortalsChanged }: SceneLoaderProps) {
    const [manifest, setManifest] = useState<SceneManifest | null>(null);
    const [sceneData, setSceneData] = useState<SceneFile | null>(null);
    const colliderMeshes = useRef<Map<string, THREE.Mesh[]>>(new Map());

    // 충돌 메쉬 수집 후 레지스트리 갱신
    const handleMeshReady = (objId: string, meshes: THREE.Mesh[]) => {
        colliderMeshes.current.set(objId, meshes);
        const all: THREE.Mesh[] = [];
        colliderMeshes.current.forEach((m) => all.push(...m));
        registerColliders(all);
    };

    useEffect(() => {
        fetch("/scenes/manifest.json")
            .then((r) => r.json())
            .then((m: SceneManifest) => {
                setManifest(m);
                return m;
            })
            .then((m) => loadScene(m.default_scene, m))
            .catch(() => {});
    }, []);

    const loadScene = async (sceneId: string, m?: SceneManifest) => {
        const mfst = m ?? manifest;
        if (!mfst) return;
        const meta = mfst.scenes.find((s) => s.id === sceneId);
        if (!meta) return;

        // 씬 전환 시 충돌 메쉬 초기화
        colliderMeshes.current.clear();
        clearColliders();

        try {
            const res = await fetch(meta.file);
            const data: SceneFile = await res.json();
            setSceneData(data);
            onSceneLoaded?.(data.name);
            onPortalsChanged?.(data.portals.map((p) => ({ id: p.id, position: p.position, radius: p.radius })));
        } catch {
            console.error("씬 로드 실패:", meta.file);
        }
    };

    const handlePortalEnter = (
        targetScene: string,
        spawnPosition: [number, number, number]
    ) => {
        onChangeScene?.(targetScene, spawnPosition);
        loadScene(targetScene);
    };

    if (!sceneData) return null;

    return (
        <>
            {/* 씬별 환경 */}
            <SceneEnvironment config={sceneData.environment} />

            {/* 오브젝트 */}
            {sceneData.objects.map((obj) => (
                <Suspense key={obj.id} fallback={<FallbackBox obj={obj} />}>
                    <GLBObject
                        obj={obj}
                        onMeshReady={(meshes) => handleMeshReady(obj.id, meshes)}
                    />
                </Suspense>
            ))}

            {/* 포털 */}
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
