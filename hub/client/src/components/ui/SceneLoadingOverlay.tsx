"use client";

import React, { useEffect, useRef } from "react";

interface Props {
    sceneName?: string;
    onTimeout?: () => void;
}

export function SceneLoadingOverlay({ sceneName, onTimeout }: Props) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            onTimeout?.();
        }, 10000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [onTimeout]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300">
            {/* 스피너 */}
            <div className="w-10 h-10 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin mb-4" />
            {/* 씬 이름 */}
            {sceneName && (
                <p className="text-white font-black text-lg tracking-tight">
                    {sceneName}
                </p>
            )}
            <p className="text-zinc-500 text-xs font-mono mt-1">로딩 중...</p>
        </div>
    );
}
