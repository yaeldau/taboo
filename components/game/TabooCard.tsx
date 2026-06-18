import type { Card } from "@/types/game";

interface Props {
  card: Card;
}

export function TabooCard({ card }: Props) {
  return (
    <div
      className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden select-none"
      style={{
        background: "linear-gradient(160deg, #e63946 0%, #b01020 100%)",
        boxShadow:
          "0 24px 64px rgba(230,57,70,0.5), 0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Card header */}
      <div className="px-6 pt-5 pb-2 flex items-center justify-between">
        <span
          className="text-xs font-black tracking-[0.25em] uppercase"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          TABOO
        </span>
        <div
          className="flex gap-1"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          ★★★★★
        </div>
      </div>

      {/* Main word */}
      <div className="px-6 pb-5 text-center">
        <h2
          className="font-black text-white leading-none"
          style={{ fontSize: "clamp(2.5rem, 10vw, 4rem)" }}
        >
          {card.word}
        </h2>
      </div>

      {/* Divider */}
      <div
        className="mx-5 mb-4 h-px"
        style={{ background: "rgba(0,0,0,0.3)" }}
      />

      {/* Forbidden words */}
      <div className="px-5 pb-6 space-y-2">
        {card.forbidden.map((word, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-2 px-4 rounded-xl"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <span
              className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.5)" }}
            >
              ✕
            </span>
            <span className="text-white/90 text-lg font-bold">{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
