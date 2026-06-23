import { computeTurnStats } from "@/lib/game";
import type { TurnResult } from "@/types/game";

interface Props {
  results: TurnResult[];
}

export function TurnScoreCounter({ results }: Props) {
  const { correct, skip, taboo, net } = computeTurnStats(results);

  const netLabel = net > 0 ? `+${net}` : String(net);
  const netColor =
    net > 0 ? "#4ade80" : net < 0 ? "#f87171" : "rgba(255,255,255,0.45)";

  return (
    <div className="flex items-center justify-center">
      <div
        className="inline-flex items-center gap-0 rounded-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Net score — clearly labelled */}
        <span className="flex flex-col items-center w-14 flex-shrink-0 py-1">
          <span className="text-[9px] leading-none mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            ניקוד
          </span>
          <span
            className="text-sm font-black tabular-nums transition-colors duration-300"
            style={{ color: netColor }}
          >
            {netLabel}
          </span>
        </span>

        {/* Separator */}
        <span className="w-px h-4 self-center" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* ✓ Correct — fixed width */}
        <span className="w-12 flex items-center justify-center gap-1 py-1.5">
          <span
            className="text-xs transition-colors duration-200"
            style={{ color: correct > 0 ? "#4ade80" : "rgba(255,255,255,0.15)" }}
          >
            ✓
          </span>
          <span
            className="text-sm font-bold tabular-nums transition-colors duration-200"
            style={{ color: correct > 0 ? "#4ade80" : "rgba(255,255,255,0.15)" }}
          >
            {correct}
          </span>
        </span>

        {/* ⟩⟩ Skip — fixed width */}
        <span className="w-12 flex items-center justify-center gap-1 py-1.5">
          <span
            className="text-xs transition-colors duration-200"
            style={{ color: skip > 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)" }}
          >
            ⟩⟩
          </span>
          <span
            className="text-sm font-bold tabular-nums transition-colors duration-200"
            style={{ color: skip > 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)" }}
          >
            {skip}
          </span>
        </span>

        {/* ✕ Taboo — fixed width */}
        <span className="w-12 flex items-center justify-center gap-1 py-1.5">
          <span
            className="text-xs transition-colors duration-200"
            style={{ color: taboo > 0 ? "#f87171" : "rgba(255,255,255,0.15)" }}
          >
            ✕
          </span>
          <span
            className="text-sm font-bold tabular-nums transition-colors duration-200"
            style={{ color: taboo > 0 ? "#f87171" : "rgba(255,255,255,0.15)" }}
          >
            {taboo}
          </span>
        </span>
      </div>
    </div>
  );
}
