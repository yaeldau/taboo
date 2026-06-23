"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { DEFAULT_GAME_STATE, type GameState, type PlayerPresence } from "@/types/game";
import { getRoomChannel } from "@/lib/supabase";
import {
  startGame,
  claimExplainer as applyClaimExplainer,
  recordResult,
  endTurn,
  nextTurn,
  endGame,
  resetGame,
  timeRemainingMs,
  redactStateForBroadcast,
  updateLobbySettings,
} from "@/lib/game";
import { playSound } from "@/lib/sounds";

export type GameAction =
  | "correct"
  | "skip"
  | "taboo"
  | "next_turn"
  | "end_game"
  | "reset"
  | { type: "start_game"; teamNames?: string[]; totalRounds?: number; turnDurationMs?: number }
  | { type: "update_lobby_settings"; teamNames?: string[]; totalRounds?: number; turnDurationMs?: number }
  | { type: "claim_explainer"; playerId: string; playerName: string };

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("taboo_player_id");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("taboo_player_id", id);
  return id;
}

function getStoredTeam(roomId: string): number | null {
  if (typeof window === "undefined") return null;
  const s = localStorage.getItem(`taboo_team_${roomId}`);
  return s !== null ? Number(s) : null;
}

export function useGameRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_GAME_STATE);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionErrorReason, setConnectionErrorReason] = useState<string>("");
  const [playerCount, setPlayerCount] = useState(0);
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  // Restore team from localStorage so the button shows correct state on reload
  const [myTeam, setMyTeam] = useState<number | null>(() => getStoredTeam(roomId));
  const [playerName, setPlayerNameState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("taboo_player_name") || "";
  });

  const stateRef = useRef<GameState>(DEFAULT_GAME_STATE);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHostRef = useRef(false);
  const playerIdRef = useRef<string>("");
  const playerNameRef = useRef<string>("");
  // Initialise ref from localStorage so it's correct in the subscribe callback
  const myTeamRef = useRef<number | null>(getStoredTeam(roomId));
  const isExplainerRef = useRef(false);

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

  // Derived: is current player the active explainer?
  const isExplainer =
    !!playerIdRef.current &&
    gameState.activeExplainerPlayerId === playerIdRef.current;

  isExplainerRef.current = isExplainer;

  const broadcastPresence = useCallback((data: PlayerPresence) => {
    channelRef.current?.track(data);
    channelRef.current?.send({
      type: "broadcast",
      event: "presence_update",
      payload: data,
    });
  }, []);

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.slice(0, 16);
    localStorage.setItem("taboo_player_name", trimmed);
    playerNameRef.current = trimmed;
    setPlayerNameState(trimmed);
    broadcastPresence({
      playerId: playerIdRef.current,
      name: trimmed,
      teamId: myTeamRef.current,
      joined_at: Date.now(),
    });
  }, [broadcastPresence]);

  const joinTeam = useCallback((teamId: number | null) => {
    myTeamRef.current = teamId;
    setMyTeam(teamId);
    // Persist so the button shows the right state after a page reload
    if (teamId !== null) {
      localStorage.setItem(`taboo_team_${roomId}`, String(teamId));
    } else {
      localStorage.removeItem(`taboo_team_${roomId}`);
    }
    broadcastPresence({
      playerId: playerIdRef.current,
      name: playerNameRef.current,
      teamId,
      joined_at: Date.now(),
    });
  }, [roomId, broadcastPresence]);

  const dispatch = useCallback(
    (action: GameAction) => {
      const s = stateRef.current;

      // Any player can claim the explainer role
      if (typeof action === "object" && action.type === "claim_explainer") {
        if (isHostRef.current) {
          if (s.phase === "claiming") {
            broadcast(applyClaimExplainer(s, action.playerId, action.playerName));
          }
        } else {
          channelRef.current?.send({
            type: "broadcast",
            event: "claim_explainer",
            payload: { playerId: action.playerId, playerName: action.playerName },
          });
        }
        return;
      }

      // Non-host active explainer relays turn actions to host
      if (!isHostRef.current) {
        if (
          isExplainerRef.current &&
          (action === "correct" || action === "skip" || action === "taboo")
        ) {
          channelRef.current?.send({
            type: "broadcast",
            event: "player_action",
            payload: { action, playerId: playerIdRef.current },
          });
        }
        return;
      }

      // Host applies all other actions directly
      if (typeof action === "string") {
        switch (action) {
          case "correct":   return broadcast(recordResult(s, "correct"));
          case "skip":      return broadcast(recordResult(s, "skip"));
          case "taboo":     return broadcast(recordResult(s, "taboo"));
          case "next_turn": return broadcast(nextTurn(s));
          case "end_game":  return broadcast(endGame(s));
          case "reset":     return broadcast(resetGame(s));
        }
      } else if (action.type === "update_lobby_settings") {
        const newState = updateLobbySettings(s, action);
        broadcast(newState);
        // Re-send after a brief delay so non-hosts don't miss it if the first is dropped
        setTimeout(() => {
          channelRef.current?.send({
            type: "broadcast",
            event: "state_update",
            payload: { state: redactStateForBroadcast(stateRef.current) },
          });
        }, 600);
      } else if (action.type === "start_game") {
        let base = s;
        if (action.teamNames) {
          base = {
            ...base,
            teams: action.teamNames.map((name, i) => ({ id: i, name, score: 0 })),
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
      playSound("turn_end");
      broadcast(endTurn(stateRef.current));
      return;
    }
    const timer = setTimeout(() => {
      if (stateRef.current.phase === "playing") {
        playSound("turn_end");
        broadcast(endTurn(stateRef.current));
      }
    }, remaining);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.phase, gameState.turnStartedAt, isHost]);

  useEffect(() => {
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

    const pid = getOrCreatePlayerId();
    playerIdRef.current = pid;

    const pname = localStorage.getItem("taboo_player_name") || "";
    playerNameRef.current = pname;

    const channel = getRoomChannel(roomId);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "state_update" }, ({ payload }) => {
        if (!isHostRef.current) {
          updateState(payload.state as GameState);
        }
      })
      .on("broadcast", { event: "player_action" }, ({ payload }) => {
        if (!isHostRef.current) return;
        const { action, playerId } = payload as { action: "correct" | "skip" | "taboo"; playerId: string };
        if (playerId !== stateRef.current.activeExplainerPlayerId) return;
        broadcast(recordResult(stateRef.current, action));
      })
      .on("broadcast", { event: "claim_explainer" }, ({ payload }) => {
        if (!isHostRef.current) return;
        if (stateRef.current.phase !== "claiming") return;
        const { playerId, playerName } = payload as { playerId: string; playerName: string };
        broadcast(applyClaimExplainer(stateRef.current, playerId, playerName));
      })
      // Immediate presence update from any player (name change or team join/leave)
      .on("broadcast", { event: "presence_update" }, ({ payload }) => {
        const p = payload as PlayerPresence;
        setPlayers((prev) => {
          const filtered = prev.filter((x) => x.playerId !== p.playerId);
          return [...filtered, p];
        });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PlayerPresence>();
        const raw = Object.values(state).flatMap((arr) => arr);
        // Deduplicate by playerId — keep the entry with the highest joined_at
        // (we use Date.now() on every track() call so this always picks the freshest data)
        const byPlayer = new Map<string, PlayerPresence>();
        for (const p of raw) {
          const existing = byPlayer.get(p.playerId);
          if (!existing || p.joined_at > existing.joined_at) {
            byPlayer.set(p.playerId, p);
          }
        }
        const list = [...byPlayer.values()];
        setPlayers(list);
        setPlayerCount(list.length);
        // NOTE: we intentionally do NOT update myTeam from presence here.
        // myTeam is managed locally (joinTeam) and persisted in localStorage.
        // Syncing it from presence caused a race condition where a stale sync
        // would reset the team the player had just chosen.
      })
      .on("presence", { event: "join" }, () => {
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
        // Track presence with fresh timestamp so deduplication always picks the latest entry
        const presenceData: PlayerPresence = {
          playerId: playerIdRef.current,
          name: playerNameRef.current,
          teamId: myTeamRef.current,
          joined_at: Date.now(),
        };
        await channel.track(presenceData);
        // Also broadcast so peers see us immediately without waiting for presence sync
        channel.send({
          type: "broadcast",
          event: "presence_update",
          payload: presenceData,
        });
      } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
        console.log("Supabase will auto-reconnect:", status, err?.message ?? "");
      }
    });

    return () => {
      clearTimeout(timeout);
      channel.unsubscribe();
    };
  }, [roomId, updateState]);

  return {
    gameState,
    isHost,
    isExplainer,
    playerId: playerIdRef.current,
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
  };
}
