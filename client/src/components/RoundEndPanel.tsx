import type { PublicGameState } from '@skull-king/shared';
import { useGame } from '../context/GameContext';

export function RoundEndPanel({ state }: { state: PublicGameState }) {
  const { continueRound } = useGame();
  const roundResults = state.roundHistory[state.roundHistory.length - 1] ?? [];
  const sorted = [...roundResults].sort(
    (a, b) => (state.totalScores[b.playerId] ?? 0) - (state.totalScores[a.playerId] ?? 0)
  );

  const nameFor = (id: string) => state.players.find((p) => p.id === id)?.name ?? '?';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4">
      <h2 className="font-display text-4xl text-ink-strong text-shadow-gold">Round {state.round} Complete</h2>
      <div className="w-full max-w-sm panel-parchment overflow-hidden">
        <ul className="divide-y divide-[#6e5634]/20">
          {sorted.map((r) => (
            <li key={r.playerId} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-bold text-ink-strong">{nameFor(r.playerId)}</p>
                <p className="text-xs text-ink-soft">
                  Bid {r.bid}, won {r.tricksWon}
                  {r.bonusPoints > 0 ? ` · +${r.bonusPoints} bonus` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-display text-2xl ${r.roundScore >= 0 ? 'text-emerald-800' : 'text-[#8c1620]'}`}>
                  {r.roundScore >= 0 ? '+' : ''}
                  {r.roundScore}
                </p>
                <p className="text-xs text-ink-soft">total {r.totalScoreAfter}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={continueRound} className="btn-crimson text-2xl px-9 py-3">
        {state.round >= state.totalRounds ? 'See Final Results' : 'Next Round'}
      </button>
    </div>
  );
}
