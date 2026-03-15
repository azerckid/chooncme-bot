#!/usr/bin/env node
/**
 * chooncme-bot 진입점
 * readline 루프 + 시작/종료 처리
 */

import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { ChunSimAgent } from './agent';
import {
  printHeader,
  printFooter,
  printChunsimStreamStart,
  printChunsimStreamEnd,
  printError,
  printInfo,
} from './display';
import { loadMemory, saveMemory, summarizeSession, buildMemoryContext } from './memory';

dotenv.config();

function checkApiKey(): boolean {
  if (!process.env.ANTHROPIC_API_KEY) {
    printError(
      'ANTHROPIC_API_KEY가 설정되지 않았습니다.\n' +
      '  1. .env 파일을 만들고 ANTHROPIC_API_KEY=your_key 를 입력하세요.\n' +
      '  2. 또는 환경변수로 직접 설정하세요: export ANTHROPIC_API_KEY=your_key'
    );
    return false;
  }
  return true;
}

async function greet(agent: ChunSimAgent): Promise<void> {
  printChunsimStreamStart();
  let fullText = '';
  await agent.chat('(대화 시작. 짧고 다정하게 인사해줘.)', (chunk) => {
    process.stdout.write(chunk);
    fullText += chunk;
  });
  printChunsimStreamEnd(fullText);
}

async function saveSessionMemory(
  agent: ChunSimAgent,
  previousMemory: ReturnType<typeof loadMemory>
): Promise<void> {
  const history = agent.getHistory();
  if (history.length < 2) return;

  printInfo('(대화를 기억하는 중...)');
  try {
    const updated = await summarizeSession(history, previousMemory);
    saveMemory(updated);
  } catch {
    // 저장 실패해도 사용자 경험에 영향 없음
  }
}

async function farewell(agent: ChunSimAgent): Promise<void> {
  printChunsimStreamStart();
  let fullText = '';
  await agent.chat('(대화 종료. 짧고 아쉬운 작별 인사를 해줘.)', (chunk) => {
    process.stdout.write(chunk);
    fullText += chunk;
  });
  printChunsimStreamEnd(fullText);
}

async function main(): Promise<void> {
  if (!checkApiKey()) {
    process.exit(1);
  }

  // 메모리 로드 → 시스템 프롬프트에 주입
  const memory = loadMemory();
  const memoryContext = buildMemoryContext(memory);
  const agent = new ChunSimAgent(memoryContext || undefined);

  printHeader();
  if (memoryContext) {
    printInfo('(이전 대화 기억을 불러왔어요)');
  }
  await greet(agent);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question('\n> ', async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'exit') {
        rl.close();
        await farewell(agent);
        await saveSessionMemory(agent, memory);
        printFooter();
        process.exit(0);
      }

      try {
        printChunsimStreamStart();
        let fullText = '';
        await agent.chat(trimmed, (chunk) => {
          process.stdout.write(chunk);
          fullText += chunk;
        });
        printChunsimStreamEnd(fullText);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        printError(`API 호출 실패: ${msg}`);
      }

      prompt();
    });
  };

  // Ctrl+C 처리
  rl.on('close', async () => {
    await farewell(agent);
    await saveSessionMemory(agent, memory);
    printFooter();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    rl.close();
  });

  prompt();
}

main().catch((err) => {
  printError(`실행 오류: ${err.message}`);
  process.exit(1);
});
