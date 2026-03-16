"use client";

import React from "react";
import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface SceneEnvironmentConfig {
    sky?: {
        preset: "city" | "sunset" | "dawn" | "night" | "forest" | "warehouse";
    };
    fog?: {
        color: string;
        near: number;
        far: number;
    };
    ambient_light?: {
        intensity: number;
        color: string;
    };
    directional_light?: {
        intensity: number;
        color: string;
        position: [number, number, number];
    };
    background_color?: string;
}

interface Props {
    config?: SceneEnvironmentConfig;
}

export function SceneEnvironment({ config }: Props) {
    const { scene } = useThree();

    React.useEffect(() => {
        if (config?.background_color) {
            scene.background = new THREE.Color(config.background_color);
        } else {
            scene.background = null;
        }
        if (config?.fog) {
            scene.fog = new THREE.Fog(
                config.fog.color,
                config.fog.near,
                config.fog.far
            );
        } else {
            scene.fog = null;
        }
    }, [config, scene]);

    return (
        <>
            {config?.sky?.preset && (
                <Environment preset={config.sky.preset} background />
            )}
            <ambientLight
                intensity={config?.ambient_light?.intensity ?? 2.0}
                color={config?.ambient_light?.color ?? "#ffffff"}
            />
            <directionalLight
                intensity={config?.directional_light?.intensity ?? 1.0}
                color={config?.directional_light?.color ?? "#ffffff"}
                position={config?.directional_light?.position ?? [10, 10, 5]}
                castShadow
            />
        </>
    );
}
