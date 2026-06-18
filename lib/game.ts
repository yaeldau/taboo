import type { GameState, TurnOutcome, TurnResult } from "@/types/game";
import { DEFAULT_GAME_STATE, TURN_DURATION_MS } from "@/types/game";
import { getCardByIndex } from "@/lib/cards";

export function startTurn(state: GameState): GameState {
  const nextIndex =
    state.usedCardIndices.length > 0
      ? Math.max(...state.usedCardIndices) + 1
      : 0;

  return {
    ...state,
    phase: "playing",
    currentCard: getCardByIndex(nextIndex),
    usedCardIndices: [...state.usedCardIndices, nextIndex],
    turnResults: [],
    turnStartedAt: Date.now(),
  };
}

export function recordResult(
  state: GameState,
  outcome: TurnOutcome
): GameState {
  if (!state.currentCard) return state;

  const result: TurnResult = { word: state.currentCard.word, outcome };

  const nextIndex = Math.max(...state.usedCardIndices) + 1;
  const nextCard = getCardByIndex(nextIndex);

  return {
    ...state,
    currentCard: nextCard,
    usedCardIndices: [...state.usedCardIndices, nextIndex],
    turnResults: [...state.turnResults, result],
  };
}

export function endTurn(state: GameState): GameState {
  const delta = state.turnResults.reduce((acc, r) => {
    if (r.outcome === "correct") return acc + 1;
    if (r.outcome === "taboo") return acc - 1;
    return acc;
  }, 0);

  const teams: GameState["teams"] = [
    { ...state.teams[0] },
    { ...state.teams[1] },
  ];
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
  return startTurn({ ...state, activeTeam: nextTeam });
}

export function endGame(state: GameState): GameState {
  return { ...state, phase: "ended", currentCard: null, turnStartedAt: null };
}

export function resetGame(state: GameState): GameState {
  return {
    ...DEFAULT_GAME_STATE,
    teams: [
      { ...state.teams[0], score: 0 },
      { ...state.teams[1], score: 0 },
    ],
  };
}

export function isTurnExpired(state: GameState): boolean {
  if (!state.turnStartedAt) return false;
  return Date.now() - state.turnStartedAt >= TURN_DURATION_MS;
}

export function timeRemainingMs(state: GameState): number {
  if (!state.turnStartedAt) return TURN_DURATION_MS;
  return Math.max(0, TURN_DURATION_MS - (Date.now() - state.turnStartedAt));
}
