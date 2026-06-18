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
} from "@/lib/game";

export type GameAction =
  | "correct"
  | "skip"
  | "taboo"
  | "next_turn"
  | "end_game"
  | "reset"
  | { type: "start_game"; teamNames?: [string, string] };

export function useGameRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
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
        payload: { state },
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
            ...s,
            teams: [
              { ...s.teams[0], name: action.teamNames[0] },
              { ...s.teams[1], name: action.teamNames[1] },
            ] as [Team, Team],
          };
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
    const host = sessionStorage.getItem(`isHost_${roomId}`) === "true";
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
              payload: { state: stateRef.current },
            });
          setTimeout(sendState, 300);
          setTimeout(sendState, 1500);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({ joined_at: Date.now() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, updateState]);

  return { gameState, isHost, connected, playerCount, dispatch };
}
