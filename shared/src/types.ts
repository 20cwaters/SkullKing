export type SuitName = 'parrots' | 'chests' | 'maps' | 'jolly_roger';

export interface SuitCard {
  id: string;
  kind: 'suit';
  suit: SuitName;
  value: number; // 1-14
}

export interface PirateCard {
  id: string;
  kind: 'pirate';
}

export interface EscapeCard {
  id: string;
  kind: 'escape';
}

export interface MermaidCard {
  id: string;
  kind: 'mermaid';
}

export interface SkullKingCard {
  id: string;
  kind: 'skull_king';
}

export type Card = SuitCard | PirateCard | EscapeCard | MermaidCard | SkullKingCard;

export type CardKind = Card['kind'];

// The base 69-card deck only supports a full 10-round game for up to 6 players
// (round 10 deals 10 cards/player; 7+ players would exceed the deck at round 10,
// which is also why the physical box caps the game at 2-6 players).
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const TOTAL_ROUNDS = 10;
