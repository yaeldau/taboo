"use client";

import { useEffect, useState } from "react";
import { timeRemainingMs } from "@/lib/game";
import { TURN_DURATION_MS } from "@/types/game";
import type { GameState } from "@/types/game";

interface Props {
  gameState: GameState;
}

export function Timer({ gameState }: Props) {
  const [remaining, setRemaining] = useState(() => timeRemainingMs(gameState));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(timeRemainingMs(gameState));
    }, 100);
    return () => clearInterval(interval);
  }, [gameState]);

  const seconds = Math.ceil(remaining / 1000);
  const progress = remaining / TURN_DURATION_MS;

  const SIZE = 76;
  const STROKE = 6;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const color =
    seconds <= 10 ? "#ef4444" : seconds <= 20 ? "#f59e0b" : "#ffffff";

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.1s linear, stroke 0.5s ease",
          }}
        />
      </svg>
      <span
        className="absolute text-xl font-black tabular-nums select-none"
        style={{ color, transition: "color 0.5s ease" }}
      >
        {seconds}
      </span>
    </div>
  );
}
