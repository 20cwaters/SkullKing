import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PageBackground } from '../components/theme/PageBackground';
import { PlayerStatusBar } from '../components/PlayerStatusBar';
import { BiddingPanel } from '../components/BiddingPanel';
import { TrickArea } from '../components/TrickArea';
import { Hand } from '../components/Hand';
import { Scoreboard } from '../components/Scoreboard';
import { RoundEndPanel } from '../components/RoundEndPanel';
import { GameEndPanel } from '../components/GameEndPanel';
import { TutorialOverlay } from '../components/TutorialOverlay';

export default function GamePage() {
  const { publicState, privateState, myPlayerId, lastError, clearError, leaveRoom } = useGame();
  const [showScoreboard, setShowScoreboard] = useState(false);

  if (!publicState) return null;
  const state = publicState;

  function handleLeave() {
    if (window.confirm('Abandon ship? A bot will play out your hand for the rest of the game.')) {
      leaveRoom();
    }
  }

  const headerButton =
    'rounded-full bg-[#171310] border border-[#a3812c]/70 text-[#f2d888] text-xs font-bold px-3 py-1.5 shadow-[0_2px_5px_rgba(50,32,10,0.4)] active:scale-95 transition-transform';

  return (
    <PageBackground>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 pt-3 pb-1">
          <h1 className="font-display text-2xl text-ink-strong text-shadow-gold">
            Round {state.round}<span className="text-ink-soft text-lg">/{state.totalRounds}</span>
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setShowScoreboard(true)} className={headerButton}>
              📜 Scoreboard
            </button>
            <button
              onClick={handleLeave}
              className="rounded-full bg-[#7c141f] border border-[#5c0e16] text-[#f6ecd2] text-xs font-bold px-3 py-1.5 shadow-[0_2px_5px_rgba(50,32,10,0.4)] active:scale-95 transition-transform"
            >
              ⚓ Leave
            </button>
          </div>
        </header>

        <PlayerStatusBar state={state} myPlayerId={myPlayerId} />

        <TutorialOverlay state={state} privateState={privateState} myPlayerId={myPlayerId} />

        {lastError && (
          <div className="mx-3 mt-2 bg-[#7c141f] text-[#f6ecd2] rounded-lg px-3 py-2 text-xs flex justify-between items-center shadow-card">
            <span>{lastError}</span>
            <button onClick={clearError} className="font-bold px-1">
              ✕
            </button>
          </div>
        )}

        {state.phase === 'bidding' && <BiddingPanel state={state} privateState={privateState} />}
        {state.phase === 'trick' && <TrickArea state={state} />}
        {state.phase === 'round_end' && <RoundEndPanel state={state} />}
        {state.phase === 'game_end' && <GameEndPanel state={state} />}

        {(state.phase === 'bidding' || state.phase === 'trick') && (
          <Hand privateState={privateState} phase={state.phase} />
        )}

        {showScoreboard && <Scoreboard state={state} onClose={() => setShowScoreboard(false)} />}
      </div>
    </PageBackground>
  );
}
