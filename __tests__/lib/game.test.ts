import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startGame,
  startTurn,
  recordResult,
  endTurn,
  nextTurn,
  endGame,
  resetGame,
  isTurnExpired,
  timeRemainingMs,
  redactStateForBroadcast,
} from "@/lib/game";
import { DEFAULT_GAME_STATE, TURN_DURATION_MS } from "@/types/game";
import type { GameState } from "@/types/game";

// ─── helpers ────────────────────────────────────────────────────────────────

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  ...DEFAULT_GAME_STATE,
  teams: [
    { id: 0, name: "אדומים", score: 0 },
    { id: 1, name: "כחולים", score: 0 },
  ],
  ...overrides,
});

const FAKE_CARD = { word: "כלב", forbidden: ["חיה", "נביחה", "גור", "מחמד", "זנב"] as [string,string,string,string,string] };
const FAKE_CARD_2 = { word: "שמש", forbidden: ["חם", "אור", "כוכב", "קרניים", "שמיים"] as [string,string,string,string,string] };

// ─── startGame ───────────────────────────────────────────────────────────────

describe("startGame", () => {
  it("transitions phase from lobby to playing", () => {
    const next = startGame(makeState());
    expect(next.phase).toBe("playing");
  });

  it("draws a card", () => {
    const next = startGame(makeState());
    expect(next.currentCard).not.toBeNull();
  });

  it("sets turnStartedAt to a recent timestamp", () => {
    const before = Date.now();
    const next = startGame(makeState());
    expect(next.turnStartedAt).toBeGreaterThanOrEqual(before);
    expect(next.turnStartedAt).toBeLessThanOrEqual(Date.now());
  });

  it("always starts with team 0", () => {
    const next = startGame(makeState({ activeTeam: 1 }));
    expect(next.activeTeam).toBe(0);
  });

  it("clears turnResults", () => {
    const s = makeState({
      turnResults: [{ word: "test", outcome: "correct" }],
    });
    expect(startGame(s).turnResults).toHaveLength(0);
  });

  it("preserves team names and scores", () => {
    const s = makeState({
      teams: [
        { id: 0, name: "ראשונים", score: 3 },
        { id: 1, name: "שניים", score: 2 },
      ],
    });
    const next = startGame(s);
    expect(next.teams[0].name).toBe("ראשונים");
    expect(next.teams[1].name).toBe("שניים");
    expect(next.teams[0].score).toBe(3);
    expect(next.teams[1].score).toBe(2);
  });
});

// ─── startTurn ───────────────────────────────────────────────────────────────

describe("startTurn", () => {
  it("sets phase to playing", () => {
    const s = makeState({ phase: "turn_summary", currentCard: FAKE_CARD, cardQueue: [FAKE_CARD_2] });
    expect(startTurn(s).phase).toBe("playing");
  });

  it("clears turnResults", () => {
    const s = makeState({
      phase: "turn_summary",
      currentCard: FAKE_CARD,
      cardQueue: [FAKE_CARD_2],
      turnResults: [{ word: "כלב", outcome: "correct" }],
    });
    expect(startTurn(s).turnResults).toHaveLength(0);
  });

  it("draws from the queue", () => {
    const s = makeState({
      phase: "turn_summary",
      cardQueue: [FAKE_CARD, FAKE_CARD_2],
    });
    const next = startTurn(s);
    expect(next.currentCard).toEqual(FAKE_CARD);
    expect(next.cardQueue).toHaveLength(1);
  });

  it("refills from deck when queue is empty", () => {
    const s = makeState({ phase: "turn_summary", cardQueue: [] });
    const next = startTurn(s);
    expect(next.currentCard).not.toBeNull();
  });

  it("sets a fresh turnStartedAt", () => {
    const before = Date.now();
    const s = makeState({ phase: "turn_summary", cardQueue: [FAKE_CARD] });
    const next = startTurn(s);
    expect(next.turnStartedAt).toBeGreaterThanOrEqual(before);
  });
});

// ─── recordResult ────────────────────────────────────────────────────────────

