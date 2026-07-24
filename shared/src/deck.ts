import type { Card, SuitName } from './types.js';

export const SUITS: SuitName[] = ['parrots', 'chests', 'maps', 'jolly_roger'];

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 14; value++) {
      deck.push({ id: `${suit}-${value}`, kind: 'suit', suit, value });
    }
  }
  for (let i = 1; i <= 5; i++) deck.push({ id: `pirate-${i}`, kind: 'pirate' });
  for (let i = 1; i <= 5; i++) deck.push({ id: `escape-${i}`, kind: 'escape' });
  for (let i = 1; i <= 2; i++) deck.push({ id: `mermaid-${i}`, kind: 'mermaid' });
  deck.push({ id: 'skull-king-1', kind: 'skull_king' });
  return deck;
}

export function shuffleDeck<T>(cards: T[], rng: () => number = Math.random): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Deals `roundNumber` cards to each of `numPlayers` players from a freshly shuffled deck. */
export function dealRound(numPlayers: number, roundNumber: number, rng?: () => number): Card[][] {
  const needed = numPlayers * roundNumber;
  const deck = shuffleDeck(buildDeck(), rng);
  if (needed > deck.length) {
    throw new Error(
      `Cannot deal round ${roundNumber} to ${numPlayers} players: needs ${needed} cards, deck only has ${deck.length}`
    );
  }
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  for (let i = 0; i < needed; i++) {
    hands[i % numPlayers].push(deck[i]);
  }
  return hands;
}
