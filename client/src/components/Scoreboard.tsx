import type { PublicGameState } from '@skull-king/shared';

export function Scoreboard({ state, onClose }: { state: PublicGameState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl max-h-[85vh] panel-parchment !rounded-t-2xl sm:!rounded-2xl text-ink-strong flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#171310] text-[#f2d888]">
          <h2 className="font-display text-2xl">Ship's Log</h2>
          <button onClick={onClose} className="text-2xl leading-none">
            ✕
          </button>
        </div>
        <div className="overflow-auto p-3">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-parchment-sheet text-left px-2 py-1 z-10">Round</th>
                {state.players.map((p) => (
                  <th key={p.id} className="px-2 py-1 text-center whitespace-nowrap font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.roundHistory.map((round, idx) => (
                <tr key={idx} className="border-t border-ink/10">
                  <td className="sticky left-0 bg-parchment-sheet px-2 py-1.5 font-semibold">{idx + 1}</td>
                  {state.players.map((p) => {
                    const r = round.find((x) => x.playerId === p.id);
                    if (!r) return <td key={p.id} className="px-2 py-1.5 text-center">—</td>;
                    const positive = r.roundScore >= 0;
                    return (
                      <td key={p.id} className="px-2 py-1.5 text-center whitespace-nowrap">
                        <div className="text-[11px] text-ink/60">
                          {r.bid}→{r.tricksWon}
                          {r.bonusPoints > 0 ? ` +${r.bonusPoints}` : ''}
                        </div>
                        <div className={`font-bold ${positive ? 'text-emerald-700' : 'text-crimson-600'}`}>
                          {positive ? '+' : ''}
                          {r.roundScore}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-ink/40 bg-gold-200/40">
                <td className="sticky left-0 bg-gold-200/70 px-2 py-2 font-display text-base">Total</td>
                {state.players.map((p) => (
                  <td key={p.id} className="px-2 py-2 text-center font-display text-lg">
                    {state.totalScores[p.id] ?? 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {state.roundHistory.length === 0 && (
            <p className="text-center text-ink/60 text-sm py-6">No rounds completed yet — the log is still blank.</p>
          )}
        </div>
      </div>
    </div>
  );
}
