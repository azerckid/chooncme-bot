"use client";

import React, { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useGameStore } from "@/store/useGameStore";
import { getColliders } from "@/lib/colliderRegistry";

type CameraMode = "third" | "first" | "free";

const AGENT_RADIUS = 0.4;
const raycaster = new THREE.Raycaster();

function isBlocked(origin: THREE.Vector3, direction: THREE.Vector3): boolean {
    const colliders = getColliders();
    if (colliders.length === 0) return false;
    raycaster.set(origin, direction.clone().normalize());
    raycaster.far = AGENT_RADIUS;
    const hits = raycaster.intersectObjects(colliders, true);
    return hits.length > 0;
}

interface ControlsProps {
    model: React.RefObject<THREE.Group | null>;
}

export function Controls({ model }: ControlsProps) {
    const orbitRef = useRef<any>(null);
    const { camera } = useThree();
    const [cameraMode, setCameraMode] = useState<CameraMode>("third");

    // V: 3인칭 ↔ 1인칭, F: 자유 카메라
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
            if (e.key === "v" || e.key === "V") {
                setCameraMode((m) => m === "third" ? "first" : "third");
            }
            if (e.key === "f" || e.key === "F") {
                setCameraMode((m) => m === "free" ? "third" : "free");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // 내부 연산용 벡터들 (메모리 최적화)
    const walkDirection = useRef(new THREE.Vector3()).current;
    const rotateAngle = useRef(new THREE.Vector3(0, 1, 0)).current;
    const rotateQuarternion = useRef(new THREE.Quaternion()).current;

    const walkVelocity = 0.1; // 이동 속도

    useFrame(() => {
        if (!model.current || !orbitRef.current) return;

        // useFrame 내부에서는 항상 최신 상태를 조회해야 함 (애니메이션 동기화 문제 해결)
        const state = useGameStore.getState();
        const {
            action,
            directionOffset,
            playerPosition,
            targetPosition,
            isAutoMoving,
            keyPressed
        } = state;

        const hasInput = Object.values(keyPressed).some(v => v);

        let moveX = 0;
        let moveZ = 0;

        // A. 키보드 이동 (우선순위 높음)
        // action 상태가 Run이거나 키 입력이 있을 때
        if ((action === "Run" && !isAutoMoving) || hasInput) {

            // 키보드 개입 시 자동 이동 즉시 취소
            if (isAutoMoving) {
                state.setIsAutoMoving(false);
                state.setTargetPosition(null);
            }

            // 1. 캐릭터 회전
            const angleYCameraDirection = Math.atan2(
                camera.position.x - model.current.position.x,
                camera.position.z - model.current.position.z
            );

            rotateQuarternion.setFromAxisAngle(
                rotateAngle,
                angleYCameraDirection + directionOffset
            );

            model.current.quaternion.rotateTowards(rotateQuarternion, 0.2);

            // 2. 이동 방향 계산
            camera.getWorldDirection(walkDirection);
            walkDirection.y = 0;
            walkDirection.normalize();
            walkDirection.applyAxisAngle(rotateAngle, directionOffset);

            moveX = walkDirection.x * walkVelocity;
            moveZ = walkDirection.z * walkVelocity;

            // B. 마우스 자동 이동
        } else if (isAutoMoving && targetPosition) {
            const currentPos = model.current.position;
            const targetVec = new THREE.Vector3(targetPosition.x, currentPos.y, targetPosition.z);
            const dist = currentPos.distanceTo(targetVec);

            if (dist > 0.2) {
                // 1. 목표 방향 바라보기
                const lookTarget = new THREE.Vector3(targetPosition.x, currentPos.y, targetPosition.z);
                model.current.lookAt(lookTarget);

                // 2. 이동 벡터 계산
                const direction = new THREE.Vector3().subVectors(targetVec, currentPos).normalize();

                // 절대 이동량
                const absMoveX = direction.x * walkVelocity;
                const absMoveZ = direction.z * walkVelocity;

                moveX = -absMoveX;
                moveZ = -absMoveZ;

                // 액션 상태 동기화 (Run)
                if (action !== "Run") {
                    state.setAction("Run");
                }

            } else {
                // 도착 완료
                state.setIsAutoMoving(false);
                state.setTargetPosition(null);
                state.setAction("Idle");
            }
        }

        // 자유 카메라 모드: 이동 입력 무시
        if (cameraMode === "free") return;

        // C. 위치 업데이트 공통 로직
        if (moveX !== 0 || moveZ !== 0) {
            // 충돌 감지 — 이동 방향으로 Raycaster 발사
            const origin = new THREE.Vector3(playerPosition.x, 0.5, playerPosition.z);
            const moveDir = new THREE.Vector3(-moveX, 0, -moveZ).normalize();
            if (isBlocked(origin, moveDir)) {
                moveX = 0;
                moveZ = 0;
            }
        }

        if (moveX !== 0 || moveZ !== 0) {
            const nextX = playerPosition.x - moveX;
            const nextZ = playerPosition.z - moveZ;

            // Zustand 업데이트
            useGameStore.setState({
                playerPosition: { x: nextX, y: playerPosition.y, z: nextZ }
            });

            // 모델 위치 강제 업데이트
            model.current.position.set(nextX, playerPosition.y, nextZ);

            if (cameraMode === "first") {
                // 1인칭: 카메라를 캐릭터 눈 위치로
                camera.position.set(nextX, playerPosition.y + 1.6, nextZ);
                if (orbitRef.current) {
                    orbitRef.current.target.set(nextX, playerPosition.y + 1.6, nextZ - 1);
                    orbitRef.current.update();
                }
            } else {
                // 3인칭
                camera.position.x -= moveX;
                camera.position.z -= moveZ;
                if (orbitRef.current) {
                    orbitRef.current.target.set(nextX, playerPosition.y + 1.5, nextZ);
                    orbitRef.current.update();
                }
            }
        }
    });

    return (
        <OrbitControls
            ref={orbitRef}
            enableZoom={true}
            enablePan={cameraMode === "free"}
            minDistance={cameraMode === "first" ? 0.1 : 5}
            maxDistance={cameraMode === "free" ? 100 : 15}
            maxPolarAngle={cameraMode === "free" ? Math.PI : Math.PI / 2 - 0.1}
        />
    );
}
