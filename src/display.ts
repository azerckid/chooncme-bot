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

// 스트리밍은 내부에서 버퍼링, 완료 후 포맷해서 출력
export function printChunsimResponse(fullText: string): void {
  printChunsim(fullText);
}

export function printError(msg: string): void {
  console.error(`\n[오류] ${msg}`);
}

export function printInfo(msg: string): void {
  console.log(`\n${msg}`);
}
