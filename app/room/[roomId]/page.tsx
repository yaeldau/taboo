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
import { TurnScoreCounter } from "@/components/game/TurnScoreCounter";
import { ClaimTurn } from "@/components/game/ClaimTurn";
import { ExitButton } from "@/components/game/ExitButton";
import { Volume2, VolumeX } from "lucide-react";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const {
    gameState,
    isHost,
    isExplainer,
    playerId,
    playerName,
    myTeam,
    players,
    connected,
    connectionError,
    connectionErrorReason,
    playerCount,
    dispatch,
    setPlayerName,
    joinTeam,
  } = useGameRoom(roomId);
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
        playerId={playerId}
        playerName={playerName}
        myTeam={myTeam}
        players={players}
        dispatch={dispatch}
        setPlayerName={setPlayerName}
        joinTeam={joinTeam}
      />
    );
  }

  if (gameState.phase === "claiming") {
    return (
      <ClaimTurn
        gameState={gameState}
        isHost={isHost}
        playerId={playerId}
        playerName={playerName}
        myTeam={myTeam}
        players={players}
        dispatch={dispatch}
        setPlayerName={setPlayerName}
        joinTeam={joinTeam}
      />
    );
  }

  if (gameState.phase === "playing") {
    const { teams, activeTeam } = gameState;
    return (
      <div className="flex flex-col h-dvh bg-gray-950">
        {/* Top bar: Team scores flanking the timer, with mute toggle */}
        {teams.length === 2 ? (
          <div className="flex items-center gap-2 px-4 pt-2 pb-1 sm:gap-3 sm:px-5 sm:pt-4 sm:pb-2">
            {/* Team 0 — right side in RTL */}
            <div
              className={`flex-1 text-center transition-all duration-300 ${
                activeTeam === 0 ? "opacity-100" : "opacity-35"
              }`}
            >
              <div className="text-xs text-gray-400 truncate">{teams[0].name}</div>
              <div className="text-2xl sm:text-3xl font-black text-white leading-none mt-0.5">
                {teams[0].score}
              </div>
              {activeTeam === 0 && (
                <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: "#e63946" }} />
              )}
            </div>

            {/* Timer + controls stacked */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <Timer gameState={gameState} />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center w-7 h-7 rounded-full touch-manipulation transition-colors active:scale-90"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                  aria-label={muted ? "הפעל צלילים" : "השתק צלילים"}
                >
                  {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
                </button>
                <ExitButton isHost={isHost} dispatch={dispatch} />
              </div>
            </div>

            {/* Team 1 — left side in RTL */}
            <div
              className={`flex-1 text-center transition-all duration-300 ${
                activeTeam === 1 ? "opacity-100" : "opacity-35"
              }`}
            >
              <div className="text-xs text-gray-400 truncate">{teams[1].name}</div>
              <div className="text-2xl sm:text-3xl font-black text-white leading-none mt-0.5">
                {teams[1].score}
              </div>
              {activeTeam === 1 && (
                <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1" style={{ background: "#e63946" }} />
              )}
            </div>
          </div>
        ) : (
          /* 1 team or 3+ teams: compact column layout */
          <div className="flex flex-col px-4 pt-2 pb-1 sm:px-5 sm:pt-4 sm:pb-2 gap-1">
            <div className="flex gap-2 justify-around items-end">
              {teams.map((team, i) => (
                <div
                  key={i}
                  className={`text-center transition-all duration-300 flex-1 ${
                    activeTeam === i ? "opacity-100" : "opacity-35"
                  }`}
                >
                  <div className="text-xs text-gray-400 truncate">{team.name}</div>
                  <div className="text-xl sm:text-2xl font-black text-white leading-none mt-0.5">
                    {team.score}
                  </div>
                  {activeTeam === i && (
                    <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: "#e63946" }} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Timer gameState={gameState} />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center w-7 h-7 rounded-full touch-manipulation transition-colors active:scale-90"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                  aria-label={muted ? "הפעל צלילים" : "השתק צלילים"}
                >
                  {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-gray-400" />}
                </button>
                <ExitButton isHost={isHost} dispatch={dispatch} />
              </div>
            </div>
          </div>
        )}

        {/* Explainer name banner */}
        {gameState.activeExplainerName && (
          <div className="text-center py-0.5">
            <span className="text-xs text-gray-500">
              מסביר: <span className="text-gray-400 font-semibold">{gameState.activeExplainerName}</span>
            </span>
          </div>
        )}

        {/* Card — explainer sees word; everyone else sees guess prompt */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-1 gap-1 overflow-hidden">
          {isExplainer ? (
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
              className="w-full max-w-sm rounded-3xl flex flex-col items-center justify-center gap-3 py-10"
              style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                border: "2px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="text-5xl">🤔</div>
              <p className="text-white text-2xl font-black">נחשו!</p>
              <p className="text-gray-500 text-sm text-center px-6">
                {gameState.activeExplainerName
                  ? `${gameState.activeExplainerName} מתאר — נסו לנחש`
                  : "המסביר מתאר — נסו לנחש את המילה"}
              </p>
            </div>
          )}
        </div>

        {/* Running turn score — visible to all players */}
        <TurnScoreCounter results={gameState.turnResults} />

        {/* Action buttons pinned to bottom */}
        <div className="px-4 pt-0 pb-2">
          <ActionButtons dispatch={dispatch} isExplainer={isExplainer} />
        </div>

        {/* Watcher strip — let late joiners pick a team without leaving */}
        {myTeam === null && !isExplainer && (
          <div className="px-4 pb-3">
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-gray-500 text-xs">הצטרף לקבוצה:</span>
              <div className="flex gap-2 flex-wrap">
                {gameState.teams.map((team, i) => (
                  <button
                    key={i}
                    onClick={() => joinTeam(i)}
                    className="px-3 py-1 rounded-lg text-xs font-bold touch-manipulation active:scale-95 transition-all"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#9ca3af" }}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
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
        myTeam={myTeam}
        joinTeam={joinTeam}
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
