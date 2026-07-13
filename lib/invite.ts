export type InviteResult = "shared" | "copied" | "failed";

export interface InviteNavigator {
  share?: (data: { title?: string; url?: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

// Some browsers (managed-policy Chrome, Brave's fingerprinting shield, etc.)
// silently hang navigator.clipboard.writeText forever instead of rejecting
// it, which would freeze the whole invite flow with zero feedback. Race it
// against a timeout so a broken clipboard can never block the fallback.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
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
      // No timeout here: the share sheet is a real user interaction and can
      // legitimately stay open for a while (e.g. composing a message).
      await nav.share({ title: "טאבו", url });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "shared";
    }
  }

  if (nav.clipboard) {
    try {
      await withTimeout(nav.clipboard.writeText(url), 2500);
      return "copied";
    } catch {}
  }

  return "failed";
}
