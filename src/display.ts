/**
 * 터미널 출력 포맷
 */

const CHUNSIM_NAME = '춘심';
const DIVIDER = '─'.repeat(40);

export function printHeader(): void {
  console.log('\n' + DIVIDER);
  console.log(`  ${CHUNSIM_NAME} 에이전트 v0.1`);
  console.log(DIVIDER + '\n');
}

export function printFooter(): void {
  console.log('\n' + DIVIDER + '\n');
}

export function printChunsim(text: string): void {
  // '---' 구분자를 실제 줄바꿈으로 변환 (춘심 메시지 분리)
  const parts = text.split(/\s*---\s*/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      console.log(`\n${CHUNSIM_NAME}: ${trimmed}`);
    }
  }
}

export function printChunsimChunk(chunk: string): void {
  process.stdout.write(chunk);
}

export function printChunsimStreamStart(): void {
  process.stdout.write(`\n${CHUNSIM_NAME}: `);
}

export function printChunsimStreamEnd(fullText: string): void {
  // 스트리밍 완료 후 '---' 분리 처리
  const parts = fullText.split(/\s*---\s*/);
  if (parts.length > 1) {
    // 다중 메시지인 경우 재출력
    process.stdout.write('\r\x1b[K'); // 현재 줄 지우기
    printChunsim(fullText);
  } else {
    process.stdout.write('\n');
  }
}

export function printError(msg: string): void {
  console.error(`\n[오류] ${msg}`);
}

export function printInfo(msg: string): void {
  console.log(`\n${msg}`);
}
