"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GameAction } from "@/hooks/useGameRoom";

interface Props {
  isHost: boolean;
  dispatch: (action: GameAction) => void;
}

export function ExitButton({ isHost, dispatch }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  function handleExit() {
    if (isHost) {
      // Ending the game affects every player, not just the host — confirm
      // first so a stray tap doesn't end it for everyone mid-game.
      setConfirming(true);
    } else {
      router.push("/");
    }
  }

  return (
    <>
      <button
        onClick={handleExit}
        className="flex items-center gap-1 text-gray-600 text-sm py-1 px-3 rounded-xl touch-manipulation active:text-gray-300 transition-colors"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        aria-label="יציאה מהמשחק"
      >
        ✕
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-5 space-y-4"
            style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <p className="text-white font-black text-lg">לסיים את המשחק?</p>
              <p className="text-gray-400 text-sm">המשחק יסתיים לכל השחקנים</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 h-11 rounded-xl font-bold text-sm touch-manipulation active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.08)", color: "#d1d5db" }}
              >
                ביטול
              </button>
              <button
                onClick={() => dispatch("end_game")}
                className="flex-1 h-11 rounded-xl font-bold text-sm text-white touch-manipulation active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #e63946, #c1121f)" }}
              >
                סיים משחק
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
