"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import { Lobby } from "@/components/game/Lobby";
import { TabooCard } from "@/components/game/TabooCard";
import { Timer } from "@/components/game/Timer";
import { ActionButtons } from "@/components/game/ActionButtons";
import { TurnSummary } from "@/components/game/TurnSummary";
import { GameEnded } from "@/components/game/GameEnded";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameState, isHost, connected, playerCount, dispatch } =
    useGameRoom(roomId);

  // Keep screen awake during gameplay
  useEffect(() => {
    if (gameState.phase !== "playing") return;
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
      .wakeLock.request("screen")
      .then((l) => { lock = l; })
      .catch(() => {});
    return () => { lock?.release(); };
  }, [gameState.phase]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-spin">⏳</div>
          <p className="text-gray-400 text-lg">מתחבר לחדר...</p>
        </div>
      </div>
    );
  }

  if (gameState.phase === "lobby") {
    return (
      <Lobby
        gameState={gameState}
        isHost={isHost}
        playerCount={playerCount}
        roomId={roomId}
        dispatch={dispatch}
      />
    );
  }

  if (gameState.phase === "playing") {
    const { teams, activeTeam } = gameState;
    return (
      <div className="flex flex-col h-screen bg-gray-950">
        {/* Top bar: Team scores flanking the timer */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          {/* Team 0 — right side in RTL (naturally first) */}
          <div
            className={`flex-1 text-center transition-all duration-300 ${
              activeTeam === 0 ? "opacity-100" : "opacity-35"
            }`}
          >
            <div className="text-xs text-gray-400 truncate">
              {teams[0].name}
            </div>
            <div
              className="text-3xl font-black text-white leading-none mt-0.5"
            >
              {teams[0].score}
            </div>
            {activeTeam === 0 && (
              <div
                className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                style={{ background: "#e63946" }}
              />
            )}
          </div>

          <Timer gameState={gameState} />

          {/* Team 1 — left side in RTL (naturally last) */}
          <div
            className={`flex-1 text-center transition-all duration-300 ${
              activeTeam === 1 ? "opacity-100" : "opacity-35"
            }`}
          >
            <div className="text-xs text-gray-400 truncate">
              {teams[1].name}
            </div>
            <div className="text-3xl font-black text-white leading-none mt-0.5">
              {teams[1].score}
            </div>
            {activeTeam === 1 && (
              <div
                className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                style={{ background: "#e63946" }}
              />
            )}
          </div>
        </div>

        {/* Card — takes all remaining space */}
        <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
          {gameState.currentCard && (
            <TabooCard card={gameState.currentCard} />
          )}
        </div>

        {/* Action buttons pinned to bottom */}
        <div className="px-4 pb-6 pt-2">
          <ActionButtons dispatch={dispatch} isHost={isHost} />
        </div>
      </div>
    );
  }

  if (gameState.phase === "turn_summary") {
    return (
      <TurnSummary
        gameState={gameState}
        isHost={isHost}
        dispatch={dispatch}
      />
    );
  }

  if (gameState.phase === "ended") {
    return (
      <GameEnded
        gameState={gameState}
        isHost={isHost}
        dispatch={dispatch}
      />
    );
  }

  return null;
}
