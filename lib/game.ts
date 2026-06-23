import type { GameState, TurnOutcome, TurnResult, Team } from "@/types/game";
import { DEFAULT_GAME_STATE } from "@/types/game";
import { getShuffledDeck } from "@/lib/cards";

function drawFromQueue(state: GameState): {
  card: GameState["currentCard"];
  queue: GameState["cardQueue"];
} {
  const queue = state.cardQueue.length > 0 ? state.cardQueue : getShuffledDeck();
  const [card, ...rest] = queue;
  return { card: card ?? null, queue: rest };
}

export function updateLobbySettings(
  state: GameState,
  settings: { teamNames?: [string, string]; totalRounds?: number; turnDurationMs?: number },
): GameState {
  if (state.phase !== "lobby") return state;
  let next = { ...state };
  if (settings.teamNames) {
    next = {
      ...next,
      teams: [
        { ...next.teams[0], name: settings.teamNames[0] },
        { ...next.teams[1], name: settings.teamNames[1] },
      ] as [Team, Team],
    };
  }
  if (settings.totalRounds !== undefined) next = { ...next, totalRounds: settings.totalRounds };
  if (settings.turnDurationMs !== undefined) next = { ...next, turnDurationMs: settings.turnDurationMs };
  return next;
}

/** Transitions from lobby to claiming phase; shuffles deck but waits for explainer to be claimed. */
export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: "claiming",
    activeTeam: 0,
    currentRound: 1,
    cardQueue: getShuffledDeck(),
    currentCard: null,
    turnResults: [],
    turnStartedAt: null,
    activeExplainerPlayerId: null,
    activeExplainerName: "",
  };
}

/** Called when a player claims the explainer role; starts the turn timer and draws the first card. */
export function claimExplainer(state: GameState, playerId: string, playerName: string): GameState {
  if (state.phase !== "claiming") return state;
  const { card, queue } = drawFromQueue(state);
  return {
    ...state,
    phase: "playing",
    activeExplainerPlayerId: playerId,
    activeExplainerName: playerName,
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

/** Transitions to claiming phase for the next team's turn. Returns endGame if all rounds are done. */
export function nextTurn(state: GameState): GameState {
  const nextTeam: 0 | 1 = state.activeTeam === 0 ? 1 : 0;
  const completingRound = state.activeTeam === 1;
  const nextRound = completingRound ? state.currentRound + 1 : state.currentRound;

  if (completingRound && nextRound > state.totalRounds) {
    return endGame(state);
  }

  return {
    ...state,
    phase: "claiming",
    activeTeam: nextTeam,
    currentRound: nextRound,
    currentCard: null,
    turnResults: [],
    turnStartedAt: null,
    activeExplainerPlayerId: null,
    activeExplainerName: "",
  };
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

/**
 * Returns a copy of state safe to broadcast to all clients.
 * Strips cardQueue (future cards) but keeps currentCard so the active explainer can see it.
 */
export function redactStateForBroadcast(state: GameState): GameState {
  return { ...state, cardQueue: [] };
}

export interface TurnStats {
  correct: number;
  skip: number;
  taboo: number;
  net: number;
}

export function computeTurnStats(results: TurnResult[]): TurnStats {
  const correct = results.filter((r) => r.outcome === "correct").length;
  const skip = results.filter((r) => r.outcome === "skip").length;
  const taboo = results.filter((r) => r.outcome === "taboo").length;
  return { correct, skip, taboo, net: correct - taboo };
}
