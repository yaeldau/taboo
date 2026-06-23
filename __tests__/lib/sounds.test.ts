import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isMuted, setMuted, toggleMute, playSound } from "@/lib/sounds";

// Inject a minimal localStorage mock so tests run in the node environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k in store) delete store[k]; },
};

beforeEach(() => {
  mockLocalStorage.clear();
  vi.stubGlobal("localStorage", mockLocalStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isMuted", () => {
  it("returns false when key is absent", () => {
    expect(isMuted()).toBe(false);
  });

  it("returns true when key is 'true'", () => {
    store["taboo_muted"] = "true";
    expect(isMuted()).toBe(true);
  });

  it("returns false when key is 'false'", () => {
    store["taboo_muted"] = "false";
    expect(isMuted()).toBe(false);
  });
});

describe("setMuted", () => {
  it("stores true", () => {
    setMuted(true);
    expect(store["taboo_muted"]).toBe("true");
  });

  it("stores false", () => {
    setMuted(false);
    expect(store["taboo_muted"]).toBe("false");
  });
});

describe("toggleMute", () => {
  it("toggles from unmuted to muted", () => {
    expect(toggleMute()).toBe(true);
    expect(isMuted()).toBe(true);
  });

  it("toggles from muted back to unmuted", () => {
    setMuted(true);
    expect(toggleMute()).toBe(false);
    expect(isMuted()).toBe(false);
  });

  it("round-trips correctly", () => {
    toggleMute(); // → muted
    toggleMute(); // → unmuted
    expect(isMuted()).toBe(false);
  });
});

describe("playSound", () => {
  it("does not throw when muted", () => {
    setMuted(true);
    expect(() => playSound("correct")).not.toThrow();
    expect(() => playSound("taboo")).not.toThrow();
    expect(() => playSound("skip")).not.toThrow();
  });

  it("does not throw when AudioContext is unavailable (no window)", () => {
    // window is not defined in the node test environment
    expect(() => playSound("correct")).not.toThrow();
    expect(() => playSound("taboo")).not.toThrow();
    expect(() => playSound("skip")).not.toThrow();
    expect(() => playSound("turn_end")).not.toThrow();
  });

  it("does not throw turn_end when muted", () => {
    setMuted(true);
    expect(() => playSound("turn_end")).not.toThrow();
  });
});
