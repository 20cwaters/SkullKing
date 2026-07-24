import { describe, expect, it } from 'vitest';
import { buildDeck, dealRound, shuffleDeck } from '../src/deck.js';

describe('buildDeck', () => {
  it('has 69 cards total', () => {
    expect(buildDeck()).toHaveLength(69);
  });

  it('has correct counts per kind', () => {
    const deck = buildDeck();
    const suitCards = deck.filter((c) => c.kind === 'suit');
    const pirates = deck.filter((c) => c.kind === 'pirate');
    const escapes = deck.filter((c) => c.kind === 'escape');
    const mermaids = deck.filter((c) => c.kind === 'mermaid');
    const skullKings = deck.filter((c) => c.kind === 'skull_king');

    expect(suitCards).toHaveLength(56);
    expect(pirates).toHaveLength(5);
    expect(escapes).toHaveLength(5);
    expect(mermaids).toHaveLength(2);
    expect(skullKings).toHaveLength(1);
  });

  it('has 14 cards numbered 1-14 for each of the 4 suits', () => {
    const deck = buildDeck();
    for (const suit of ['parrots', 'chests', 'maps', 'jolly_roger'] as const) {
      const cards = deck.filter((c) => c.kind === 'suit' && c.suit === suit);
      expect(cards).toHaveLength(14);
      const values = cards.map((c) => (c.kind === 'suit' ? c.value : -1)).sort((a, b) => a - b);
      expect(values).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    }
  });

  it('has all unique ids', () => {
    const deck = buildDeck();
    expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
  });
});

describe('shuffleDeck', () => {
  it('preserves all elements', () => {
    const deck = buildDeck();
    const shuffled = shuffleDeck(deck, () => 0.5);
    expect(shuffled).toHaveLength(deck.length);
    expect(new Set(shuffled.map((c) => c.id))).toEqual(new Set(deck.map((c) => c.id)));
  });

  it('does not mutate the input array', () => {
    const deck = buildDeck();
    const copy = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(copy);
  });
});

describe('dealRound', () => {
  it('deals roundNumber cards to each player', () => {
    const hands = dealRound(4, 5);
    expect(hands).toHaveLength(4);
    for (const hand of hands) {
      expect(hand).toHaveLength(5);
    }
  });

  it('deals no duplicate cards across hands', () => {
    const hands = dealRound(6, 10);
    const allIds = hands.flat().map((c) => c.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds).toHaveLength(60);
  });

  it('supports the max supported table (6 players) through round 10', () => {
    expect(() => dealRound(6, 10)).not.toThrow();
  });

  it('throws when the deck cannot cover the deal', () => {
    // 7 players * 10 cards = 70 > 69-card deck
    expect(() => dealRound(7, 10)).toThrow();
  });
});
