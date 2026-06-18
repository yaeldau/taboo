export type GamePhase = "lobby" | "playing" | "turn_summary" | "ended";

export interface Team {
  id: 0 | 1;
  name: string;
  score: number;
}

export interface Card {
  word: string;
  forbidden: [string, string, string, string, string];
}

export type TurnOutcome = "correct" | "skip" | "taboo";

export interface TurnResult {
  word: string;
  outcome: TurnOutcome;
}

export interface GameState {
  phase: GamePhase;
  teams: [Team, Team];
  activeTeam: 0 | 1;
  currentCard: Card | null;
  /** Remaining cards for this game, shuffled at start */
  cardQueue: Card[];
  turnResults: TurnResult[];
  /** Unix ms timestamp when the current turn started, for timer sync */
  turnStartedAt: number | null;
}

export const TURN_DURATION_MS = 60_000;

export const DEFAULT_GAME_STATE: GameState = {
  phase: "lobby",
  teams: [
    { id: 0, name: "קבוצה א", score: 0 },
    { id: 1, name: "קבוצה ב", score: 0 },
  ],
  activeTeam: 0,
  currentCard: null,
  cardQueue: [],
  turnResults: [],
  turnStartedAt: null,
};

/** Message broadcast over the Supabase Realtime channel */
export interface RoomBroadcast {
  type: "state_update";
  state: GameState;
}
