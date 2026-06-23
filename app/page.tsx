"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoomId } from "@/lib/room";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleCreateRoom() {
    const roomId = createRoomId();
    localStorage.setItem(`isHost_${roomId}`, "true");
    router.push(`/room/${roomId}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const roomId = code.trim().toLowerCase();
    if (roomId.length === 6) router.push(`/room/${roomId}`);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-10 px-6 text-center bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Logo */}
      <div className="space-y-3">
        <h1
          className="text-8xl font-black tracking-tight select-none"
          style={{
            color: "#e63946",
            textShadow: "0 0 60px rgba(230,57,70,0.5), 0 0 120px rgba(230,57,70,0.2)",
          }}
        >
          טאבו
        </h1>
        <p className="text-gray-400 text-xl">משחק מילים אונליין</p>
      </div>

      <div className="flex flex-col gap-5 w-full max-w-xs">
        <Button
          size="lg"
          onClick={handleCreateRoom}
          className="h-16 text-xl font-black rounded-2xl text-white border-0 touch-manipulation"
          style={{
            background: "linear-gradient(135deg, #e63946, #c1121f)",
            boxShadow: "0 8px 32px rgba(230,57,70,0.5)",
          }}
        >
          צור משחק חדש
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-sm">או</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 6))}
            placeholder="קוד חדר"
            dir="ltr"
            className="w-full text-center text-2xl font-mono font-black tracking-[0.25em] py-3 px-4 rounded-2xl text-white outline-none transition-colors uppercase"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
            onFocus={(e) => (e.target.style.border = "1px solid rgba(230,57,70,0.6)")}
            onBlur={(e) => (e.target.style.border = "1px solid rgba(255,255,255,0.15)")}
          />
          <Button
            type="submit"
            size="lg"
            disabled={code.trim().length !== 6}
            className="h-14 text-lg font-black rounded-2xl text-white border-0 touch-manipulation disabled:opacity-40"
            style={{
              background: "rgba(255,255,255,0.1)",
            }}
          >
            הצטרף למשחק
          </Button>
        </form>
      </div>
    </main>
  );
}
