import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@skull-king/shared';
import { RoomManager } from './RoomManager.js';
import { registerSocketHandlers } from './socketHandlers.js';

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS }));
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGINS },
});

const roomManager = new RoomManager(io);
registerSocketHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  console.log(`Skull King server listening on port ${PORT}`);
});
