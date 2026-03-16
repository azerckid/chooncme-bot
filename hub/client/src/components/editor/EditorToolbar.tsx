"use client";

import React, { useRef, useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { exportScenes, importManifest } from "./editorExport";

interface EditorToolbarProps {
    onBake?: () => Promise<void>;
    baking?: boolean;
    navMeshDirty?: boolean;
    onClearNavMesh?: () => void;
}

export default function EditorToolbar({ onBake, baking, navMeshDirty, onClearNavMesh }: EditorToolbarProps) {
    const {
        scenes,
        activeSceneId,
        transformMode,
        setTransformMode,
        snapEnabled,
        toggleSnap,
        snapValue,
        addObject,
        addPortal,
        loadScenes,
    } = useEditorStore();

    const glbInputRef = useRef<HTMLInputElement>(null);
    const manifestInputRef = useRef<HTMLInputElement>(null);

    // W/E/R 단축키
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
            if (e.key === "w" || e.key === "W") setTransformMode("translate");
            if (e.key === "e" || e.key === "E") setTransformMode("rotate");
            if (e.key === "r" || e.key === "R") setTransformMode("scale");
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [setTransformMode]);

    const handleGlbImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        addObject(url, file.name.replace(".glb", ""));
        e.target.value = "";
    };

    const handleExport = () => {
        exportScenes(scenes, activeSceneId);
    };

    const handleManifestLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await importManifest(file);
        if (result) {
            loadScenes(result.scenes, result.defaultSceneId);
        }
        e.target.value = "";
    };

    const modeBtn = (label: string, mode: typeof transformMode, key: string) => (
        <button
            onClick={() => setTransformMode(mode)}
            className={`px-2 py-1 text-xs rounded font-mono transition-colors ${
                transformMode === mode
                    ? "bg-pink-500 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
            title={`${label} (${key})`}
        >
            {key}
        </button>
    );

    return (
        <div className="flex items-center gap-2 px-3 h-10 bg-zinc-900 border-b border-zinc-800 shrink-0">
            {/* GLB 임포트 */}
            <input ref={glbInputRef} type="file" accept=".glb" className="hidden" onChange={handleGlbImport} />
            <button
                onClick={() => glbInputRef.current?.click()}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
            >
                Import GLB
            </button>

            {/* 포털 추가 */}
            <button
                onClick={addPortal}
                className="px-3 py-1 bg-pink-900/60 hover:bg-pink-800/60 text-pink-300 text-xs rounded border border-pink-700/40 transition-colors"
            >
                Add Portal
            </button>

            <div className="h-5 w-px bg-zinc-700 mx-1" />

            {/* 변환 모드 */}
            {modeBtn("Translate", "translate", "W")}
            {modeBtn("Rotate", "rotate", "E")}
            {modeBtn("Scale", "scale", "R")}

            <div className="h-5 w-px bg-zinc-700 mx-1" />

            {/* 스냅 */}
            <button
                onClick={toggleSnap}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                    snapEnabled ? "bg-teal-700 text-teal-100" : "bg-zinc-700 text-zinc-500"
                }`}
                title="그리드 스냅 ON/OFF"
            >
                Snap {snapEnabled ? "ON" : "OFF"}
            </button>

            <div className="flex-1" />

            {/* NavMesh Bake */}
            <button
                onClick={() => onBake?.()}
                disabled={baking}
                className={`px-3 py-1 text-xs rounded transition-colors font-semibold ${
                    navMeshDirty
                        ? "bg-yellow-700 hover:bg-yellow-600 text-yellow-100"
                        : "bg-blue-800 hover:bg-blue-700 text-blue-100"
                } disabled:opacity-50`}
            >
                {baking ? "Baking..." : "Bake NavMesh"}
            </button>
            {onClearNavMesh && (
                <button
                    onClick={onClearNavMesh}
                    className="px-2 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                >
                    Clear
                </button>
            )}

            {/* 불러오기 */}
            <input ref={manifestInputRef} type="file" accept=".json" className="hidden" onChange={handleManifestLoad} />
            <button
                onClick={() => manifestInputRef.current?.click()}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
            >
                Load
            </button>

            {/* 내보내기 */}
            <button
                onClick={handleExport}
                className="px-3 py-1 bg-teal-700 hover:bg-teal-600 text-white text-xs rounded transition-colors font-semibold"
            >
                Export
            </button>
        </div>
    );
}
