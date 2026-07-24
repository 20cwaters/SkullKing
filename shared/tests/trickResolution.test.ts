import { describe, expect, it } from 'vitest';
import { getLedSuit, getLegalCards, resolveTrick, type PlayedCard } from '../src/trickResolution.js';
import type { Card, SuitName } from '../src/types.js';

const suit = (suitName: SuitName, value: number, id?: string): Card => ({
  id: id ?? `${suitName}-${value}`,
  kind: 'suit',
  suit: suitName,
  value,
});
const pirate = (id: string): Card => ({ id, kind: 'pirate' });
const escape = (id: string): Card => ({ id, kind: 'escape' });
const mermaid = (id: string): Card => ({ id, kind: 'mermaid' });
const skullKing = (id = 'skull-king-1'): Card => ({ id, kind: 'skull_king' });

const played = (playerId: string, card: Card): PlayedCard => ({ playerId, card });

describe('getLedSuit', () => {
  it('is the suit of the first card when it is a suit card', () => {
    const trick = [played('p1', suit('parrots', 7)), played('p2', suit('chests', 10))];
    expect(getLedSuit(trick)).toBe('parrots');
  });

  it('is null when the first card is a special card', () => {
    const trick = [played('p1', pirate('pirate-1')), played('p2', suit('chests', 10))];
    expect(getLedSuit(trick)).toBeNull();
  });

  it('is null for an empty trick', () => {
    expect(getLedSuit([])).toBeNull();
  });
});

describe('getLegalCards', () => {
  it('allows anything when no suit is led', () => {
    const hand = [suit('parrots', 3), pirate('pirate-1')];
    expect(getLegalCards(hand, null)).toEqual(hand);
  });

  it('restricts to led suit plus specials when the player holds the led suit', () => {
    const hand = [suit('parrots', 3), suit('chests', 9), pirate('pirate-1'), escape('escape-1')];
    const legal = getLegalCards(hand, 'parrots');
    expect(legal).toEqual([suit('parrots', 3), pirate('pirate-1'), escape('escape-1')]);
  });

  it('allows anything when the player has none of the led suit', () => {
    const hand = [suit('chests', 9), suit('maps', 2)];
    expect(getLegalCards(hand, 'parrots')).toEqual(hand);
  });

  it('always allows special cards regardless of led suit', () => {
    const hand = [pirate('pirate-1'), mermaid('mermaid-1'), skullKing(), escape('escape-1')];
    expect(getLegalCards(hand, 'parrots')).toEqual(hand);
  });
});

describe('resolveTrick', () => {
  it('highest card of the led suit wins a plain trick', () => {
    const trick = [played('p1', suit('parrots', 7)), played('p2', suit('parrots', 12)), played('p3', suit('chests', 14))];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p2');
    expect(result.bonusPoints).toBe(0);
  });

  it('off-suit cards never win even with a higher number', () => {
    const trick = [played('p1', suit('parrots', 2)), played('p2', suit('chests', 14))];
    expect(resolveTrick(trick).winner.playerId).toBe('p1');
  });

  it('trump (jolly roger) beats any led suit card', () => {
    const trick = [played('p1', suit('parrots', 14)), played('p2', suit('jolly_roger', 1))];
    expect(resolveTrick(trick).winner.playerId).toBe('p2');
  });

  it('highest trump wins when multiple trumps are played', () => {
    const trick = [
      played('p1', suit('jolly_roger', 3)),
      played('p2', suit('jolly_roger', 9)),
      played('p3', suit('parrots', 14)),
    ];
    expect(resolveTrick(trick).winner.playerId).toBe('p2');
  });

  it('escape cards always lose to any other card', () => {
    const trick = [played('p1', escape('escape-1')), played('p2', suit('parrots', 1))];
    expect(resolveTrick(trick).winner.playerId).toBe('p2');
  });

  it('first escape wins when the whole trick is escapes', () => {
    const trick = [played('p1', escape('escape-1')), played('p2', escape('escape-2')), played('p3', escape('escape-3'))];
    expect(resolveTrick(trick).winner.playerId).toBe('p1');
  });

  it('a pirate beats numbered cards and trump', () => {
    const trick = [played('p1', suit('jolly_roger', 14)), played('p2', pirate('pirate-1'))];
    expect(resolveTrick(trick).winner.playerId).toBe('p2');
  });

  it('first pirate wins when multiple pirates are played (no skull king)', () => {
    const trick = [played('p1', pirate('pirate-1')), played('p2', pirate('pirate-2'))];
    expect(resolveTrick(trick).winner.playerId).toBe('p1');
  });

  it('a mermaid beats pirates', () => {
    const trick = [played('p1', pirate('pirate-1')), played('p2', mermaid('mermaid-1'))];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p2');
    expect(result.bonusPoints).toBe(0);
  });

  it('the skull king beats numbered cards and trump when no pirate/mermaid is present, earning the base 50pt bonus', () => {
    const trick = [played('p1', suit('parrots', 14)), played('p2', suit('jolly_roger', 14)), played('p3', skullKing())];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p3');
    expect(result.bonusPoints).toBe(50);
  });

  it('a pirate captures the skull king when no mermaid is present, earning 100pts', () => {
    const trick = [played('p1', skullKing()), played('p2', pirate('pirate-1'))];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p2');
    expect(result.bonusPoints).toBe(100);
  });

  it('a mermaid beguiles the skull king even without a pirate present, earning 150pts', () => {
    const trick = [played('p1', skullKing()), played('p2', mermaid('mermaid-1'))];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p2');
    expect(result.bonusPoints).toBe(150);
  });

  it('a mermaid beguiling the skull king overrides a pirate also in the trick', () => {
    const trick = [
      played('p1', skullKing()),
      played('p2', pirate('pirate-1')),
      played('p3', mermaid('mermaid-1')),
    ];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p3');
    expect(result.bonusPoints).toBe(150);
  });

  it('first mermaid wins the beguile when two mermaids are in the trick with the skull king', () => {
    const trick = [
      played('p1', skullKing()),
      played('p2', mermaid('mermaid-1')),
      played('p3', mermaid('mermaid-2')),
    ];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p2');
    expect(result.bonusPoints).toBe(150);
  });

  it('escapes played alongside specials never factor into the winner', () => {
    const trick = [played('p1', escape('escape-1')), played('p2', skullKing()), played('p3', escape('escape-2'))];
    const result = resolveTrick(trick);
    expect(result.winner.playerId).toBe('p2');
    expect(result.bonusPoints).toBe(50);
  });

  it('throws on an empty trick', () => {
    expect(() => resolveTrick([])).toThrow();
  });
});
