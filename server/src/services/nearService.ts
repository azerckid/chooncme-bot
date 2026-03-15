/**
 * NEAR 온체인 연동 서비스 (v0.8-hackathon)
 *
 * near-api-js v7 (ESModule) → Function() 패턴으로 CJS에서 실제 dynamic import 수행.
 * TypeScript가 import()를 require()로 변환하는 것을 방지.
 * 환경변수 미설정 시 silent skip — 기존 기능에 영향 없음.
 */

import { AgentProfile } from "../types";
import { MatchResult } from "../store/matchStore";
import { getBadges } from "./badgeService";

const {
  NEAR_NETWORK = "testnet",
  NEAR_CONTRACT_ID,
  NEAR_ACCOUNT_ID,
  NEAR_PRIVATE_KEY,
  HUB_SERVER_URL,
} = process.env;

async function notifyHub(body: Record<string, unknown>): Promise<void> {
  if (!HUB_SERVER_URL) return;
  try {
    await fetch(`${HUB_SERVER_URL}/near-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // 허브 미실행 시 조용히 무시
  }
}

export function isNearConfigured(): boolean {
  return !!(NEAR_CONTRACT_ID && NEAR_ACCOUNT_ID && NEAR_PRIVATE_KEY);
}

// Function()으로 감싸서 tsc의 require() 변환을 방지 (near-api-js v7 ESModule 호환)
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const nearImport = new Function('return import("near-api-js")') as () => Promise<any>;

async function getAccount() {
  const { Account, KeyPairSigner, JsonRpcProvider, KeyPair } = await nearImport();
  const provider = new JsonRpcProvider({ url: `https://rpc.${NEAR_NETWORK}.near.org` });
  const keyPair = KeyPair.fromString(NEAR_PRIVATE_KEY as `ed25519:${string}`);
  const signer = new KeyPairSigner(keyPair);
  return new Account(NEAR_ACCOUNT_ID as string, provider, signer);
}

export async function registerBotOnChain(profile: AgentProfile): Promise<void> {
  if (!isNearConfigured()) return;
  try {
    const account = await getAccount();
    await account.callFunction({
      contractId: NEAR_CONTRACT_ID as string,
      methodName: "registerBot",
      args: {
        botId: profile.botId,
        ownerAccount: profile.nearAccount ?? "",
        ownerSummary: profile.owner_summary.slice(0, 500),
      },
      gas: BigInt("30000000000000"),
      deposit: BigInt(0),
    });
    console.log(`[NEAR] registerBot: ${profile.botId}`);
    await notifyHub({
      type: "botRegistered",
      botId: profile.botId,
      badges: getBadges(profile.botId),
    });
  } catch (err) {
    console.error(`[NEAR] registerBot 실패 (skip):`, err);
  }
}

export async function recordMatchOnChain(result: MatchResult): Promise<void> {
  if (!isNearConfigured()) return;
  try {
    const account = await getAccount();
    await account.callFunction({
      contractId: NEAR_CONTRACT_ID as string,
      methodName: "recordMatch",
      args: {
        matchId: result.matchId,
        botAId: result.bot_a_id,
        botBId: result.bot_b_id,
        score: result.score,
        summary: result.summary.slice(0, 500),
      },
      gas: BigInt("30000000000000"),
      deposit: BigInt(0),
    });
    console.log(`[NEAR] recordMatch: ${result.matchId} score=${result.score}`);
    await notifyHub({
      type: "matchRecorded",
      botAId: result.bot_a_id,
      botBId: result.bot_b_id,
      score: result.score,
      summary: result.summary,
      badgesA: getBadges(result.bot_a_id),
      badgesB: getBadges(result.bot_b_id),
    });
  } catch (err) {
    console.error(`[NEAR] recordMatch 실패 (skip):`, err);
  }
}
