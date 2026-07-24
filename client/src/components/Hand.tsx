import type { GamePhase, PrivatePlayerState } from '@skull-king/shared';
import { CardFace } from './cards/Card';
import { useGame } from '../context/GameContext';

export function Hand({ privateState, phase }: { privateState: PrivatePlayerState | null; phase: GamePhase }) {
  const { playCard } = useGame();
  if (!privateState || privateState.hand.length === 0) return null;

  const legal = privateState.legalCardIds;
  const isMyTurn = legal !== null;

  return (
    <div className="w-full bg-gradient-to-b from-[#241d15] to-[#14100b] border-t-[3px] border-[#a3812c]/70 pt-2.5 pb-4 shadow-[0_-4px_12px_rgba(50,32,10,0.35)]">
      <p className="text-center text-xs mb-2 h-4 font-bold tracking-wide">
        {isMyTurn ? (
          <span className="text-[#f2d888] animate-pulse">Your turn — tap a card to play</span>
        ) : phase === 'bidding' ? (
          <span className="text-[#a89468]">Your hand</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </p>
      <div className="flex justify-center gap-1.5 sm:gap-2 px-2 overflow-x-auto no-scrollbar pt-2">
        {privateState.hand.map((card) => {
          // Only mark a card illegal-looking once we actually know the legal set (i.e. it's my turn
          // to play). During bidding, or while waiting on someone else's turn, show the hand plainly.
          const isPlayableNow = isMyTurn && legal!.includes(card.id);
          const isIllegalNow = isMyTurn && !legal!.includes(card.id);
          return (
            <CardFace
              key={card.id}
              card={card}
              size="lg"
              disabled={isIllegalNow}
              onClick={isPlayableNow ? () => playCard(card.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
