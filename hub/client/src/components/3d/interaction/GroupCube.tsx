"use client";

import React from "react";
import { InteractionCube } from "./InteractionCube";

export function GroupCube() {
    return (
        <group>
            <InteractionCube
                position={[6.5, 10, -4.5]}
                rotation={[10, 20, -30]}
                color="teal"
            />
            <InteractionCube
                position={[5.5, 12, -3.5]}
                rotation={[30, -10, 20]}
                color="teal"
            />
            <InteractionCube
                position={[2.5, 14, -5.5]}
                rotation={[-30, 20, 10]}
                color="teal"
            />
            <InteractionCube
                position={[-4.5, 16, -4.5]}
                rotation={[20, -10, 30]}
                color="hotpink"
                title="COMMUNITY CHAT"
            >
                <div className="bg-zinc-100 p-4 h-full rounded-lg flex items-center justify-center italic text-zinc-500">
                    Chat System Coming Soon...
                </div>
            </InteractionCube>
            <InteractionCube
                position={[-2.5, 18, -3.5]}
                rotation={[10, 30, -20]}
                color="teal"
            />
            <InteractionCube
                position={[-1.5, 20, -3.5]}
                rotation={[20, -10, 30]}
                color="teal"
            />
        </group>
    );
}
