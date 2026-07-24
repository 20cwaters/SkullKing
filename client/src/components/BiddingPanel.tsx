import { useState } from 'react';
import type { PrivatePlayerState, PublicGameState } from '@skull-king/shared';
import { useGame } from '../context/GameContext';

const COIN_BASE =
  'aspect-square rounded-full font-display text-2xl border-2 transition-all flex items-center justify-center';
const COIN_IDLE = 'bg-[#faf4e2] border-[#8a6a3a]/50 text-ink-soft shadow-[0_2px_4px_rgba(50,32,10,0.25)]';
const COIN_SELECTED =
  'bg-gradient-to-b from-[#f2d888] to-[#c89a2e] border-[#6e5212] text-[#3a2410] scale-110 shadow-[0_0_12px_rgba(200,154,46,0.8)]';

export function BiddingPanel({ state, privateState }: { state: PublicGameState; privateState: PrivatePlayerState | null }) {
  const { submitBid } = useGame();
  const [selected, setSelected] = useState<number | null>(privateState?.myBid ?? null);
  const alreadyLocked = privateState?.myBid !== null && privateState?.myBid !== undefined;
  const options = Array.from({ length: state.round + 1 }, (_, i) => i);

  const lockedCount = state.players.filter((p) => p.hasBid).length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-5">
      <h2 className="font-display text-3xl text-ink-strong text-shadow-gold text-center leading-tight">
        How many tricks will ye win?
      </h2>
      <p className="text-ink-soft italic text-sm -mt-2">
        Round {state.round} of {state.totalRounds} — {state.round} card{state.round === 1 ? '' : 's'} in hand
      </p>

      {alreadyLocked ? (
        <div className="flex flex-col items-center gap-3 mt-2">
          <div className={`${COIN_BASE} ${COIN_SELECTED} w-24 text-5xl`}>{privateState?.myBid}</div>
          <p className="text-ink-soft text-sm italic">
            Bid locked in. Waiting on {state.players.length - lockedCount} more pirate
            {state.players.length - lockedCount === 1 ? '' : 's'}…
          </p>
          <div className="flex gap-1.5">
            {state.players.map((p) => (
              <span
                key={p.id}
                className={`w-2.5 h-2.5 rounded-full ${p.hasBid ? 'bg-emerald-700' : 'bg-[#6e5634]/30'}`}
                title={p.name}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2.5 max-w-xs w-full">
            {options.map((n) => (
              <button key={n} onClick={() => setSelected(n)} className={`${COIN_BASE} ${selected === n ? COIN_SELECTED : COIN_IDLE}`}>
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => selected !== null && submitBid(selected)}
            disabled={selected === null}
            className="btn-crimson mt-1 text-2xl px-10 py-3"
          >
            Lock In Bid
          </button>
        </>
      )}
    </div>
  );
}
