"use client";

import { useRouter } from "next/navigation";
import type { GameAction } from "@/hooks/useGameRoom";

interface Props {
  isHost: boolean;
  dispatch: (action: GameAction) => void;
}

export function ExitButton({ isHost, dispatch }: Props) {
  const router = useRouter();

  function handleExit() {
    if (isHost) {
      dispatch("end_game");
    } else {
      router.push("/");
    }
  }

  return (
    <button
      onClick={handleExit}
      className="flex items-center gap-1 text-gray-600 text-sm py-1 px-3 rounded-xl touch-manipulation active:text-gray-300 transition-colors"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      aria-label="יציאה מהמשחק"
    >
      ✕
    </button>
  );
}
