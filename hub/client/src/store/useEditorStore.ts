import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

export type TransformMode = "translate" | "rotate" | "scale";

export interface SceneObject {
    id: string;
    name: string;
    src: string;
    position: [number, number, number];
    rotation: [number, number, number]; // radians
    scale: [number, number, number];
}

export interface Portal {
    id: string;
    position: [number, number, number];
    radius: number;
    target_scene: string;
    spawn_position: [number, number, number];
    label?: string;
}

export interface SceneData {
    id: string;
    name: string;
    objects: SceneObject[];
    portals: Portal[];
    navmesh?: unknown;
}

interface EditorStore {
    // 씬 목록
    scenes: SceneData[];
    activeSceneId: string;

    // 선택 상태
    selectedId: string | null;
    selectedType: "object" | "portal" | null;

    // 변환 모드
    transformMode: TransformMode;

    // 스냅
    snapEnabled: boolean;
    snapValue: number;

    // 씬 조작
    addScene: (name: string) => void;
    removeScene: (id: string) => void;
    renameScene: (id: string, name: string) => void;
    setActiveScene: (id: string) => void;

    // 오브젝트 조작
    addObject: (src: string, name: string) => void;
    removeObject: (id: string) => void;
    updateObject: (id: string, patch: Partial<SceneObject>) => void;

    // 포털 조작
    addPortal: () => void;
    removePortal: (id: string) => void;
    updatePortal: (id: string, patch: Partial<Portal>) => void;

    // 선택
    select: (id: string | null, type: "object" | "portal" | null) => void;

    // 변환 모드
    setTransformMode: (mode: TransformMode) => void;

    // 스냅
    toggleSnap: () => void;

    // 씬 데이터 로드
    loadScenes: (scenes: SceneData[], defaultSceneId: string) => void;
}

const DEFAULT_SCENE_ID = "scene_01";

const defaultScene: SceneData = {
    id: DEFAULT_SCENE_ID,
    name: "씬 1",
    objects: [],
    portals: [],
};

export const useEditorStore = create<EditorStore>((set, get) => ({
    scenes: [defaultScene],
    activeSceneId: DEFAULT_SCENE_ID,
    selectedId: null,
    selectedType: null,
    transformMode: "translate",
    snapEnabled: true,
    snapValue: 0.5,

    addScene: (name) => {
        const id = `scene_${uuidv4().slice(0, 8)}`;
        set((s) => ({
            scenes: [...s.scenes, { id, name, objects: [], portals: [] }],
            activeSceneId: id,
        }));
    },

    removeScene: (id) => {
        set((s) => {
            const remaining = s.scenes.filter((sc) => sc.id !== id);
            if (remaining.length === 0) return s;
            const nextActive = s.activeSceneId === id ? remaining[0].id : s.activeSceneId;
            return { scenes: remaining, activeSceneId: nextActive, selectedId: null, selectedType: null };
        });
    },

    renameScene: (id, name) => {
        set((s) => ({
            scenes: s.scenes.map((sc) => (sc.id === id ? { ...sc, name } : sc)),
        }));
    },

    setActiveScene: (id) => set({ activeSceneId: id, selectedId: null, selectedType: null }),

    addObject: (src, name) => {
        const obj: SceneObject = {
            id: uuidv4(),
            name,
            src,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
        };
        set((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId ? { ...sc, objects: [...sc.objects, obj] } : sc
            ),
            selectedId: obj.id,
            selectedType: "object",
        }));
    },

    removeObject: (id) => {
        set((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId ? { ...sc, objects: sc.objects.filter((o) => o.id !== id) } : sc
            ),
            selectedId: s.selectedId === id ? null : s.selectedId,
            selectedType: s.selectedId === id ? null : s.selectedType,
        }));
    },

    updateObject: (id, patch) => {
        set((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId
                    ? { ...sc, objects: sc.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) }
                    : sc
            ),
        }));
    },

    addPortal: () => {
        const portal: Portal = {
            id: uuidv4(),
            position: [0, 0, 5],
            radius: 1.5,
            target_scene: "",
            spawn_position: [0, 0, 0],
            label: "포털",
        };
        set((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId ? { ...sc, portals: [...sc.portals, portal] } : sc
            ),
            selectedId: portal.id,
            selectedType: "portal",
        }));
    },

    removePortal: (id) => {
        set((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId ? { ...sc, portals: sc.portals.filter((p) => p.id !== id) } : sc
            ),
            selectedId: s.selectedId === id ? null : s.selectedId,
            selectedType: s.selectedId === id ? null : s.selectedType,
        }));
    },

    updatePortal: (id, patch) => {
        set((s) => ({
            scenes: s.scenes.map((sc) =>
                sc.id === s.activeSceneId
                    ? { ...sc, portals: sc.portals.map((p) => (p.id === id ? { ...p, ...patch } : p)) }
                    : sc
            ),
        }));
    },

    select: (id, type) => set({ selectedId: id, selectedType: type }),

    setTransformMode: (mode) => set({ transformMode: mode }),

    toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

    loadScenes: (scenes, defaultSceneId) => {
        set({ scenes, activeSceneId: defaultSceneId, selectedId: null, selectedType: null });
    },
}));
