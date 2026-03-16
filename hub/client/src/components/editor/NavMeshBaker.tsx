"use client";

import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface NavMeshBakerHandle {
    bake: () => Promise<void>;
    clear: () => void;
}

export interface NavMeshBakeParams {
    cellSize: number;
    cellHeight: number;
    agentHeight: number;
    agentRadius: number;
    agentMaxClimb: number;
    agentMaxSlope: number;
}

export interface NavMeshData {
    baked_at: string;
    params: NavMeshBakeParams;
    vertices: number[];
    indices: number[];
}

const DEFAULT_PARAMS: NavMeshBakeParams = {
    cellSize: 0.3,
    cellHeight: 0.2,
    agentHeight: 1.8,
    agentRadius: 0.4,
    agentMaxClimb: 0.4,
    agentMaxSlope: 45,
};

interface NavMeshBakerProps {
    params: NavMeshBakeParams;
    onBakeComplete: (data: NavMeshData) => void;
    onClear: () => void;
}

const NavMeshBaker = forwardRef<NavMeshBakerHandle, NavMeshBakerProps>(
    ({ params, onBakeComplete, onClear }, ref) => {
        const { scene } = useThree();
        const helperRef = useRef<THREE.Object3D | null>(null);

        useImperativeHandle(ref, () => ({
            bake: async () => {
                try {
                    const { init } = await import("@recast-navigation/core");
                    const { threeToSoloNavMesh } = await import("@recast-navigation/three");
                    const { NavMeshHelper } = await import("@recast-navigation/three");

                    await init();

                    // 씬에서 일반 메쉬 수집 (NavMesh, 포털 제외)
                    const meshes: THREE.Mesh[] = [];
                    scene.traverse((obj) => {
                        if (
                            obj instanceof THREE.Mesh &&
                            !(obj as any).__isNavMesh &&
                            !(obj as any).__isPortal
                        ) {
                            meshes.push(obj);
                        }
                    });

                    if (meshes.length === 0) {
                        alert("씬에 배치된 메쉬가 없습니다.");
                        return;
                    }

                    const { navMesh, success } = threeToSoloNavMesh(meshes, {
                        cs: params.cellSize,
                        ch: params.cellHeight,
                        walkableSlopeAngle: params.agentMaxSlope,
                        walkableHeight: Math.ceil(params.agentHeight / params.cellHeight),
                        walkableClimb: Math.ceil(params.agentMaxClimb / params.cellHeight),
                        walkableRadius: Math.ceil(params.agentRadius / params.cellSize),
                    });

                    if (!success || !navMesh) {
                        alert("NavMesh 생성에 실패했습니다.");
                        return;
                    }

                    // 기존 헬퍼 제거
                    if (helperRef.current) scene.remove(helperRef.current);

                    // 시각화
                    const helper = new NavMeshHelper(navMesh, {
                        navMeshMaterial: new THREE.MeshBasicMaterial({
                            color: "#4d91ff",
                            opacity: 0.35,
                            transparent: true,
                            side: THREE.DoubleSide,
                            depthWrite: false,
                        }),
                    });
                    (helper as any).__isNavMesh = true;
                    scene.add(helper);
                    helperRef.current = helper;

                    // 직렬화 (vertices/indices 추출)
                    const helperMesh = (helper as any).mesh as THREE.Mesh;
                    const geo = helperMesh?.geometry;
                    const posAttr = geo?.getAttribute("position");
                    const idxAttr = geo?.index;

                    const result: NavMeshData = {
                        baked_at: new Date().toISOString(),
                        params,
                        vertices: posAttr ? Array.from(posAttr.array as Float32Array) : [],
                        indices: idxAttr ? Array.from(idxAttr.array as Uint32Array) : [],
                    };

                    onBakeComplete(result);
                } catch (err) {
                    console.error("[NavMesh] Bake 실패:", err);
                    alert("NavMesh Bake에 실패했습니다: " + String(err));
                }
            },

            clear: () => {
                if (helperRef.current) {
                    scene.remove(helperRef.current);
                    helperRef.current = null;
                }
                onClear();
            },
        }));

        return null;
    }
);

NavMeshBaker.displayName = "NavMeshBaker";
export { DEFAULT_PARAMS };
export default NavMeshBaker;
