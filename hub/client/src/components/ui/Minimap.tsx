"use client";

import React, { useRef, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

const SIZE = 160;
const WORLD_RANGE = 20; // -20 ~ +20 units
const scale = SIZE / (WORLD_RANGE * 2);

function worldToMap(wx: number, wz: number): [number, number] {
    const mx = (wx + WORLD_RANGE) * scale;
    const my = (wz + WORLD_RANGE) * scale;
    return [Math.round(mx), Math.round(my)];
}

interface MinimapProps {
    portals?: { position: [number, number, number]; radius: number }[];
}

export function Minimap({ portals = [] }: MinimapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerPosition = useGameStore((s) => s.playerPosition);
    const otherPlayers = useGameStore((s) => s.otherPlayers);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 배경
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = "rgba(10,10,20,0.85)";
        ctx.fillRect(0, 0, SIZE, SIZE);

        // 그리드
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= SIZE; i += SIZE / 8) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
        }

        // 포털
        portals.forEach((p) => {
            const [mx, my] = worldToMap(p.position[0], p.position[2]);
            ctx.beginPath();
            ctx.arc(mx, my, Math.max(3, p.radius * scale), 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,110,180,0.7)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // 다른 플레이어
        Object.values(otherPlayers).forEach((p) => {
            const [mx, my] = worldToMap(p.position.x, p.position.z);
            ctx.beginPath();
            ctx.arc(mx, my, p.isBot ? 2.5 : 3.5, 0, Math.PI * 2);
            ctx.fillStyle = p.isBot ? "rgba(236,72,153,0.7)" : "rgba(200,200,200,0.8)";
            ctx.fill();
        });

        // 내 플레이어 (분홍, 크게)
        const [mx, my] = worldToMap(playerPosition.x, playerPosition.z);
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#ff6eb4";
        ctx.shadowColor = "#ff6eb4";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

    }, [playerPosition, otherPlayers, portals]);

    return (
        <div className="absolute bottom-6 right-6 z-10 pointer-events-none">
            <div
                className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                style={{ width: SIZE, height: SIZE }}
            >
                <canvas ref={canvasRef} width={SIZE} height={SIZE} />
            </div>
            <p className="text-center text-[9px] text-zinc-600 font-mono mt-1 uppercase tracking-widest">
                minimap
            </p>
        </div>
    );
}
