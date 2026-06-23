import { useRouter } from "next/navigation";
import type { GameState } from "@/types/game";
import type { GameAction } from "@/hooks/useGameRoom";
import { Button } from "@/components/ui/button";

interface Props {
  gameState: GameState;
  isHost: boolean;
  dispatch: (action: GameAction) => void;
}

export function GameEnded({ gameState, isHost, dispatch }: Props) {
  const router = useRouter();
  const { teams } = gameState;

  const singleTeam = teams.length === 1;
  const maxScore = Math.max(...teams.map((t) => t.score));
  const topTeams = teams.filter((t) => t.score === maxScore);
  const winner = !singleTeam && topTeams.length === 1 ? topTeams[0] : null;

  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col items-center justify-center h-dvh bg-gradient-to-b from-gray-950 to-gray-900 px-6 py-6 gap-5 overflow-hidden">
      {/* Trophy */}
      <div className="text-6xl animate-bounce">
        {singleTeam ? "🎉" : winner ? "🏆" : "🤝"}
      </div>

      {/* Winner announcement */}
      <div className="text-center space-y-1">
        {singleTeam ? (
          <>
            <p className="text-gray-400 text-base">כל הכבוד!</p>
            <h2
              className="text-4xl font-black text-white"
              style={{ textShadow: "0 0 40px rgba(230,57,70,0.5)" }}
            >
              {teams[0].score} נקודות!
            </h2>
          </>
        ) : winner ? (
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
        {sorted.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between px-5 py-3 rounded-2xl"
            style={
              winner && team.id === winner.id
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
              {winner && team.id === winner.id && (
                <span className="text-lg">🥇</span>
              )}
              {!winner && !singleTeam && <span className="text-lg">🏅</span>}
              <span className="text-white font-bold text-lg">{team.name}</span>
            </div>
            <span className="text-2xl font-black text-white">
              {team.score}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs flex flex-col gap-2">
        {isHost ? (
          <Button
            size="lg"
            onClick={() => dispatch("reset")}
            className="w-full h-12 text-lg font-black rounded-2xl text-white border-0 touch-manipulation"
            style={{
              background: "linear-gradient(135deg, #e63946, #c1121f)",
              boxShadow: "0 8px 24px rgba(230,57,70,0.4)",
            }}
          >
            שחק שוב! 🎮
          </Button>
        ) : (
          <p className="text-center text-gray-600 text-sm">המארח יתחיל משחק חדש</p>
        )}
        <button
          onClick={() => router.push("/")}
          className="w-full py-2.5 rounded-xl text-gray-500 text-sm font-semibold touch-manipulation active:text-gray-300 transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          יציאה לדף הבית
        </button>
      </div>
    </div>
  );
}
