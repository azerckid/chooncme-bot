/**
 * botPresenceService — 오프라인 봇 허브 자율 아바타
 *
 * 팬(주인)이 로컬 클라이언트를 종료해 오프라인 상태가 되어도
 * 서버 측에서 socket.io-client로 허브에 봇 아바타를 자동 접속시킨다.
 * 아바타는 3~8초 간격으로 랜덤 이동하며 허브에 상주한다.
 */

// socket.io-client은 CJS/ESM 혼용 환경에서 require로 로드
// eslint-disable-next-line @typescript-eslint/no-require-imports
const socketIoClient = require('socket.io-client');
const ioClient: (url: string, opts?: Record<string, unknown>) => SocketInstance = socketIoClient.io ?? socketIoClient.default ?? socketIoClient;

// socket 인스턴스 타입 (socket.io-client Socket의 최소 인터페이스)
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
const BOT_WALK_SPEED = parseFloat(process.env.BOT_WALK_SPEED || '3.0'); // units/sec
const BOT_STEP_INTERVAL_MS = 100; // 10fps — lerp가 보간하므로 충분
const MAX_ACTIVE_BOTS = parseInt(process.env.MAX_ACTIVE_BOTS || '50');

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface BotPresenceEntry {
  botId: string;
  socket: SocketInstance;
  moveInterval: ReturnType<typeof setInterval>;
  position: { x: number; y: number; z: number };
  connectedAt: number;
}

// ── 상태 ──────────────────────────────────────────────────────────────────────

const activeBots = new Map<string, BotPresenceEntry>();

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

function randomInRange(center: number, range: number): number {
  return center + (Math.random() * 2 - 1) * range;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function startMoveLoop(entry: BotPresenceEntry): void {
  // 목적지까지 BOT_WALK_SPEED(units/sec)로 조금씩 이동 후 잠시 대기
  const walkTo = (target: { x: number; z: number }) => {
    const stepDist = (BOT_WALK_SPEED * BOT_STEP_INTERVAL_MS) / 1000;

    const tick = () => {
      if (!activeBots.has(entry.botId)) return;

      const dx = target.x - entry.position.x;
      const dz = target.z - entry.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= stepDist) {
        // 목적지 도착 — 정확히 맞추고 다음 목적지 예약
        entry.position = { x: target.x, y: 0, z: target.z };
        entry.socket.emit('playerMove', { position: entry.position });
        scheduleNext();
        return;
      }

      // 한 스텝만큼 이동
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

    entry.moveInterval = setTimeout(() => {
      if (!activeBots.has(entry.botId)) return;

      const target = {
        x: clamp(randomInRange(entry.position.x, BOT_MOVE_RANGE), -14, 14),
        z: clamp(randomInRange(entry.position.z, BOT_MOVE_RANGE), -14, 14),
      };

      walkTo(target);
    }, idleDelay) as unknown as ReturnType<typeof setInterval>;
  };

  scheduleNext();
}

function evictOldestBot(): void {
  let oldest: BotPresenceEntry | null = null;
  for (const entry of activeBots.values()) {
    if (!oldest || entry.connectedAt < oldest.connectedAt) {
      oldest = entry;
    }
  }
  if (oldest) {
    console.log(`[botPresence] MAX_ACTIVE_BOTS(${MAX_ACTIVE_BOTS}) 초과 — 가장 오래된 봇 제거: ${oldest.botId}`);
    disconnectBot(oldest.botId);
  }
}

// ── 공개 API ──────────────────────────────────────────────────────────────────

/**
 * 봇을 허브에 자동 접속시킨다.
 * 이미 접속 중인 봇이면 skip.
 */
export async function connectBot(botId: string, nickname: string): Promise<void> {
  if (activeBots.has(botId)) {
    console.log(`[botPresence] 이미 접속 중 — skip: ${botId}`);
    return;
  }

  if (activeBots.size >= MAX_ACTIVE_BOTS) {
    evictOldestBot();
  }

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
  };

  socket.on('connect', () => {
    console.log(`[botPresence] 허브 접속 완료: ${nickname} (botId=${botId})`);
    socket.emit('join', {
      nickname,
      botId,
      isBot: true,
      criteria: {},
    });
    startMoveLoop(entry);
  });

  socket.on('disconnect', (...args: unknown[]) => {
    const reason = args[0] as string;
    console.log(`[botPresence] 허브 연결 해제: ${botId} (reason=${reason})`);
    // 명시적으로 disconnectBot()을 호출하지 않은 경우(서버 재시작 등) 정리
    if (activeBots.has(botId)) {
      clearTimeout(entry.moveInterval as unknown as ReturnType<typeof setTimeout>);
      activeBots.delete(botId);
    }
  });

  socket.on('connect_error', (...args: unknown[]) => {
    const err = args[0] as Error;
    console.warn(`[botPresence] 허브 연결 실패 (botId=${botId}): ${err.message}`);
  });

  activeBots.set(botId, entry);
}

/**
 * 봇을 허브에서 이탈시킨다.
 */
export function disconnectBot(botId: string): void {
  const entry = activeBots.get(botId);
  if (!entry) return;

  clearTimeout(entry.moveInterval as unknown as ReturnType<typeof setTimeout>);
  entry.socket.disconnect();
  activeBots.delete(botId);
  console.log(`[botPresence] 봇 이탈: ${botId}`);
}

/**
 * 현재 허브에 접속 중인 봇 ID 목록.
 */
export function getActiveBotIds(): string[] {
  return Array.from(activeBots.keys());
}

/**
 * 현재 활성 봇 수.
 */
export function getActiveBotCount(): number {
  return activeBots.size;
}
