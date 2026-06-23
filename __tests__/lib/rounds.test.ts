import { describe, it, expect } from "vitest";
import {
  startGame,
  nextTurn,
  resetGame,
} from "@/lib/game";
import { DEFAULT_GAME_STATE } from "@/types/game";
import type { GameState } from "@/types/game";

const FAKE_CARD = { word: "כלב", forbidden: ["חיה", "נביחה", "גור", "מחמד", "זנב"] as [string,string,string,string,string] };
const FAKE_CARD_2 = { word: "שמש", forbidden: ["חם", "אור", "כוכב", "קרניים", "שמיים"] as [string,string,string,string,string] };

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  ...DEFAULT_GAME_STATE,
  teams: [
    { id: 0, name: "א", score: 0 },
    { id: 1, name: "ב", score: 0 },
  ],
  ...overrides,
});

// ─── GameState defaults ───────────────────────────────────────────────────────

describe("DEFAULT_GAME_STATE round fields", () => {
  it("has totalRounds defaulting to 3", () => {
    expect(DEFAULT_GAME_STATE.totalRounds).toBe(3);
  });

  it("has currentRound defaulting to 1", () => {
    expect(DEFAULT_GAME_STATE.currentRound).toBe(1);
  });
});

// ─── startGame ───────────────────────────────────────────────────────────────

describe("startGame round handling", () => {
  it("resets currentRound to 1", () => {
    const s = makeState({ currentRound: 2 });
    expect(startGame(s).currentRound).toBe(1);
  });

  it("preserves totalRounds from state", () => {
    const s = makeState({ totalRounds: 5 });
    expect(startGame(s).totalRounds).toBe(5);
  });

  it("defaults totalRounds to 3 when not set", () => {
    expect(startGame(makeState()).totalRounds).toBe(3);
  });
});

// ─── nextTurn round counting ──────────────────────────────────────────────────

describe("nextTurn round counting", () => {
  it("does NOT increment currentRound when switching 0 → 1", () => {
    const s = makeState({ activeTeam: 0, currentRound: 1, totalRounds: 3, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).currentRound).toBe(1);
  });

  it("increments currentRound when switching 1 → 0 (completing a full round)", () => {
    const s = makeState({ activeTeam: 1, currentRound: 1, totalRounds: 3, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).currentRound).toBe(2);
  });

  it("switches to team 0 when incrementing round", () => {
    const s = makeState({ activeTeam: 1, currentRound: 1, totalRounds: 3, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).activeTeam).toBe(0);
  });

  it("transitions to claiming phase when rounds remain", () => {
    const s = makeState({ activeTeam: 1, currentRound: 1, totalRounds: 3, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).phase).toBe("claiming");
  });

  it("auto-ends game after last round's last turn (team 1 completes final round)", () => {
    const s = makeState({ activeTeam: 1, currentRound: 3, totalRounds: 3, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).phase).toBe("ended");
  });

  it("does NOT auto-end when team 0 finishes the last round (team 1 still to play)", () => {
    const s = makeState({ activeTeam: 0, currentRound: 3, totalRounds: 3, cardQueue: [FAKE_CARD] });
    const next = nextTurn(s);
    expect(next.phase).toBe("claiming");
    expect(next.currentRound).toBe(3); // round stays at 3, team 1 still plays
  });

  it("auto-ends with scores preserved", () => {
    const s = makeState({
      activeTeam: 1,
      currentRound: 3,
      totalRounds: 3,
      teams: [{ id: 0, name: "א", score: 7 }, { id: 1, name: "ב", score: 5 }],
      cardQueue: [FAKE_CARD],
    });
    const next = nextTurn(s);
    expect(next.teams[0].score).toBe(7);
    expect(next.teams[1].score).toBe(5);
  });

  it("works with totalRounds: 1 (single round game)", () => {
    const s = makeState({ activeTeam: 1, currentRound: 1, totalRounds: 1, cardQueue: [FAKE_CARD] });
    expect(nextTurn(s).phase).toBe("ended");
  });

  it("works with large totalRounds (5 rounds)", () => {
    const s = makeState({ activeTeam: 1, currentRound: 4, totalRounds: 5, cardQueue: [FAKE_CARD] });
    const next = nextTurn(s);
    expect(next.phase).toBe("claiming");
    expect(next.currentRound).toBe(5);
  });
});

// ─── resetGame round handling ─────────────────────────────────────────────────

describe("resetGame round handling", () => {
  it("resets currentRound to 1", () => {
    const s = makeState({ currentRound: 3 });
    expect(resetGame(s).currentRound).toBe(1);
  });

  it("preserves totalRounds (player-configured setting)", () => {
    const s = makeState({ totalRounds: 5 });
    expect(resetGame(s).totalRounds).toBe(5);
  });
});
