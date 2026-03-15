/**
 * 매칭 라우터
 * POST /match/start          — 두 봇 간 매칭 시작 (하드 필터 → Bot-to-Bot → Judge)
 * GET  /match/results/:botId — 특정 봇의 매칭 결과 조회
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getHubBot } from '../store/hubStore';
import { getProfile as getAgentProfile } from '../store/agentStore';
import { saveMatch, getMatchesByBot, updateMatchStatus } from '../store/matchStore';
import { hardFilter, runBotConversation } from '../engine/matchEngine';
import { sendMatchNotification } from '../services/notificationService';
import type { MatchResult } from '../store/matchStore';

const router = Router();

// POST /match/start
router.post('/start', async (req, res) => {
  const { bot_a_id, bot_b_id } = req.body as { bot_a_id?: string; bot_b_id?: string };

  if (!bot_a_id || !bot_b_id) {
    res.status(400).json({ ok: false, error: 'bot_a_id, bot_b_id are required' });
    return;
  }
  if (bot_a_id === bot_b_id) {
    res.status(400).json({ ok: false, error: 'same bot cannot match with itself' });
    return;
  }

  const hubA = getHubBot(bot_a_id);
  const hubB = getHubBot(bot_b_id);
  if (!hubA || !hubB) {
    res.status(404).json({ ok: false, error: 'one or both bots not found in hub' });
    return;
  }

  // ── PHASE 2: 하드 필터 ──────────────────────────────────────
  const filterResult = hardFilter(hubA, hubB);
  if (!filterResult.pass) {
    console.log(`[match] 하드 필터 탈락: ${bot_a_id} <> ${bot_b_id} — ${filterResult.reason}`);
    res.json({ ok: true, passed_filter: false, reason: filterResult.reason });
    return;
  }

  console.log(`[match] 매칭 시작: ${bot_a_id} <> ${bot_b_id}`);

  const matchId = uuidv4();
  const pending: MatchResult = {
    matchId,
    bot_a_id,
    bot_b_id,
    score: 0,
    confidence: 'low',
    match_signals: [],
    mismatch_signals: [],
    summary: '진행 중',
    status: 'in_progress',
    matched_at: new Date().toISOString(),
    notified: false,
  };
  saveMatch(pending);
  updateMatchStatus(matchId, 'in_progress');

  // ── PHASE 3: 봇-to-봇 대화 + Judge LLM ──────────────────────
  // 비동기로 실행 — 요청에 즉시 matchId 반환
  (async () => {
    try {
      const profileA = getAgentProfile(bot_a_id);
      const profileB = getAgentProfile(bot_b_id);

      if (!profileA || !profileB) {
        updateMatchStatus(matchId, 'failed');
        return;
      }

      const result = await runBotConversation(profileA, profileB);
      const { judgeScore, endReason } = result;

      const final: MatchResult = {
        matchId,
        bot_a_id,
        bot_b_id,
        score: judgeScore.score,
        confidence: judgeScore.confidence,
        match_signals: judgeScore.match_signals,
        mismatch_signals: judgeScore.mismatch_signals,
        summary: judgeScore.summary,
        status: 'completed',
        matched_at: new Date().toISOString(),
        notified: judgeScore.score >= 70,
      };
      saveMatch(final);

      console.log(
        `[match] 완료: ${bot_a_id} <> ${bot_b_id} — score=${judgeScore.score} endReason=${endReason}`
      );

      // v0.4: 알림 발송 (score >= 70 시)
      await sendMatchNotification(final, profileA.owner_email, profileB.owner_email);
    } catch (err) {
      console.error(`[match] 오류: ${err}`);
      updateMatchStatus(matchId, 'failed');
    }
  })();

  res.json({ ok: true, passed_filter: true, matchId, status: 'in_progress' });
});

// GET /match/results/:botId
router.get('/results/:botId', (req, res) => {
  const { botId } = req.params;
  const results = getMatchesByBot(botId);
  res.json({ ok: true, count: results.length, results });
});

export default router;
