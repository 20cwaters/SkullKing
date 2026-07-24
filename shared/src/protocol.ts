import type { Card, SuitName } from './types.js';

export interface PublicPlayer {
  id: string;
  name: string;
  isBot: boolean;
  connected: boolean;
  isHost: boolean;
  hasBid: boolean; // true once locked in for the current round, without revealing the value
}

export type GamePhase = 'lobby' | 'bidding' | 'trick' | 'round_end' | 'game_end';

export interface TrickCardView {
  playerId: string;
  card: Card;
}

export interface RoundScoreView {
  playerId: string;
  bid: number;
  tricksWon: number;
  bonusPoints: number;
  roundScore: number;
  totalScoreAfter: number;
}

export interface PublicGameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  dealerId: string | null;
  hostId: string;
  maxPlayers: number;
  minPlayers: number;
  players: PublicPlayer[];

  bidsRevealed: boolean;
  revealedBids: Record<string, number> | null;

  ledSuit: SuitName | null;
  currentTrick: TrickCardView[];
  currentTurnPlayerId: string | null;
  tricksWonThisRound: Record<string, number>;
  completedTrickCountThisRound: number;
  awaitingTrickAck: boolean;
  lastTrickWinnerId: string | null;

  roundHistory: RoundScoreView[][];
  totalScores: Record<string, number>;
  winnerIds: string[] | null;
}

export interface PrivatePlayerState {
  playerId: string;
  hand: Card[];
  legalCardIds: string[] | null; // null unless it's currently this player's turn to play
  myBid: number | null;
}

export interface AckOk {
  ok: true;
}
export interface AckErr {
  ok: false;
  error: string;
}
export type Ack = AckOk | AckErr;

export interface CreateRoomAck extends AckOk {
  roomCode: string;
  playerId: string;
  token: string;
}
export interface JoinRoomAck extends AckOk {
  playerId: string;
  token: string;
}

export interface ClientToServerEvents {
  create_room: (
    payload: { playerName: string; maxPlayers: number },
    ack: (res: CreateRoomAck | AckErr) => void
  ) => void;
  join_room: (payload: { roomCode: string; playerName: string }, ack: (res: JoinRoomAck | AckErr) => void) => void;
  rejoin_room: (payload: { roomCode: string; playerId: string; token: string }, ack: (res: Ack) => void) => void;
  add_bot: (payload: { roomCode: string }, ack: (res: Ack) => void) => void;
  remove_bot: (payload: { roomCode: string; playerId: string }, ack: (res: Ack) => void) => void;
  start_game: (payload: { roomCode: string }, ack: (res: Ack) => void) => void;
  submit_bid: (payload: { roomCode: string; bid: number }, ack: (res: Ack) => void) => void;
  play_card: (payload: { roomCode: string; cardId: string }, ack: (res: Ack) => void) => void;
  continue_round: (payload: { roomCode: string }, ack: (res: Ack) => void) => void;
  leave_room: (payload: { roomCode: string }) => void;
}

export interface ServerToClientEvents {
  state_update: (state: PublicGameState) => void;
  private_state: (state: PrivatePlayerState) => void;
}
