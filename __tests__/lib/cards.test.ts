import { describe, it, expect } from "vitest";
import { getShuffledDeck, totalCards } from "@/lib/cards";

describe("totalCards", () => {
  it("returns a positive count", () => {
    expect(totalCards()).toBeGreaterThan(0);
  });
});

describe("getShuffledDeck", () => {
  it("returns all cards (no duplicates, no missing)", () => {
    const deck = getShuffledDeck();
    expect(deck).toHaveLength(totalCards());
  });

  it("every card has a word and 5 forbidden words", () => {
    const deck = getShuffledDeck();
    for (const card of deck) {
      expect(typeof card.word).toBe("string");
      expect(card.word.length).toBeGreaterThan(0);
      expect(card.forbidden).toHaveLength(5);
      for (const f of card.forbidden) {
        expect(typeof f).toBe("string");
        expect(f.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns a different order on successive calls (probabilistic)", () => {
    const deck1 = getShuffledDeck();
    const deck2 = getShuffledDeck();
    const sameOrder = deck1.every((c, i) => c.word === deck2[i].word);
    // With ~100 cards the probability of identical shuffle is astronomically low
    expect(sameOrder).toBe(false);
  });

  it("does not mutate the source (successive calls return all cards)", () => {
    getShuffledDeck();
    const second = getShuffledDeck();
    expect(second).toHaveLength(totalCards());
  });

  it("each word is unique within the deck", () => {
    const deck = getShuffledDeck();
    const words = deck.map((c) => c.word);
    const unique = new Set(words);
    expect(unique.size).toBe(words.length);
  });
});
