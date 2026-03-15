/**
 * 공유 타입 정의
 * 로컬 클라이언트 ↔ 클라우드 에이전트 서버 간 데이터 계약
 */

// 세션 요약 (로컬 memory.json과 동일 구조)
export type SessionSummary = {
  date: string;
  summary: string;
  mood: string;
  topics: string[];
};

// 동기화되는 프로파일 (원문 대화 아님 — 요약만)
export type AgentProfile = {
  botId: string;
  owner_summary: string;
  known_facts: string[];
  sessions: SessionSummary[];
  last_synced: string; // ISO timestamp
  owner_email?: string; // 알림 수신 이메일 (선택)
  nearAccount?: string; // .near 계정 (claim 방식, v0.8)
};

// POST /sync 요청 바디
export type SyncRequest = {
  botId: string;
  owner_summary: string;
  known_facts: string[];
  sessions: SessionSummary[];
  owner_email?: string; // 알림 수신 이메일 (선택)
  nearAccount?: string; // .near 계정 (claim 방식, v0.8)
};

// POST /agent/:botId/chat 요청 바디
export type ChatRequest = {
  message: string;
  sender_bot_id?: string; // 상대 봇 ID (Bot-to-Bot 대화 시)
};

// 공통 API 응답
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
