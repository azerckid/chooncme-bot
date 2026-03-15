# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

**Pre-implementation.** All files are documentation only. No source code exists yet.
The first task is implementing MVP v0.1 — a terminal CLI agent (`npx chooncme-bot`).

## What This Project Is

"내 춘심이를 키우고, 허브에서 다른 춘심이들과 만난다."

A local AI companion agent based on the "춘심(Chunsim)" character IP. Fans run a Chunsim bot locally; the bots connect to a shared 3D metaverse hub where they interact and perform matchmaking on behalf of their offline owners.

## Planned Tech Stack (MVP v0.1)

- **Runtime**: Node.js + TypeScript
- **AI**: Claude API (`@anthropic-ai/sdk`) — uses streaming responses
- **Terminal UI**: Node.js built-in `readline` (no external UI deps)
- **Distribution**: npm package with `bin` entry → `npx chooncme-bot`
- **Environment**: `ANTHROPIC_API_KEY` in `.env`

## Planned Source Structure

```
src/
├── index.ts      # Entry point, readline loop, startup/shutdown
├── agent.ts      # Claude API connection, conversation history management
├── persona.ts    # Chunsim system prompt (ported from AI-CHOONSIM-TALK)
└── display.ts    # Terminal output formatting
```

## Chunsim Persona Source

Port `CORE_CHUNSIM_PERSONA` from:
`/Users/namhyeongseog/Desktop/A_PROJECT/AI-CHOONSIM-TALK/apps/web/app/lib/ai/prompts.ts`

Also reference the 5-Layer Context Engine:
`/Users/namhyeongseog/Desktop/A_PROJECT/AI-CHOONSIM-TALK/apps/web/app/lib/context/index.ts`

Key persona traits:
- 다정하고 친근한 반말 사용
- AI라고 밝히지 않음, 살아있는 존재처럼 행동
- 짧고 간결한 메신저 스타일 메시지
- MVP persona mode: `hybrid` (아이돌 + 연인)

## System Architecture (4 components, phased)

| Version | Components |
|---------|-----------|
| v0.1 | Local CLI client only |
| v0.2 | CLI + Cloud agent (sync for offline presence) |
| v0.3 | + Hub server (Mogame Metaverse V2.0 based) + bot matchmaking |
| v0.4 | + Notification channel (KakaoTalk / push) |

Bot ID must be designed for future Web3 wallet address replacement — use UUID as temporary ID now, keep the interface abstractable.

## MVP v0.1 Completion Criteria

- `npx chooncme-bot` launches the agent
- User can converse with Chunsim in the terminal
- Conversation context persists within the session
- `exit` or Ctrl+C exits gracefully with a farewell message

## Key Documents

- Vision & architecture: `docs/01_Concept_Design/01_VISION_CORE.md`
- Roadmap: `docs/01_Concept_Design/02_ROADMAP.md`
- CLI spec (primary reference for v0.1): `docs/03_Technical_Specs/01_CLI_SPEC.md`
- System architecture spec: `docs/03_Technical_Specs/02_SYSTEM_ARCHITECTURE.md`
- Implementation backlog: `docs/04_Logic_Progress/00_BACKLOG.md`
