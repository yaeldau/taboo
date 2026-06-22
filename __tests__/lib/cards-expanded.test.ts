import { describe, it, expect } from "vitest";
import { getShuffledDeck, totalCards } from "@/lib/cards";

describe("expanded card deck", () => {
  it("has at least 200 cards", () => {
    expect(totalCards()).toBeGreaterThanOrEqual(200);
  });

  it("no card word appears more than once", () => {
    const deck = getShuffledDeck();
    const words = deck.map((c) => c.word);
    const unique = new Set(words);
    expect(unique.size).toBe(words.length);
  });

  it("no card has a forbidden word that matches its own main word", () => {
    const deck = getShuffledDeck();
    const violations: string[] = [];
    for (const card of deck) {
      for (const f of card.forbidden) {
        if (f === card.word) violations.push(card.word);
      }
    }
    expect(violations).toHaveLength(0);
  });

  it("every card has exactly 5 non-empty forbidden words", () => {
    const deck = getShuffledDeck();
    for (const card of deck) {
      expect(card.forbidden).toHaveLength(5);
      for (const f of card.forbidden) {
        expect(f.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("no card has duplicate forbidden words", () => {
    const deck = getShuffledDeck();
    const violations: string[] = [];
    for (const card of deck) {
      const unique = new Set(card.forbidden);
      if (unique.size !== card.forbidden.length) violations.push(card.word);
    }
    expect(violations).toHaveLength(0);
  });
});
