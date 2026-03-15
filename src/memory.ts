/**
 * AI Memory — 세션 요약 로컬 저장/로드 + 클라우드 에이전트 서버 동기화
 * 저장 위치: ~/.chooncme/memory.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as http from 'http';
import Anthropic from '@anthropic-ai/sdk';

const MEMORY_DIR = path.join(os.homedir(), '.chooncme');
const MEMORY_FILE = path.join(MEMORY_DIR, 'memory.json');
const MAX_SESSIONS = 10; // 최근 N개 세션만 유지

export type SessionSummary = {
  date: string;        // YYYY-MM-DD
  summary: string;     // 오늘 대화 요약
  mood: string;        // 감정 상태 변화
  topics: string[];    // 주요 토픽
};

export type Memory = {
  owner_summary: string;       // 주인에 대한 전반적 요약 (누적 업데이트)
  known_facts: string[];       // 확인된 사실들
  sessions: SessionSummary[];  // 세션별 요약 (최근 N개)
};

const DEFAULT_MEMORY: Memory = {
  owner_summary: '',
  known_facts: [],
  sessions: [],
};

// 메모리 디렉토리/파일 초기화
function ensureMemoryDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

export function loadMemory(): Memory {
  ensureMemoryDir();

  if (!fs.existsSync(MEMORY_FILE)) {
    return { ...DEFAULT_MEMORY };
  }

  try {
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Memory;
    return {
      owner_summary: parsed.owner_summary ?? '',
      known_facts: parsed.known_facts ?? [],
      sessions: parsed.sessions ?? [],
    };
  } catch {
    // 파일 손상 시 초기화
    console.error('[memory] memory.json 파일이 손상되었습니다. 새로 시작합니다.');
    return { ...DEFAULT_MEMORY };
  }
}

export function saveMemory(memory: Memory): void {
  try {
    ensureMemoryDir();
    // 세션 수 제한
    if (memory.sessions.length > MAX_SESSIONS) {
      memory.sessions = memory.sessions.slice(-MAX_SESSIONS);
    }
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf-8');
  } catch (err) {
    console.error('[memory] 저장 실패 (디스크 권한 확인):', err);
  }
}

// 세션 종료 시 Claude에게 대화 요약 요청
export async function summarizeSession(
  history: Array<{ role: string; content: string }>,
  previousMemory: Memory
): Promise<Memory> {
  if (history.length < 2) {
    return previousMemory; // 대화가 거의 없으면 저장 안 함
  }

  const client = new Anthropic();
  const conversationText = history
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? '주인' : '춘심'}: ${m.content}`)
    .join('\n');

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `아래 대화에서 "주인"에 대해 새로 알게 된 것, 감정 상태, 주요 토픽을 분석해줘.
반드시 아래 JSON 형식으로만 답해줘. 다른 텍스트 없이 JSON만:
{
  "summary": "오늘 대화 한 줄 요약",
  "mood": "감정 변화 (예: stressed → relaxed)",
  "topics": ["토픽1", "토픽2"],
  "new_facts": ["새로 알게 된 사실1", "새로 알게 된 사실2"]
}

대화:
${conversationText}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(cleaned);

    const today = new Date().toISOString().split('T')[0];
    const newSession: SessionSummary = {
      date: today,
      summary: parsed.summary ?? '',
      mood: parsed.mood ?? '',
      topics: parsed.topics ?? [],
    };

    // 새 사실 추가 (중복 방지)
    const newFacts: string[] = parsed.new_facts ?? [];
    const updatedFacts = [
      ...previousMemory.known_facts,
      ...newFacts.filter(f => !previousMemory.known_facts.includes(f)),
    ];

    // owner_summary 업데이트 (세션이 쌓일수록 더 정확해짐)
    const updatedSummary = await updateOwnerSummary(
      client,
      previousMemory.owner_summary,
      newSession,
      updatedFacts
    );

    return {
      owner_summary: updatedSummary,
      known_facts: updatedFacts,
      sessions: [...previousMemory.sessions, newSession],
    };
  } catch {
    // 요약 실패 시 기존 메모리 유지 (대화 경험에 영향 없음)
    return previousMemory;
  }
}

async function updateOwnerSummary(
  client: Anthropic,
  previousSummary: string,
  newSession: SessionSummary,
  knownFacts: string[]
): Promise<string> {
  if (!previousSummary && knownFacts.length === 0) {
    return newSession.summary;
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `춘심봇이 주인을 더 잘 알기 위한 요약을 업데이트해줘.
기존 요약: ${previousSummary || '없음'}
알려진 사실들: ${knownFacts.join(', ') || '없음'}
오늘 새로 알게 된 것: ${newSession.summary}

두 줄 이내의 자연스러운 문장으로 통합된 요약만 반환해줘.`,
        },
      ],
    });

    return response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : previousSummary;
  } catch {
    return previousSummary;
  }
}

// 클라우드 에이전트 서버로 프로파일 동기화
export async function syncToServer(
  botId: string,
  memory: Memory,
  serverUrl: string
): Promise<void> {
  const body = JSON.stringify({
    botId,
    owner_summary: memory.owner_summary,
    known_facts: memory.known_facts,
    sessions: memory.sessions,
  });

  return new Promise((resolve) => {
    const url = new URL(`${serverUrl}/sync`);
    const lib = url.protocol === 'https:' ? https : http;

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        // 응답 소비 (메모리 누수 방지)
        res.resume();
        resolve();
      }
    );

    req.on('error', () => resolve()); // 서버 미실행 시 조용히 무시
    req.setTimeout(5000, () => { req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

// 메모리를 시스템 프롬프트용 문자열로 변환
export function buildMemoryContext(memory: Memory): string {
  if (!memory.owner_summary && memory.sessions.length === 0) {
    return '';
  }

  const parts: string[] = [];

  if (memory.owner_summary) {
    parts.push(memory.owner_summary);
  }

  const recentSessions = memory.sessions.slice(-3);
  if (recentSessions.length > 0) {
    parts.push('\n최근 대화:');
    for (const s of recentSessions) {
      parts.push(`- ${s.date}: ${s.summary} (기분: ${s.mood})`);
    }
  }

  return parts.join('\n');
}
