import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { TutorialProvider } from './context/TutorialContext';
import JoinPage from './pages/JoinPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RulesModal from './components/RulesModal';

function Shell() {
  const { publicState, roomCode } = useGame();
  const [rulesOpen, setRulesOpen] = useState(false);

  let content: React.ReactNode;
  if (!roomCode || !publicState) {
    content = <JoinPage />;
  } else if (publicState.phase === 'lobby') {
    content = <LobbyPage />;
  } else {
    content = <GamePage />;
  }

  return (
    <>
      {content}
      <button
        onClick={() => setRulesOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-gradient-to-b from-[#f2d888] to-[#b8912a] text-[#3a2410] w-14 h-14 flex items-center justify-center font-display text-sm shadow-[0_3px_8px_rgba(50,32,10,0.5)] active:scale-95 border-2 border-[#6e5212]"
        aria-label="Open rules reference"
      >
        Rules
      </button>
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <TutorialProvider>
        <Shell />
      </TutorialProvider>
    </GameProvider>
  );
}
