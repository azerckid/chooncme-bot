import { SceneData } from "@/store/useEditorStore";

export interface SceneManifest {
    version: string;
    default_scene: string;
    scenes: { id: string; name: string; file: string }[];
}

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportScenes(scenes: SceneData[], defaultSceneId: string) {
    // manifest.json
    const manifest: SceneManifest = {
        version: "1.0",
        default_scene: defaultSceneId,
        scenes: scenes.map((sc) => ({
            id: sc.id,
            name: sc.name,
            file: `/scenes/${sc.id}.json`,
        })),
    };
    downloadJson(manifest, "manifest.json");

    // 각 scene_XX.json
    scenes.forEach((sc) => {
        const sceneFile = {
            version: "1.0",
            id: sc.id,
            name: sc.name,
            exported_at: new Date().toISOString(),
            objects: sc.objects,
            portals: sc.portals,
            ...(sc.navmesh ? { navmesh: sc.navmesh } : {}),
        };
        downloadJson(sceneFile, `${sc.id}.json`);
    });
}

export async function importManifest(
    file: File
): Promise<{ scenes: SceneData[]; defaultSceneId: string } | null> {
    try {
        const text = await file.text();
        const manifest: SceneManifest = JSON.parse(text);

        if (!manifest.default_scene || !Array.isArray(manifest.scenes)) {
            alert("manifest.json 형식이 올바르지 않습니다.");
            return null;
        }

        // 각 씬 파일 로드 시도 (fetch)
        const scenes: SceneData[] = [];
        for (const meta of manifest.scenes) {
            try {
                const res = await fetch(meta.file);
                if (res.ok) {
                    const sceneFile = await res.json();
                    scenes.push({
                        id: sceneFile.id,
                        name: sceneFile.name,
                        objects: sceneFile.objects ?? [],
                        portals: sceneFile.portals ?? [],
                        navmesh: sceneFile.navmesh,
                    });
                } else {
                    // 파일 없으면 빈 씬
                    scenes.push({ id: meta.id, name: meta.name, objects: [], portals: [] });
                }
            } catch {
                scenes.push({ id: meta.id, name: meta.name, objects: [], portals: [] });
            }
        }

        const defaultId = manifest.default_scene;
        const validDefault = scenes.some((s) => s.id === defaultId)
            ? defaultId
            : scenes[0]?.id ?? defaultId;

        return { scenes, defaultSceneId: validDefault };
    } catch {
        alert("manifest.json 파싱에 실패했습니다.");
        return null;
    }
}
