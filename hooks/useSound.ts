"use client";

import { useState, useCallback } from "react";
import { isMuted, toggleMute as doToggle } from "@/lib/sounds";

export function useSound() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isMuted();
  });

  const toggleMute = useCallback(() => {
    const next = doToggle();
    setMutedState(next);
  }, []);

  return { muted, toggleMute };
}