describe("recordResult", () => {
  const playingState = makeState({
    phase: "playing",
    currentCard: FAKE_CARD,
    cardQueue: [FAKE_CARD_2],
    turnStartedAt: Date.now(),
  });

  it("appends a correct result", () => {
    const next = recordResult(playingState, "correct");
    expect(next.turnResults).toHaveLength(1);
    expect(next.turnResults[0]).toEqual({ word: "כלב", outcome: "correct" });
  });

  it("appends a skip result", () => {
    const next = recordResult(playingState, "skip");
    expect(next.turnResults[0].outcome).toBe("skip");
  });

  it("appends a taboo result", () => {
    const next = recordResult(playingState, "taboo");
    expect(next.turnResults[0].outcome).toBe("taboo");
  });

  it("advances to the next card", () => {
    const next = recordResult(playingState, "correct");
    expect(next.currentCard).toEqual(FAKE_CARD_2);
  });

  it("shrinks the queue", () => {
    const next = recordResult(playingState, "correct");
    expect(next.cardQueue).toHaveLength(0);
  });

  it("is a no-op when currentCard is null", () => {
    const s = makeState({ phase: "playing", currentCard: null });
    const next = recordResult(s, "correct");
    expect(next).toBe(s);
  });

  it("accumulates multiple results", () => {
    const s = makeState({
      phase: "playing",
      currentCard: FAKE_CARD,
      cardQueue: [FAKE_CARD_2, FAKE_CARD],
    });
    const s2 = recordResult(s, "correct");
    const s3 = recordResult(s2, "taboo");
    expect(s3.turnResults).toHaveLength(2);
    expect(s3.turnResults[0].outcome).toBe("correct");
    expect(s3.turnResults[1].outcome).toBe("taboo");
  });
});

// ─── endTurn ─────────────────────────────────────────────────────────────────

describe("endTurn", () => {
  it("transitions to turn_summary", () => {
    const s = makeState({ phase: "playing", currentCard: FAKE_CARD });
    expect(endTurn(s).phase).toBe("turn_summary");
  });

  it("clears currentCard and turnStartedAt", () => {
    const s = makeState({ phase: "playing", currentCard: FAKE_CARD, turnStartedAt: Date.now() });
    const next = endTurn(s);
    expect(next.currentCard).toBeNull();
    expect(next.turnStartedAt).toBeNull();
  });

  it("applies +1 per correct result", () => {
    const s = makeState({
      activeTeam: 0,
      turnResults: [
        { word: "א", outcome: "correct" },
        { word: "ב", outcome: "correct" },
      ],
    });
    expect(endTurn(s).teams[0].score).toBe(2);
  });

  it("applies -1 per taboo result", () => {
    const s = makeState({
      activeTeam: 0,
      turnResults: [{ word: "א", outcome: "taboo" }],
    });
    expect(endTurn(s).teams[0].score).toBe(-1);
  });

  it("skip results do not change score", () => {
    const s = makeState({
      activeTeam: 0,
      turnResults: [{ word: "א", outcome: "skip" }],
    });
    expect(endTurn(s).teams[0].score).toBe(0);
  });

  it("applies delta to the active team only", () => {
    const s = makeState({
      activeTeam: 1,
      turnResults: [{ word: "א", outcome: "correct" }],
    });
    const next = endTurn(s);
    expect(next.teams[0].score).toBe(0);
    expect(next.teams[1].score).toBe(1);
  });

  it("can accumulate score across turns (score persists from before turn)", () => {
    const s = makeState({
      activeTeam: 0,
      teams: [{ id: 0, name: "א", score: 5 }, { id: 1, name: "ב", score: 0 }],
      turnResults: [{ word: "x", outcome: "correct" }],
    });
    expect(endTurn(s).teams[0].score).toBe(6);
  });

  it("score can go negative with all taboo results", () => {
    const s = makeState({
      activeTeam: 0,
      turnResults: [
        { word: "א", outcome: "taboo" },
        { word: "ב", outcome: "taboo" },
      ],
    });
    expect(endTurn(s).teams[0].score).toBe(-2);
  });

  it("mixed results apply net delta", () => {
    const s = makeState({
      activeTeam: 0,
      turnResults: [
        { word: "א", outcome: "correct" },
        { word: "ב", outcome: "correct" },
        { word: "ג", outcome: "taboo" },
        { word: "ד", outcome: "skip" },
      ],
    });
    expect(endTurn(s).teams[0].score).toBe(1); // 2 - 1
  });

  it("empty results leave score unchanged", () => {
    const s = makeState({ activeTeam: 0, turnResults: [] });
    expect(endTurn(s).teams[0].score).toBe(0);
  });
});

