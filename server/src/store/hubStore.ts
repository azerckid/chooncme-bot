/**
 * 허브 접속 봇 관리 (인메모리)
 */

export type MatchCriteria = {
  age_range?: [number, number];   // [min, max]
  region?: string;                // 지역
  interests?: string[];           // 관심사 카테고리
};

export type HubBot = {
  botId: string;
  criteria: MatchCriteria;        // 주인이 설정한 매칭 조건
  joined_at: string;              // ISO timestamp
};

const hub = new Map<string, HubBot>();

export function joinHub(bot: HubBot): void {
  hub.set(bot.botId, bot);
}

export function leaveHub(botId: string): boolean {
  return hub.delete(botId);
}

export function getHubBot(botId: string): HubBot | undefined {
  return hub.get(botId);
}

export function getAllHubBots(): HubBot[] {
  return Array.from(hub.values());
}

export function isInHub(botId: string): boolean {
  return hub.has(botId);
}
