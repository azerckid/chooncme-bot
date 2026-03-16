"use client";

import React, { Suspense, useRef, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import NavMeshBaker, { NavMeshBakerHandle, NavMeshBakeParams, DEFAULT_PARAMS } from "./NavMeshBaker";

export interface EditorCanvasHandle {
    bakeNavMesh: () => Promise<void>;
    clearNavMesh: () => void;
}

interface EditorCanvasProps {
    children?: React.ReactNode;
    onBakeComplete?: (data: unknown) => void;
    onNavMeshClear?: () => void;
    bakeParams?: NavMeshBakeParams;
}

const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
    ({ children, onBakeComplete, onNavMeshClear, bakeParams }, ref) => {
        const bakerRef = useRef<NavMeshBakerHandle>(null);

        useImperativeHandle(ref, () => ({
            bakeNavMesh: async () => { await bakerRef.current?.bake(); },
            clearNavMesh: () => { bakerRef.current?.clear(); },
        }));

        return (
            <Canvas
                camera={{ position: [10, 10, 10], fov: 50 }}
                style={{ background: "#1a1a2e" }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={1.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

                    <Grid
                        args={[40, 40]}
                        cellSize={1}
                        cellThickness={0.5}
                        cellColor="#3a3a5c"
                        sectionSize={5}
                        sectionThickness={1}
                        sectionColor="#6b6b9b"
                        fadeDistance={60}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid
                    />

                    {children}

                    <NavMeshBaker
                        ref={bakerRef}
                        params={bakeParams ?? DEFAULT_PARAMS}
                        onBakeComplete={(data) => onBakeComplete?.(data)}
                        onClear={() => onNavMeshClear?.()}
                    />

                    <OrbitControls makeDefault />

                    <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                        <GizmoViewport
                            axisColors={["#ff4d6d", "#4dff91", "#4d91ff"]}
                            labelColor="white"
                        />
                    </GizmoHelper>
                </Suspense>
            </Canvas>
        );
    }
);

EditorCanvas.displayName = "EditorCanvas";
export default EditorCanvas;
