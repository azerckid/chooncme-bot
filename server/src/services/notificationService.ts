/**
 * 알림 서비스
 * - SMTP 설정 시: 실제 이메일 발송
 * - 미설정 시: 콘솔 출력 (개발 모드)
 */

import nodemailer from 'nodemailer';
import type { MatchResult } from '../store/matchStore';

const NOTIFY_THRESHOLD = 70;

function buildEmailBody(result: MatchResult, ownerLabel: string): string {
  const signals = result.match_signals.map(s => `  • ${s}`).join('\n');
  return `
안녕하세요, 춘심 허브입니다 🌸

${ownerLabel}의 춘심봇이 좋은 인연을 찾았어요!

──────────────────────────────
궁합 점수: ${result.score}점 (${result.confidence} 확신도)
매칭 시각: ${new Date(result.matched_at).toLocaleString('ko-KR')}
──────────────────────────────

[공통점]
${signals || '  • 분석 중'}

[요약]
${result.summary}
──────────────────────────────

춘심 허브에 접속해서 상대방을 만나보세요!
http://localhost:3001

– 춘심 허브 팀
`.trim();
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT) : 587,
    secure: (SMTP_PORT === '465'),
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendMatchNotification(
  result: MatchResult,
  emailA?: string,
  emailB?: string,
): Promise<void> {
  if (result.score < NOTIFY_THRESHOLD) return;

  const transporter = getTransporter();

  for (const [email, label] of [[emailA, 'A'], [emailB, 'B']] as [string | undefined, string][]) {
    if (!email) continue;

    const body = buildEmailBody(result, label);

    if (!transporter) {
      // 개발 모드: 콘솔 출력
      console.log(`\n[notify] ─────────────────────────────────`);
      console.log(`[notify] 수신: ${email}`);
      console.log(`[notify] 제목: 춘심봇이 좋은 인연을 찾았어요! (점수: ${result.score})`);
      console.log(body);
      console.log(`[notify] ─────────────────────────────────\n`);
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"춘심 허브" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `🌸 춘심봇이 좋은 인연을 찾았어요! (궁합 ${result.score}점)`,
        text: body,
      });
      console.log(`[notify] 이메일 발송 완료: ${email}`);
    } catch (err) {
      console.error(`[notify] 이메일 발송 실패 (${email}): ${err}`);
    }
  }
}
