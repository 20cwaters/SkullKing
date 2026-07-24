import { getLegalCards, resolveTrick } from '@skull-king/shared';
import type { Card, PlayedCard, SuitName } from '@skull-king/shared';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function perCardWinProbability(card: Card, competitionFactor: number): number {
  switch (card.kind) {
    case 'skull_king':
      return 0.88;
    case 'pirate':
      return 0.65 * clamp(competitionFactor + 0.3, 0.55, 1);
    case 'mermaid':
      return 0.5 * clamp(competitionFactor + 0.3, 0.55, 1);
    case 'escape':
      return 0;
    case 'suit':
      if (card.suit === 'jolly_roger') {
        return (0.3 + 0.55 * (card.value / 14)) * competitionFactor;
      }
      return (0.12 + 0.35 * (card.value / 14) ** 2) * competitionFactor;
  }
}

/** Estimates a reasonable bid from hand strength: sum of per-card win probabilities, with a little variety. */
export function chooseBotBid(hand: Card[], roundNumber: number, numPlayers: number): number {
  if (roundNumber === 0) return 0;
  const competitionFactor = clamp(4 / (numPlayers + 2), 0.5, 1.15);
  const rawEstimate = hand.reduce((sum, card) => sum + perCardWinProbability(card, competitionFactor), 0);
  const jitter = (Math.random() - 0.5) * 0.8;
  return clamp(Math.round(rawEstimate + jitter), 0, roundNumber);
}

/** Lower cost = more disposable when dumping; also the preferred pick among cards that all win a trick. */
function cardCost(card: Card): number {
  switch (card.kind) {
    case 'escape':
      return -1;
    case 'suit':
      return card.suit === 'jolly_roger' ? 20 + card.value : card.value;
    case 'pirate':
      return 40;
    case 'mermaid':
      return 45;
    case 'skull_king':
      return 50;
  }
}

export interface BotPlayContext {
  hand: Card[];
  ledSuit: SuitName | null;
  currentTrick: PlayedCard[];
  myBid: number;
  myTricksWonSoFar: number;
  roundNumber: number;
}

export function chooseBotPlay(botPlayerId: string, ctx: BotPlayContext): Card {
  const legal = getLegalCards(ctx.hand, ctx.ledSuit);
  if (legal.length === 1) return legal[0];

  const tricksNeeded = ctx.myBid - ctx.myTricksWonSoFar;
  const wantsToWin = tricksNeeded > 0;
  const isLeading = ctx.currentTrick.length === 0;

  const byCostAsc = (a: Card, b: Card) => cardCost(a) - cardCost(b);

  if (isLeading) {
    const sorted = [...legal].sort(byCostAsc);
    return wantsToWin ? sorted[sorted.length - 1] : sorted[0];
  }

  const wouldWin = (card: Card): boolean => {
    const simulated: PlayedCard[] = [...ctx.currentTrick, { playerId: botPlayerId, card }];
    return resolveTrick(simulated).winner.playerId === botPlayerId;
  };

  const winners = legal.filter(wouldWin).sort(byCostAsc);
  const nonWinners = legal.filter((c) => !wouldWin(c)).sort(byCostAsc);

  if (wantsToWin) {
    if (winners.length > 0) return winners[0]; // cheapest card that still wins, saves strong cards
    return nonWinners.length > 0 ? nonWinners[0] : legal.sort(byCostAsc)[0]; // can't win this one, dump cheaply
  }

  // Trying to avoid winning: prefer a card that loses; if forced to win, take the cheapest winner.
  if (nonWinners.length > 0) return nonWinners[0];
  return winners[0];
}

/** Small randomized delay so bot actions are watchable rather than instantaneous. */
export function botThinkDelayMs(): number {
  return 700 + Math.floor(Math.random() * 900);
}
