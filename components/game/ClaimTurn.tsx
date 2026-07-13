"use client";

import { useState } from "react";
import type { GameState, PlayerPresence } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";
import { ExitButton } from "@/components/game/ExitButton";
import { InviteLinkFallback } from "@/components/game/InviteLinkFallback";
import { useInvite } from "@/hooks/useInvite";

interface Props {
  gameState: GameState;
  isHost: boolean;
  playerId: string;
  playerName: string;
  myTeam: number | null;
  players: PlayerPresence[];
  dispatch: (action: GameAction) => void;
  setPlayerName: (name: string) => void;
  joinTeam: (teamId: number | null) => void;
}

export function ClaimTurn({
  gameState,
  isHost,
  playerId,
  playerName,
  myTeam,
  players,
  dispatch,
  setPlayerName,
  joinTeam,
}: Props) {
  const { teams, activeTeam, currentRound, totalRounds } = gameState;
  const [nameInput, setNameInput] = useState(playerName);
  const { invite: handleInvite, copied, manualUrl } = useInvite();

  const myName = players.find((p) => p.playerId === playerId)?.name || nameInput || "שחקן";
  const isMyTurn = myTeam === activeTeam;

  function handleClaim() {
    dispatch({ type: "claim_explainer", playerId, playerName: myName });
  }

  function handleNameBlur() {
    const trimmed = nameInput.trim();
    if (trimmed) setPlayerName(trimmed);
  }

  return (
    <div className="flex flex-col h-dvh bg-gradient-to-b from-gray-950 to-gray-900 px-5 pt-4 pb-5 gap-3 overflow-y-auto">
      {/* Top row: exit + round info + invite */}
      <div className="flex items-center justify-between flex-shrink-0">
        <ExitButton isHost={isHost} dispatch={dispatch} />
        <span className="text-gray-500 text-xs">
          סיבוב {currentRound} מתוך {totalRounds}
        </span>
        <button
          onClick={handleInvite}
          className="text-xs py-1 px-3 rounded-xl touch-manipulation active:scale-95 transition-all"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: copied ? "#4ade80" : "#9ca3af" }}
        >
          {copied ? "הועתק! ✓" : "הזמן 📨"}
        </button>
      </div>

      {manualUrl && <InviteLinkFallback url={manualUrl} />}

      {/* Heading */}
      <div className="text-center flex-shrink-0">
        <h2 className="text-2xl font-black text-white">תור {teams[activeTeam].name}</h2>
        <p className="text-gray-400 text-sm">מי מסביר הפעם?</p>
      </div>

      {/* Name input */}
      <div className="flex-shrink-0">
        <p className="text-gray-500 text-xs text-center mb-1 uppercase tracking-widest">השם שלי</p>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value.slice(0, 16))}
          onBlur={(e) => {
            e.target.style.border = "1px solid rgba(255,255,255,0.12)";
            handleNameBlur();
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="הכנס שם..."
          dir="rtl"
          className="w-full text-center text-sm font-bold rounded-xl py-2 px-3 text-white outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          onFocus={(e) => (e.target.style.border = "1px solid rgba(230,57,70,0.5)")}
        />
      </div>

      {/* All teams — join from here */}
      <div className={`grid gap-3 flex-shrink-0 ${teams.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {teams.map((team, i) => {
          const members = players.filter((p) => p.teamId === i);
          const isMyTeam = myTeam === i;
          return (
            <div
              key={i}
              className="flex flex-col gap-1.5 rounded-2xl p-3"
              style={
                i === activeTeam
                  ? { background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.25)" }
                  : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white truncate">{team.name}</span>
                <span className="text-xs font-bold text-gray-400">{team.score}</span>
              </div>

              {/* Members */}
              <div className="min-h-[1.25rem] flex flex-wrap gap-1">
                {members.map((p) => (
                  <span
                    key={p.playerId}
                    className="text-xs rounded-full px-2 py-0.5"
                    style={
                      p.playerId === playerId
                        ? { background: "rgba(230,57,70,0.2)", color: "#fca5a5" }
                        : { background: "rgba(255,255,255,0.07)", color: "#9ca3af" }
                    }
                  >
                    {p.name || "שחקן"}
                  </span>
                ))}
              </div>

              {/* Join / leave button */}
              <button
                onClick={() => joinTeam(isMyTeam ? null : i)}
                className="w-full py-1 rounded-xl text-xs font-bold transition-all active:scale-95 touch-manipulation"
                style={
                  isMyTeam
                    ? { background: "rgba(230,57,70,0.25)", border: "1px solid rgba(230,57,70,0.5)", color: "#fca5a5" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#6b7280" }
                }
              >
                {isMyTeam ? "✓ אני כאן" : "הצטרף"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Claim / waiting */}
      {isMyTurn ? (
        <button
          onClick={handleClaim}
          className="w-full h-14 rounded-2xl font-black text-xl text-white active:scale-95 transition-transform touch-manipulation flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #e63946, #c1121f)",
            boxShadow: "0 8px 32px rgba(230,57,70,0.4)",
          }}
        >
          אני מסביר! 🎤
        </button>
      ) : (
        <div
          className="w-full py-4 rounded-2xl text-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-gray-400 text-base animate-pulse">
            {myTeam === null
              ? "הצטרף לקבוצה כדי לשחק"
              : `ממתין לשחקן מ${teams[activeTeam].name}...`}
          </p>
        </div>
      )}
    </div>
  );
}
