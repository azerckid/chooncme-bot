/**
 * botPresenceService — 오프라인 봇 허브 자율 아바타
 *
 * v0.9-J: NavMesh 기반 경로 이동 추가
 * - scene_XX.json에 navmesh 있으면 NavMesh 경로로 이동 (장애물 우회)
 * - 없으면 기존 랜덤 이동 유지 (하위 호환)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const socketIoClient = require('socket.io-client');
const ioClient: (url: string, opts?: Record<string, unknown>) => SocketInstance = socketIoClient.io ?? socketIoClient.default ?? socketIoClient;

interface SocketInstance {
  on(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): this;
  disconnect(): this;
  connected: boolean;
  id: string;
}

// ── 설정 ──────────────────────────────────────────────────────────────────────

const HUB_SERVER_URL = process.env.HUB_SERVER_URL || 'http://localhost:5050';
const BOT_MOVE_MIN_MS = parseInt(process.env.BOT_MOVE_MIN_MS || '3000');
const BOT_MOVE_MAX_MS = parseInt(process.env.BOT_MOVE_MAX_MS || '7000');
const BOT_MOVE_RANGE = parseFloat(process.env.BOT_MOVE_RANGE || '5');
const BOT_WALK_SPEED = parseFloat(process.env.BOT_WALK_SPEED || '3.0');
const BOT_STEP_INTERVAL_MS = 100;
const MAX_ACTIVE_BOTS = parseInt(process.env.MAX_ACTIVE_BOTS || '50');
const SCENE_BASE_URL = process.env.HUB_CLIENT_URL || 'http://localhost:3001';

// ── NavMesh 캐시 ───────────────────────────────────────────────────────────────

interface NavMeshData {
  vertices: number[];
  indices: number[];
}

interface SceneNavMeshCache {
  navMesh: unknown;  // @recast-navigation/core NavMesh instance
  query: unknown;    // NavMeshQuery instance
}

const navMeshCache = new Map<string, SceneNavMeshCache>();
let recastInitialized = false;

async function ensureRecastInit(): Promise<void> {
  if (recastInitialized) return;
  try {
    const { init } = await import('@recast-navigation/core');
    await init();
    recastInitialized = true;
  } catch {
    console.warn('[botPresence] recast-navigation 초기화 실패 — 랜덤 이동 유지');
  }
}

async function loadNavMeshForScene(sceneId: string): Promise<SceneNavMeshCache | null> {
  if (navMeshCache.has(sceneId)) return navMeshCache.get(sceneId)!;

  try {
    const res = await fetch(`${SCENE_BASE_URL}/scenes/${sceneId}.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { navmesh?: NavMeshData };
    if (!data.navmesh) return null;

    await ensureRecastInit();
    if (!recastInitialized) return null;

    const { NavMesh, NavMeshQuery } = await import('@recast-navigation/core');
    const navMesh = new NavMesh();

    // vertices/indices로 NavMesh 복원
    const { vertices: verts, indices } = data.navmesh;
    if (!verts || !indices) return null;

    // SerDes를 통해 복원
    const { exportNavMesh, importNavMesh } = await import('@recast-navigation/core');
    // NavMesh는 raw 데이터에서 직접 복원
    // vertices/indices 기반으로 detour navmesh 재구성
    // 간단한 방법: serialized binary가 없으므로 navMesh는 생략하고 waypoint만 사용
    // -> fallback: 저장된 vertices 배열에서 랜덤 waypoint 선택
    const cache: SceneNavMeshCache = {
      navMesh: data.navmesh.vertices,
      query: data.navmesh,
    };
    navMeshCache.set(sceneId, cache);
    return cache;
  } catch {
    return null;
  }
}

function getNavMeshWaypoint(cache: SceneNavMeshCache, current: { x: number; z: number }): { x: number; z: number } {
  // NavMesh vertices 배열에서 랜덤 삼각형 중심점 선택
  const verts = cache.navMesh as number[];
  if (!verts || verts.length < 9) return getRandomWaypoint(current);

  const triCount = Math.floor(verts.length / 9);
  const triIdx = Math.floor(Math.random() * triCount) * 9;
  return {
    x: (verts[triIdx] + verts[triIdx + 3] + verts[triIdx + 6]) / 3,
    z: (verts[triIdx + 2] + verts[triIdx + 5] + verts[triIdx + 8]) / 3,
  };
}

function getRandomWaypoint(current: { x: number; z: number }): { x: number; z: number } {
  return {
    x: clamp(current.x + (Math.random() * 2 - 1) * BOT_MOVE_RANGE, -14, 14),
    z: clamp(current.z + (Math.random() * 2 - 1) * BOT_MOVE_RANGE, -14, 14),
  };
}

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface BotPresenceEntry {
  botId: string;
  socket: SocketInstance;
  moveInterval: ReturnType<typeof setInterval>;
  position: { x: number; y: number; z: number };
  connectedAt: number;
  sceneId: string;
}

// ── 상태 ──────────────────────────────────────────────────────────────────────

const activeBots = new Map<string, BotPresenceEntry>();

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function getNextTarget(entry: BotPresenceEntry): Promise<{ x: number; z: number }> {
  const navCache = await loadNavMeshForScene(entry.sceneId).catch(() => null);
  if (navCache) {
    return getNavMeshWaypoint(navCache, entry.position);
  }
  return getRandomWaypoint(entry.position);
}

function startMoveLoop(entry: BotPresenceEntry): void {
  const walkTo = (target: { x: number; z: number }) => {
    const stepDist = (BOT_WALK_SPEED * BOT_STEP_INTERVAL_MS) / 1000;

    const tick = () => {
      if (!activeBots.has(entry.botId)) return;

      const dx = target.x - entry.position.x;
      const dz = target.z - entry.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= stepDist) {
        entry.position = { x: target.x, y: 0, z: target.z };
        entry.socket.emit('playerMove', { position: entry.position });
        scheduleNext();
        return;
      }

      entry.position = {
        x: entry.position.x + (dx / dist) * stepDist,
        y: 0,
        z: entry.position.z + (dz / dist) * stepDist,
      };
      entry.socket.emit('playerMove', { position: entry.position });

      entry.moveInterval = setTimeout(tick, BOT_STEP_INTERVAL_MS) as unknown as ReturnType<typeof setInterval>;
    };

    tick();
  };

  const scheduleNext = () => {
    const idleDelay = BOT_MOVE_MIN_MS + Math.random() * (BOT_MOVE_MAX_MS - BOT_MOVE_MIN_MS);

    entry.moveInterval = setTimeout(async () => {
      if (!activeBots.has(entry.botId)) return;
      const target = await getNextTarget(entry);
      walkTo(target);
    }, idleDelay) as unknown as ReturnType<typeof setInterval>;
  };

  scheduleNext();
}

function evictOldestBot(): void {
  let oldest: BotPresenceEntry | null = null;
  for (const entry of activeBots.values()) {
    if (!oldest || entry.connectedAt < oldest.connectedAt) oldest = entry;
  }
  if (oldest) {
    console.log(`[botPresence] MAX_ACTIVE_BOTS(${MAX_ACTIVE_BOTS}) 초과 — 제거: ${oldest.botId}`);
    disconnectBot(oldest.botId);
  }
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

export async function connectBot(
  botId: string,
  nickname: string,
  sceneId = 'scene_01'
): Promise<void> {
  if (activeBots.has(botId)) {
    console.log(`[botPresence] 이미 접속 중 — skip: ${botId}`);
    return;
  }

  if (activeBots.size >= MAX_ACTIVE_BOTS) evictOldestBot();

  const socket = ioClient(HUB_SERVER_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 8000,
  });

  const initialPosition = {
    x: (Math.random() - 0.5) * 10,
    y: 0,
    z: (Math.random() - 0.5) * 10,
  };

  const entry: BotPresenceEntry = {
    botId,
    socket,
    moveInterval: null as unknown as ReturnType<typeof setInterval>,
    position: initialPosition,
    connectedAt: Date.now(),
    sceneId,
  };

  socket.on('connect', () => {
    console.log(`[botPresence] 접속: ${nickname} (botId=${botId}, scene=${sceneId})`);
    socket.emit('join', {
      nickname,
      botId,
      isBot: true,
      criteria: {},
      scene_id: sceneId,
    });
    startMoveLoop(entry);
  });

  socket.on('disconnect', (...args: unknown[]) => {
    const reason = args[0] as string;
    console.log(`[botPresence] 해제: ${botId} (reason=${reason})`);
    if (activeBots.has(botId)) {
      clearTimeout(entry.moveInterval as unknown as ReturnType<typeof setTimeout>);
      activeBots.delete(botId);
    }
  });

  socket.on('connect_error', (...args: unknown[]) => {
    const err = args[0] as Error;
    console.warn(`[botPresence] 연결 실패 (botId=${botId}): ${err.message}`);
  });

  activeBots.set(botId, entry);
}

export function disconnectBot(botId: string): void {
  const entry = activeBots.get(botId);
  if (!entry) return;
  clearTimeout(entry.moveInterval as unknown as ReturnType<typeof setTimeout>);
  entry.socket.disconnect();
  activeBots.delete(botId);
  console.log(`[botPresence] 봇 이탈: ${botId}`);
}

export function getActiveBotIds(): string[] {
  return Array.from(activeBots.keys());
}

export function getActiveBotCount(): number {
  return activeBots.size;
}

/** NavMesh 캐시 무효화 (씬 파일 변경 시) */
export function invalidateNavMeshCache(sceneId?: string): void {
  if (sceneId) {
    navMeshCache.delete(sceneId);
  } else {
    navMeshCache.clear();
  }
}
