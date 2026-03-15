"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { Progress } from "@/components/ui/progress";
import { RocketIcon } from "lucide-react";

export function Loader() {
    const { active, progress } = useProgress();
    const [show, setShow] = useState(true);

    useEffect(() => {
        // 로딩이 완료되어도 부드러운 전환을 위해 잠시 대기
        if (progress === 100) {
            const timer = setTimeout(() => setShow(false), 800);
            return () => clearTimeout(timer);
        } else {
            setShow(true);
        }
    }, [progress]);

    if (!show && !active) return null;

    return (
        <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${progress === 100 ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <div className="w-full max-w-md px-6 flex flex-col gap-8 items-center">

                {/* Logo / Title Area */}
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="p-4 rounded-full bg-teal-500/10 border border-teal-500/20 shadow-[0_0_50px_rgba(45,212,191,0.2)]">
                        <RocketIcon className="w-8 h-8 text-teal-400" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                        LOADING EXPERIENCE
                    </h1>
                </div>

                {/* Progress Bar Area */}
                <div className="w-full space-y-2">
                    <div className="flex justify-between text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500">
                        <span>Initializing Assets</span>
                        <span className="text-teal-400">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-1 bg-zinc-900" />
                </div>

                {/* Dynamic Tips (Optional) */}
                <p className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase animate-pulse">
                    Establishing Secure Connection...
                </p>
            </div>

            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-black to-black -z-10" />
        </div>
    );
}
