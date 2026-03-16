"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

interface ModelProps {
    action: string;
    avatarColor?: string;
}

export function Chunsim({ action, avatarColor }: ModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF("/chunsim.glb");

    // SkeletonUtils.clone을 사용하여 Scene을 깊은 복사(Deep Clone)합니다.
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { nodes, materials } = useGraph(clone) as any;

    // 색조 오버레이
    const bodyMaterial = useMemo(() => {
        const mat = (materials.Ch03_Body as THREE.MeshStandardMaterial).clone();
        if (avatarColor) mat.color = new THREE.Color(avatarColor);
        return mat;
    }, [materials.Ch03_Body, avatarColor]);

    const { actions } = useAnimations(animations, group);

    const previousAction = useRef<string>("");

    useEffect(() => {
        if (previousAction.current && actions[previousAction.current]) {
            actions[previousAction.current]?.fadeOut(0.2);
        }

        if (actions[action]) {
            actions[action]?.reset().fadeIn(0.2).play();
        }

        previousAction.current = action;
    }, [action, actions]);

    return (
        <group ref={group} dispose={null}>
            <group name="Scene">
                <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
                    <primitive object={nodes.mixamorigHips} />
                    <skinnedMesh
                        castShadow
                        name="Ch03"
                        geometry={nodes.Ch03.geometry}
                        material={bodyMaterial}
                        skeleton={nodes.Ch03.skeleton}
                    />
                </group>
            </group>
        </group>
    );
}

useGLTF.preload("/chunsim.glb");
