import type { PublicGameState } from '@skull-king/shared';
import { useGame } from '../context/GameContext';
import { CardBack } from './cards/Card';

export function GameEndPanel({ state }: { state: PublicGameState }) {
  const { leaveRoom, myPlayerId } = useGame();
  const sorted = [...state.players].sort((a, b) => (state.totalScores[b.id] ?? 0) - (state.totalScores[a.id] ?? 0));
  const winners = state.winnerIds ?? [];
  const iWon = myPlayerId ? winners.includes(myPlayerId) : false;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4 text-center">
      <CardBack size="md" className="rotate-3" />
      <h2 className="font-display text-5xl text-ink-strong text-shadow-gold leading-none">
        {winners.length > 1 ? 'Shared Glory!' : iWon ? 'You Win!' : 'The Voyage Ends'}
      </h2>
      <p className="text-ink-soft italic">
        {winners.map((id) => state.players.find((p) => p.id === id)?.name).join(' & ')} claim
        {winners.length === 1 ? 's' : ''} the treasure
      </p>
      <div className="w-full max-w-sm panel-parchment overflow-hidden">
        <ul className="divide-y divide-[#6e5634]/20">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center justify-between px-4 py-3 ${
                winners.includes(p.id) ? 'bg-gradient-to-r from-[#f2d888]/60 to-transparent' : ''
              }`}
            >
              <span className="flex items-center gap-2 font-bold text-ink-strong">
                <span className="text-ink-soft w-5">{i + 1}.</span>
                {winners.includes(p.id) && '👑 '}
                {p.name}
              </span>
              <span className="font-display text-2xl text-ink-strong">{state.totalScores[p.id] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={leaveRoom} className="btn-crimson text-2xl px-9 py-3">
        Return to Port
      </button>
    </div>
  );
}
