"use client";

import React, { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

/**
 * VirtualJoystick — 터치 기기 자동 감지, 좌하단 표시
 * nipplejs 조이스틱 출력 → keyPressed 상태 매핑 (w/a/s/d)
 */
export function VirtualJoystick() {
    const containerRef = useRef<HTMLDivElement>(null);
    const joystickRef = useRef<unknown>(null);

    useEffect(() => {
        // 터치 기기만 표시
        const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
        if (!isTouch) return;
        if (!containerRef.current) return;

        let nipple: typeof import("nipplejs");
        let manager: ReturnType<typeof nipple.create> | null = null;

        import("nipplejs").then((mod) => {
            nipple = mod.default ?? mod;
            manager = nipple.create({
                zone: containerRef.current!,
                mode: "static",
                position: { left: "60px", bottom: "60px" },
                color: "rgba(255,110,180,0.6)",
                size: 100,
            });

            manager.on("move", (_, data) => {
                const angle = data.angle?.degree ?? 0;
                const force = Math.min(data.force ?? 0, 1);
                if (force < 0.2) {
                    useGameStore.setState({ keyPressed: {} });
                    return;
                }
                // 각도 → WASD 매핑 (nipplejs: 0=right, 90=up, 180=left, 270=down)
                const keys: Record<string, boolean> = {};
                if (angle > 45 && angle <= 135) keys["w"] = true;
                else if (angle > 135 && angle <= 225) keys["a"] = true;
                else if (angle > 225 && angle <= 315) keys["s"] = true;
                else keys["d"] = true;
                // 대각선
                if (angle > 25 && angle <= 65) { keys["w"] = true; keys["d"] = true; }
                if (angle > 115 && angle <= 155) { keys["w"] = true; keys["a"] = true; }
                if (angle > 205 && angle <= 245) { keys["s"] = true; keys["a"] = true; }
                if (angle > 295 && angle <= 335) { keys["s"] = true; keys["d"] = true; }

                useGameStore.setState({ keyPressed: keys });
            });

            manager.on("end", () => {
                useGameStore.setState({ keyPressed: {} });
            });

            joystickRef.current = manager;
        });

        return () => {
            manager?.destroy();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-0 left-0 w-40 h-40 z-20 pointer-events-auto touch-none"
            style={{ display: "block" }}
        />
    );
}
