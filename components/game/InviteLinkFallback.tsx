interface Props {
  url: string;
}

// Shown when Web Share, Clipboard, and legacy execCommand copy all fail —
// a plain on-page input the user can manually select and copy, since it
// can't be silently blocked the way a browser dialog can.
export function InviteLinkFallback({ url }: Props) {
  return (
    <div
      className="flex-shrink-0 rounded-xl p-2"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <p className="text-gray-400 text-[10px] text-center mb-1">
        ההעתקה האוטומטית לא זמינה — העתק ידנית:
      </p>
      <input
        readOnly
        dir="ltr"
        value={url}
        onFocus={(e) => e.target.select()}
        className="w-full text-center text-xs rounded-lg py-1.5 px-2 text-white outline-none"
        style={{ background: "rgba(0,0,0,0.3)" }}
      />
    </div>
  );
}
