/**
 * Claude API 연결 및 대화 히스토리 관리
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './persona';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export class ChunSimAgent {
  private client: Anthropic;
  private history: Message[] = [];
  private systemPrompt: string;

  constructor(memoryContext?: string) {
    this.client = new Anthropic();
    this.systemPrompt = buildSystemPrompt(memoryContext);
  }

  updateMemoryContext(memoryContext: string): void {
    this.systemPrompt = buildSystemPrompt(memoryContext);
  }

  async chat(userMessage: string, onChunk: (chunk: string) => void): Promise<string> {
    this.history.push({ role: 'user', content: userMessage });

    let fullResponse = '';

    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: this.systemPrompt,
      messages: this.history,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const chunk = event.delta.text;
        fullResponse += chunk;
        onChunk(chunk);
      }
    }

    this.history.push({ role: 'assistant', content: fullResponse });
    return fullResponse;
  }

  getHistory(): Message[] {
    return [...this.history];
  }
}
