/**
 * 춘심 허브 서버
 * - Socket.io 실시간 멀티플레이어 (Mogame V2 기반)
 * - v0.9-H: 다중 씬 룸 시스템 (scene_id 기반 분리)
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const MATCH_ENGINE_URL = process.env.MATCH_ENGINE_URL || "http://localhost:3000";
const MAX_PLAYERS_PER_SCENE = parseInt(process.env.MAX_PLAYERS_PER_SCENE || "20");
const DEFAULT_SCENE_ID = "scene_01";

// ── 타입 ────────────────────────────────────────────────────────────────────

interface UserPosition {
  x: number;
  y: number;
  z: number;
}

interface MatchCriteria {
  age_range?: [number, number];
  region?: string;
  interests?: string[];
}

interface User {
  id: string;
  position: UserPosition;
  nickname?: string;
  botId?: string;
  isBot?: boolean;
  criteria?: MatchCriteria;
  scene_id: string;
}

// ── 룸 구조 ─────────────────────────────────────────────────────────────────

// rooms[sceneId][socketId] = User
const rooms: Record<string, Record<string, User>> = {};

function getRoom(sceneId: string): Record<string, User> {
  if (!rooms[sceneId]) rooms[sceneId] = {};
  return rooms[sceneId];
}

function getRoomOf(socketId: string): string | null {
  for (const [sceneId, room] of Object.entries(rooms)) {
    if (room[socketId]) return sceneId;
  }
  return null;
}

function findUserByBotId(botId: string): User | null {
  for (const room of Object.values(rooms)) {
    const found = Object.values(room).find((u) => u.botId === botId);
    if (found) return found;
  }
  return null;
}

function findSocketIdByBotId(botId: string): string | null {
  for (const room of Object.values(rooms)) {
    for (const [sid, u] of Object.entries(room)) {
      if (u.botId === botId) return sid;
    }
  }
  return null;
}

// ── 매칭 엔진 연동 ───────────────────────────────────────────────────────────

async function notifyMatchEngine(
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  try {
    const res = await fetch(`${MATCH_ENGINE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(`[hub] matchEngine ${path} 응답 오류: ${text}`);
    }
  } catch (err) {
    console.warn(`[hub] matchEngine ${path} 연결 실패 (무시): ${err}`);
  }
}

// ── Express + Socket.io ──────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: "0.9.0", service: "chooncme-hub-server" });
});

// NEAR 이벤트 수신 (매칭 엔진 → 허브)
app.post("/near-event", (req, res) => {
  const { type, botId, botAId, botBId, score, summary } = req.body as {
    type: "botRegistered" | "matchRecorded" | "matchStarted" | "matchCompleted";
    botId?: string;
    botAId?: string;
    botBId?: string;
    score?: number;
    summary?: string;
  };

  const { badges, badgesA, badgesB } = req.body as {
    badges?: { id: string; label: string; color: string; emoji: string }[];
    badgesA?: { id: string; label: string; color: string; emoji: string }[];
    badgesB?: { id: string; label: string; color: string; emoji: string }[];
  };

  const { matchId, botAId: mBotAId, botBId: mBotBId, passed, matchSignals } = req.body as {
    matchId?: string;
    botAId?: string;
    botBId?: string;
    passed?: boolean;
    matchSignals?: string[];
  };

  if (type === "matchStarted" && matchId && mBotAId && mBotBId) {
    io.emit("matchStarted", { matchId, botAId: mBotAId, botBId: mBotBId });
    console.log(`[hub] 관전: 매칭 시작 ${mBotAId} <> ${mBotBId}`);
    res.json({ ok: true });
    return;
  }

  if (type === "matchCompleted" && matchId) {
    io.emit("matchCompleted", { matchId, botAId: mBotAId, botBId: mBotBId, score, summary, passed, matchSignals });
    console.log(`[hub] 관전: 매칭 완료 score=${score} passed=${passed}`);
    res.json({ ok: true });
    return;
  }

  if (type === "botRegistered" && botId) {
    if (badges) botBadges[botId] = badges;
    const sid = findSocketIdByBotId(botId);
    io.emit("nearAnnouncement", { type, botId, message: "춘심봇이 NEAR 기억은행에 등록되었습니다" });
    io.emit("badgeUpdate", { botId, badges: badges ?? [] });
    if (sid) io.emit("walkToBank", { socketId: sid, botId });
    console.log(`[hub] NEAR: botRegistered botId=${botId}`);
  }

  if (type === "matchRecorded" && botAId && botBId) {
    if (badgesA) botBadges[botAId] = badgesA;
    if (badgesB) botBadges[botBId] = badgesB;
    const sidA = findSocketIdByBotId(botAId);
    const sidB = findSocketIdByBotId(botBId);
    io.emit("nearAnnouncement", { type, botAId, botBId, score, summary, message: `매칭 기록이 NEAR에 저장되었습니다 (score: ${score})` });
    io.emit("badgeUpdate", { botId: botAId, badges: badgesA ?? [] });
    io.emit("badgeUpdate", { botId: botBId, badges: badgesB ?? [] });
    if (sidA) io.emit("walkToBank", { socketId: sidA, botId: botAId });
    if (sidB) io.emit("walkToBank", { socketId: sidB, botId: botBId });
    console.log(`[hub] NEAR: matchRecorded ${botAId} <> ${botBId} score=${score}`);
  }

  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// botId별 뱃지 보관
const botBadges: Record<string, { id: string; label: string; color: string; emoji: string }[]> = {};

io.on("connection", (socket) => {
  console.log(`[hub] 연결: ${socket.id}`);

  // 전체 유저 목록 (하위 호환 — 클라이언트가 users 객체로 초기화)
  const allUsers: Record<string, User> = {};
  for (const room of Object.values(rooms)) {
    Object.assign(allUsers, room);
  }
  socket.emit("init", { id: socket.id, users: allUsers });

  // 1. join
  socket.on("join", async (data: {
    nickname: string;
    botId?: string;
    isBot?: boolean;
    criteria?: MatchCriteria;
    scene_id?: string;
  }) => {
    const sceneId = data.scene_id || DEFAULT_SCENE_ID;
    const room = getRoom(sceneId);

    if (Object.keys(room).length >= MAX_PLAYERS_PER_SCENE) {
      socket.emit("sceneFull", { scene_id: sceneId });
      console.warn(`[hub] 씬 만원: ${sceneId}`);
      return;
    }

    const newUser: User = {
      id: socket.id,
      nickname: data.nickname,
      botId: data.botId,
      isBot: data.isBot ?? false,
      criteria: data.criteria,
      scene_id: sceneId,
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: (Math.random() - 0.5) * 10,
      },
    };
    room[socket.id] = newUser;

    socket.emit("joinSuccess", newUser);
    // 같은 씬 플레이어에게만 알림
    Object.keys(room).forEach((sid) => {
      if (sid !== socket.id) io.to(sid).emit("playerJoined", newUser);
    });

    console.log(`[hub] 참여: ${data.nickname} → 씬=${sceneId} (bot=${data.botId || "없음"})`);

    if (data.botId) {
      await notifyMatchEngine("/hub/join", { botId: data.botId, criteria: data.criteria ?? {} });
    }
  });

  // 2. 이동 (같은 씬에만 브로드캐스트)
  socket.on("playerMove", (data: { position: UserPosition }) => {
    const sceneId = getRoomOf(socket.id);
    if (!sceneId) return;
    const room = rooms[sceneId];
    if (room[socket.id]) room[socket.id].position = data.position;
    Object.keys(room).forEach((sid) => {
      if (sid !== socket.id) {
        io.to(sid).emit("playerMoved", { id: socket.id, position: data.position });
      }
    });
  });

  // 3. 씬 전환
  socket.on("changeScene", async (data: {
    target_scene: string;
    spawn_position: [number, number, number];
  }) => {
    const currentSceneId = getRoomOf(socket.id);
    if (!currentSceneId) return;

    const targetRoom = getRoom(data.target_scene);
    if (Object.keys(targetRoom).length >= MAX_PLAYERS_PER_SCENE) {
      socket.emit("sceneFull", { scene_id: data.target_scene });
      return;
    }

    // 현재 씬에서 제거
    const user = rooms[currentSceneId][socket.id];
    delete rooms[currentSceneId][socket.id];
    Object.keys(rooms[currentSceneId] ?? {}).forEach((sid) => {
      io.to(sid).emit("playerLeft", { id: socket.id });
    });

    // 대상 씬에 추가
    const updatedUser: User = {
      ...user,
      scene_id: data.target_scene,
      position: { x: data.spawn_position[0], y: data.spawn_position[1], z: data.spawn_position[2] },
    };
    targetRoom[socket.id] = updatedUser;
    Object.keys(targetRoom).forEach((sid) => {
      if (sid !== socket.id) io.to(sid).emit("playerJoined", updatedUser);
    });

    socket.emit("sceneChanged", {
      scene_id: data.target_scene,
      spawn_position: data.spawn_position,
    });

    // 채팅 공지 (씬 전체에 시스템 메시지)
    const sceneName = data.target_scene; // 클라이언트가 이름 알고 있음
    Object.keys(targetRoom).forEach((sid) => {
      io.to(sid).emit("chat", {
        id: "SYSTEM",
        sender: "시스템",
        message: `${updatedUser.nickname ?? "플레이어"}이(가) [${sceneName}]에 입장했습니다`,
        timestamp: Date.now(),
      });
    });

    console.log(`[hub] 씬 전환: ${user?.nickname} ${currentSceneId} → ${data.target_scene}`);
  });

  // 4. 채팅 (근거리: 15 units 이내 / /all 접두사: 씬 전체)
  const NEARBY_CHAT_RANGE = 15;
  socket.on("chat", (data: { message: string }) => {
    const sceneId = getRoomOf(socket.id);
    if (!sceneId) return;
    const room = rooms[sceneId];
    const user = room?.[socket.id];
    if (!user) return;

    const isGlobal = data.message.startsWith("/all ");
    const message = isGlobal ? data.message.slice(5) : data.message;

    const chatPayload = {
      id: socket.id,
      sender: user.nickname || "Anonymous",
      message,
      timestamp: Date.now(),
    };

    Object.entries(room).forEach(([sid, target]) => {
      if (isGlobal) {
        io.to(sid).emit("chat", chatPayload);
        return;
      }
      // 근거리 필터
      const dx = target.position.x - user.position.x;
      const dz = target.position.z - user.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= NEARBY_CHAT_RANGE) {
        io.to(sid).emit("chat", chatPayload);
      }
    });
  });

  // 5. 매칭 요청
  socket.on("requestMatch", async (data: { bot_a_id: string; bot_b_id: string }) => {
    console.log(`[hub] 매칭 요청: ${data.bot_a_id} <> ${data.bot_b_id}`);
    try {
      const res = await fetch(`${MATCH_ENGINE_URL}/match/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json() as Record<string, unknown>;
      socket.emit("matchStarted", json);
    } catch (err) {
      socket.emit("matchError", { error: String(err) });
    }
  });

  // 6. 연결 해제
  socket.on("disconnect", async () => {
    const sceneId = getRoomOf(socket.id);
    const user = sceneId ? rooms[sceneId]?.[socket.id] : null;
    console.log(`[hub] 해제: ${user?.nickname || socket.id}`);

    if (sceneId && rooms[sceneId]) {
      delete rooms[sceneId][socket.id];
      Object.keys(rooms[sceneId]).forEach((sid) => {
        io.to(sid).emit("playerLeft", { id: socket.id });
      });
    }

    if (user?.botId) {
      await notifyMatchEngine("/hub/leave", { botId: user.botId });
    }
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;

server.listen(PORT, () => {
  console.log(`[hub] 춘심 허브 서버 실행 중 — http://localhost:${PORT}`);
  console.log(`[hub] 매칭 엔진: ${MATCH_ENGINE_URL} / 씬당 최대: ${MAX_PLAYERS_PER_SCENE}명`);
});
