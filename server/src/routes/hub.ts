/**
 * 허브 등록/조회/이탈 라우터
 * POST /hub/join   — 봇 허브 등록 (매칭 조건 포함)
 * GET  /hub/bots   — 현재 허브에 있는 봇 목록
 * POST /hub/leave  — 봇 허브 이탈
 */

import { Router } from 'express';
import { joinHub, leaveHub, getAllHubBots, isInHub } from '../store/hubStore';
import type { HubBot, MatchCriteria } from '../store/hubStore';

const router = Router();

// POST /hub/join
router.post('/join', (req, res) => {
  const { botId, criteria } = req.body as { botId?: string; criteria?: MatchCriteria };

  if (!botId || typeof botId !== 'string') {
    res.status(400).json({ ok: false, error: 'botId is required' });
    return;
  }

  const bot: HubBot = {
    botId,
    criteria: criteria ?? {},
    joined_at: new Date().toISOString(),
  };

  joinHub(bot);
  console.log(`[hub] 봇 등록: ${botId}`);
  res.json({ ok: true, botId });
});

// GET /hub/bots
router.get('/bots', (_req, res) => {
  const bots = getAllHubBots();
  res.json({ ok: true, count: bots.length, bots });
});

// POST /hub/leave
router.post('/leave', (req, res) => {
  const { botId } = req.body as { botId?: string };

  if (!botId || typeof botId !== 'string') {
    res.status(400).json({ ok: false, error: 'botId is required' });
    return;
  }

  const removed = leaveHub(botId);
  if (!removed) {
    res.status(404).json({ ok: false, error: 'bot not found in hub' });
    return;
  }

  console.log(`[hub] 봇 이탈: ${botId}`);
  res.json({ ok: true, botId });
});

export default router;
