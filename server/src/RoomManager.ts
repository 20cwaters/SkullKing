import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@skull-king/shared';
import { GameRoom } from './GameRoom.js';
import { generateRoomCode } from './roomCode.js';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private io: IoServer;

  constructor(io: IoServer) {
    this.io = io;
  }

  createRoom(maxPlayers: number): GameRoom {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();
    const room = new GameRoom(this.io, code, maxPlayers);
    room.onEmpty = () => this.rooms.delete(code);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }
}
