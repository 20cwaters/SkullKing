import { randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import {
  dealRound,
  getLedSuit,
  getLegalCards,
  isValidBid,
  MAX_PLAYERS,
  MIN_PLAYERS,
  resolveTrick,
  scoreRound,
  TOTAL_ROUNDS,
} from '@skull-king/shared';
import type {
  Card,
  ClientToServerEvents,
  GamePhase,
  PlayedCard,
  PrivatePlayerState,
  PublicGameState,
  RoundScoreView,
  ServerToClientEvents,
  SuitName,
} from '@skull-king/shared';
import { chooseBotBid, chooseBotPlay, botThinkDelayMs } from './botAI.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface PlayerRecord {
  id: string;
  name: string;
  isBot: boolean;
  connected: boolean;
  socketId: string | null;
  token: string;
  hand: Card[];
}

const TRICK_RESULT_DELAY_MS = 2000;
const ROUND_END_DELAY_MS = 8000;

const BOT_NAMES = [
  'Bosun Byte',
  'Salty Sam',
  'One-Eyed Ollie',
  'Cutlass Clara',
  'Rum Runner Rex',
  'Barnacle Bill',
  'Powder Monkey Pete',
  'First Mate Fiona',
  'Deadeye Dan',
  'Plank Walker Pip',
];

export class GameRoom {
  readonly code: string;
  hostId: string | null = null;
  maxPlayers: number;
  private io: IoServer;

  private players = new Map<string, PlayerRecord>();
  private playerOrder: string[] = [];

  phase: GamePhase = 'lobby';
  round = 0;
  private dealerIndex = 0;

  private bids = new Map<string, number>();
  private bidsLockedIn = new Set<string>();
  private bidsRevealed = false;

  private currentTrick: PlayedCard[] = [];
  private ledSuit: SuitName | null = null;
  private currentTurnIndex: number | null = null;
  private tricksWonThisRound: Record<string, number> = {};
  private completedTricksThisRound: PlayedCard[][] = [];
  private awaitingTrickAck = false;
  private lastTrickWinnerId: string | null = null;

  private roundHistory: RoundScoreView[][] = [];
  private totalScores: Record<string, number> = {};
  private winnerIds: string[] | null = null;

  private roundEndTimer: NodeJS.Timeout | null = null;
  destroyed = false;
  onEmpty: (() => void) | null = null;
  private emptyTimer: NodeJS.Timeout | null = null;