// ─── nextTurn ────────────────────────────────────────────────────────────────

describe("nextTurn", () => {
  it("switches active team from 0 to 1", () => {
    const s = makeState({ activeTeam: 0, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).activeTeam).toBe(1);
  });

  it("switches active team from 1 to 0", () => {
    const s = makeState({ activeTeam: 1, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).activeTeam).toBe(0);
  });

  it("starts a fresh turn (sets phase to playing)", () => {
    const s = makeState({ phase: "turn_summary", activeTeam: 0, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).phase).toBe("playing");
  });

  it("clears turnResults", () => {
    const s = makeState({
      activeTeam: 0,
      cardQueue: [FAKE_CARD],
      turnResults: [{ word: "x", outcome: "correct" }],
    });
    expect(nextTurn(s).turnResults).toHaveLength(0);
  });
});

// ─── endGame ─────────────────────────────────────────────────────────────────

describe("endGame", () => {
  it("transitions to ended", () => {
    const s = makeState({ phase: "playing" });
    expect(endGame(s).phase).toBe("ended");
  });

  it("clears currentCard and turnStartedAt", () => {
    const s = makeState({ currentCard: FAKE_CARD, turnStartedAt: Date.now() });
    const next = endGame(s);
    expect(next.currentCard).toBeNull();
    expect(next.turnStartedAt).toBeNull();
  });

  it("preserves scores", () => {
    const s = makeState({
      teams: [{ id: 0, name: "א", score: 7 }, { id: 1, name: "ב", score: 3 }],
    });
    const next = endGame(s);
    expect(next.teams[0].score).toBe(7);
    expect(next.teams[1].score).toBe(3);
  });
});

// ─── resetGame ───────────────────────────────────────────────────────────────

describe("resetGame", () => {
  it("resets phase to lobby", () => {
    const s = makeState({ phase: "ended" });
    expect(resetGame(s).phase).toBe("lobby");
  });

  it("resets scores to 0", () => {
    const s = makeState({
      teams: [{ id: 0, name: "א", score: 10 }, { id: 1, name: "ב", score: 5 }],
    });
    const next = resetGame(s);
    expect(next.teams[0].score).toBe(0);
    expect(next.teams[1].score).toBe(0);
  });

  it("preserves team names", () => {
    const s = makeState({
      teams: [{ id: 0, name: "הארנבים", score: 10 }, { id: 1, name: "הצבים", score: 5 }],
    });
    const next = resetGame(s);
    expect(next.teams[0].name).toBe("הארנבים");
    expect(next.teams[1].name).toBe("הצבים");
  });

  it("clears currentCard and queue", () => {
    const s = makeState({ currentCard: FAKE_CARD, cardQueue: [FAKE_CARD_2] });
    const next = resetGame(s);
    expect(next.currentCard).toBeNull();
    expect(next.cardQueue).toHaveLength(0);
  });
});

// ─── isTurnExpired ───────────────────────────────────────────────────────────

describe("isTurnExpired", () => {
  it("returns false when turnStartedAt is null", () => {
    expect(isTurnExpired(makeState({ turnStartedAt: null }))).toBe(false);
  });

  it("returns false when turn is still fresh", () => {
    const s = makeState({ turnStartedAt: Date.now() });
    expect(isTurnExpired(s)).toBe(false);
  });

  it("returns true when turn time has elapsed", () => {
    const s = makeState({ turnStartedAt: Date.now() - TURN_DURATION_MS - 1 });
    expect(isTurnExpired(s)).toBe(true);
  });

  it("returns false at exactly the boundary (not strictly >)", () => {
    // >= means exactly at boundary is expired
    const s = makeState({ turnStartedAt: Date.now() - TURN_DURATION_MS });
    expect(isTurnExpired(s)).toBe(true);
  });
});

