"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { DEFAULT_GAME_STATE, type GameState, type Team } from "@/types/game";
import { getRoomChannel } from "@/lib/supabase";
import {
  startGame,
  recordResult,
  endTurn,
  nextTurn,
  endGame,
  resetGame,
  timeRemainingMs,
  redactStateForBroadcast,
} from "@/lib/game";

export type GameAction =
  | "correct"
  | "skip"
  | "taboo"
  | "next_turn"
  | "end_game"
  | "reset"
  | { type: "start_game"; teamNames?: [string, string]; totalRounds?: number; turnDurationMs?: number };

export function useGameRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionErrorReason, setConnectionErrorReason] = useState<string>("");
  const [playerCount, setPlayerCount] = useState(0);

  const stateRef = useRef<GameState>(DEFAULT_GAME_STATE);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHostRef = useRef(false);

  const updateState = useCallback((state: GameState) => {
    setGameState(state);
    stateRef.current = state;
  }, []);

  const broadcast = useCallback(
    (state: GameState) => {
      updateState(state);
      channelRef.current?.send({
        type: "broadcast",
        event: "state_update",
        payload: { state: redactStateForBroadcast(state) },
      });
    },
    [updateState]
  );

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!isHostRef.current) return;
      const s = stateRef.current;

      if (typeof action === "string") {
        switch (action) {
          case "correct":   return broadcast(recordResult(s, "correct"));
          case "skip":      return broadcast(recordResult(s, "skip"));
          case "taboo":     return broadcast(recordResult(s, "taboo"));
          case "next_turn": return broadcast(nextTurn(s));
          case "end_game":  return broadcast(endGame(s));
          case "reset":     return broadcast(resetGame(s));
        }
      } else if (action.type === "start_game") {
        let base = s;
        if (action.teamNames) {
          base = {
            ...base,
            teams: [
              { ...base.teams[0], name: action.teamNames[0] },
              { ...base.teams[1], name: action.teamNames[1] },
            ] as [Team, Team],
          };
        }
        if (action.totalRounds !== undefined) {
          base = { ...base, totalRounds: action.totalRounds };
        }
        if (action.turnDurationMs !== undefined) {
          base = { ...base, turnDurationMs: action.turnDurationMs };
        }
        broadcast(startGame(base));
      }
    },
    [broadcast]
  );

  // Auto-expire turn — only host triggers endTurn
  useEffect(() => {
    if (gameState.phase !== "playing" || !isHost) return;
    const remaining = timeRemainingMs(gameState);
    if (remaining <= 0) {
      broadcast(endTurn(stateRef.current));
      return;
    }
    const timer = setTimeout(() => {
      if (stateRef.current.phase === "playing") {
        broadcast(endTurn(stateRef.current));
      }
    }, remaining);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.phase, gameState.turnStartedAt, isHost]);

  useEffect(() => {
    // Detect missing env vars before attempting to connect
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setConnectionErrorReason(
        `חסרים משתני סביבה: ${!url ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!key ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""}`.trim()
      );
      setConnectionError(true);
      return;
    }

    const host = localStorage.getItem(`isHost_${roomId}`) === "true";
    setIsHost(host);
    isHostRef.current = host;

    const channel = getRoomChannel(roomId);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "state_update" }, ({ payload }) => {
        // Non-host updates from broadcast; host already applied state locally
        if (!isHostRef.current) {
          updateState(payload.state as GameState);
        }
      })
      .on("presence", { event: "sync" }, () => {
        setPlayerCount(Object.keys(channel.presenceState()).length);
      })
      .on("presence", { event: "join" }, () => {
        // Re-broadcast current state so late joiners receive it.
        // Send twice (300ms and 1500ms) because mobile clients may not be
        // fully subscribed to broadcast events when the join event fires.
        if (isHostRef.current) {
          const sendState = () =>
            channelRef.current?.send({
              type: "broadcast",
              event: "state_update",
              payload: { state: redactStateForBroadcast(stateRef.current) },
            });
          setTimeout(sendState, 300);
          setTimeout(sendState, 1500);
        }
      });

    // Fail visibly after 8 seconds rather than spinning forever
    const timeout = setTimeout(() => {
      setConnectionErrorReason("פסק זמן — הפרויקט ב-Supabase אולי מושהה או ה-URL שגוי");
      setConnectionError(true);
    }, 15000);

    channel.subscribe(async (status, err) => {
      console.log("Supabase channel status:", status, err?.message ?? "");
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        setConnected(true);
        setConnectionError(false);
        setConnectionErrorReason("");
        await channel.track({ joined_at: Date.now() });
      } else if (status === "TIMED_OUT") {
        clearTimeout(timeout);
        setConnectionErrorReason("פסק זמן (TIMED_OUT) — בדוק שהפרויקט ב-Supabase פעיל");
        setConnectionError(true);
      } else if (status === "CHANNEL_ERROR") {
        clearTimeout(timeout);
        setConnectionErrorReason(
          err?.message
            ? `שגיאת ערוץ: ${err.message}`
            : "שגיאת ערוץ (CHANNEL_ERROR) — בדוק הרשאות Realtime ב-Supabase"
        );
        setConnectionError(true);
      }
    });

    return () => {
      clearTimeout(timeout);
      channel.unsubscribe();
    };
  }, [roomId, updateState]);

  return { gameState, isHost, connected, connectionError, connectionErrorReason, playerCount, dispatch };
}
