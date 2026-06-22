"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useGameRoom } from "@/hooks/useGameRoom";
import { useSound } from "@/hooks/useSound";
import { Lobby } from "@/components/game/Lobby";
import { TabooCard } from "@/components/game/TabooCard";
import { Timer } from "@/components/game/Timer";
import { ActionButtons } from "@/components/game/ActionButtons";
import { TurnSummary } from "@/components/game/TurnSummary";
import { GameEnded } from "@/components/game/GameEnded";
import { Volume2, VolumeX } from "lucide-react";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameState, isHost, connected, connectionError, connectionErrorReason, playerCount, dispatch } =
    useGameRoom(roomId);
  const { muted, toggleMute } = useSound();

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

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">⚠️</div>
          <p className="text-white text-xl font-bold">לא ניתן להתחבר</p>
          {connectionErrorReason ? (
            <p
              className="text-amber-400 text-sm font-mono px-3 py-2 rounded-lg text-right"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              {connectionErrorReason}
            </p>
          ) : null}
          <p className="text-gray-500 text-xs">
            בדוק את קונסול הדפדפן (F12) לפרטים נוספים
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 rounded-xl text-white font-bold touch-manipulation"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

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
      <div className="flex flex-col h-dvh bg-gray-950">
        {/* Top bar: Team scores flanking the timer, with mute toggle */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-1 sm:gap-3 sm:px-5 sm:pt-4 sm:pb-2">
          {/* Team 0 — right side in RTL */}
          <div
            className={`flex-1 text-center transition-all duration-300 ${
              activeTeam === 0 ? "opacity-100" : "opacity-35"
            }`}
          >
            <div className="text-xs text-gray-400 truncate">
              {teams[0].name}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white leading-none mt-0.5">
              {teams[0].score}
            </div>
            {activeTeam === 0 && (
              <div
                className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                style={{ background: "#e63946" }}
              />
            )}
          </div>

          {/* Timer + mute button stacked */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <Timer gameState={gameState} />
            <button
              onClick={toggleMute}
              className="flex items-center justify-center w-7 h-7 rounded-full touch-manipulation transition-colors active:scale-90"
              style={{ background: "rgba(255,255,255,0.07)" }}
              aria-label={muted ? "הפעל צלילים" : "השתק צלילים"}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-gray-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          {/* Team 1 — left side in RTL */}
          <div
            className={`flex-1 text-center transition-all duration-300 ${
              activeTeam === 1 ? "opacity-100" : "opacity-35"
            }`}
          >
            <div className="text-xs text-gray-400 truncate">
              {teams[1].name}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white leading-none mt-0.5">
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

        {/* Card — only the host (clue giver) sees the word */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-1 gap-1 overflow-hidden">
          {isHost ? (
            gameState.currentCard && (
              <>
                <p className="text-gray-600 text-xs tabular-nums">
                  כרטיס {gameState.turnResults.length + 1}
                </p>
                <TabooCard card={gameState.currentCard} />
              </>
            )
          ) : (
            <div
              className="w-full max-w-sm rounded-3xl flex flex-col items-center justify-center gap-4 py-16"
              style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                border: "2px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="text-6xl">🤔</div>
              <p className="text-white text-2xl font-black">נחשו!</p>
              <p className="text-gray-500 text-sm text-center px-6">
                המארח מתאר — נסו לנחש את המילה
              </p>
            </div>
          )}
        </div>

        {/* Action buttons pinned to bottom */}
        <div className="px-4 pt-1 pb-2">
          <ActionButtons dispatch={dispatch} isHost={isHost} />
        </div>

        {/* End game — subtle, host only */}
        {isHost && (
          <div className="pb-3 text-center">
            <button
              onClick={() => dispatch("end_game")}
              className="text-gray-600 text-sm py-1 px-4 touch-manipulation active:text-gray-400 transition-colors"
            >
              סיים משחק
            </button>
          </div>
        )}
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
