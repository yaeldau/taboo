"use client";

import { useRouter } from "next/navigation";
import { createRoomId } from "@/lib/room";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  function handleCreateRoom() {
    const roomId = createRoomId();
    sessionStorage.setItem(`isHost_${roomId}`, "true");
    router.push(`/room/${roomId}`);
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
        <p className="text-sm text-gray-500">
          כדי להצטרף — פתח את הקישור שקיבלת
        </p>
      </div>
    </main>
  );
}
