import { describe, expect, it } from 'vitest';
import { computeRoundBonuses, isValidBid, scoreBid, scoreRound } from '../src/scoring.js';
import type { PlayedCard } from '../src/trickResolution.js';
import type { Card } from '../src/types.js';

const suitCard = (value: number): Card => ({ id: `parrots-${value}`, kind: 'suit', suit: 'parrots', value });
const pirate = (id: string): Card => ({ id, kind: 'pirate' });
const mermaid = (id: string): Card => ({ id, kind: 'mermaid' });
const skullKing = (): Card => ({ id: 'skull-king-1', kind: 'skull_king' });
const played = (playerId: string, card: Card): PlayedCard => ({ playerId, card });

describe('isValidBid', () => {
  it('accepts integers from 0 to the round number', () => {
    expect(isValidBid(0, 5)).toBe(true);
    expect(isValidBid(5, 5)).toBe(true);
    expect(isValidBid(3, 5)).toBe(true);
  });

  it('rejects out-of-range or non-integer bids', () => {
    expect(isValidBid(-1, 5)).toBe(false);
    expect(isValidBid(6, 5)).toBe(false);
    expect(isValidBid(2.5, 5)).toBe(false);
  });
});

describe('scoreBid', () => {
  it('awards 20 points per trick for a matched bid > 0', () => {
    expect(scoreBid(3, 3, 5, 0)).toBe(60);
  });

  it('adds bonus points on top of a matched non-zero bid', () => {
    expect(scoreBid(3, 3, 5, 50)).toBe(110);
  });

  it('awards 10 x round number for a matched zero bid', () => {
    expect(scoreBid(0, 0, 7, 0)).toBe(70);
  });

  it('penalizes 10 points per trick of difference on a missed bid', () => {
    expect(scoreBid(3, 5, 5, 0)).toBe(-20);
    expect(scoreBid(5, 2, 5, 0)).toBe(-30);
  });

  it('penalizes 10 x round number when a zero bid is missed', () => {
    expect(scoreBid(0, 1, 7, 0)).toBe(-70);
  });
});

describe('computeRoundBonuses', () => {
  it('sums bonuses per winning player across tricks', () => {
    const tricks: PlayedCard[][] = [
      [played('p1', skullKing()), played('p2', pirate('pirate-1'))], // p2 wins, +100
      [played('p1', suitCard(3)), played('p2', suitCard(9))], // no bonus
      [played('p2', mermaid('mermaid-1')), played('p3', pirate('pirate-2'))], // p2 wins vs pirate, no SK -> 0 bonus
    ];
    expect(computeRoundBonuses(tricks)).toEqual({ p2: 100 });
  });
});

describe('scoreRound', () => {
  it('grants bonus points to a player whose bid was matched', () => {
    const tricks: PlayedCard[][] = [[played('p1', skullKing()), played('p2', pirate('pirate-1'))]];
    const results = scoreRound({ p1: 0, p2: 1 }, { p1: 0, p2: 1 }, 3, tricks);
    const p2Result = results.find((r) => r.playerId === 'p2')!;
    expect(p2Result.bonusPoints).toBe(100);
    expect(p2Result.roundScore).toBe(20 * 1 + 100);
  });

  it('forfeits bonus points when the winning bonus-earner missed their bid', () => {
    const tricks: PlayedCard[][] = [[played('p1', skullKing()), played('p2', pirate('pirate-1'))]];
    const results = scoreRound({ p1: 0, p2: 0 }, { p1: 0, p2: 1 }, 3, tricks);
    const p2Result = results.find((r) => r.playerId === 'p2')!;
    expect(p2Result.bonusPoints).toBe(0);
    expect(p2Result.roundScore).toBe(-30); // 0 bid missed at round 3 => -10*3
  });
});
