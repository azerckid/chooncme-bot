"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

interface ModelProps {
    action: string;
}

export function Chunsim({ action }: ModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF("/chunsim.glb");

    // SkeletonUtils.clone을 사용하여 Scene을 깊은 복사(Deep Clone)합니다.
    // 이렇게 해야 여러 캐릭터가 렌더링될 때 뼈대(Bone)가 서로 간섭하지 않습니다.
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { nodes, materials } = useGraph(clone) as any;

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
                        material={materials.Ch03_Body}
                        skeleton={nodes.Ch03.skeleton} // 복제된 스켈레톤 사용
                    />
                </group>
            </group>
        </group>
    );
}

useGLTF.preload("/chunsim.glb");
