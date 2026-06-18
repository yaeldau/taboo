import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold">טאבו</h1>
        <Badge variant="secondary" className="font-mono text-sm">
          חדר: {roomId}
        </Badge>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">ממתין לשחקנים...</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>המשחק עדיין בפיתוח</p>
          <p className="text-sm mt-2">שתף את הקישור כדי להזמין שחקנים</p>
        </CardContent>
      </Card>
    </main>
  );
}
