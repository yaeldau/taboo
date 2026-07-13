"use client";

import { useCallback, useState } from "react";
import { inviteViaNavigator } from "@/lib/invite";

// document.execCommand is deprecated but still the only copy mechanism that
// works on insecure (non-HTTPS) origins, where the Clipboard API is absent.
function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {}
  document.body.removeChild(textarea);
  return ok;
}

export function useInvite() {
  const [copied, setCopied] = useState(false);
  // Manual fallback lives in on-page DOM state rather than a browser dialog
  // (window.prompt/alert) — dialogs can be silently blocked by browser
  // policy, so they aren't actually a guaranteed fallback.
  const [manualUrl, setManualUrl] = useState<string | null>(null);

  const invite = useCallback(async () => {
    const url = window.location.href;
    setManualUrl(null);

    // The whole chain is wrapped: merely *accessing* navigator.share or
    // navigator.clipboard can throw in some browsers/Permissions-Policy
    // configs, which previously left the button looking like a no-op.
    try {
      const result = await inviteViaNavigator(url, navigator);
      if (result === "shared") return;

      if (result === "copied" || legacyCopy(url)) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch {}

    setManualUrl(url);
  }, []);

  return { invite, copied, manualUrl };
}
