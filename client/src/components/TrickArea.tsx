import type { PublicGameState } from '@skull-king/shared';
import { CardFace } from './cards/Card';

export function TrickArea({ state }: { state: PublicGameState }) {
  const nameFor = (id: string) => state.players.find((p) => p.id === id)?.name ?? '?';
  const currentPlayer = state.players.find((p) => p.id === state.currentTurnPlayerId);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 min-h-[220px]">
      <p className="text-ink-soft text-xs mb-3">
        ~ Trick {state.completedTrickCountThisRound + 1} of {state.round} ~
      </p>
      <div className="flex flex-wrap items-end justify-center gap-3 min-h-[8rem]">
        {state.currentTrick.length === 0 && !state.awaitingTrickAck && (
          <p className="text-ink-soft/70 text-sm self-center">Waiting for the first card…</p>
        )}
        {state.currentTrick.map((tc, i) => {
          const isWinner = state.awaitingTrickAck && state.lastTrickWinnerId === tc.playerId;
          return (
            <div
              key={`${tc.playerId}-${i}`}
              className={`flex flex-col items-center gap-1 ${isWinner ? 'animate-trick-win' : ''}`}
            >
              <CardFace
                card={tc.card}
                size="md"
                className={isWinner ? '!drop-shadow-[0_0_12px_rgba(200,154,46,0.9)]' : ''}
              />
              <span className={`text-[11px] font-bold ${isWinner ? 'text-[#8a6a1c]' : 'text-ink-soft'}`}>
                {nameFor(tc.playerId)}
                {isWinner ? ' ⚑' : ''}
              </span>
            </div>
          );
        })}
      </div>
      {!state.awaitingTrickAck && currentPlayer && (
        <p className="text-ink-soft text-sm mt-3">
          <span className="font-display text-lg text-ink-strong">{currentPlayer.name}</span> to play
        </p>
      )}
      {state.awaitingTrickAck && state.lastTrickWinnerId && (
        <p className="font-display text-2xl text-[#8c1620] mt-2 text-shadow-gold">
          {nameFor(state.lastTrickWinnerId)} takes the trick!
        </p>
      )}
    </div>
  );
}
