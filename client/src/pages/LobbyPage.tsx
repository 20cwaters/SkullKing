import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useTutorial } from '../context/TutorialContext';
import { PageBackground } from '../components/theme/PageBackground';
import { MIN_PLAYERS } from '@skull-king/shared';

export default function LobbyPage() {
  const { publicState, myPlayerId, addBot, removeBot, startGame, leaveRoom, roomCode, lastError, clearError } = useGame();
  const { enabled: tutorialEnabled, setEnabled: setTutorialEnabled } = useTutorial();
  const [copied, setCopied] = useState(false);

  if (!publicState || !roomCode) return null;

  const isHost = myPlayerId === publicState.hostId;
  const canStart = publicState.players.length >= MIN_PLAYERS && publicState.players.length <= publicState.maxPlayers;
  const emptySlots = Math.max(0, publicState.maxPlayers - publicState.players.length);

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <PageBackground>
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        <h1 className="font-display text-5xl text-ink-strong text-shadow-gold mb-1">The Crew's Quarters</h1>
        <p className="text-ink-soft italic mb-6">Waiting to set sail…</p>

        <div className="w-full max-w-sm panel-parchment p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Room Code</span>
            <button onClick={copyLink} className="text-xs font-bold text-[#8c1620] underline underline-offset-2">
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </div>
          <div className="text-4xl font-display tracking-[0.35em] text-center py-2 text-ink-strong">{roomCode}</div>
        </div>

        <div className="w-full max-w-sm panel-parchment overflow-hidden mb-4">
          <div className="px-4 py-2.5 bg-[#171310] text-[#f2d888] font-display text-xl flex justify-between items-center">
            <span>
              Crew ({publicState.players.length}/{publicState.maxPlayers})
            </span>
          </div>
          <ul className="divide-y divide-[#6e5634]/20">
            {publicState.players.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-emerald-700' : 'bg-[#6e5634]/40'}`} />
                  <span className="font-bold text-ink-strong">
                    {p.name}
                    {p.id === myPlayerId ? ' (you)' : ''}
                  </span>
                  {p.isHost && (
                    <span className="text-[10px] uppercase tracking-wide bg-gradient-to-b from-[#f2d888] to-[#c89a2e] text-[#3a2410] border border-[#6e5212] px-1.5 py-0.5 rounded-full font-bold">
                      Host
                    </span>
                  )}
                  {p.isBot && (
                    <span className="text-[10px] uppercase tracking-wide bg-[#3d5163] text-[#e8e4d4] px-1.5 py-0.5 rounded-full font-bold">
                      Bot
                    </span>
                  )}
                </span>
                {isHost && p.isBot && (
                  <button onClick={() => removeBot(p.id)} className="text-xs text-[#8c1620] font-bold underline underline-offset-2">
                    Remove
                  </button>
                )}
              </li>
            ))}
            {emptySlots > 0 &&
              Array.from({ length: emptySlots }).map((_, i) => (
                <li key={`empty-${i}`} className="flex items-center justify-between px-4 py-3 text-ink-soft/70 italic">
                  <span>Empty seat</span>
                  {isHost && (
                    <button
                      onClick={addBot}
                      className="text-xs font-bold text-[#2c4f7c] not-italic border-2 border-[#2c4f7c]/50 bg-[#faf4e2] rounded-full px-2.5 py-1"
                    >
                      + Add Bot
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </div>

        <label className="w-full max-w-sm flex items-center justify-between panel-parchment px-4 py-3 mb-6 cursor-pointer">
          <span className="text-sm font-bold text-ink-strong">Tutorial mode (guided tips, first 2 rounds)</span>
          <input
            type="checkbox"
            checked={tutorialEnabled}
            onChange={(e) => setTutorialEnabled(e.target.checked)}
            className="w-5 h-5 accent-[#8c1620]"
          />
        </label>

        {lastError && (
          <div className="w-full max-w-sm bg-[#7c141f] text-[#f6ecd2] rounded-lg px-4 py-2 mb-4 text-sm flex justify-between items-center shadow-card">
            <span>{lastError}</span>
            <button onClick={clearError} className="font-bold">
              ✕
            </button>
          </div>
        )}

        <div className="w-full max-w-sm flex flex-col gap-3">
          {isHost ? (
            <button onClick={startGame} disabled={!canStart} className="btn-crimson text-2xl py-4">
              Weigh Anchor &amp; Start
            </button>
          ) : (
            <p className="text-center text-ink-soft italic py-2">Waiting for the host to start the game…</p>
          )}
          <button onClick={leaveRoom} className="text-ink-soft text-sm underline underline-offset-2 text-center">
            Leave room
          </button>
        </div>
      </div>
    </PageBackground>
  );
}
