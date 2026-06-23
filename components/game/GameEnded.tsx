import type { GameState } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/button";

interface Props {
  gameState: GameState;
  isHost: boolean;
  dispatch: (action: GameAction) => void;
}

export function GameEnded({ gameState, isHost, dispatch }: Props) {
  const { teams } = gameState;

  const winner =
    teams[0].score > teams[1].score
      ? teams[0]
      : teams[1].score > teams[0].score
      ? teams[1]
      : null;

  const sortedIndices = ([0, 1] as Array<0 | 1>).sort(
    (a, b) => teams[b].score - teams[a].score
  );

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-gradient-to-b from-gray-950 to-gray-900 px-6 py-6 gap-5 overflow-hidden">
      {/* Trophy */}
      <div className="text-6xl animate-bounce">{winner ? "🏆" : "🤝"}</div>

      {/* Winner announcement */}
      <div className="text-center space-y-1">
        {winner ? (
          <>
            <p className="text-gray-400 text-base">המנצחים הם...</p>
            <h2
              className="text-4xl font-black text-white"
              style={{ textShadow: "0 0 40px rgba(230,57,70,0.5)" }}
            >
              {winner.name}!
            </h2>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-base">וואו, זה...</p>
            <h2 className="text-4xl font-black text-white">תיקו!</h2>
          </>
        )}
      </div>

      {/* Final scores */}
      <div className="w-full max-w-xs space-y-2">
        {sortedIndices.map((i) => (
          <div
            key={i}
            className="flex items-center justify-between px-5 py-3 rounded-2xl"
            style={
              winner && teams[i].id === winner.id
                ? {
                    background: "rgba(230,57,70,0.15)",
                    border: "1.5px solid rgba(230,57,70,0.4)",
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            <div className="flex items-center gap-3">
              {winner && teams[i].id === winner.id && (
                <span className="text-lg">🥇</span>
              )}
              {!winner && <span className="text-lg">🏅</span>}
              <span className="text-white font-bold text-lg">{teams[i].name}</span>
            </div>
            <span className="text-2xl font-black text-white">
              {teams[i].score}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {isHost ? (
        <Button
          size="lg"
          onClick={() => dispatch("reset")}
          className="w-full max-w-xs h-12 text-lg font-black rounded-2xl text-white border-0 touch-manipulation"
          style={{
            background: "linear-gradient(135deg, #e63946, #c1121f)",
            boxShadow: "0 8px 24px rgba(230,57,70,0.4)",
          }}
        >
          שחק שוב! 🎮
        </Button>
      ) : (
        <p className="text-gray-600 text-sm">המארח יתחיל משחק חדש</p>
      )}
    </div>
  );
}
