"use client";

import React, { useEffect, useState } from "react";

interface Props {
    sceneName: string | null;
}

export function SceneNameHUD({ sceneName }: Props) {
    const [visible, setVisible] = useState(false);
    const [displayed, setDisplayed] = useState<string | null>(null);

    useEffect(() => {
        if (!sceneName) return;
        setDisplayed(sceneName);
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(timer);
    }, [sceneName]);

    return (
        <>
            {/* 씬 전환 시 중앙 페이드 배너 */}
            <div
                className={`absolute top-24 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 pointer-events-none ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}
            >
                <div className="px-5 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-xl">
                    <span className="text-white text-sm font-black tracking-tight">
                        {displayed}
                    </span>
                </div>
            </div>
        </>
    );
}
