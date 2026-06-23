"use client";

import type { GameState, PlayerPresence } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";
import { ExitButton } from "@/components/game/ExitButton";

interface Props {
  gameState: GameState;
  isHost: boolean;
  playerId: string;
  myTeam: 0 | 1 | null;
  players: PlayerPresence[];
  dispatch: (action: GameAction) => void;
}

export function ClaimTurn({ gameState, isHost, playerId, myTeam, players, dispatch }: Props) {
  const { teams, activeTeam, currentRound, totalRounds } = gameState;

  const activeTeamPlayers = players.filter((p) => p.teamId === activeTeam);
  const isMyTurn = myTeam === activeTeam;

  const myName = players.find((p) => p.playerId === playerId)?.name || "שחקן";

  function handleClaim() {
    dispatch({ type: "claim_explainer", playerId, playerName: myName });
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-gray-950 to-gray-900 px-5 pt-4 pb-6 gap-4">
      {/* Top bar with exit */}
      <div className="flex justify-start flex-shrink-0">
        <ExitButton isHost={isHost} dispatch={dispatch} />
      </div>

      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-gray-500 text-sm">
          סיבוב {currentRound} מתוך {totalRounds}
        </p>
        <h2 className="text-2xl font-black text-white">
          תור {teams[activeTeam].name}
        </h2>
        <p className="text-gray-400 text-sm">מי מסביר הפעם?</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 max-w-xs w-full mx-auto">
        {([0, 1] as const).map((i) => (
          <div
            key={i}
            className="text-center py-2 rounded-xl"
            style={
              i === activeTeam
                ? { background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.3)" }
                : { background: "rgba(255,255,255,0.04)" }
            }
          >
            <div className="text-xs text-gray-400 mb-0.5 truncate">{teams[i].name}</div>
            <div className="text-2xl font-black text-white">{teams[i].score}</div>
          </div>
        ))}
      </div>

      {/* Active team player list */}
      {activeTeamPlayers.length > 0 && (
        <div className="max-w-xs w-full mx-auto">
          <p className="text-gray-600 text-xs text-center mb-2 uppercase tracking-widest">
            שחקני {teams[activeTeam].name}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {activeTeamPlayers.map((p) => (
              <span
                key={p.playerId}
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={
                  p.playerId === playerId
                    ? { background: "rgba(230,57,70,0.2)", color: "#fca5a5", border: "1px solid rgba(230,57,70,0.4)" }
                    : { background: "rgba(255,255,255,0.07)", color: "#d1d5db" }
                }
              >
                {p.name || "שחקן"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Claim button or waiting message */}
      <div className="max-w-xs w-full mx-auto space-y-3">
        {isMyTurn ? (
          <button
            onClick={handleClaim}
            className="w-full h-16 rounded-2xl font-black text-xl text-white active:scale-95 transition-transform touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #e63946, #c1121f)",
              boxShadow: "0 8px 32px rgba(230,57,70,0.4)",
            }}
          >
            אני מסביר! 🎤
          </button>
        ) : (
          <div
            className="w-full py-5 rounded-2xl text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-gray-400 text-base animate-pulse">
              ממתין לשחקן מ{teams[activeTeam].name}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
