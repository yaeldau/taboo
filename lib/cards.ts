import rawCards from "@/data/cards.json";
import type { Card } from "@/types/game";

const cards = rawCards as Card[];

export function getShuffledDeck(): Card[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function getCardByIndex(index: number): Card {
  return cards[index % cards.length];
}

export function totalCards(): number {
  return cards.length;
}
