/**
 * 춘심이 클라우드 에이전트 서버
 */

import express from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import syncRouter from './routes/sync';
import agentRouter from './routes/agent';

// 여러 경로를 순서대로 시도 (실행 위치와 무관하게 안정적으로 로드)
const envPaths = [
  path.resolve(__dirname, '../.env'),        // server/src → server/.env
  path.resolve(__dirname, '../../server/.env'), // 프로젝트 루트에서 실행 시
  path.resolve(process.cwd(), '.env'),       // 현재 디렉토리
  path.resolve(process.cwd(), 'server/.env'), // 루트에서 server/ 참조
];
for (const p of envPaths) {
  const result = dotenv.config({ path: p });
  if (!result.error && process.env.ANTHROPIC_API_KEY) break;
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const app = express();

app.use(express.json());

// 헬스체크
app.get('/health', (_req, res) => {
  res.json({ ok: true, version: '0.2.0' });
});

// 라우터
app.use('/sync', syncRouter);
app.use('/agent', agentRouter);

app.listen(PORT, () => {
  console.log(`[server] 춘심 클라우드 에이전트 서버 실행 중 — http://localhost:${PORT}`);
});
