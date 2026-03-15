"use client";

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping } from "three";
import { usePlane, PlaneProps } from "@react-three/cannon";
import { Mesh } from "three";

export function Plane(props: PlaneProps) {
    const placeholderMap = useLoader(TextureLoader, "/textures/placeholder.png");
    if (placeholderMap) {
        placeholderMap.wrapS = placeholderMap.wrapT = RepeatWrapping;
        placeholderMap.repeat.set(10, 10);
    }

    const [ref] = usePlane(() => ({
        mass: 0,
        ...props,
    }));

    return (
        <mesh ref={ref as React.RefObject<Mesh>} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial
                color="teal"
                roughness={0.5}
                metalness={0.2}
                map={placeholderMap}
            />
        </mesh>
    );
}
