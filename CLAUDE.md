# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Development Workflow

For every task:

1. Understand the requirement and identify missing functionality.
2. Write or update tests before implementation whenever practical.
3. Implement the smallest change required.
4. Run relevant tests after every change.
5. Fix failures before continuing.
6. Verify that the implementation satisfies all requirements.
7. Repeat until the task is fully complete.

## TDD

- Prefer Test Driven Development.
- Add tests for every bug fix.
- Do not consider a task complete with failing tests.
- Prefer small, focused tests.

## Code Quality

- Keep changes small and focused.
- Avoid unnecessary refactoring.
- Do not rewrite working code without a clear reason.
- Prefer simple solutions over complex abstractions.
- Fix root causes instead of symptoms.

## UI Requirements

- Mobile-first design.
- No horizontal scrolling.
- No vertical scrolling unless explicitly required.
- Support screens down to 320px width.
- Keep layouts responsive.

## Git Workflow

After each completed feature:

1. Run tests.
2. Create a git commit with a clear commit message.
3. Push the commit to the current branch.

## Completion Criteria

A task is complete only when:

- All requirements are implemented.
- Relevant tests pass.
- The project builds successfully.
- No known issues related to the task remain.

When working on a task, continue iterating until the completion criteria are met. Never stop after a partial implementation if additional work is required to satisfy the completion criteria.

## Commands

```bash
npm run dev          # start dev server at localhost:3000
npm run build        # production build
npm test             # run all tests (vitest, node env)
npm run test:watch   # watch mode
```

Single test file: `npx vitest run __tests__/lib/game.test.ts`

Environment: copy `.env.local.example` → `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No DB tables needed — the game uses Supabase Realtime Broadcast only.

## Architecture

**Stack:** Next.js 16 App Router · React 19 · Tailwind CSS v4 · Supabase Realtime · Vitest · shadcn/ui · Hebrew/RTL UI

**Routing:**
- `/` — landing page (`app/page.tsx`): create or join room
- `/room/[roomId]` — game room (`app/room/[roomId]/page.tsx`): full game UI

**State model (`types/game.ts`):**  
`GameState` is a plain serializable object that flows through a pure state machine in `lib/game.ts`. The host is the sole source of truth — all mutations happen locally on the host and the result is broadcast to peers via Supabase Realtime. Non-hosts are read-only receivers.

**Host election:** `localStorage.getItem("isHost_<roomId>")` — set to `"true"` when the player creates the room. There is no server-side authority.

**Real-time layer (`hooks/useGameRoom.ts`):**  
The `useGameRoom` hook owns the Supabase channel lifecycle. It exposes `dispatch(action)` (host-only) which runs the pure state-machine functions and calls `broadcast()`. Non-hosts receive `state_update` events and update local state. Card data (`currentCard`, `cardQueue`) is stripped before broadcast (`redactStateForBroadcast`) so non-hosts never see the current card.

**Game phases:** `lobby` → `playing` → `turn_summary` → (repeat or `ended`). Turn expiry is handled exclusively by the host via a `setTimeout` in `useGameRoom`.

**Pure game logic (`lib/game.ts`):** All game state transitions are pure functions (no side effects). Tests in `__tests__/lib/` cover these functions directly — no React or Supabase mocking needed.

**Sound (`lib/sounds.ts` / `hooks/useSound.ts`):** Web Audio API synthesized tones, no asset files. Mute state persisted in `localStorage` under key `taboo_muted`.

**Cards (`data/cards.json`, `lib/cards.ts`):** ~100 Hebrew taboo cards. Each card: `{ word: string, forbidden: [5 strings] }`. Deck is shuffled at game start and refilled from a fresh shuffle when exhausted.

**Component tree (under `components/game/`):**
- `Lobby` — team name setup, round/duration config, start button
- `TabooCard` — displays word + forbidden list (host-only)
- `ActionButtons` — Correct / Skip / Taboo (host-only)
- `Timer` — countdown derived from `turnStartedAt` + `turnDurationMs`
- `TurnScoreCounter` — live per-turn tally visible to all players
- `TurnSummary` — end-of-turn results, next-turn button
- `Scoreboard` — team scores
- `GameEnded` — winner display, reset button
