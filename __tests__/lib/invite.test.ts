import { describe, it, expect, vi } from "vitest";
import { inviteViaNavigator } from "@/lib/invite";

describe("inviteViaNavigator", () => {
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