// ─── timeRemainingMs ─────────────────────────────────────────────────────────

describe("timeRemainingMs", () => {
  it("returns TURN_DURATION_MS when turnStartedAt is null", () => {
    expect(timeRemainingMs(makeState({ turnStartedAt: null }))).toBe(TURN_DURATION_MS);
  });

  it("returns a value near TURN_DURATION_MS for a fresh turn", () => {
    const s = makeState({ turnStartedAt: Date.now() });
    const remaining = timeRemainingMs(s);
    expect(remaining).toBeGreaterThan(TURN_DURATION_MS - 50);
    expect(remaining).toBeLessThanOrEqual(TURN_DURATION_MS);
  });

  it("returns 0 (not negative) for an expired turn", () => {
    const s = makeState({ turnStartedAt: Date.now() - TURN_DURATION_MS - 5000 });
    expect(timeRemainingMs(s)).toBe(0);
  });

  it("returns correct partial time", () => {
    const elapsed = 20_000;
    const s = makeState({ turnStartedAt: Date.now() - elapsed });
    const remaining = timeRemainingMs(s);
    expect(remaining).toBeGreaterThan(TURN_DURATION_MS - elapsed - 50);
    expect(remaining).toBeLessThan(TURN_DURATION_MS - elapsed + 50);
  });
});

// ─── redactStateForBroadcast ─────────────────────────────────────────────────

describe("redactStateForBroadcast", () => {
  it("strips currentCard (null)", () => {
    const s = makeState({ currentCard: FAKE_CARD });
    expect(redactStateForBroadcast(s).currentCard).toBeNull();
  });

  it("empties cardQueue", () => {
    const s = makeState({ cardQueue: [FAKE_CARD, FAKE_CARD_2] });
    expect(redactStateForBroadcast(s).cardQueue).toHaveLength(0);
  });

  it("preserves phase", () => {
    const s = makeState({ phase: "playing" });
    expect(redactStateForBroadcast(s).phase).toBe("playing");
  });

  it("preserves teams and scores", () => {
    const s = makeState({
      teams: [{ id: 0, name: "א", score: 5 }, { id: 1, name: "ב", score: 3 }],
    });
    const r = redactStateForBroadcast(s);
    expect(r.teams[0].score).toBe(5);
    expect(r.teams[1].score).toBe(3);
    expect(r.teams[0].name).toBe("א");
  });

  it("preserves activeTeam", () => {
    const s = makeState({ activeTeam: 1 });
    expect(redactStateForBroadcast(s).activeTeam).toBe(1);
  });

  it("preserves turnStartedAt", () => {
    const ts = Date.now();
    const s = makeState({ turnStartedAt: ts });
    expect(redactStateForBroadcast(s).turnStartedAt).toBe(ts);
  });

  it("preserves turnResults", () => {
    const s = makeState({
      turnResults: [{ word: "כלב", outcome: "correct" }],
    });
    expect(redactStateForBroadcast(s).turnResults).toEqual(s.turnResults);
  });

  it("does not mutate the original state", () => {
    const s = makeState({ currentCard: FAKE_CARD, cardQueue: [FAKE_CARD_2] });
    redactStateForBroadcast(s);
    expect(s.currentCard).toEqual(FAKE_CARD);
    expect(s.cardQueue).toHaveLength(1);
  });

  it("handles already-null currentCard gracefully", () => {
    const s = makeState({ currentCard: null });
    expect(redactStateForBroadcast(s).currentCard).toBeNull();
  });

  it("handles empty queue gracefully", () => {
    const s = makeState({ cardQueue: [] });
    expect(redactStateForBroadcast(s).cardQueue).toHaveLength(0);
  });
});
