"use client";

import { useRouter } from "next/navigation";
import { createRoomId } from "@/lib/room";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();

  function handleCreateRoom() {
    const roomId = createRoomId();
    router.push(`/room/${roomId}`);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight">טאבו</h1>
        <p className="text-muted-foreground text-lg">משחק מילים אונליין</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button size="lg" onClick={handleCreateRoom} className="text-lg h-14">
          צור משחק חדש
        </Button>
        <p className="text-sm text-muted-foreground">
          כדי להצטרף למשחק קיים — פתח את הקישור שקיבלת
        </p>
      </div>
    </main>
  );
}
