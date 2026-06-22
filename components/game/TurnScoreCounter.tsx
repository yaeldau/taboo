import { computeTurnStats } from "@/lib/game";
import type { TurnResult } from "@/types/game";

interface Props {
  results: TurnResult[];
}

export function TurnScoreCounter({ results }: Props) {
  const { correct, skip, taboo, net } = computeTurnStats(results);

  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <span className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${correct > 0 ? "text-green-400" : "text-gray-700"}`}>
        <span>✓</span>
        <span>{correct}</span>
      </span>
      <span className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${skip > 0 ? "text-gray-400" : "text-gray-700"}`}>
        <span className="text-xs">⟩⟩</span>
        <span>{skip}</span>
      </span>
      <span className={`flex items-center gap-1.5 text-sm font-bold tabular-nums ${taboo > 0 ? "text-red-400" : "text-gray-700"}`}>
        <span>✕</span>
        <span>{taboo}</span>
      </span>
      {net !== 0 && (
        <span className={`text-sm font-black tabular-nums ${net > 0 ? "text-green-400" : "text-red-400"}`}>
          ({net > 0 ? "+" : ""}{net})
        </span>
      )}
    </div>
  );
}
