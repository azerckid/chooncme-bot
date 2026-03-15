/**
 * POST /sync — 로컬 클라이언트가 세션 종료 시 프로파일 업로드
 */

import { Router, Request, Response } from 'express';
import { SyncRequest, ApiResponse, AgentProfile } from '../types';
import { upsertProfile, getProfile } from '../store/agentStore';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const body = req.body as SyncRequest;

  if (!body.botId || typeof body.botId !== 'string') {
    const r: ApiResponse<never> = { ok: false, error: 'botId is required' };
    res.status(400).json(r);
    return;
  }

  const profile: AgentProfile = {
    botId: body.botId,
    owner_summary: body.owner_summary ?? '',
    known_facts: body.known_facts ?? [],
    sessions: body.sessions ?? [],
    last_synced: new Date().toISOString(),
    owner_email: body.owner_email,
  };

  upsertProfile(profile);

  console.log(`[sync] botId=${body.botId} synced (${profile.sessions.length} sessions)`);

  const r: ApiResponse<{ last_synced: string }> = {
    ok: true,
    data: { last_synced: profile.last_synced },
  };
  res.status(200).json(r);
});

export default router;
