import type { PublicGameState } from '@skull-king/shared';
import { CardBack } from './cards/Card';

export function PlayerStatusBar({ state, myPlayerId }: { state: PublicGameState; myPlayerId: string | null }) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-3 py-2 min-w-max">
        {state.players.map((p) => {
          const isTurn = state.currentTurnPlayerId === p.id && state.phase === 'trick';
          const isWinner = state.lastTrickWinnerId === p.id && state.awaitingTrickAck;
          const tricks = state.tricksWonThisRound[p.id] ?? 0;
          const bidValue = state.bidsRevealed ? state.revealedBids?.[p.id] : undefined;
          return (
            <div
              key={p.id}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 border-2 transition-all bg-parchment-sheet ${
                isTurn || isWinner
                  ? 'border-[#c89a2e] shadow-[0_0_10px_rgba(200,154,46,0.7)]'
                  : 'border-[#6e5634]/35 shadow-[0_2px_4px_rgba(50,32,10,0.25)]'
              } ${isWinner ? 'animate-trick-win' : ''}`}
            >
              <div className="flex items-center gap-1">
                {p.id === state.dealerId && (
                  <span title="Dealer" className="text-[10px]">
                    🧭
                  </span>
                )}
                <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-emerald-700' : 'bg-[#6e5634]/40'}`} />
                <span className="text-xs font-bold text-ink-strong max-w-[6.5rem] truncate">
                  {p.name}
                  {p.id === myPlayerId ? ' (you)' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-soft">
                <span>Bid: {bidValue !== undefined ? bidValue : p.hasBid ? '✓' : '…'}</span>
                <span className="flex items-center gap-1">
                  <CardBack size="sm" className="!w-3" />
                  {tricks}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
