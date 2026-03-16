"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";

interface Props {
    id: string;
    nickname?: string;
    botId?: string;
    isBot?: boolean;
    onClose: () => void;
}

export function PlayerProfilePopup({ id, nickname, botId, isBot, onClose }: Props) {
    const botBadges = useGameStore((s) => s.botBadges);
    const badges = botId ? (botBadges[botId] ?? []) : [];

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-3 p-5 bg-zinc-950/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl min-w-[220px]">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        {isBot ? "bot profile" : "player"}
                    </span>
                    <button
                        onClick={onClose}
                        className="text-zinc-600 hover:text-white text-xs transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* 닉네임 */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-white font-black text-lg">
                        {isBot ? "🤖 " : ""}{nickname || id.slice(0, 8)}
                    </span>
                    {botId && (
                        <span className="text-zinc-600 text-[10px] font-mono truncate">
                            {botId}
                        </span>
                    )}
                </div>

                {/* 뱃지 */}
                {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {badges.map((b) => (
                            <div
                                key={b.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    backgroundColor: b.color + "22",
                                    border: `1px solid ${b.color}55`,
                                    color: b.color,
                                }}
                            >
                                {b.emoji} {b.label}
                            </div>
                        ))}
                    </div>
                )}

                {/* 매칭 요청 버튼 (봇인 경우) */}
                {isBot && botId && (
                    <button
                        className="w-full py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold rounded-lg border border-pink-500/30 transition-colors"
                        onClick={onClose}
                    >
                        매칭 요청
                    </button>
                )}
            </div>
        </div>
    );
}
