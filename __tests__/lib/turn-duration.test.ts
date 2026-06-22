import { describe, it, expect } from "vitest";
import {
  startGame,
  resetGame,
  isTurnExpired,
  timeRemainingMs,
} from "@/lib/game";
import { DEFAULT_GAME_STATE } from "@/types/game";
import type { GameState } from "@/types/game";

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  ...DEFAULT_GAME_STATE,
  teams: [
    { id: 0, name: "א", score: 0 },
    { id: 1, name: "ב", score: 0 },
  ],
  ...overrides,
});

describe("DEFAULT_GAME_STATE turn duration", () => {
  it("has turnDurationMs defaulting to 60000", () => {
    expect(DEFAULT_GAME_STATE.turnDurationMs).toBe(60_000);
  });
});

describe("isTurnExpired respects state.turnDurationMs", () => {
  it("expires a 30s turn after 30s", () => {
    const s = makeState({ turnDurationMs: 30_000, turnStartedAt: Date.now() - 30_001 });
    expect(isTurnExpired(s)).toBe(true);
  });

  it("does NOT expire a 90s turn after 60s", () => {
    const s = makeState({ turnDurationMs: 90_000, turnStartedAt: Date.now() - 60_000 });
    expect(isTurnExpired(s)).toBe(false);
  });

  it("expires a 45s turn after 45s", () => {
    const s = makeState({ turnDurationMs: 45_000, turnStartedAt: Date.now() - 45_000 });
    expect(isTurnExpired(s)).toBe(true);
  });
});

describe("timeRemainingMs respects state.turnDurationMs", () => {
  it("returns turnDurationMs when turnStartedAt is null", () => {
    const s = makeState({ turnDurationMs: 30_000, turnStartedAt: null });
    expect(timeRemainingMs(s)).toBe(30_000);
  });

  it("returns correct remaining for a 30s turn started 10s ago", () => {
    const s = makeState({ turnDurationMs: 30_000, turnStartedAt: Date.now() - 10_000 });
    const remaining = timeRemainingMs(s);
    expect(remaining).toBeGreaterThan(19_900);
    expect(remaining).toBeLessThanOrEqual(20_000);
  });

  it("returns 0 for an expired 30s turn", () => {
    const s = makeState({ turnDurationMs: 30_000, turnStartedAt: Date.now() - 35_000 });
    expect(timeRemainingMs(s)).toBe(0);
  });
});

describe("startGame preserves turnDurationMs", () => {
  it("keeps turnDurationMs from base state when 30s", () => {
    const s = makeState({ turnDurationMs: 30_000 });
    expect(startGame(s).turnDurationMs).toBe(30_000);
  });

  it("keeps turnDurationMs from base state when 90s", () => {
    const s = makeState({ turnDurationMs: 90_000 });
    expect(startGame(s).turnDurationMs).toBe(90_000);
  });
});

describe("resetGame preserves turnDurationMs", () => {
  it("preserves a custom 45s duration", () => {
    const s = makeState({ turnDurationMs: 45_000 });
    expect(resetGame(s).turnDurationMs).toBe(45_000);
  });

  it("preserves the default 60s duration", () => {
    const s = makeState({ turnDurationMs: 60_000 });
    expect(resetGame(s).turnDurationMs).toBe(60_000);
  });
});
