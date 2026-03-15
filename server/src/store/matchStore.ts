/**
 * 매칭 결과 저장소 (인메모리)
 */

export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type MatchResult = {
  matchId: string;
  bot_a_id: string;
  bot_b_id: string;
  score: number;              // 0~100
  confidence: 'high' | 'medium' | 'low';
  match_signals: string[];
  mismatch_signals: string[];
  summary: string;
  status: MatchStatus;
  matched_at: string;
  notified: boolean;
};

const store = new Map<string, MatchResult>();

export function saveMatch(result: MatchResult): void {
  store.set(result.matchId, result);
}

export function getMatch(matchId: string): MatchResult | undefined {
  return store.get(matchId);
}

export function getMatchesByBot(botId: string): MatchResult[] {
  return Array.from(store.values()).filter(
    m => m.bot_a_id === botId || m.bot_b_id === botId
  );
}

export function updateMatchStatus(matchId: string, status: MatchStatus): void {
  const m = store.get(matchId);
  if (m) store.set(matchId, { ...m, status });
}
