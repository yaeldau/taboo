"use client";

import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameState } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";

interface Props {
  gameState: GameState;
  isHost: boolean;
  playerCount: number;
  roomId: string;
  dispatch: (action: GameAction) => void;
}

export function Lobby({ gameState, isHost, playerCount, roomId, dispatch }: Props) {
  const [teamNames, setTeamNames] = useState<[string, string]>([
    gameState.teams[0].name,
    gameState.teams[1].name,
  ]);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStart() {
    dispatch({ type: "start_game", teamNames });
  }

  function updateTeamName(index: 0 | 1, value: string) {
    const next: [string, string] = [teamNames[0], teamNames[1]];
    next[index] = value.slice(0, 12);
    setTeamNames(next);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 px-6 pt-16 pb-10 gap-8">
      {/* Logo */}
      <div className="text-center space-y-2">
        <h1
          className="text-8xl font-black tracking-tight select-none"
          style={{
            color: "#e63946",
            textShadow: "0 0 60px rgba(230,57,70,0.4)",
          }}
        >
          טאבו
        </h1>
        <p className="text-gray-400 text-lg">משחק מילים אונליין</p>
      </div>

      {/* Room code */}
      <div className="w-full max-w-xs space-y-2 text-center">
        <p className="text-gray-500 text-sm uppercase tracking-widest">קוד חדר</p>
        <button
          onClick={handleShare}
          className="w-full text-4xl font-mono font-black tracking-[0.25em] py-4 px-6 rounded-2xl text-white transition-all active:scale-95"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px dashed rgba(255,255,255,0.2)",
          }}
        >
          {roomId.toUpperCase()}
        </button>
      </div>

      {/* Share + player count */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          className="flex-1 gap-2 h-11 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl"
          onClick={handleShare}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "הועתק!" : "העתק קישור"}
        </Button>
        <div className="flex items-center gap-1.5 text-gray-400 text-sm whitespace-nowrap">
          <Users className="w-4 h-4" />
          <span>{playerCount} מחוברים</span>
        </div>
      </div>

      {/* Team names */}
      <div className="w-full max-w-xs space-y-3">
        <p className="text-gray-500 text-sm text-center uppercase tracking-widest">
          שמות קבוצות
        </p>
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as const).map((i) =>
            isHost ? (
              <input
                key={i}
                type="text"
                inputMode="text"
                autoComplete="off"
                value={teamNames[i]}
                onChange={(e) => updateTeamName(i, e.target.value)}
                placeholder={i === 0 ? "קבוצה א" : "קבוצה ב"}
                className="text-center text-base font-bold rounded-xl py-3 px-3 text-white outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                onFocus={(e) =>
                  (e.target.style.border = "1px solid rgba(230,57,70,0.6)")
                }
                onBlur={(e) =>
                  (e.target.style.border = "1px solid rgba(255,255,255,0.15)")
                }
              />
            ) : (
              <div
                key={i}
                className="text-center text-base font-bold rounded-xl py-3 px-3 text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {gameState.teams[i].name}
              </div>
            )
          )}
        </div>
      </div>

      {/* Start / waiting */}
      <div className="w-full max-w-xs mt-auto">
        {isHost ? (
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-16 text-xl font-black rounded-2xl text-white border-0 touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #e63946, #c1121f)",
              boxShadow: "0 8px 32px rgba(230,57,70,0.4)",
            }}
          >
            התחל משחק! 🎮
          </Button>
        ) : (
          <div className="text-center space-y-2 py-4">
            <p className="text-gray-400 text-lg animate-pulse">
              ממתין למארח להתחיל...
            </p>
            <p className="text-gray-600 text-sm">
              {gameState.teams[0].name} נגד {gameState.teams[1].name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
