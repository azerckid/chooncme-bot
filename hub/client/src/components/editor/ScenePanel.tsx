"use client";

import React from "react";
import { useEditorStore, SceneObject, Portal } from "@/store/useEditorStore";

function Vec3Input({
    label,
    value,
    onChange,
    step = 0.1,
    toDeg = false,
}: {
    label: string;
    value: [number, number, number];
    onChange: (v: [number, number, number]) => void;
    step?: number;
    toDeg?: boolean;
}) {
    const display = toDeg ? value.map((v) => parseFloat((v * (180 / Math.PI)).toFixed(2))) : value.map((v) => parseFloat(v.toFixed(3)));
    const axes = ["X", "Y", "Z"];
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
            <div className="flex gap-1">
                {axes.map((axis, i) => (
                    <div key={axis} className="flex flex-col flex-1">
                        <span className="text-[9px] text-zinc-600 text-center">{axis}</span>
                        <input
                            type="number"
                            value={display[i]}
                            step={step}
                            onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0;
                                const next = [...value] as [number, number, number];
                                next[i] = toDeg ? v * (Math.PI / 180) : v;
                                onChange(next);
                            }}
                            className="w-full bg-zinc-800 text-white text-[11px] text-center rounded px-1 py-0.5 border border-zinc-700 focus:outline-none focus:border-pink-500"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

function ObjectProperties({ obj }: { obj: SceneObject }) {
    const { updateObject } = useEditorStore();
    return (
        <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Name</span>
                <input
                    value={obj.name}
                    onChange={(e) => updateObject(obj.id, { name: e.target.value })}
                    className="w-full bg-zinc-800 text-white text-xs rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-pink-500"
                />
            </div>
            <Vec3Input label="Position" value={obj.position} onChange={(v) => updateObject(obj.id, { position: v })} />
            <Vec3Input label="Rotation" value={obj.rotation} onChange={(v) => updateObject(obj.id, { rotation: v })} toDeg />
            <Vec3Input label="Scale" value={obj.scale} onChange={(v) => updateObject(obj.id, { scale: v })} step={0.1} />
        </div>
    );
}

function PortalProperties({ portal }: { portal: Portal }) {
    const { updatePortal, scenes } = useEditorStore();
    const sceneOptions = scenes.filter((s) => s.id !== useEditorStore.getState().activeSceneId);
    return (
        <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Label</span>
                <input
                    value={portal.label ?? ""}
                    onChange={(e) => updatePortal(portal.id, { label: e.target.value })}
                    className="w-full bg-zinc-800 text-white text-xs rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-pink-500"
                />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Target Scene</span>
                <select
                    value={portal.target_scene}
                    onChange={(e) => updatePortal(portal.id, { target_scene: e.target.value })}
                    className="w-full bg-zinc-800 text-white text-xs rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-pink-500"
                >
                    <option value="">-- 선택 --</option>
                    {sceneOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Radius</span>
                <input
                    type="number"
                    value={portal.radius}
                    step={0.1}
                    min={0.5}
                    onChange={(e) => updatePortal(portal.id, { radius: parseFloat(e.target.value) || 1.5 })}
                    className="w-full bg-zinc-800 text-white text-xs rounded px-2 py-1 border border-zinc-700 focus:outline-none focus:border-pink-500"
                />
            </div>
            <Vec3Input label="Position" value={portal.position} onChange={(v) => updatePortal(portal.id, { position: v })} />
            <Vec3Input label="Spawn Position" value={portal.spawn_position} onChange={(v) => updatePortal(portal.id, { spawn_position: v })} />
        </div>
    );
}

export default function ScenePanel() {
    const { scenes, activeSceneId, selectedId, selectedType, select, removeObject, removePortal } = useEditorStore();
    const activeScene = scenes.find((s) => s.id === activeSceneId);
    if (!activeScene) return null;

    const selectedObj = selectedType === "object" ? activeScene.objects.find((o) => o.id === selectedId) : null;
    const selectedPortal = selectedType === "portal" ? activeScene.portals.find((p) => p.id === selectedId) : null;

    return (
        <div className="w-64 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden text-white">
            {/* 오브젝트 목록 */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-3 pt-3 pb-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Objects</span>
                </div>
                {activeScene.objects.map((obj) => (
                    <div
                        key={obj.id}
                        onClick={() => select(obj.id, "object")}
                        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs transition-colors ${selectedId === obj.id ? "bg-pink-500/20 text-pink-300" : "hover:bg-zinc-800 text-zinc-300"}`}
                    >
                        <span className="truncate">{obj.name}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                            className="text-zinc-600 hover:text-red-400 ml-2 text-[10px]"
                        >X</button>
                    </div>
                ))}

                {/* 포털 목록 */}
                {activeScene.portals.length > 0 && (
                    <div className="px-3 pt-2 pb-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Portals</span>
                    </div>
                )}
                {activeScene.portals.map((portal) => (
                    <div
                        key={portal.id}
                        onClick={() => select(portal.id, "portal")}
                        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs transition-colors ${selectedId === portal.id ? "bg-pink-500/20 text-pink-300" : "hover:bg-zinc-800 text-zinc-400"}`}
                    >
                        <span className="truncate text-pink-400/70">⬡ {portal.label || "포털"}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); removePortal(portal.id); }}
                            className="text-zinc-600 hover:text-red-400 ml-2 text-[10px]"
                        >X</button>
                    </div>
                ))}
            </div>

            {/* Properties 패널 */}
            <div className="border-t border-zinc-800 p-3 overflow-y-auto max-h-72">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Properties</span>
                {selectedObj && <ObjectProperties obj={selectedObj} />}
                {selectedPortal && <PortalProperties portal={selectedPortal} />}
                {!selectedObj && !selectedPortal && (
                    <p className="text-zinc-600 text-[11px] mt-2">오브젝트를 선택하세요</p>
                )}
            </div>
        </div>
    );
}
