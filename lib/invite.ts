export type InviteResult = "shared" | "copied" | "failed";

export interface InviteNavigator {
  share?: (data: { title?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

// Tries Web Share, then Clipboard API. Both are unavailable on insecure
// (non-HTTPS, non-localhost) origins — common when testing over a LAN IP —
// so callers must still handle "failed" with a manual-copy fallback.
export async function inviteViaNavigator(
  url: string,
  nav: InviteNavigator
): Promise<InviteResult> {
  if (nav.share) {
    try {
      await nav.share({ title: "טאבו", url });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "shared";
    }
  }

  if (nav.clipboard) {
    try {
      await nav.clipboard.writeText(url);
      return "copied";
    } catch {}
  }

  return "failed";
}