  constructor(io: IoServer, code: string, maxPlayers: number) {
    this.io = io;
    this.code = code;
    this.maxPlayers = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, maxPlayers));
  }

  private nextBotName(): string {
    const used = new Set([...this.players.values()].map((p) => p.name));
    const available = BOT_NAMES.filter((n) => !used.has(n));
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    return `Bot ${used.size + 1}`;
  }

  addPlayer(name: string): { ok: true; playerId: string; token: string } | { ok: false; error: string } {
    if (this.phase !== 'lobby') return { ok: false, error: 'This game has already started.' };
    if (this.players.size >= this.maxPlayers) return { ok: false, error: 'Room is full.' };
    const trimmed = name.trim().slice(0, 20) || 'Pirate';

    const id = randomUUID();
    const token = randomUUID();
    this.players.set(id, { id, name: trimmed, isBot: false, connected: true, socketId: null, token, hand: [] });
    this.playerOrder.push(id);
    if (!this.hostId) this.hostId = id;
    return { ok: true, playerId: id, token };
  }

  addBot(requesterId: string): { ok: true } | { ok: false; error: string } {
    if (requesterId !== this.hostId) return { ok: false, error: 'Only the host can add bots.' };
    if (this.phase !== 'lobby') return { ok: false, error: 'This game has already started.' };
    if (this.players.size >= this.maxPlayers) return { ok: false, error: 'Room is full.' };
    const id = randomUUID();
    this.players.set(id, {
      id,
      name: this.nextBotName(),
      isBot: true,
      connected: true,
      socketId: null,
      token: randomUUID(),
      hand: [],
    });
    this.playerOrder.push(id);
    this.emitState();
    return { ok: true };
  }

  removeBot(requesterId: string, playerId: string): { ok: true } | { ok: false; error: string } {
    if (requesterId !== this.hostId) return { ok: false, error: 'Only the host can remove bots.' };
    if (this.phase !== 'lobby') return { ok: false, error: 'This game has already started.' };
    const player = this.players.get(playerId);
    if (!player || !player.isBot) return { ok: false, error: 'That bot does not exist.' };
    this.players.delete(playerId);
    this.playerOrder = this.playerOrder.filter((id) => id !== playerId);
    this.emitState();
    return { ok: true };
  }

  attachSocket(playerId: string, token: string, socketId: string): { ok: true } | { ok: false; error: string } {
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found in this room.' };
    if (player.token !== token) return { ok: false, error: 'Invalid session token.' };
    player.connected = true;
    player.socketId = socketId;
    if (this.emptyTimer) {
      clearTimeout(this.emptyTimer);
      this.emptyTimer = null;
    }
    this.emitState();
    return { ok: true };
  }

  leaveRoom(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    if (this.phase === 'lobby') {
      this.players.delete(playerId);
      this.playerOrder = this.playerOrder.filter((id) => id !== playerId);
      if (this.hostId === playerId) {
        this.hostId = this.playerOrder.find((id) => !this.players.get(id)!.isBot) ?? this.playerOrder[0] ?? null;
      }
    } else {
      player.connected = false;
      player.socketId = null;
    }
    this.checkEmpty();
    this.emitState();
    this.scheduleAutoActions();
  }

  markDisconnected(socketId: string): void {
    const player = [...this.players.values()].find((p) => p.socketId === socketId);
    if (!player) return;
    player.connected = false;
    player.socketId = null;
    if (this.phase === 'lobby' && this.hostId === player.id) {
      this.hostId = this.playerOrder.find((id) => id !== player.id && this.players.get(id)!.connected) ?? this.hostId;
    }
    this.checkEmpty();
    this.emitState();
    this.scheduleAutoActions();
  }

  private checkEmpty(): void {
    const anyoneConnected = [...this.players.values()].some((p) => p.connected);
    if (!anyoneConnected && !this.emptyTimer) {
      this.emptyTimer = setTimeout(() => {
        this.destroyed = true;
        this.onEmpty?.();
      }, 10 * 60 * 1000);
    }
  }

  startGame(requesterId: string): { ok: true } | { ok: false; error: string } {
    if (requesterId !== this.hostId) return { ok: false, error: 'Only the host can start the game.' };
    if (this.phase !== 'lobby') return { ok: false, error: 'The game has already started.' };
    if (this.players.size < MIN_PLAYERS) return { ok: false, error: `Need at least ${MIN_PLAYERS} players to start.` };
    if (this.players.size > MAX_PLAYERS) return { ok: false, error: `A table can only seat up to ${MAX_PLAYERS} players.` };

    this.round = 1;
    this.dealerIndex = 0;
    this.totalScores = {};
    for (const id of this.playerOrder) this.totalScores[id] = 0;
    this.roundHistory = [];
    this.beginRound();
    return { ok: true };
  }

  private beginRound(): void {
    const hands = dealRound(this.playerOrder.length, this.round);
    this.playerOrder.forEach((id, i) => {
      this.players.get(id)!.hand = hands[i];
    });
    this.bids.clear();
    this.bidsLockedIn.clear();
    this.bidsRevealed = false;
    this.tricksWonThisRound = {};
    for (const id of this.playerOrder) this.tricksWonThisRound[id] = 0;
    this.completedTricksThisRound = [];
    this.currentTrick = [];
    this.ledSuit = null;
    this.currentTurnIndex = null;
    this.awaitingTrickAck = false;
    this.lastTrickWinnerId = null;
    this.phase = 'bidding';
    this.emitState();
    this.scheduleAutoActions();
  }

  submitBid(playerId: string, bid: number): { ok: true } | { ok: false; error: string } {
    if (this.phase !== 'bidding') return { ok: false, error: 'Not currently bidding.' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };
    if (this.bidsLockedIn.has(playerId)) return { ok: false, error: 'Bid already locked in.' };
    if (!isValidBid(bid, this.round)) return { ok: false, error: `Bid must be between 0 and ${this.round}.` };

    this.bids.set(playerId, bid);
    this.bidsLockedIn.add(playerId);
    this.emitState();

    if (this.bidsLockedIn.size === this.playerOrder.length) {
      this.revealBidsAndStartTrick();
    }
    return { ok: true };
  }

  private revealBidsAndStartTrick(): void {
    this.bidsRevealed = true;
    this.currentTurnIndex = (this.dealerIndex + 1) % this.playerOrder.length;
    this.phase = 'trick';
    this.emitState();
    this.scheduleAutoActions();
  }

  playCard(playerId: string, cardId: string): { ok: true } | { ok: false; error: string } {
    if (this.phase !== 'trick' || this.awaitingTrickAck) return { ok: false, error: 'No card can be played right now.' };
    if (this.currentTurnIndex === null || this.playerOrder[this.currentTurnIndex] !== playerId) {
      return { ok: false, error: "It's not your turn." };
    }
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found.' };

    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) return { ok: false, error: 'That card is not in your hand.' };
    const card = player.hand[cardIdx];

    const legal = getLegalCards(player.hand, this.ledSuit);
    if (!legal.some((c) => c.id === cardId)) return { ok: false, error: 'You must follow suit if you can.' };

    player.hand.splice(cardIdx, 1);
    this.currentTrick.push({ playerId, card });
    this.ledSuit = getLedSuit(this.currentTrick);

    if (this.currentTrick.length === this.playerOrder.length) {
      const result = resolveTrick(this.currentTrick);
      this.completedTricksThisRound.push([...this.currentTrick]);
      this.tricksWonThisRound[result.winner.playerId] = (this.tricksWonThisRound[result.winner.playerId] ?? 0) + 1;
      this.awaitingTrickAck = true;
      this.lastTrickWinnerId = result.winner.playerId;
      this.emitState();
      setTimeout(() => this.advanceAfterTrick(), TRICK_RESULT_DELAY_MS);
    } else {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playerOrder.length;
      this.emitState();
      this.scheduleAutoActions();
    }
    return { ok: true };
  }

  private advanceAfterTrick(): void {
    if (this.destroyed) return;
    this.awaitingTrickAck = false;
    this.currentTrick = [];
    this.ledSuit = null;
    const winnerId = this.lastTrickWinnerId!;
    this.currentTurnIndex = this.playerOrder.indexOf(winnerId);

    if (this.completedTricksThisRound.length === this.round) {
      this.finishRound();
    } else {
      this.emitState();
      this.scheduleAutoActions();
    }
  }

  private finishRound(): void {
    const bidsRecord: Record<string, number> = Object.fromEntries(this.bids);
    const results = scoreRound(bidsRecord, this.tricksWonThisRound, this.round, this.completedTricksThisRound);
    const roundView: RoundScoreView[] = results.map((r) => {
      this.totalScores[r.playerId] = (this.totalScores[r.playerId] ?? 0) + r.roundScore;
      return { ...r, totalScoreAfter: this.totalScores[r.playerId] };
    });
    this.roundHistory.push(roundView);
    this.phase = 'round_end';
    this.emitState();
    this.roundEndTimer = setTimeout(() => {
      this.roundEndTimer = null;
      this.startNextRoundOrEnd();
    }, ROUND_END_DELAY_MS);
  }

  /** Lets any player skip the between-round wait once everyone's seen the scoreboard. */
  continueRound(): { ok: true } | { ok: false; error: string } {
    if (this.phase !== 'round_end' || !this.roundEndTimer) return { ok: false, error: 'Nothing to continue right now.' };
    clearTimeout(this.roundEndTimer);
    this.roundEndTimer = null;
    this.startNextRoundOrEnd();
    return { ok: true };
  }

  private startNextRoundOrEnd(): void {
    if (this.destroyed) return;
    if (this.round >= TOTAL_ROUNDS) {
      this.phase = 'game_end';
      const max = Math.max(...this.playerOrder.map((id) => this.totalScores[id] ?? 0));
      this.winnerIds = this.playerOrder.filter((id) => (this.totalScores[id] ?? 0) === max);
      this.emitState();
    } else {
      this.round += 1;
      this.dealerIndex = (this.dealerIndex + 1) % this.playerOrder.length;
      this.beginRound();
    }
  }

  private scheduleAutoActions(): void {
    if (this.destroyed) return;

    if (this.phase === 'bidding') {
      for (const id of this.playerOrder) {
        const player = this.players.get(id)!;
        if (this.bidsLockedIn.has(id)) continue;
        if (!player.isBot && player.connected) continue;
        setTimeout(() => {
          if (this.destroyed || this.phase !== 'bidding' || this.bidsLockedIn.has(id)) return;
          const bid = chooseBotBid(player.hand, this.round, this.playerOrder.length);
          this.submitBid(id, bid);
        }, botThinkDelayMs());
      }
      return;
    }

    if (this.phase === 'trick' && !this.awaitingTrickAck && this.currentTurnIndex !== null) {
      const playerId = this.playerOrder[this.currentTurnIndex];
      const player = this.players.get(playerId)!;
      if (player.isBot || !player.connected) {
        setTimeout(() => {
          if (this.destroyed || this.phase !== 'trick' || this.awaitingTrickAck) return;
          if (this.currentTurnIndex === null || this.playerOrder[this.currentTurnIndex] !== playerId) return;
          const card = chooseBotPlay(playerId, {
            hand: player.hand,
            ledSuit: this.ledSuit,
            currentTrick: this.currentTrick,
            myBid: this.bids.get(playerId) ?? 0,
            myTricksWonSoFar: this.tricksWonThisRound[playerId] ?? 0,
            roundNumber: this.round,
          });
          this.playCard(playerId, card.id);
        }, botThinkDelayMs());
      }
    }
  }

  private toPublicState(): PublicGameState {
    return {
      roomCode: this.code,
      phase: this.phase,
      round: this.round,
      totalRounds: TOTAL_ROUNDS,
      dealerId: this.round > 0 ? this.playerOrder[this.dealerIndex] ?? null : null,
      hostId: this.hostId ?? '',
      maxPlayers: this.maxPlayers,
      minPlayers: MIN_PLAYERS,
      players: this.playerOrder.map((id) => {
        const p = this.players.get(id)!;
        return {
          id: p.id,
          name: p.name,
          isBot: p.isBot,
          connected: p.connected,
          isHost: p.id === this.hostId,
          hasBid: this.bidsLockedIn.has(p.id),
        };
      }),
      bidsRevealed: this.bidsRevealed,
      revealedBids: this.bidsRevealed ? Object.fromEntries(this.bids) : null,
      ledSuit: this.ledSuit,
      currentTrick: this.currentTrick,
      currentTurnPlayerId: this.currentTurnIndex !== null ? this.playerOrder[this.currentTurnIndex] : null,
      tricksWonThisRound: this.tricksWonThisRound,
      completedTrickCountThisRound: this.completedTricksThisRound.length,
      awaitingTrickAck: this.awaitingTrickAck,
      lastTrickWinnerId: this.lastTrickWinnerId,
      roundHistory: this.roundHistory,
      totalScores: this.totalScores,
      winnerIds: this.winnerIds,
    };
  }

  private toPrivateState(playerId: string): PrivatePlayerState {
    const player = this.players.get(playerId)!;
    const isMyTurn =
      this.phase === 'trick' &&
      !this.awaitingTrickAck &&
      this.currentTurnIndex !== null &&
      this.playerOrder[this.currentTurnIndex] === playerId;
    return {
      playerId,
      hand: player.hand,
      legalCardIds: isMyTurn ? getLegalCards(player.hand, this.ledSuit).map((c) => c.id) : null,
      myBid: this.bids.get(playerId) ?? null,
    };
  }

  emitState(): void {
    if (this.destroyed) return;
    const publicState = this.toPublicState();
    this.io.to(this.code).emit('state_update', publicState);
    for (const player of this.players.values()) {
      if (player.connected && player.socketId) {
        this.io.to(player.socketId).emit('private_state', this.toPrivateState(player.id));
      }
    }
  }

}
