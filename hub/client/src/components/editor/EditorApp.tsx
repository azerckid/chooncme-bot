"use client";

import React, { useRef, useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import EditorCanvas, { EditorCanvasHandle } from "./EditorCanvas";
import EditorToolbar from "./EditorToolbar";
import SceneTabBar from "./SceneTabBar";
import ScenePanel from "./ScenePanel";
import SceneObjectItem from "./SceneObjectItem";
import PortalItem from "./PortalItem";
import { DEFAULT_PARAMS, NavMeshBakeParams } from "./NavMeshBaker";

export default function EditorApp() {
    const { scenes, activeSceneId, selectedId, selectedType, select, updateObject } = useEditorStore();
    const activeScene = scenes.find((s) => s.id === activeSceneId);
    const canvasRef = useRef<EditorCanvasHandle>(null);

    const [baking, setBaking] = useState(false);
    const [navMeshDirty, setNavMeshDirty] = useState(false);
    const [bakeParams] = useState<NavMeshBakeParams>(DEFAULT_PARAMS);

    const handleBake = async () => {
        setBaking(true);
        try {
            await canvasRef.current?.bakeNavMesh();
            setNavMeshDirty(false);
        } finally {
            setBaking(false);
        }
    };

    const handleNavMeshClear = () => {
        // store에서 navmesh 제거는 EditorToolbar에서 처리
    };

    const handleBakeComplete = (data: unknown) => {
        // 현재 활성 씬에 navmesh 저장
        const store = useEditorStore.getState();
        store.scenes.forEach((sc) => {
            if (sc.id === store.activeSceneId) {
                // scenes를 직접 mutate하지 않고 zustand action으로
            }
        });
        // store에 navmesh 필드 업데이트 (임시: useEditorStore setState 직접)
        useEditorStore.setState((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId ? { ...sc, navmesh: data } : sc
            ),
        }));
    };

    return (
        <div className="flex flex-col w-full h-screen bg-zinc-950 text-white overflow-hidden">
            {/* 씬 탭 바 */}
            <SceneTabBar />

            {/* 툴바 */}
            <EditorToolbar
                onBake={handleBake}
                baking={baking}
                navMeshDirty={navMeshDirty}
                onClearNavMesh={() => {
                    canvasRef.current?.clearNavMesh();
                    useEditorStore.setState((s) => ({
                        scenes: s.scenes.map((sc) =>
                            sc.id === s.activeSceneId ? { ...sc, navmesh: undefined } : sc
                        ),
                    }));
                    setNavMeshDirty(false);
                }}
            />

            {/* 메인 영역 */}
            <div className="flex flex-1 overflow-hidden">
                {/* 3D 뷰포트 */}
                <div className="flex-1 relative">
                    <EditorCanvas
                        ref={canvasRef}
                        onBakeComplete={handleBakeComplete}
                        onNavMeshClear={handleNavMeshClear}
                        bakeParams={bakeParams}
                    >
                        {/* 배경 클릭 시 선택 해제 */}
                        <mesh
                            visible={false}
                            position={[0, -0.01, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            onClick={() => select(null, null)}
                        >
                            <planeGeometry args={[1000, 1000]} />
                            <meshBasicMaterial />
                        </mesh>

                        {/* 씬 오브젝트 */}
                        {activeScene?.objects.map((obj) => (
                            <SceneObjectItem
                                key={obj.id}
                                obj={obj}
                                isSelected={selectedId === obj.id && selectedType === "object"}
                                onChanged={() => setNavMeshDirty(true)}
                            />
                        ))}

                        {/* 포털 */}
                        {activeScene?.portals.map((portal) => (
                            <PortalItem
                                key={portal.id}
                                portal={portal}
                                isSelected={selectedId === portal.id && selectedType === "portal"}
                            />
                        ))}
                    </EditorCanvas>

                    {/* 에디터 라벨 */}
                    <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1">
                        <div className="px-2 py-1 bg-zinc-900/70 rounded text-[10px] text-zinc-500 font-mono border border-zinc-800">
                            SCENE EDITOR / {activeScene?.name ?? ""} / DEV ONLY
                        </div>
                        {navMeshDirty && (
                            <div className="px-2 py-1 bg-yellow-900/70 rounded text-[10px] text-yellow-400 font-mono border border-yellow-700/40">
                                NavMesh 갱신 필요
                            </div>
                        )}
                        {baking && (
                            <div className="px-2 py-1 bg-blue-900/70 rounded text-[10px] text-blue-300 font-mono border border-blue-700/40">
                                Baking...
                            </div>
                        )}
                    </div>
                </div>

                {/* 우측 패널 */}
                <ScenePanel />
            </div>
        </div>
    );
}
