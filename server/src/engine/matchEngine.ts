/**
 * 매칭 엔진
 * - PHASE 2: 하드 필터 (주인이 설정한 조건 기준)
 * - PHASE 3: 봇 간 대화 + Judge LLM 판정
 */

import Anthropic from '@anthropic-ai/sdk';
import type { HubBot } from '../store/hubStore';
import type { AgentProfile } from '../types';

// ── 설정값 ──────────────────────────────────────────────────────────────────

const MAX_TURNS = 10;
const TURN_TIMEOUT_MS = 10_000;
const SESSION_TIMEOUT_MS = 120_000;
const MATCH_THRESHOLD = 80;    // 이 이상 → 즉시 매칭 종료
const MISMATCH_THRESHOLD = 20; // 이 이하 → 즉시 불일치 종료
const EARLY_CHECK_EVERY = 2;   // 짝수 턴마다 Judge 중간 점검

function getClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// ── 하드 필터 ─────────────────────────────────────────────────────────────────

export type HardFilterResult = { pass: boolean; reason?: string };

export function hardFilter(a: HubBot, b: HubBot): HardFilterResult {
  const ca = a.criteria;
  const cb = b.criteria;

  // 지역 조건: 둘 다 설정한 경우에만 비교
  if (ca.region && cb.region && ca.region !== cb.region) {
    return { pass: false, reason: `지역 불일치 (${ca.region} vs ${cb.region})` };
  }

  // 나이대 조건: 겹치는 구간이 있어야 함
  if (ca.age_range && cb.age_range) {
    const [aMin, aMax] = ca.age_range;
    const [bMin, bMax] = cb.age_range;
    if (aMax < bMin || bMax < aMin) {
      return { pass: false, reason: `나이대 불일치 (${aMin}-${aMax} vs ${bMin}-${bMax})` };
    }
  }

  // 관심사 조건: 공통 관심사가 하나 이상 있어야 함
  if (ca.interests && ca.interests.length > 0 && cb.interests && cb.interests.length > 0) {
    const intersection = ca.interests.filter(i => cb.interests!.includes(i));
    if (intersection.length === 0) {
      return { pass: false, reason: `공통 관심사 없음 (${ca.interests.join(',')} vs ${cb.interests.join(',')})` };
    }
  }

  return { pass: true };
}

// ── Judge LLM ─────────────────────────────────────────────────────────────────

export type JudgeScore = {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  match_signals: string[];
  mismatch_signals: string[];
  summary: string;
};

