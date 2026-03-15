"use client";

import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import { LightControl } from "./environment/LightControl";
import { Plane } from "./environment/Plane";
import { GroupCube } from "./interaction/GroupCube";
import { DestinationMarker } from "./interaction/DestinationMarker";

import { MoviePlane } from "./environment/MoviePlane";
import { NearMemoryBank } from "./environment/NearMemoryBank";
import { OtherPlayer } from "./character/OtherPlayer";
import { Player } from "./character/Player";
import { useGameStore } from "@/store/useGameStore";
import { Button } from "@/components/ui/button";
import { RocketIcon, PlayIcon, BoxIcon, VideoIcon } from "lucide-react";
import { LightingControlPanel } from "@/components/ui/LightingControlPanel";
import { ChatSystem } from "@/components/ui/ChatSystem";
import { Loader } from "@/components/ui/Loader";
import { useSocket } from "@/hooks/useSocket";
import { socket } from "@/lib/socket";

export default function MetaverseWorld() {
    const isStarted = useGameStore((state) => state.isStarted);
    const setIsStarted = useGameStore((state) => state.setIsStarted);
    const otherPlayers = useGameStore((state) => state.otherPlayers); // 접속자 목록
    const setMyNickname = useGameStore((state) => state.setMyNickname);
    const setMyBotId = useGameStore((state) => state.setMyBotId);
    const setMyCriteria = useGameStore((state) => state.setMyCriteria);
    const [nickname, setNickname] = useState("");
    const [botId, setBotId] = useState("");
    const [region, setRegion] = useState("");
    const [interests, setInterests] = useState("");

    // Store Actions for Click Move
    const setTargetPosition = useGameStore((state) => state.setTargetPosition);
    const setIsAutoMoving = useGameStore((state) => state.setIsAutoMoving);

    // 소켓 연결 활성화
    useSocket();

    const handleJoin = () => {
        if (!nickname.trim()) return;
        setMyNickname(nickname.trim());
        if (botId.trim()) setMyBotId(botId.trim());
        setMyCriteria({
            region: region.trim() || undefined,
            interests: interests.trim()
                ? interests.split(",").map((s) => s.trim()).filter(Boolean)
                : undefined,
        });
        setIsStarted(true);
    };

    // 바닥 클릭 핸들러
    const handlePlaneClick = (e: any) => {
        // 이동 가능한 바닥을 클릭했을 때만 동작
        const point = e.point;
        // console.log("Moving to:", point);

        setTargetPosition(point);
        setIsAutoMoving(true);
        e.stopPropagation();
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative">
            <Loader />
            {/* 3D World */}
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                <Suspense fallback={null}>
                    <Physics gravity={[0, -9.81, 0]}>
                        <LightControl />

                        {/* 바닥 (클릭 이벤트 추가) */}
                        <group onClick={handlePlaneClick}>
                            <Plane rotation={[-Math.PI / 2, 0, 0]} />
                        </group>

                        <GroupCube />
                        <NearMemoryBank />
                        <Player nickname={nickname} />
                        {/* 다른 유저들 렌더링 */}
                        {Object.values(otherPlayers).map((player) => (
                            <OtherPlayer
                                key={player.id}
                                id={player.id}
                                position={player.position}
                                action={player.action}
                                nickname={player.nickname}
                            />
                        ))}

                        {/* 클릭 마커 */}
                        <DestinationMarker />
                    </Physics>

                    <MoviePlane position={[0, 7, -20]} />

                    {/* @ts-ignore */}
                    <Stats />
                </Suspense>
                <axesHelper args={[5]} />
            </Canvas>

            {/* Start Screen Overlay */}
            {!isStarted && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-2xl transition-all duration-700">
                    <div className="flex flex-col items-center gap-10 text-center max-w-2xl px-6">
                        <div className="space-y-4 animate-in fade-in zoom-in duration-1000">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold tracking-widest uppercase">
                                <RocketIcon className="w-3 h-3" />
                                춘심 허브 v0.3 접속 준비
                            </div>
                            <h1 className="text-7xl font-black tracking-tighter text-white">
                                춘심 <span className="text-pink-400">허브</span>
                            </h1>
                            <p className="text-zinc-400 font-mono tracking-widest uppercase text-sm max-w-md mx-auto leading-relaxed">
                                내 춘심이를 키우고, 허브에서 다른 춘심이들과 만난다<br />
                                Chunsim Bot Hub — 3D Virtual Meeting Space
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-4 w-full max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                            <input
                                type="text"
                                placeholder="내 춘심봇 이름 (닉네임)"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                className="w-full h-12 px-6 bg-zinc-900/50 border border-white/10 rounded-full text-center text-white placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50 focus:bg-zinc-900/80 transition-all"
                                autoFocus
                            />
                            <input
                                type="text"
                                placeholder="Bot ID (선택 — 매칭 엔진 연동용 UUID)"
                                value={botId}
                                onChange={(e) => setBotId(e.target.value)}
                                className="w-full h-10 px-6 bg-zinc-900/30 border border-white/5 rounded-full text-center text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/30 transition-all"
                            />
                            <div className="flex gap-2 w-full">
                                <input
                                    type="text"
                                    placeholder="지역 (예: 서울)"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="flex-1 h-10 px-4 bg-zinc-900/30 border border-white/5 rounded-full text-center text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/30 transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="관심사 (쉼표 구분)"
                                    value={interests}
                                    onChange={(e) => setInterests(e.target.value)}
                                    className="flex-1 h-10 px-4 bg-zinc-900/30 border border-white/5 rounded-full text-center text-white text-sm placeholder:text-zinc-700 focus:outline-none focus:border-pink-500/30 transition-all"
                                />
                            </div>
                            <Button
                                size="lg"
                                onClick={handleJoin}
                                disabled={!nickname.trim()}
                                className="w-full h-16 bg-pink-500 hover:bg-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(236,72,153,0.3)] gap-3"
                            >
                                <PlayIcon className="w-6 h-6 fill-current" />
                                허브 입장
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-12 mt-4 opacity-60">
                            <div className="flex flex-col gap-2">
                                <BoxIcon className="w-5 h-5 text-teal-500 mx-auto" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Graphics</span>
                                    <span className="text-xs text-zinc-300">R3F Engine</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <RocketIcon className="w-5 h-5 text-teal-500 mx-auto" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Physics</span>
                                    <span className="text-xs text-zinc-300">Cannon.js</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <VideoIcon className="w-5 h-5 text-teal-500 mx-auto" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Media</span>
                                    <span className="text-xs text-zinc-300">Spatial Video</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HUD / Overlay */}
            {isStarted && (
                <div className="absolute top-6 left-6 z-10 text-white font-mono pointer-events-none select-none animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex flex-col gap-1 p-4 bg-zinc-950/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                        <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                            춘심 허브
                        </h1>
                        <div className="h-[1px] w-full bg-white/10 my-1" />
                        <div className="h-[1px] w-full bg-white/10 my-1" />
                        <div className="flex items-center justify-between min-w-[200px]">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-400">Chunsim Hub v0.3</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${socket.connected ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`} />
                                <span className="text-[10px] font-bold text-zinc-300">
                                    {Object.keys(otherPlayers).length + 1} ONLINE
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-2">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase">Controls</span>
                                <span className="text-xs text-teal-200 font-bold">W A S D</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-zinc-500 font-bold uppercase">Rotation</span>
                                <span className="text-xs text-blue-200 font-bold">MOUSE</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isStarted && <LightingControlPanel />}
            {isStarted && <ChatSystem />}

            {isStarted && (
                <div className="absolute bottom-6 right-6 z-10 pointer-events-none animate-in fade-in duration-1000">
                    <div className="px-4 py-2 bg-zinc-950/40 backdrop-blur-sm rounded-full border border-white/5">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest italic font-bold">System: Responsive</span>
                    </div>
                </div>
            )}
        </div>
    );
}
