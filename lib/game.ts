import type { GameState, TurnOutcome, TurnResult, Team } from "@/types/game";
import { DEFAULT_GAME_STATE, TURN_DURATION_MS } from "@/types/game";
import { getShuffledDeck } from "@/lib/cards";

function drawFromQueue(state: GameState): {
  card: GameState["currentCard"];
  queue: GameState["cardQueue"];
} {
  const queue = state.cardQueue.length > 0 ? state.cardQueue : getShuffledDeck();
  const [card, ...rest] = queue;
  return { card: card ?? null, queue: rest };
}

export function startGame(state: GameState): GameState {
  const base: GameState = { ...state, cardQueue: [], activeTeam: 0, currentRound: 1 };
  const { card, queue } = drawFromQueue(base);
  return {
    ...base,
    phase: "playing",
    currentCard: card,
    cardQueue: queue,
    turnResults: [],
    turnStartedAt: Date.now(),
  };
}

export function startTurn(state: GameState): GameState {
  const { card, queue } = drawFromQueue(state);
  return {
    ...state,
    phase: "playing",
    currentCard: card,
    cardQueue: queue,
    turnResults: [],
    turnStartedAt: Date.now(),
  };
}

export function recordResult(state: GameState, outcome: TurnOutcome): GameState {
  if (!state.currentCard) return state;

  const result: TurnResult = { word: state.currentCard.word, outcome };
  const { card, queue } = drawFromQueue(state);

  return {
    ...state,
    currentCard: card,
    cardQueue: queue,
    turnResults: [...state.turnResults, result],
  };
}

export function endTurn(state: GameState): GameState {
  const delta = state.turnResults.reduce((acc, r) => {
    if (r.outcome === "correct") return acc + 1;
    if (r.outcome === "taboo") return acc - 1;
    return acc;
  }, 0);

  const teams: [Team, Team] = [{ ...state.teams[0] }, { ...state.teams[1] }];
  teams[state.activeTeam].score += delta;

  return {
    ...state,
    phase: "turn_summary",
    teams,
    currentCard: null,
    turnStartedAt: null,
  };
}

export function nextTurn(state: GameState): GameState {
  const nextTeam: 0 | 1 = state.activeTeam === 0 ? 1 : 0;
  // Completing a round = team 1 finishes (we're switching back to team 0)
  const completingRound = state.activeTeam === 1;
  const nextRound = completingRound ? state.currentRound + 1 : state.currentRound;

  if (completingRound && nextRound > state.totalRounds) {
    return endGame(state);
  }

  return startTurn({ ...state, activeTeam: nextTeam, currentRound: nextRound });
}

export function endGame(state: GameState): GameState {
  return { ...state, phase: "ended", currentCard: null, turnStartedAt: null };
}

export function resetGame(state: GameState): GameState {
  return {
    ...DEFAULT_GAME_STATE,
    totalRounds: state.totalRounds,
    turnDurationMs: state.turnDurationMs,
    teams: [
      { id: 0, name: state.teams[0].name, score: 0 },
      { id: 1, name: state.teams[1].name, score: 0 },
    ],
  };
}

export function isTurnExpired(state: GameState): boolean {
  if (!state.turnStartedAt) return false;
  return Date.now() - state.turnStartedAt >= state.turnDurationMs;
}

export function timeRemainingMs(state: GameState): number {
  if (!state.turnStartedAt) return state.turnDurationMs;
  return Math.max(0, state.turnDurationMs - (Date.now() - state.turnStartedAt));
}

/** Returns a copy of state safe to broadcast to non-host clients (card data stripped). */
export function redactStateForBroadcast(state: GameState): GameState {
  return { ...state, currentCard: null, cardQueue: [] };
}
