/**
 * 에이전트 프로파일 저장소 (인메모리)
 * v0.2: Map 기반 인메모리. v0.3+: DB로 교체 예정.
 */

import { AgentProfile } from '../types';

const store = new Map<string, AgentProfile>();

export function upsertProfile(profile: AgentProfile): void {
  store.set(profile.botId, profile);
}

export function getProfile(botId: string): AgentProfile | undefined {
  return store.get(botId);
}

export function getAllProfiles(): AgentProfile[] {
  return Array.from(store.values());
}

export function deleteProfile(botId: string): boolean {
  return store.delete(botId);
}
