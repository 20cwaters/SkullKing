import type { PrivatePlayerState, PublicGameState } from '@skull-king/shared';
import { useTutorial } from '../context/TutorialContext';

function tipFor(state: PublicGameState, privateState: PrivatePlayerState | null, myPlayerId: string | null): { id: string; text: string } | null {
  if (state.phase === 'bidding') {
    if (privateState?.myBid !== null && privateState?.myBid !== undefined) return null;
    return {
      id: `bid-${state.round}`,
      text: 'Look at your hand: high numbers, Jolly Roger trumps, Pirates, Mermaids and the Skull King are your best bets to win a trick. Bid how many tricks you expect to win — everyone\'s bid stays secret until all are locked in.',
    };
  }
  if (state.phase === 'trick') {
    const isMyTurn = state.currentTurnPlayerId === myPlayerId;
    if (!isMyTurn) return null;
    if (state.currentTrick.length === 0) {
      return {
        id: `lead-${state.round}`,
        text: "You're leading this trick — play any card. Whoever plays the highest card of that suit wins, unless someone plays a trump (Jolly Roger) or a special card (Pirate/Mermaid/Skull King).",
      };
    }
    return {
      id: `follow-${state.round}`,
      text: 'You must follow the suit that was led if you have one — dimmed cards are illegal right now. No matching suit? Play anything, including trump or a special card.',
    };
  }
  if (state.phase === 'round_end') {
    return {
      id: `score-${state.round}`,
      text: 'Match your bid exactly to score big (20 pts/trick, or 10×round if you correctly bid zero). Miss your bid and you lose 10 points per trick you were off.',
    };
  }
  return null;
}

export function TutorialOverlay({
  state,
  privateState,
  myPlayerId,
}: {
  state: PublicGameState;
  privateState: PrivatePlayerState | null;
  myPlayerId: string | null;
}) {
  const { enabled, dismissed, dismiss } = useTutorial();
  if (!enabled || state.round > 2) return null;

  const tip = tipFor(state, privateState, myPlayerId);
  if (!tip || dismissed.has(tip.id)) return null;

  return (
    <div className="mx-3 mt-2 rounded-lg bg-gold-200 text-ink border-2 border-gold-500 shadow-card px-3 py-2 flex gap-2 items-start">
      <span className="text-lg leading-none">🗺️</span>
      <p className="text-xs flex-1 leading-snug">{tip.text}</p>
      <button onClick={() => dismiss(tip.id)} className="text-ink/60 font-bold text-sm leading-none px-1">
        ✕
      </button>
    </div>
  );
}
