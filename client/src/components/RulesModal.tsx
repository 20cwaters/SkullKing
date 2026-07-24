import { CardFace } from './cards/Card';
import type { Card } from '@skull-king/shared';

const HIERARCHY: { card: Card; note: string }[] = [
  { card: { id: 'r-sk', kind: 'skull_king' }, note: 'Beats everything — except a Mermaid, who beguiles him and wins instead.' },
  { card: { id: 'r-pirate', kind: 'pirate' }, note: 'Beats numbers, trump, Mermaids — and even captures the Skull King.' },
  { card: { id: 'r-mermaid', kind: 'mermaid' }, note: 'Beats numbers and trump, loses to Pirates. Beguiles the Skull King (wins if both are in the trick).' },
  { card: { id: 'r-trump', kind: 'suit', suit: 'jolly_roger', value: 14 }, note: 'Jolly Roger is trump — beats every plain-suit number card.' },
  { card: { id: 'r-suit', kind: 'suit', suit: 'parrots', value: 14 }, note: 'Highest card of the led suit wins if no trump or specials are played.' },
  { card: { id: 'r-escape', kind: 'escape' }, note: 'Always loses. An all-Escape trick is won by whichever was played first.' },
];

export default function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-xl max-h-[88vh] panel-parchment !rounded-t-2xl sm:!rounded-2xl text-ink-strong flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#171310] text-[#f2d888] flex-shrink-0">
          <h2 className="font-display text-2xl">Captain's Rules</h2>
          <button onClick={onClose} className="text-2xl leading-none">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex flex-col gap-6 text-sm">
          <section>
            <h3 className="font-display text-lg text-crimson-700 mb-2">Card Hierarchy</h3>
            <ul className="flex flex-col gap-2">
              {HIERARCHY.map(({ card, note }) => (
                <li key={card.id} className="flex items-center gap-3">
                  <CardFace card={card} size="sm" />
                  <span className="text-ink/80">{note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-display text-lg text-crimson-700 mb-2">Playing a Trick</h3>
            <p className="text-ink/80">
              Follow the led suit if you can. Special cards (Pirate, Escape, Mermaid, Skull King) can always be played
              regardless of suit. If the lead card is a special, no suit is set — anyone may play anything.
            </p>
          </section>

          <section>
            <h3 className="font-display text-lg text-crimson-700 mb-2">Scoring a Round</h3>
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-ink/10">
                  <td className="py-1.5 pr-2 font-semibold">Bid &gt; 0, matched exactly</td>
                  <td className="py-1.5 text-right">+20 × bid</td>
                </tr>
                <tr className="border-b border-ink/10">
                  <td className="py-1.5 pr-2 font-semibold">Bid = 0, matched (won none)</td>
                  <td className="py-1.5 text-right">+10 × round number</td>
                </tr>
                <tr className="border-b border-ink/10">
                  <td className="py-1.5 pr-2 font-semibold">Bid missed</td>
                  <td className="py-1.5 text-right">−10 per trick over/under</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 font-semibold">Bid = 0, missed (won ≥1)</td>
                  <td className="py-1.5 text-right">−10 × round number</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="font-display text-lg text-crimson-700 mb-2">Skull King Capture Bonuses</h3>
            <p className="text-ink/80 mb-2">
              Only paid out if your own bid was matched that round. Whoever wins the trick containing the Skull King
              earns the bonus:
            </p>
            <ul className="text-ink/80 list-disc list-inside space-y-1">
              <li>+50 for simply winning that trick</li>
              <li>+50 more (100 total) if you captured him with a Pirate</li>
              <li>+100 more (150 total) if a Mermaid beguiled him</li>
            </ul>
          </section>

          <section>
            <h3 className="font-display text-lg text-crimson-700 mb-2">Winning the Game</h3>
            <p className="text-ink/80">
              After 10 rounds, whoever has the highest total score wins. Ties share the victory.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
