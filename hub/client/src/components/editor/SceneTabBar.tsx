"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";

export default function SceneTabBar() {
    const { scenes, activeSceneId, setActiveScene, addScene, removeScene, renameScene } = useEditorStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const handleDoubleClick = (id: string, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    const handleRenameBlur = () => {
        if (editingId && editingName.trim()) {
            renameScene(editingId, editingName.trim());
        }
        setEditingId(null);
    };

    const handleAddScene = () => {
        const name = `씬 ${scenes.length + 1}`;
        addScene(name);
    };

    const handleRemove = (id: string) => {
        // 다른 씬에서 이 씬을 가리키는 포털이 있으면 경고
        const { scenes: allScenes } = useEditorStore.getState();
        const hasLinkedPortal = allScenes.some(
            (sc) => sc.id !== id && sc.portals.some((p) => p.target_scene === id)
        );
        if (hasLinkedPortal) {
            alert("다른 씬에서 이 씬을 가리키는 포털이 있습니다. 먼저 포털을 제거해주세요.");
            return;
        }
        removeScene(id);
    };

    return (
        <div className="flex items-center gap-1 px-2 bg-zinc-900 border-b border-zinc-800 h-9 overflow-x-auto">
            {scenes.map((sc) => (
                <div
                    key={sc.id}
                    onClick={() => setActiveScene(sc.id)}
                    onDoubleClick={() => handleDoubleClick(sc.id, sc.name)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs cursor-pointer shrink-0 transition-colors ${
                        activeSceneId === sc.id
                            ? "bg-zinc-800 text-white border border-b-0 border-zinc-700"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    {editingId === sc.id ? (
                        <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleRenameBlur}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameBlur()}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-700 text-white text-xs rounded px-1 w-20 focus:outline-none"
                        />
                    ) : (
                        <span>{sc.name}</span>
                    )}
                    {scenes.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(sc.id); }}
                            className="text-zinc-600 hover:text-red-400 text-[10px] ml-1"
                        >×</button>
                    )}
                </div>
            ))}
            <button
                onClick={handleAddScene}
                className="px-2 py-1 text-zinc-500 hover:text-pink-400 text-xs shrink-0 transition-colors"
            >
                + 씬 추가
            </button>
        </div>
    );
}
