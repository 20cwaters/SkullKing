import type { PlayedCard } from './trickResolution.js';
import { resolveTrick } from './trickResolution.js';

export interface RoundResult {
  playerId: string;
  bid: number;
  tricksWon: number;
  bonusPoints: number;
  roundScore: number;
}

export function isValidBid(bid: number, roundNumber: number): boolean {
  return Number.isInteger(bid) && bid >= 0 && bid <= roundNumber;
}

/**
 * Points for a single player's round, given the bonus points they're entitled to
 * (bonus should already be zeroed out by the caller if their bid wasn't matched).
 */
export function scoreBid(bid: number, tricksWon: number, roundNumber: number, bonusPoints: number): number {
  if (bid === 0) {
    return tricksWon === 0 ? 10 * roundNumber + bonusPoints : -10 * roundNumber;
  }
  if (tricksWon === bid) return 20 * bid + bonusPoints;
  return -10 * Math.abs(bid - tricksWon);
}

/** Sums Skull King capture bonuses per winning player across all tricks played in a round. */
export function computeRoundBonuses(tricks: PlayedCard[][]): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const trick of tricks) {
    const { winner, bonusPoints } = resolveTrick(trick);
    if (bonusPoints > 0) {
      bonuses[winner.playerId] = (bonuses[winner.playerId] ?? 0) + bonusPoints;
    }
  }
  return bonuses;
}

export function scoreRound(
  bids: Record<string, number>,
  tricksWonCounts: Record<string, number>,
  roundNumber: number,
  tricks: PlayedCard[][]
): RoundResult[] {
  const bonuses = computeRoundBonuses(tricks);
  return Object.keys(bids).map((playerId) => {
    const bid = bids[playerId];
    const tricksWon = tricksWonCounts[playerId] ?? 0;
    const matched = bid === tricksWon;
    // Bonus points only count when the player's base bid was matched that round.
    const bonusPoints = matched ? bonuses[playerId] ?? 0 : 0;
    const roundScore = scoreBid(bid, tricksWon, roundNumber, bonusPoints);
    return { playerId, bid, tricksWon, bonusPoints, roundScore };
  });
}
