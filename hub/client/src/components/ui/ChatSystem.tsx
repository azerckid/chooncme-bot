"use client";

import React, { useEffect, useState, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { socket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareIcon, SendIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
    id: string;
    sender: string;
    message: string;
    timestamp: number;
    isMe: boolean;
}

export function ChatSystem() {
    const isStarted = useGameStore((state) => state.isStarted);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    const otherPlayers = useGameStore((state) => state.otherPlayers); // 다른 유저 정보 가져오기

    // 임시 사용자 ID 제거 (socket.id 사용)

    useEffect(() => {
        if (!isStarted) return;

        // 소켓 연결
        if (!socket.connected) {
            socket.connect();
        }

        // 메시지 수신 이벤트 핸들러
        // 서버 코드 기준: chat 이벤트 (수신 데이터: { id, sender, message, timestamp })
        const handleMessage = (data: { id: string; message: string; sender: string; timestamp: number }) => {

            const newMessage: ChatMessage = {
                id: data.id,
                sender: data.sender || "Anonymous",
                message: data.message,
                timestamp: data.timestamp,
                isMe: data.id === socket.id,
            };

            setMessages((prev) => [...prev, newMessage]);

            if (!isOpen) {
                // 알림 로직
            }
        };

        socket.on("chat", handleMessage);

        return () => {
            socket.off("chat", handleMessage);
        };
    }, [isStarted, isOpen, otherPlayers]);

    // 자동 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // 서버 코드 기준: chat 이벤트, 데이터: { message: string }
        socket.emit("chat", { message: inputValue.trim() });

        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSend();
        }
        // 게임 조작(WASD) 이벤트 전파 방지
        e.stopPropagation();
    };

    if (!isStarted) return null;

    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2 transition-all duration-500",
            isOpen ? "w-80" : "w-auto"
        )}>

            {/* 토글 버튼 (닫혀있을 때) */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-12 w-12 rounded-full bg-zinc-950/60 backdrop-blur-xl border border-white/10 text-teal-400 shadow-2xl hover:bg-zinc-900 hover:scale-110 transition-all"
                >
                    <MessageSquareIcon className="w-5 h-5" />
                </Button>
            )}

            {/* 채팅 패널 */}
            <div className={cn(
                "w-full transition-all duration-500 origin-bottom-right overflow-hidden",
                isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10 h-0 pointer-events-none"
            )}>
                <Card className="bg-zinc-950/80 backdrop-blur-xl border-white/10 text-white shadow-2xl">
                    <CardHeader className="py-3 px-4 border-b border-white/5 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight text-teal-400">
                            <MessageSquareIcon className="w-3 h-3" />
                            Live Chat
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-zinc-500 hover:text-white hover:bg-white/10"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="sr-only">Close</span>
                            <span className="text-xs font-mono">✕</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-64 p-4" ref={scrollRef}>
                            <div className="flex flex-col gap-3">
                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 py-10 opacity-50">
                                        <MessageSquareIcon className="w-8 h-8" />
                                        <span className="text-xs font-mono">No messages yet</span>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex flex-col gap-1 max-w-[85%]", msg.isMe ? "self-end items-end" : "self-start items-start")}>
                                        {!msg.isMe && (
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-bold ml-1">
                                                <UserIcon className="w-2 h-2" />
                                                {msg.sender}
                                            </span>
                                        )}
                                        <div className={cn(
                                            "px-3 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm",
                                            msg.isMe
                                                ? "bg-teal-500 text-zinc-950 rounded-tr-none font-medium"
                                                : "bg-white/10 text-zinc-200 rounded-tl-none hover:bg-white/15 transition-colors"
                                        )}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="h-9 bg-black/40 border-white/10 text-xs text-white placeholder:text-zinc-600 focus-visible:ring-teal-500/50"
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                className="h-9 w-9 bg-teal-500 hover:bg-teal-400 text-zinc-950 shadow-[0_0_10px_rgba(45,212,191,0.2)]"
                            >
                                <SendIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
