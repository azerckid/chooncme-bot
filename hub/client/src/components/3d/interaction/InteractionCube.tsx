"use client";

import React, { useState } from "react";
import { Html } from "@react-three/drei";
import { useBox, BoxProps } from "@react-three/cannon";
import { Mesh } from "three";

interface InteractionCubeProps extends BoxProps {
    color?: string;
    title?: string;
    children?: React.ReactNode;
}

export function InteractionCube({
    color = "teal",
    title = "HELLO WORLD",
    children,
    ...props
}: InteractionCubeProps) {
    const [clicked, setClicked] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [open, setOpen] = useState(false);

    const [ref] = useBox(() => ({
        mass: 1,
        ...props,
    }));

    return (
        <mesh
            ref={ref as React.RefObject<Mesh>}
            castShadow
            onClick={() => {
                setClicked(!clicked);
                setOpen(!open);
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            scale={clicked ? [1.5, 1.5, 1.5] : [1, 1, 1]}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? "red" : color} />

            {open && (
                <Html center>
                    <div className="flex flex-col w-[400px] min-h-[400px] bg-white text-black p-6 rounded-xl shadow-2xl border border-zinc-200 pointer-events-auto backdrop-blur-md bg-white/90">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpen(false);
                                }}
                                className="hover:bg-zinc-100 p-2 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 rounded-lg overflow-hidden">
                            {children || (
                                <div className="flex flex-col gap-4 p-4 bg-teal-50 rounded-lg h-full">
                                    <p className="font-medium">Welcome to the meta world!</p>
                                    <p className="text-sm text-zinc-600">This is a special space for interaction and exploration.</p>
                                    <div className="mt-auto text-xs font-mono text-zinc-400">azerckid@gmail.com</div>
                                </div>
                            )}
                        </div>
                    </div>
                </Html>
            )}
        </mesh>
    );
}
