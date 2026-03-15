/**
 * GET  /agent/:botId         — 에이전트 프로파일 조회
 * POST /agent/:botId/chat    — 클라우드 에이전트 대화 (오프라인 대리)
 */

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { ChatRequest, ApiResponse, AgentProfile } from '../types';
import { getProfile } from '../store/agentStore';

const router = Router();

// dotenv 로드 후 사용되도록 요청 시점에 생성
function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// GET /agent/:botId
router.get('/:botId', (req: Request, res: Response) => {
  const profile = getProfile(req.params.botId);

  if (!profile) {
    const r: ApiResponse<never> = { ok: false, error: 'Agent not found' };
    res.status(404).json(r);
    return;
  }

  const r: ApiResponse<AgentProfile> = { ok: true, data: profile };
  res.status(200).json(r);
});

// POST /agent/:botId/chat
router.post('/:botId/chat', async (req: Request, res: Response) => {
  const profile = getProfile(req.params.botId);

  if (!profile) {
    const r: ApiResponse<never> = { ok: false, error: 'Agent not found' };
    res.status(404).json(r);
    return;
  }

  const body = req.body as ChatRequest;
  if (!body.message || typeof body.message !== 'string') {
    const r: ApiResponse<never> = { ok: false, error: 'message is required' };
    res.status(400).json(r);
    return;
  }

  const systemPrompt = buildAgentSystemPrompt(profile);

  try {
    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: body.message }],
    });

    const reply =
      response.content[0].type === 'text' ? response.content[0].text : '';

    console.log(`[agent] botId=${req.params.botId} chat responded`);

    const r: ApiResponse<{ reply: string }> = { ok: true, data: { reply } };
    res.status(200).json(r);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const r: ApiResponse<never> = { ok: false, error: msg };
    res.status(500).json(r);
  }
});

function buildAgentSystemPrompt(profile: AgentProfile): string {
  const recentSessions = profile.sessions.slice(-3);

  return `
당신은 '춘심'이라는 이름의 AI 에이전트입니다.
지금은 주인(${profile.owner_summary ? '아래 설명 참고' : '아직 잘 모름'})이 오프라인 상태입니다.
당신은 주인을 대리해 허브에서 다른 춘심봇들과 대화합니다.

주인에 대해 알고 있는 것:
${profile.owner_summary || '아직 많이 모릅니다.'}

알려진 사실:
${profile.known_facts.length > 0 ? profile.known_facts.map(f => `- ${f}`).join('\n') : '없음'}

최근 대화 요약:
${recentSessions.length > 0
    ? recentSessions.map(s => `- ${s.date}: ${s.summary}`).join('\n')
    : '없음'}

대화 규칙:
- 반말, 짧고 친근한 메신저 스타일
- 주인의 성격과 관심사를 자연스럽게 드러내세요
- 모르는 것은 솔직하게 모른다고 하세요
- AI라고 밝히지 않습니다
`.trim();
}

export default router;
