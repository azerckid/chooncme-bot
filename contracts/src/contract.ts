import {
  NearBindgen,
  call,
  view,
  near,
  UnorderedMap,
  Vector,
} from "near-sdk-js";

interface BotRecord {
  botId: string;
  ownerAccount: string; // .near 계정 (claim 방식, 검증 없음)
  ownerSummary: string; // 성장 데이터 요약 (개인정보 제외)
  registeredAt: string; // block timestamp (bigint → string)
}

interface MatchRecord {
  matchId: string;
  botAId: string;
  botBId: string;
  score: number;
  summary: string;
  recordedAt: string; // block timestamp (bigint → string)
}

@NearBindgen({})
export class ChunSimContract {
  bots: UnorderedMap<BotRecord> = new UnorderedMap<BotRecord>("bots");
  matches: UnorderedMap<MatchRecord> = new UnorderedMap<MatchRecord>("matches");
  // botId → matchId 목록 (최근 순)
  botMatches: UnorderedMap<string[]> = new UnorderedMap<string[]>("bot_matches");

  // ──────────────────────────────────────────
  // CALL 메서드 (트랜잭션 필요)
  // ──────────────────────────────────────────

  @call({})
  registerBot({
    botId,
    ownerAccount,
    ownerSummary,
  }: {
    botId: string;
    ownerAccount: string;
    ownerSummary: string;
  }): void {
    const record: BotRecord = {
      botId,
      ownerAccount,
      ownerSummary,
      registeredAt: near.blockTimestamp().toString(),
    };
    this.bots.set(botId, record);
    near.log(`registerBot: ${botId} → ${ownerAccount}`);
  }

  @call({})
  recordMatch({
    matchId,
    botAId,
    botBId,
    score,
    summary,
  }: {
    matchId: string;
    botAId: string;
    botBId: string;
    score: number;
    summary: string;
  }): void {
    const record: MatchRecord = {
      matchId,
      botAId,
      botBId,
      score,
      summary,
      recordedAt: near.blockTimestamp().toString(),
    };
    this.matches.set(matchId, record);

    // botA 매칭 이력 업데이트
    const aHistory = this.botMatches.get(botAId) ?? [];
    aHistory.unshift(matchId);
    this.botMatches.set(botAId, aHistory);

    // botB 매칭 이력 업데이트
    const bHistory = this.botMatches.get(botBId) ?? [];
    bHistory.unshift(matchId);
    this.botMatches.set(botBId, bHistory);

    near.log(`recordMatch: ${matchId} (${botAId} ↔ ${botBId}) score=${score}`);
  }

  // ──────────────────────────────────────────
  // VIEW 메서드 (읽기 전용, 가스비 없음)
  // ──────────────────────────────────────────

  @view({})
  getBot({ botId }: { botId: string }): BotRecord | null {
    return this.bots.get(botId) ?? null;
  }

  @view({})
  getMatch({ matchId }: { matchId: string }): MatchRecord | null {
    return this.matches.get(matchId) ?? null;
  }

  @view({})
  getMatchHistory({ botId }: { botId: string }): MatchRecord[] {
    const ids = this.botMatches.get(botId) ?? [];
    const results: MatchRecord[] = [];
    for (const id of ids) {
      const m = this.matches.get(id);
      if (m) results.push(m);
    }
    return results;
  }
}