async function callJudge(
  conversation: Array<{ bot: 'A' | 'B'; text: string }>,
  profileA: AgentProfile,
  profileB: AgentProfile
): Promise<JudgeScore> {
  const client = getClient();

  const convoText = conversation
    .map((t, i) => `[${i + 1}] 봇${t.bot}: ${t.text}`)
    .join('\n');

  const systemPrompt = `너는 두 사람의 궁합을 평가하는 심판이다.
아래는 두 춘심봇이 각자의 주인을 대표해 나눈 대화다.
대화 내용을 바탕으로 두 주인의 궁합 점수(0~100)와 판단 근거를 JSON으로 반환해라.

출력 형식 (JSON만, 코드 블록 없이):
{
  "score": number,
  "confidence": "high" | "medium" | "low",
  "match_signals": string[],
  "mismatch_signals": string[],
  "summary": string
}`;

  const userContent = `봇A 프로파일: ${profileA.owner_summary || '정보 없음'}
봇B 프로파일: ${profileB.owner_summary || '정보 없음'}

대화:
${convoText}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  const raw = (response.content[0] as { type: string; text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

  try {
    return JSON.parse(raw) as JudgeScore;
  } catch {
    // 파싱 실패 시 기본값 반환
    return {
      score: 50,
      confidence: 'low',
      match_signals: [],
      mismatch_signals: ['판정 파싱 실패'],
      summary: `[파싱 실패] ${raw.slice(0, 500)}`,
    };
  }
}

// ── 봇 단일 응답 ──────────────────────────────────────────────────────────────

async function getBotReply(
  profile: AgentProfile,
  botLabel: string,
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>,
  opponentProfile: AgentProfile,
): Promise<string> {
  const client = getClient();

  const systemPrompt = `너는 "${botLabel}"의 춘심봇이다. 주인 ${botLabel}을 대표해 상대 봇과 대화 중이다.
주인 정보: ${profile.owner_summary || '특별한 정보 없음'}
상대 봇 주인 정보: ${opponentProfile.owner_summary || '특별한 정보 없음'}

규칙:
- 주인의 성격과 취향을 바탕으로 자연스럽게 대화해라
- 프로파일에 없는 정보는 지어내지 마라
- 한 번에 2~3문장 이내로 짧게 답해라
- 친근하고 가벼운 대화 톤을 유지해라`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: systemPrompt,
    messages: conversation,
  });

  return (response.content[0] as { type: string; text: string }).text.trim();
}

// ── 봇-to-봇 대화 세션 ────────────────────────────────────────────────────────

export type BotConversationResult = {
  conversation: Array<{ bot: 'A' | 'B'; text: string }>;
  judgeScore: JudgeScore;
  endReason: 'max_turns' | 'early_match' | 'early_mismatch' | 'timeout';
};

export async function runBotConversation(
  profileA: AgentProfile,
  profileB: AgentProfile,
): Promise<BotConversationResult> {
  const conversation: Array<{ bot: 'A' | 'B'; text: string }> = [];

  // 각 봇의 메시지 히스토리 (Anthropic API 형식)
  const historyA: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  const historyB: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  let judgeScore: JudgeScore = {
    score: 50,
    confidence: 'low',
    match_signals: [],
    mismatch_signals: [],
    summary: '대화 시작 전',
  };
  let endReason: BotConversationResult['endReason'] = 'max_turns';

  const sessionStart = Date.now();

  // 봇 A가 먼저 인사
  const opening = `안녕! 나는 ${profileA.owner_summary?.slice(0, 30) || '춘심 팬'}의 춘심봇이야. 반가워!`;
  conversation.push({ bot: 'A', text: opening });
  historyB.push({ role: 'user', content: opening });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // 세션 타임아웃 체크
    if (Date.now() - sessionStart > SESSION_TIMEOUT_MS) {
      endReason = 'timeout';
      break;
    }

    // 봇 B 응답
    const replyBPromise = getBotReply(profileB, 'B', historyB, profileA);
    const replyBTimeout = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), TURN_TIMEOUT_MS)
    );
    const replyB = await Promise.race([replyBPromise, replyBTimeout]).catch(() => '...');
    conversation.push({ bot: 'B', text: replyB });
    historyA.push({ role: 'user', content: replyB });
    historyB.push({ role: 'assistant', content: replyB });

    // 봇 A 응답
    const replyAPromise = getBotReply(profileA, 'A', historyA, profileB);
    const replyATimeout = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), TURN_TIMEOUT_MS)
    );
    const replyA = await Promise.race([replyAPromise, replyATimeout]).catch(() => '...');
    conversation.push({ bot: 'A', text: replyA });
    historyA.push({ role: 'assistant', content: replyA });
    historyB.push({ role: 'user', content: replyA });

    // 짝수 턴마다 Judge 중간 점검
    if ((turn + 1) % EARLY_CHECK_EVERY === 0) {
      judgeScore = await callJudge(conversation, profileA, profileB);
      if (judgeScore.score >= MATCH_THRESHOLD) {
        endReason = 'early_match';
        break;
      }
      if (judgeScore.score <= MISMATCH_THRESHOLD) {
        endReason = 'early_mismatch';
        break;
      }
    }
  }

  // 최종 Judge 판정 (early exit 아닌 경우)
  if (endReason === 'max_turns' || endReason === 'timeout') {
    judgeScore = await callJudge(conversation, profileA, profileB);
  }

  return { conversation, judgeScore, endReason };
}
