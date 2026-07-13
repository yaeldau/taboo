import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { inviteViaNavigator } from "@/lib/invite";

describe("inviteViaNavigator", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns 'shared' when navigator.share succeeds", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const result = await inviteViaNavigator("https://x.test/room/1", { share });
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "טאבו", url: "https://x.test/room/1" });
  });

  it("treats a user-cancelled share sheet as 'shared', not a failure", async () => {
    const abortError = Object.assign(new Error("cancelled"), { name: "AbortError" });
    const share = vi.fn().mockRejectedValue(abortError);
    const result = await inviteViaNavigator("https://x.test/room/1", { share });
    expect(result).toBe("shared");
  });

  it("falls back to clipboard when share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const result = await inviteViaNavigator("https://x.test/room/1", {
      clipboard: { writeText },
    });
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://x.test/room/1");
  });

  it("falls back to clipboard when share fails with a non-abort error", async () => {
    const share = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const result = await inviteViaNavigator("https://x.test/room/1", {
      share,
      clipboard: { writeText },
    });
    expect(result).toBe("copied");
  });

  it("returns 'failed' when neither share nor clipboard is available", async () => {
    const result = await inviteViaNavigator("https://x.test/room/1", {});
    expect(result).toBe("failed");
  });

  it("returns 'failed' when clipboard.writeText throws (e.g. insecure context / denied permission)", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const result = await inviteViaNavigator("https://x.test/room/1", {
      clipboard: { writeText },
    });
    expect(result).toBe("failed");
  });

  it("falls back to 'failed' when clipboard.writeText hangs forever instead of settling", async () => {
    // Reproduces a real, observed browser bug: some environments never
    // resolve or reject navigator.clipboard.writeText — without a timeout
    // this would freeze the whole invite flow with no feedback forever.
    const writeText = vi.fn(() => new Promise<void>(() => {}));
    const resultPromise = inviteViaNavigator("https://x.test/room/1", {
      clipboard: { writeText },
    });
    await vi.advanceTimersByTimeAsync(3000);
    expect(await resultPromise).toBe("failed");
  });

  it("falls through to clipboard when navigator.share hangs forever instead of settling", async () => {
    // Reproduces a real, observed bug in a non-standard browser (Atlas):
    // navigator.share() never resolved or rejected at all, so the flow
    // froze on the very first step before ever reaching the fallback.
    const share = vi.fn(() => new Promise<void>(() => {}));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const resultPromise = inviteViaNavigator("https://x.test/room/1", {
      share,
      clipboard: { writeText },
    });
    await vi.advanceTimersByTimeAsync(8000);
    expect(await resultPromise).toBe("copied");
  });

  it("propagates an error thrown while merely accessing navigator.clipboard, so callers must catch it too", async () => {
    // Some browsers/Permissions-Policy configs throw on property access,
    // not just on invocation — this documents that callers of
    // inviteViaNavigator (useInvite) must wrap the call in try/catch.
    const nav = {
      get clipboard(): never {
        throw new DOMException("Clipboard access is disabled", "SecurityError");
      },
    };
    await expect(inviteViaNavigator("https://x.test/room/1", nav)).rejects.toThrow(
      "Clipboard access is disabled"
    );
  });
});
