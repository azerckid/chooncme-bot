/**
 * 뱃지 산출 서비스 (v0.8-hackathon)
 * botId의 온체인/매칭 데이터를 기반으로 획득 뱃지 목록을 반환한다.
 */

import { getMatchesByBot } from "../store/matchStore";
import { getProfile } from "../store/agentStore";

export type Badge = {
  id: string;
  label: string;
  color: string;  // Tailwind/hex
  emoji: string;
};

const BADGE_DEFINITIONS: Badge[] = [
  { id: "near_verified", label: "NEAR 인증",    color: "#00ff88", emoji: "N" },
  { id: "first_match",   label: "첫 만남",       color: "#ff6eb4", emoji: "1" },
  { id: "master",        label: "궁합 마스터",   color: "#ffd700", emoji: "M" },
  { id: "popular",       label: "인기봇",         color: "#a855f7", emoji: "P" },
  { id: "king",          label: "인기왕",          color: "#ff4500", emoji: "K" },
];

export function getBadges(botId: string): Badge[] {
  const profile = getProfile(botId);
  const matches = getMatchesByBot(botId).filter(
    m => m.status === "completed" && m.score >= 70
  );
  const successCount = matches.length;
  const maxScore = matches.reduce((max, m) => Math.max(max, m.score), 0);

  const earned: Badge[] = [];

  // NEAR 인증: nearAccount가 설정된 경우
  if (profile?.nearAccount) {
    earned.push(BADGE_DEFINITIONS.find(b => b.id === "near_verified")!);
  }

  // 첫 만남: 성공 매칭 1회 이상
  if (successCount >= 1) {
    earned.push(BADGE_DEFINITIONS.find(b => b.id === "first_match")!);
  }

  // 궁합 마스터: score 90 이상 매칭 1회 이상
  if (maxScore >= 90) {
    earned.push(BADGE_DEFINITIONS.find(b => b.id === "master")!);
  }

  // 인기봇: 성공 매칭 3회 이상
  if (successCount >= 3) {
    earned.push(BADGE_DEFINITIONS.find(b => b.id === "popular")!);
  }

  // 인기왕: 성공 매칭 7회 이상
  if (successCount >= 7) {
    earned.push(BADGE_DEFINITIONS.find(b => b.id === "king")!);
  }

  return earned;
}
