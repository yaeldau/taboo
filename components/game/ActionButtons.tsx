"use client";

import type { GameAction } from "@/hooks/useGameRoom";

interface Props {
  dispatch: (action: GameAction) => void;
  isHost: boolean;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

export function ActionButtons({ dispatch, isHost }: Props) {
  if (!isHost) {
    return (
      <div className="text-center py-5">
        <p className="text-gray-600 text-sm">המארח מנהל את הקלפים</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-2 gap-3">
        {/* Correct */}
        <button
          className="flex items-center justify-center gap-2 rounded-2xl font-black text-xl h-16 text-white active:scale-95 transition-transform touch-manipulation select-none"
          style={{
            background: "linear-gradient(135deg, #16a34a, #166534)",
            boxShadow: "0 4px 20px rgba(22,163,74,0.4)",
          }}
          onPointerDown={() => {
            vibrate(50);
            dispatch("correct");
          }}
        >
          <span>✓</span>
          <span>נכון</span>
        </button>

        {/* Skip */}
        <button
          className="flex items-center justify-center gap-2 rounded-2xl font-black text-xl h-16 text-white active:scale-95 transition-transform touch-manipulation select-none"
          style={{
            background: "linear-gradient(135deg, #374151, #1f2937)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
          onPointerDown={() => {
            vibrate(20);
            dispatch("skip");
          }}
        >
          <span className="text-gray-400">⟩⟩</span>
          <span>דלג</span>
        </button>
      </div>

      {/* Taboo — full width, most important button */}
      <button
        className="flex items-center justify-center gap-3 rounded-2xl font-black text-2xl h-16 text-white active:scale-95 transition-transform touch-manipulation select-none"
        style={{
          background: "linear-gradient(135deg, #dc2626, #7f1d1d)",
          boxShadow: "0 4px 24px rgba(220,38,38,0.5)",
        }}
        onPointerDown={() => {
          vibrate([40, 30, 80]);
          dispatch("taboo");
        }}
      >
        <span>✕</span>
        <span>טאבו!</span>
      </button>
    </div>
  );
}
