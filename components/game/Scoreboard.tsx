import type { GameState } from "@/types/game";

interface Props {
  gameState: GameState;
}

export function Scoreboard({ gameState }: Props) {
  const { teams, activeTeam } = gameState;

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {([0, 1] as const).map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4 text-center transition-all"
          style={
            activeTeam === i
              ? {
                  background: "rgba(230,57,70,0.15)",
                  border: "1.5px solid rgba(230,57,70,0.5)",
                }
              : {
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }
          }
        >
          <div className="text-xs text-gray-400 truncate mb-1">{teams[i].name}</div>
          <div className="text-4xl font-black text-white">{teams[i].score}</div>
          {activeTeam === i && (
            <div className="text-xs mt-1" style={{ color: "#e63946" }}>
              ▶ משחק עכשיו
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
