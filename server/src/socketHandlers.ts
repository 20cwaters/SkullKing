import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@skull-king/shared';
import type { RoomManager } from './RoomManager.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;
type IoSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface SocketMeta {
  roomCode: string;
  playerId: string;
}

export function registerSocketHandlers(io: IoServer, roomManager: RoomManager): void {
  const socketMeta = new Map<string, SocketMeta>();

  io.on('connection', (socket: IoSocket) => {
    const getContext = (roomCode: string) => {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.roomCode !== roomCode.toUpperCase()) return null;
      const room = roomManager.getRoom(roomCode);
      if (!room) return null;
      return { room, playerId: meta.playerId };
    };

    socket.on('create_room', ({ playerName, maxPlayers }, ack) => {
      if (!playerName || typeof playerName !== 'string') return ack({ ok: false, error: 'Name is required.' });
      const room = roomManager.createRoom(maxPlayers);
      const result = room.addPlayer(playerName);
      if (!result.ok) return ack(result);
      socket.join(room.code);
      socketMeta.set(socket.id, { roomCode: room.code, playerId: result.playerId });
      room.attachSocket(result.playerId, result.token, socket.id);
      ack({ ok: true, roomCode: room.code, playerId: result.playerId, token: result.token });
    });

    socket.on('join_room', ({ roomCode, playerName }, ack) => {
      if (!playerName || typeof playerName !== 'string') return ack({ ok: false, error: 'Name is required.' });
      const room = roomManager.getRoom(roomCode ?? '');
      if (!room) return ack({ ok: false, error: 'Room not found.' });
      const result = room.addPlayer(playerName);
      if (!result.ok) return ack(result);
      socket.join(room.code);
      socketMeta.set(socket.id, { roomCode: room.code, playerId: result.playerId });
      room.attachSocket(result.playerId, result.token, socket.id);
      ack({ ok: true, playerId: result.playerId, token: result.token });
    });

    socket.on('rejoin_room', ({ roomCode, playerId, token }, ack) => {
      const room = roomManager.getRoom(roomCode ?? '');
      if (!room) return ack({ ok: false, error: 'Room not found.' });
      const result = room.attachSocket(playerId, token, socket.id);
      if (!result.ok) return ack(result);
      socket.join(room.code);
      socketMeta.set(socket.id, { roomCode: room.code, playerId });
      ack({ ok: true });
    });

    socket.on('add_bot', ({ roomCode }, ack) => {
      const ctx = getContext(roomCode);
      if (!ctx) return ack({ ok: false, error: 'Not in this room.' });
      ack(ctx.room.addBot(ctx.playerId));
    });

    socket.on('remove_bot', ({ roomCode, playerId }, ack) => {
      const ctx = getContext(roomCode);
      if (!ctx) return ack({ ok: false, error: 'Not in this room.' });
      ack(ctx.room.removeBot(ctx.playerId, playerId));
    });

    socket.on('start_game', ({ roomCode }, ack) => {
      const ctx = getContext(roomCode);
      if (!ctx) return ack({ ok: false, error: 'Not in this room.' });
      ack(ctx.room.startGame(ctx.playerId));
    });

    socket.on('submit_bid', ({ roomCode, bid }, ack) => {
      const ctx = getContext(roomCode);
      if (!ctx) return ack({ ok: false, error: 'Not in this room.' });
      ack(ctx.room.submitBid(ctx.playerId, bid));
    });

    socket.on('play_card', ({ roomCode, cardId }, ack) => {
      const ctx = getContext(roomCode);
      if (!ctx) return ack({ ok: false, error: 'Not in this room.' });
      ack(ctx.room.playCard(ctx.playerId, cardId));
    });

    socket.on('continue_round', ({ roomCode }, ack) => {
      const ctx = getContext(roomCode);
      if (!ctx) return ack({ ok: false, error: 'Not in this room.' });
      ack(ctx.room.continueRound());
    });

    socket.on('leave_room', ({ roomCode }) => {
      const ctx = getContext(roomCode);
      if (!ctx) return;
      ctx.room.leaveRoom(ctx.playerId);
      socket.leave(roomCode);
      socketMeta.delete(socket.id);
    });

    socket.on('disconnect', () => {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        const room = roomManager.getRoom(meta.roomCode);
        room?.markDisconnected(socket.id);
      }
      socketMeta.delete(socket.id);
    });
  });
}
