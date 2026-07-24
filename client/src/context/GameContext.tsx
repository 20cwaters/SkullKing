import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PrivatePlayerState, PublicGameState } from '@skull-king/shared';
import { socket } from '../lib/socket';
import { clearSession, loadSession, saveSession } from '../lib/session';

interface GameContextValue {
  connected: boolean;
  publicState: PublicGameState | null;
  privateState: PrivatePlayerState | null;
  myPlayerId: string | null;
  roomCode: string | null;
  playerName: string;
  lastError: string | null;
  clearError: () => void;
  createRoom: (playerName: string, maxPlayers: number) => Promise<{ ok: boolean; error?: string; roomCode?: string }>;
  joinRoom: (roomCode: string, playerName: string) => Promise<{ ok: boolean; error?: string }>;
  addBot: () => void;
  removeBot: (playerId: string) => void;
  startGame: () => void;
  submitBid: (bid: number) => void;
  playCard: (cardId: string) => void;
  continueRound: () => void;
  leaveRoom: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(socket.connected);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [lastError, setLastError] = useState<string | null>(null);
  const attemptedRejoin = useRef(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const session = loadSession();
      if (session && !attemptedRejoin.current) {
        attemptedRejoin.current = true;
        socket.emit('rejoin_room', session, (res) => {
          if (res.ok) {
            setRoomCode(session.roomCode);
            setMyPlayerId(session.playerId);
            setPlayerName(session.playerName);
          } else {
            clearSession();
          }
        });
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onStateUpdate(state: PublicGameState) {
      setPublicState(state);
    }
    function onPrivateState(state: PrivatePlayerState) {
      setPrivateState(state);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state_update', onStateUpdate);
    socket.on('private_state', onPrivateState);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state_update', onStateUpdate);
      socket.off('private_state', onPrivateState);
    };
  }, []);

  const createRoom = useCallback((name: string, maxPlayers: number) => {
    return new Promise<{ ok: boolean; error?: string; roomCode?: string }>((resolve) => {
      socket.emit('create_room', { playerName: name, maxPlayers }, (res) => {
        if (res.ok) {
          setRoomCode(res.roomCode);
          setMyPlayerId(res.playerId);
          setPlayerName(name);
          saveSession({ roomCode: res.roomCode, playerId: res.playerId, token: res.token, playerName: name });
          resolve({ ok: true, roomCode: res.roomCode });
        } else {
          setLastError(res.error);
          resolve({ ok: false, error: res.error });
        }
      });
    });
  }, []);

  const joinRoom = useCallback((code: string, name: string) => {
    const upper = code.toUpperCase();
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      socket.emit('join_room', { roomCode: upper, playerName: name }, (res) => {
        if (res.ok) {
          setRoomCode(upper);
          setMyPlayerId(res.playerId);
          setPlayerName(name);
          saveSession({ roomCode: upper, playerId: res.playerId, token: res.token, playerName: name });
          resolve({ ok: true });
        } else {
          setLastError(res.error);
          resolve({ ok: false, error: res.error });
        }
      });
    });
  }, []);

  const addBot = useCallback(() => {
    if (!roomCode) return;
    socket.emit('add_bot', { roomCode }, (res) => {
      if (!res.ok) setLastError(res.error);
    });
  }, [roomCode]);

  const removeBot = useCallback(
    (playerId: string) => {
      if (!roomCode) return;
      socket.emit('remove_bot', { roomCode, playerId }, (res) => {
        if (!res.ok) setLastError(res.error);
      });
    },
    [roomCode]
  );

  const startGame = useCallback(() => {
    if (!roomCode) return;
    socket.emit('start_game', { roomCode }, (res) => {
      if (!res.ok) setLastError(res.error);
    });
  }, [roomCode]);

  const submitBid = useCallback(
    (bid: number) => {
      if (!roomCode) return;
      socket.emit('submit_bid', { roomCode, bid }, (res) => {
        if (!res.ok) setLastError(res.error);
      });
    },
    [roomCode]
  );

  const playCard = useCallback(
    (cardId: string) => {
      if (!roomCode) return;
      socket.emit('play_card', { roomCode, cardId }, (res) => {
        if (!res.ok) setLastError(res.error);
      });
    },
    [roomCode]
  );

  const continueRound = useCallback(() => {
    if (!roomCode) return;
    socket.emit('continue_round', { roomCode }, (res) => {
      if (!res.ok) setLastError(res.error);
    });
  }, [roomCode]);

  const leaveRoom = useCallback(() => {
    if (roomCode) socket.emit('leave_room', { roomCode });
    clearSession();
    setRoomCode(null);
    setMyPlayerId(null);
    setPublicState(null);
    setPrivateState(null);
  }, [roomCode]);

  const clearError = useCallback(() => setLastError(null), []);

  return (
    <GameContext.Provider
      value={{
        connected,
        publicState,
        privateState,
        myPlayerId,
        roomCode,
        playerName,
        lastError,
        clearError,
        createRoom,
        joinRoom,
        addBot,
        removeBot,
        startGame,
        submitBid,
        playCard,
        continueRound,
        leaveRoom,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
