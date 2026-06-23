import { useState } from "react";
import type { GameState, TurnResult } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/button";

interface Props {
  gameState: GameState;
  isHost: boolean;
  dispatch: (action: GameAction) => void;
}

function OutcomeIcon({ outcome }: { outcome: TurnResult["outcome"] }) {
  if (outcome === "correct")
    return <span className="text-green-400 font-black">✓</span>;
  if (outcome === "taboo")
    return <span className="font-black" style={{ color: "#ef4444" }}>✕</span>;
  return <span className="text-gray-500 font-black">⟩⟩</span>;
}

export function TurnSummary({ gameState, isHost, dispatch }: Props) {
  const [advancing, setAdvancing] = useState(false);
  const { turnResults, teams, activeTeam, currentRound, totalRounds } = gameState;
  const isLastTurn = activeTeam === 1 && currentRound === totalRounds;

  function handleNextTurn() {
    if (advancing) return;
    setAdvancing(true);
    dispatch("next_turn");
  }

  const delta = turnResults.reduce((acc, r) => {
    if (r.outcome === "correct") return acc + 1;
    if (r.outcome === "taboo") return acc - 1;
    return acc;
  }, 0);

  const correct = turnResults.filter((r) => r.outcome === "correct").length;
  const taboos = turnResults.filter((r) => r.outcome === "taboo").length;
  const skips = turnResults.filter((r) => r.outcome === "skip").length;

  const deltaColor =
    delta > 0 ? "#4ade80" : delta < 0 ? "#f87171" : "#9ca3af";
  const deltaLabel = delta > 0 ? `+${delta}` : String(delta);

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-gray-950 to-gray-900 px-5 pt-4 pb-4 gap-2 overflow-hidden">
      {/* Header */}
      <div className="text-center space-y-0.5">
        <div className="text-3xl">⏱️</div>
        <h2 className="text-xl font-black text-white">הסיבוב נגמר!</h2>
        <p className="text-gray-400 text-sm">תור {teams[activeTeam].name}</p>
        <p className="text-gray-600 text-xs">
          סיבוב {currentRound} מתוך {totalRounds}
        </p>
      </div>

      {/* Delta */}
      <div
        className="text-center py-2.5 rounded-2xl"
        style={{
          background:
            delta > 0
              ? "rgba(22,163,74,0.15)"
              : delta < 0
              ? "rgba(220,38,38,0.15)"
              : "rgba(255,255,255,0.05)",
          border: `1px solid ${delta > 0 ? "rgba(74,222,128,0.3)" : delta < 0 ? "rgba(248,113,113,0.3)" : "transparent"}`,
        }}
      >
        <span
          className="text-4xl font-black"
          style={{ color: deltaColor }}
        >
          {deltaLabel}
        </span>
        <p className="text-gray-400 text-sm mt-1">
          {correct} נכון · {taboos} טאבו · {skips} דילוג
        </p>
      </div>

      {/* Results list */}
      {turnResults.length > 0 && (
        <div className="flex-1 space-y-1.5 overflow-y-auto min-h-0">
          {turnResults.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <span className="text-white font-semibold">{r.word}</span>
              <OutcomeIcon outcome={r.outcome} />
            </div>
          ))}
        </div>
      )}

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((i) => (
          <div
            key={i}
            className="text-center py-2 rounded-xl"
            style={
              i === activeTeam
                ? {
                    background: "rgba(230,57,70,0.15)",
                    border: "1px solid rgba(230,57,70,0.3)",
                  }
                : { background: "rgba(255,255,255,0.04)" }
            }
          >
            <div className="text-xs text-gray-400 mb-0.5">{teams[i].name}</div>
            <div className="text-2xl font-black text-white">{teams[i].score}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {isHost ? (
          <>
            <Button
              size="lg"
              disabled={advancing}
              onClick={handleNextTurn}
              className="w-full h-12 text-lg font-black rounded-2xl text-white border-0 touch-manipulation disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #e63946, #c1121f)",
                boxShadow: "0 6px 24px rgba(230,57,70,0.4)",
              }}
            >
              {advancing ? "..." : isLastTurn ? "סיום משחק ←" : "סיבוב הבא ←"}
            </Button>
            <button
              onClick={() => dispatch("end_game")}
              className="w-full py-2.5 rounded-xl text-gray-400 text-sm font-semibold touch-manipulation active:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              סיים משחק
            </button>
          </>
        ) : (
          <div className="text-center text-gray-500 animate-pulse py-2">
            ממתין למארח...
          </div>
        )}
      </div>
    </div>
  );
}
