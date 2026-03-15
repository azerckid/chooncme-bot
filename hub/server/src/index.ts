/**
 * 춘심 허브 서버
 * - Socket.io 실시간 멀티플레이어 (Mogame V2 기반)
 * - 플레이어 join/leave 시 매칭 엔진 서버(MATCH_ENGINE_URL) 자동 연동
 */

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// 매칭 엔진 서버 주소 (chooncme-server, 기본 localhost:3000)
const MATCH_ENGINE_URL = process.env.MATCH_ENGINE_URL || "http://localhost:3000";

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
  botId?: string;       // 춘심봇 ID (UUID)
  criteria?: MatchCriteria; // 매칭 조건
}

// ── 매칭 엔진 연동 헬퍼 ─────────────────────────────────────────────────────

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
    // 매칭 엔진 미실행 시 조용히 무시
    console.warn(`[hub] matchEngine ${path} 연결 실패 (무시): ${err}`);
  }
}

// ── Express + Socket.io ──────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, version: "0.3.0", service: "chooncme-hub-server" });
});

// NEAR 이벤트 수신 엔드포인트 (매칭 엔진 서버 → 허브 서버)
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
    io.emit("matchCompleted", {
      matchId,
      botAId: mBotAId,
      botBId: mBotBId,
      score,
      summary,
      passed,
      matchSignals,
    });
    console.log(`[hub] 관전: 매칭 완료 score=${score} passed=${passed}`);
    res.json({ ok: true });
    return;
  }

  if (type === "botRegistered" && botId) {
    if (badges) botBadges[botId] = badges;
    const targetSocket = Object.values(users).find(u => u.botId === botId);
    const message = `춘심봇이 NEAR 기억은행에 등록되었습니다`;
    io.emit("nearAnnouncement", { type, botId, message });
    io.emit("badgeUpdate", { botId, badges: badges ?? [] });
    if (targetSocket) {
      io.emit("walkToBank", { socketId: targetSocket.id, botId });
    }
    console.log(`[hub] NEAR 이벤트: botRegistered botId=${botId}`);
  }

  if (type === "matchRecorded" && botAId && botBId) {
    if (badgesA) botBadges[botAId] = badgesA;
    if (badgesB) botBadges[botBId] = badgesB;
    const socketA = Object.values(users).find(u => u.botId === botAId);
    const socketB = Object.values(users).find(u => u.botId === botBId);
    const message = `매칭 기록이 NEAR에 저장되었습니다 (score: ${score})`;
    io.emit("nearAnnouncement", { type, botAId, botBId, score, summary, message });
    io.emit("badgeUpdate", { botId: botAId, badges: badgesA ?? [] });
    io.emit("badgeUpdate", { botId: botBId, badges: badgesB ?? [] });
    if (socketA) io.emit("walkToBank", { socketId: socketA.id, botId: botAId });
    if (socketB) io.emit("walkToBank", { socketId: socketB.id, botId: botBId });
    console.log(`[hub] NEAR 이벤트: matchRecorded ${botAId} <> ${botBId} score=${score}`);
  }

  res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users: Record<string, User> = {};

// botId별 뱃지 보관
const botBadges: Record<string, { id: string; label: string; color: string; emoji: string }[]> = {};

io.on("connection", (socket) => {
  console.log(`[hub] 클라이언트 연결: ${socket.id}`);

  // 1. 초기 접속: 내 ID + 현재 접속자 목록 전달
  socket.emit("init", { id: socket.id, users });

  // 2. 게임 참여 (join)
  socket.on("join", async (data: {
    nickname: string;
    botId?: string;
    criteria?: MatchCriteria;
  }) => {
    const newUser: User = {
      id: socket.id,
      nickname: data.nickname,
      botId: data.botId,
      criteria: data.criteria,
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: (Math.random() - 0.5) * 10,
      },
    };
    users[socket.id] = newUser;

    // 나에게 내 정보 전송
    socket.emit("joinSuccess", newUser);
    // 다른 사람들에게 알림
    socket.broadcast.emit("playerJoined", newUser);

    console.log(`[hub] 참여: ${data.nickname} (socket=${socket.id}, bot=${data.botId || "없음"})`);

    // 매칭 엔진에 허브 등록
    if (data.botId) {
      await notifyMatchEngine("/hub/join", {
        botId: data.botId,
        criteria: data.criteria ?? {},
      });
    }
  });

  // 3. 이동 (playerMove)
  socket.on("playerMove", (data: { position: UserPosition }) => {
    if (users[socket.id]) {
      users[socket.id].position = data.position;
      socket.broadcast.emit("playerMoved", {
        id: socket.id,
        position: data.position,
      });
    }
  });

  // 4. 채팅 (chat)
  socket.on("chat", (data: { message: string }) => {
    if (!users[socket.id]) return;
    io.emit("chat", {
      id: socket.id,
      sender: users[socket.id].nickname || "Anonymous",
      message: data.message,
      timestamp: Date.now(),
    });
  });

  // 5. 매칭 요청 (requestMatch) — 두 봇 ID를 지정해 매칭 시작
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
    const user = users[socket.id];
    console.log(`[hub] 연결 해제: ${user?.nickname || socket.id}`);

    if (user?.botId) {
      await notifyMatchEngine("/hub/leave", { botId: user.botId });
    }

    delete users[socket.id];
    io.emit("playerLeft", { id: socket.id });
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;

server.listen(PORT, () => {
  console.log(`[hub] 춘심 허브 서버 실행 중 — http://localhost:${PORT}`);
  console.log(`[hub] 매칭 엔진 연결: ${MATCH_ENGINE_URL}`);
});
