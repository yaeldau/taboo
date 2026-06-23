"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { primeAudio } from "@/lib/sounds";
import type { GameState, PlayerPresence } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";

interface Props {
  gameState: GameState;
  isHost: boolean;
  playerCount: number;
  roomId: string;
  playerId: string;
  playerName: string;
  myTeam: 0 | 1 | null;
  players: PlayerPresence[];
  dispatch: (action: GameAction) => void;
  setPlayerName: (name: string) => void;
  joinTeam: (teamId: 0 | 1 | null) => void;
}

export function Lobby({
  gameState,
  isHost,
  roomId,
  playerId,
  playerName,
  myTeam,
  players,
  dispatch,
  setPlayerName,
  joinTeam,
}: Props) {
  const [teamNames, setTeamNames] = useState<[string, string]>([
    gameState.teams[0].name,
    gameState.teams[1].name,
  ]);
  const [totalRounds, setTotalRounds] = useState(gameState.totalRounds);
  const [turnDurationMs, setTurnDurationMs] = useState(gameState.turnDurationMs);
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const DURATION_OPTIONS = [30_000, 45_000, 60_000, 90_000] as const;
  const durationLabel = (ms: number) => `${ms / 1000}″`;

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStart() {
    primeAudio();
    dispatch({ type: "start_game", teamNames, totalRounds, turnDurationMs });
  }

  function adjustRounds(delta: number) {
    const next = Math.min(10, Math.max(1, totalRounds + delta));
    setTotalRounds(next);
    dispatch({ type: "update_lobby_settings", totalRounds: next });
  }

  function updateTeamName(index: 0 | 1, value: string) {
    const next: [string, string] = [teamNames[0], teamNames[1]];
    next[index] = value.slice(0, 12);
    setTeamNames(next);
    dispatch({ type: "update_lobby_settings", teamNames: next });
  }

  function handleNameBlur() {
    const trimmed = nameInput.trim();
    if (trimmed) setPlayerName(trimmed);
  }

  const teamPlayers = (teamId: 0 | 1) => players.filter((p) => p.teamId === teamId);

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-gray-950 to-gray-900 px-5 pt-4 pb-4">
      {/* Logo */}
      <div className="text-center flex-shrink-0 mb-2">
        <h1
          className="text-5xl sm:text-7xl font-black tracking-tight select-none"
          style={{ color: "#e63946", textShadow: "0 0 60px rgba(230,57,70,0.4)" }}
        >
          טאבו
        </h1>
        <p className="text-gray-400 text-xs">משחק מילים אונליין</p>
      </div>

      <div className="flex-1 flex flex-col justify-evenly items-center min-h-0 w-full overflow-y-auto">
        {/* Room code + share */}
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <button
            onClick={handleShare}
            className="w-full text-2xl font-mono font-black tracking-[0.2em] py-2 px-4 rounded-2xl text-white transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px dashed rgba(255,255,255,0.2)",
            }}
          >
            {roomId.toUpperCase()}
          </button>
          <Button
            variant="outline"
            className="w-full gap-2 h-9 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl text-sm"
            onClick={handleShare}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "הועתק!" : "העתק קישור"}
          </Button>
        </div>

        {/* Player name */}
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <p className="text-gray-500 text-xs text-center uppercase tracking-widest">השם שלי</p>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
            onBlur={(e) => {
              e.target.style.border = "1px solid rgba(255,255,255,0.15)";
              handleNameBlur();
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            placeholder="הכנס שם..."
            dir="rtl"
            className="w-full text-center text-sm font-bold rounded-xl py-2.5 px-3 text-white outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onFocus={(e) => (e.target.style.border = "1px solid rgba(230,57,70,0.6)")}
          />
        </div>

        {/* Team picker */}
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <p className="text-gray-500 text-xs text-center uppercase tracking-widest">
            {isHost ? "שמות וקבוצות" : "הצטרף לקבוצה"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([0, 1] as const).map((i) => {
              const members = teamPlayers(i);
              const isMyTeam = myTeam === i;
              return (
                <div key={i} className="flex flex-col gap-1.5">
                  {isHost ? (
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      value={teamNames[i]}
                      onChange={(e) => updateTeamName(i, e.target.value)}
                      placeholder={i === 0 ? "קבוצה א" : "קבוצה ב"}
                      className="text-center text-sm font-bold rounded-xl py-2 px-3 text-white outline-none transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                      onFocus={(e) => (e.target.style.border = "1px solid rgba(230,57,70,0.6)")}
                      onBlur={(e) => (e.target.style.border = "1px solid rgba(255,255,255,0.15)")}
                    />
                  ) : (
                    <div
                      className="text-center text-sm font-bold rounded-xl py-2 px-3 text-white"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {gameState.teams[i].name}
                    </div>
                  )}

                  {/* Join button */}
                  <button
                    onClick={() => { primeAudio(); joinTeam(isMyTeam ? null : i); }}
                    className="w-full py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation"
                    style={
                      isMyTeam
                        ? {
                            background: "rgba(230,57,70,0.25)",
                            border: "1px solid rgba(230,57,70,0.5)",
                            color: "#fca5a5",
                          }
                        : {
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "#6b7280",
                          }
                    }
                  >
                    {isMyTeam ? "✓ אני כאן" : "הצטרף"}
                  </button>

                  {/* Member list */}
                  {members.length > 0 && (
                    <div className="flex flex-col gap-0.5">
                      {members.map((p) => (
                        <div
                          key={p.playerId}
                          className="text-center text-xs rounded-lg py-0.5 px-2 truncate"
                          style={{
                            color: p.playerId === playerId ? "#fca5a5" : "#9ca3af",
                            background: p.playerId === playerId ? "rgba(230,57,70,0.1)" : "transparent",
                          }}
                        >
                          {p.name || "שחקן"}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rounds picker */}
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <p className="text-gray-500 text-xs text-center uppercase tracking-widest">מספר סיבובים</p>
          <div className="flex items-center justify-center gap-5">
            {isHost ? (
              <>
                <button
                  onClick={() => adjustRounds(-1)}
                  disabled={totalRounds <= 1}
                  className="w-9 h-9 rounded-full text-xl font-black text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  −
                </button>
                <span className="text-3xl font-black text-white w-10 text-center">{totalRounds}</span>
                <button
                  onClick={() => adjustRounds(1)}
                  disabled={totalRounds >= 10}
                  className="w-9 h-9 rounded-full text-xl font-black text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  +
                </button>
              </>
            ) : (
              <span className="text-3xl font-black text-white">{gameState.totalRounds}</span>
            )}
          </div>
        </div>

        {/* Turn duration picker */}
        <div className="w-full max-w-xs flex flex-col gap-1.5">
          <p className="text-gray-500 text-xs text-center uppercase tracking-widest">זמן לתור</p>
          {isHost ? (
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((ms) => (
                <button
                  key={ms}
                  onClick={() => { setTurnDurationMs(ms); dispatch({ type: "update_lobby_settings", turnDurationMs: ms }); }}
                  className="py-2 rounded-xl text-sm font-black transition-all active:scale-95"
                  style={
                    turnDurationMs === ms
                      ? { background: "rgba(230,57,70,0.3)", border: "1px solid rgba(230,57,70,0.6)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }
                  }
                >
                  {durationLabel(ms)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-2xl font-black text-white">{durationLabel(gameState.turnDurationMs)}</p>
          )}
        </div>
      </div>

      {/* Start / waiting */}
      <div className="w-full max-w-xs mx-auto flex-shrink-0 pt-2">
        {isHost ? (
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-14 text-xl font-black rounded-2xl text-white border-0 touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #e63946, #c1121f)",
              boxShadow: "0 8px 32px rgba(230,57,70,0.4)",
            }}
          >
            התחל משחק! 🎮
          </Button>
        ) : (
          <div className="text-center space-y-1 py-2">
            <p className="text-gray-400 text-base animate-pulse">ממתין למארח להתחיל...</p>
            <p className="text-gray-600 text-sm">{gameState.teams[0].name} נגד {gameState.teams[1].name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
