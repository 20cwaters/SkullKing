import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@skull-king/shared';
import { RoomManager } from './RoomManager.js';
import { registerSocketHandlers } from './socketHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Two levels up from either server/src (dev, via tsx) or server/dist (prod build) is the repo root.
const CLIENT_DIST = path.join(__dirname, '..', '..', 'client', 'dist');

const PORT = Number(process.env.PORT) || 4000;
// Only relevant when the client is hosted separately (e.g. local dev on a different port).
// Same-origin requests, which is how this runs in production, never trigger CORS at all.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS }));
app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve the built client (single-service deploy). No-op in local dev, where Vite serves
// the client separately and client/dist won't exist yet.
app.use(express.static(CLIENT_DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_ORIGINS },
});

const roomManager = new RoomManager(io);
registerSocketHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  console.log(`Skull King server listening on port ${PORT}`);
});
