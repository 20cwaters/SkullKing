import { useEffect, useState } from 'react';
import type { Card } from '@skull-king/shared';
import { useGame } from '../context/GameContext';
import { PageBackground } from '../components/theme/PageBackground';
import { CardFace } from '../components/cards/Card';

type Tab = 'join' | 'create';

const HERO_CARDS: { card: Card; x: number; rot: number; z: number }[] = [
  { card: { id: 'hero-parrot-14', kind: 'suit', suit: 'parrots', value: 14 }, x: -108, rot: -22, z: 1 },
  { card: { id: 'hero-chest-8', kind: 'suit', suit: 'chests', value: 8 }, x: -56, rot: -11, z: 2 },
  { card: { id: 'hero-skull-king', kind: 'skull_king' }, x: 0, rot: 0, z: 5 },
  { card: { id: 'hero-mermaid', kind: 'mermaid' }, x: 56, rot: 11, z: 3 },
  { card: { id: 'hero-pirate', kind: 'pirate' }, x: 108, rot: 22, z: 2 },
];

function CardFanHero() {
  return (
    <div className="relative h-40 sm:h-44 w-full max-w-sm mx-auto" aria-hidden="true">
      {HERO_CARDS.map(({ card, x, rot, z }) => (
        <div
          key={card.id}
          className="absolute left-1/2 top-2"
          style={{
            transform: `translateX(calc(-50% + ${x}px)) rotate(${rot}deg)`,
            transformOrigin: '50% 130%',
            zIndex: z,
          }}
        >
          <CardFace card={card} size="md" className="sm:!w-[4.6rem]" />
        </div>
      ))}
    </div>
  );
}

function Flourish() {
  return (
    <svg viewBox="0 0 220 16" className="w-52 mx-auto my-1 text-[#6e5212]" aria-hidden="true">
      <path d="M4,8 H88 M132,8 H216" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M96,8 l6,-5 6,5 -6,5 Z M110,8 a4,4 0 1,0 0.01,0" fill="currentColor" />
      <circle cx="4" cy="8" r="2" fill="currentColor" />
      <circle cx="216" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

export default function JoinPage() {
  const { createRoom, joinRoom, connected } = useGame();
  const [tab, setTab] = useState<Tab>('join');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomCode(room.toUpperCase());
      setTab('join');
    }
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    setBusy(true);
    setError(null);
    const res = await joinRoom(roomCode.trim(), name.trim());
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'Could not join room.');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await createRoom(name.trim(), maxPlayers);
    setBusy(false);
    if (!res.ok) setError(res.error ?? 'Could not create room.');
  }

  const inputClasses =
    'rounded-md border-2 border-[#8a6a3a]/60 bg-[#faf4e2] px-4 py-3 text-ink-strong placeholder:text-[#a08a62] shadow-[inset_0_2px_4px_rgba(90,62,24,0.15)] focus:outline-none focus:border-[#a3812c] focus:ring-2 focus:ring-[#cfa63c]/40';

  return (
    <PageBackground>
      <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-10 sm:pt-12">
        <CardFanHero />

        <h1 className="font-display text-6xl sm:text-7xl text-ink-strong text-shadow-gold mt-3 text-center leading-none">
          Skull King
        </h1>
        <Flourish />
        <p className="text-ink-soft text-base mb-7 text-center max-w-xs">
          The classic pirate game of bids, bluffs &amp; blades — 2 to 6 scallywags
        </p>

        {!connected && (
          <p className="text-[#8c1620] text-sm mb-4 animate-pulse font-semibold">Hoisting sails… connecting to the server</p>
        )}

        <div className="w-full max-w-sm panel-parchment overflow-hidden">
          <div className="grid grid-cols-2 bg-[#171310]">
            {(['join', 'create'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`py-3.5 font-display text-xl tracking-wide transition-colors ${
                  tab === t
                    ? 'text-[#f2d888] border-b-[3px] border-[#cfa63c] bg-[#241d15]'
                    : 'text-[#8a7a5c] border-b-[3px] border-transparent'
                }`}
              >
                {t === 'join' ? 'Join Game' : 'Create Game'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'join' ? (
              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Room Code</span>
                  <input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="K7XQP"
                    className={`${inputClasses} text-xl tracking-[0.35em] text-center font-bold uppercase`}
                    autoCapitalize="characters"
                    autoComplete="off"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Your Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    placeholder="Captain…"
                    className={inputClasses}
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy || !connected || !name.trim() || !roomCode.trim()}
                  className="btn-crimson mt-2 text-2xl py-3"
                >
                  Set Sail
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Your Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    placeholder="Captain…"
                    className={inputClasses}
                  />
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Crew Size (max players)</span>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setMaxPlayers(n)}
                        className={`flex-1 aspect-square rounded-full font-display text-xl border-2 transition-all ${
                          maxPlayers === n
                            ? 'bg-gradient-to-b from-[#f2d888] to-[#c89a2e] border-[#6e5212] text-[#3a2410] scale-105 shadow-[0_2px_6px_rgba(90,62,10,0.5)]'
                            : 'bg-[#faf4e2] border-[#8a6a3a]/40 text-ink-soft'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={busy || !connected || !name.trim()} className="btn-crimson mt-2 text-2xl py-3">
                  Found a Crew
                </button>
              </form>
            )}
            {error && <p className="mt-3 text-sm text-[#8c1620] font-bold">{error}</p>}
          </div>
        </div>

        <p className="text-ink-soft/80 text-xs mt-6 text-center max-w-xs">
          Short on crew? Fill empty seats with bot buccaneers once you're in the room.
        </p>
      </div>
    </PageBackground>
  );
}
