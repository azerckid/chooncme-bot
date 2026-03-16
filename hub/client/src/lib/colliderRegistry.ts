/**
 * colliderRegistry — SceneLoader가 등록한 충돌 메쉬 목록
 * Controls가 이동 전 raycaster로 충돌 감지에 사용한다.
 */
import * as THREE from "three";

const colliders: THREE.Mesh[] = [];

export function registerColliders(meshes: THREE.Mesh[]): void {
    colliders.length = 0;
    colliders.push(...meshes);
}

export function getColliders(): THREE.Mesh[] {
    return colliders;
}

export function clearColliders(): void {
    colliders.length = 0;
}
