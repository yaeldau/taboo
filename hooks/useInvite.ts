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

  const invite = useCallback(async () => {
    const url = window.location.href;
    const result = await inviteViaNavigator(url, navigator);

    if (result === "shared") return;

    if (result === "copied" || legacyCopy(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    // Last resort so the button is never a silent no-op: the browser's own
    // prompt dialog lets the user select and copy the link manually.
    window.prompt("העתק את הקישור להזמנה:", url);
  }, []);

  return { invite, copied };
}
