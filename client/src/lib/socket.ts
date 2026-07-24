import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@skull-king/shared';

// In production the server hosts the built client itself (same origin), so no URL is needed —
// socket.io-client connects relative to the current page. VITE_SERVER_URL is only for local dev
// (client on Vite's port, server on its own) or a split-service deploy.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:4000' : undefined);

const socketOpts = { autoConnect: true, transports: ['websocket', 'polling'] };

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = SERVER_URL
  ? io(SERVER_URL, socketOpts)
  : io(socketOpts);
