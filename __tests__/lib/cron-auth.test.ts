import { describe, it, expect } from "vitest";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

describe("isAuthorizedCronRequest", () => {
  it("authorizes when the header matches 'Bearer <secret>'", () => {
    expect(isAuthorizedCronRequest("Bearer abc123", "abc123")).toBe(true);
  });

  it("rejects a missing authorization header", () => {
    expect(isAuthorizedCronRequest(null, "abc123")).toBe(false);
  });

  it("rejects a mismatched secret", () => {
    expect(isAuthorizedCronRequest("Bearer wrong", "abc123")).toBe(false);
  });

  it("rejects when CRON_SECRET is not configured", () => {
    expect(isAuthorizedCronRequest("Bearer abc123", undefined)).toBe(false);
  });
});
