"use client";

import { useRef } from "react";
import { WindowedModal } from "./WindowedModal";

interface GameHelpProps {
  onClose: () => void;
}

const SECTIONS = [
  { id: "quick", label: "Quick Start" },
  { id: "features", label: "Features" },
  { id: "bet", label: "Bet & multiplier" },
  { id: "play", label: "How to Play" },
  { id: "rules", label: "Rules" },
  { id: "market", label: "Black Market" },
  { id: "tips", label: "Important" },
  { id: "lore", label: "Lore" },
] as const;

export function GameHelp({ onClose }: GameHelpProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    const el = scrollRef.current?.querySelector(`[data-section="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col">
        <WindowedModal title="GAME GUIDE" onClose={onClose} className="flex max-h-full flex-col">
          <div className="flex max-h-[75vh] flex-col gap-4 overflow-hidden">
            {/* Navigation */}
            <div className="flex flex-wrap gap-2 border-b-2 border-[var(--glitch-pink)]/30 pb-3">
              {SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  className="rounded border-2 border-[var(--glitch-pink)]/50 bg-[var(--bg-card)] px-3 py-1.5 font-pixel text-[10px] text-white transition hover:border-[var(--glitch-pink)] hover:bg-[var(--glitch-pink)]/20"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-6 overflow-y-auto pr-1 font-mono"
              style={{ maxHeight: "min(60vh, 400px)" }}
            >
              <section data-section="quick" className="rounded border-2 border-[var(--glitch-teal)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-teal)]">Quick Start</h3>
                <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-gray-200">
                  <li><strong>Enter the Pits:</strong> Connect your wallet (or play as guest). You need a character to bet — create one in <strong>The Forge</strong> to get <strong>2,000 PITS</strong> to start.</li>
                  <li><strong>The Forge:</strong> Name your gladiator, pick clothes, weapon, and avatar. One-time setup; you can rename later from the Dashboard when your wallet is connected.</li>
                  <li><strong>Earn more PITS:</strong> Use <strong>Daily Spin</strong> (3 free spins per day), <strong>Snake</strong>, and <strong>Glitch Popper</strong> on the left/right panels — none of these burn PITS; they only add.</li>
                  <li><strong>Bet Battle:</strong> In the center, stake 50–1000 PITS. Your gladiator fights the House. Win = bet × multiplier; lose = your stake is <strong>burned</strong> (gone).</li>
                  <li><strong>Black Market:</strong> Spend PITS on Attack, Defense, and Luck to improve your gladiator’s win chance in battles. Open from the header.</li>
                </ul>
              </section>

              <section data-section="features" className="rounded border-2 border-[var(--glitch-teal)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-3 font-pixel text-sm text-[var(--glitch-teal)]">Features: Spin, Snake, Glitch Popper & Bet Battle</h3>
                <p className="mb-3 text-xs text-gray-400">
                  Each panel has an <strong>(i)</strong> info icon next to its title — click it for a short summary. Details below.
                </p>

                <div className="mb-4">
                  <h4 className="mb-1 font-pixel text-xs text-[var(--glitch-pink)]">Daily Spin (left panel)</h4>
                  <p className="mb-1 text-sm leading-relaxed text-gray-200">
                    <strong>3 free spins per day</strong> (resets at midnight). Spins are tracked per wallet (or per session if not connected). Each spin shows 3 reels with avatar symbols. <strong>No stake — you never burn PITS here.</strong>
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Earn:</strong> Three matching = <strong>50 PITS</strong>, two matching = <strong>25 PITS</strong>, no match = <strong>10 PITS</strong>. You always earn something every spin.
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="mb-1 font-pixel text-xs text-[var(--glitch-teal)]">Snake (left panel)</h4>
                  <p className="mb-1 text-sm leading-relaxed text-gray-200">
                    <strong>Arrow keys or WASD</strong> to move. Eat the pink food to grow; avoid walls and your body. <strong>No stake — dying does not cost PITS.</strong>
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Earn:</strong> PITS = <strong>round(score ÷ 10)</strong>, capped at <strong>20 PITS</strong> per game. Score = food eaten (snake length − 3). Examples: 35 score → 3 PITS; 100 score → 10 PITS; 200+ → 20 PITS max.
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="mb-1 font-pixel text-xs text-[var(--glitch-pink)]">Glitch Popper (right panel)</h4>
                  <p className="mb-1 text-sm leading-relaxed text-gray-200">
                    Colored orbs float up; <strong>click them</strong> before they disappear. <strong>No stake;</strong> missing orbs does not deduct PITS.
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Earn:</strong> <strong>0.01 PITS</strong> per orb popped. Purely additive — pop as many as you can.
                  </p>
                </div>

                <div>
                  <h4 className="mb-1 font-pixel text-xs text-[var(--glitch-gold)]">Bet Battle Simulator (center)</h4>
                  <p className="mb-1 text-sm leading-relaxed text-gray-200">
                    <strong>This is the only feature where you can lose PITS.</strong> Stake 50–1000 PITS. Your gladiator fights the House in a simulated battle. Win = you get <strong>bet × multiplier</strong> (multiplier by bet tier). Lose = your <strong>entire stake is burned</strong> (no refund).
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>Multiplier tiers:</strong> 50–99 → 1.5×, 100–249 → 2×, 250–499 → 2.5×, 500–999 → 3×, 1000+ → 4×. <strong>Potential win = bet × multiplier</strong> (e.g. 100 PITS at 2× = 200 PITS on win). Your Attack, Defense, and Luck (Black Market) affect win chance.
                  </p>
                </div>
              </section>

              <section data-section="bet" className="rounded border-2 border-[var(--glitch-gold)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-gold)]">Bet & multiplier</h3>
                <p className="mb-2 text-sm leading-relaxed text-gray-200">
                  <strong>Min bet: 50 PITS. Max bet: 1000 PITS.</strong> Use the preset buttons (50, 100, 250, 500, 1000) or type a custom amount in <strong>CUSTOM BET</strong>. Both use the same multiplier tiers.
                </p>
                <p className="mb-2 text-sm leading-relaxed text-gray-300">
                  Your <strong>multiplier</strong> is set by your bet amount. <strong>Win</strong> = you receive <strong>bet × multiplier</strong> PITS (e.g. 100 at 2× = 200 PITS). <strong>Lose</strong> = your stake is burned; you get nothing back.
                </p>
                <p className="mb-2 text-xs text-gray-400">Multiplier tiers (presets and custom):</p>
                <table className="w-full border-collapse text-sm text-gray-200">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="py-1 text-left font-semibold">Bet amount</th>
                      <th className="py-1 text-right font-semibold">Multiplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/70"><td className="py-1">50–99 PITS</td><td className="py-1 text-right">1.5×</td></tr>
                    <tr className="border-b border-gray-700/70"><td className="py-1">100–249 PITS</td><td className="py-1 text-right">2×</td></tr>
                    <tr className="border-b border-gray-700/70"><td className="py-1">250–499 PITS</td><td className="py-1 text-right">2.5×</td></tr>
                    <tr className="border-b border-gray-700/70"><td className="py-1">500–999 PITS</td><td className="py-1 text-right">3×</td></tr>
                    <tr className="border-b border-gray-700/70"><td className="py-1">1000 PITS</td><td className="py-1 text-right">4×</td></tr>
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-gray-400">
                  Example: 75 PITS custom bet → 1.5× tier → potential win 112 PITS. Same tier as the 50 PITS preset.
                </p>
              </section>

              <section data-section="play" className="rounded border-2 border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-pink)]">How to Play</h3>
                <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-gray-200">
                  <li><strong>Pick your gladiator:</strong> Use <strong>PICK YOUR AVATAR</strong> (right panel) to choose who appears in the arena. Your balance is shown in the center panel.</li>
                  <li><strong>Set your bet:</strong> Choose amount (presets or custom, 50–1000 PITS). Higher amount = higher multiplier tier (1.5× to 4×).</li>
                  <li>Click <strong>PLACE BET</strong>. A battle runs; the <strong>Glitch Log</strong> (below the arena) shows the result. Win → you get <strong>bet × multiplier</strong> PITS. Lose → your stake is burned.</li>
                  <li><strong>AUTOBET:</strong> Set a number of rounds (5, 10, 20, 50, 100) and click START. It runs until the count is reached or you click STOP. Session profit is shown in the bar above the arena.</li>
                  <li><strong>Music & volume:</strong> Use MUSIC ON/OFF and the volume slider in the header. Help and Black Market are in the header too.</li>
                </ol>
              </section>

              <section data-section="rules" className="rounded border-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-pink)]">Rules</h3>
                <p className="mb-2 text-sm leading-relaxed text-gray-200">
                  <strong>Multiply or burn.</strong> In the Bet Battle: you stake PITS, the House holds the other side. One outcome — no partial refunds. Only the center Bet Battle can burn PITS; Daily Spin, Snake, and Glitch Popper only add PITS.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-gray-300">
                  <li><strong>Win</strong> → you receive bet × multiplier PITS.</li>
                  <li><strong>Lose</strong> → your stake is burned (gone from your balance).</li>
                  <li><strong>PITS</strong> are the in-game currency: earn from Spin, Snake, Glitch Popper, and winning bets; spend on bets and Black Market upgrades.</li>
                  <li>Daily Spin count resets at midnight (per wallet or session).</li>
                </ul>
              </section>

              <section data-section="market" className="rounded border-2 border-[var(--glitch-teal)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-teal)]">Black Market</h3>
                <p className="mb-2 text-sm leading-relaxed text-gray-200">
                  Open from the header. Spend PITS on <strong>Attack</strong>, <strong>Defense</strong>, and <strong>Luck</strong>. Higher stats improve your gladiator’s chance to win in the Bet Battle. Upgrades apply to your character for all future battles.
                </p>
                <p className="text-xs text-gray-400">
                  Your total wagered, won, lost, and upgrade count are visible in the <strong>Dashboard</strong> (header) when your wallet is connected.
                </p>
              </section>

              <section data-section="tips" className="rounded border-2 border-[var(--glitch-gold)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-gold)]">Important for players</h3>
                <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-gray-200">
                  <li><strong>You must Forge a character</strong> to get your starting 2,000 PITS and to place bets. Without a character, you can still use Daily Spin, Snake, and Glitch Popper to earn.</li>
                  <li><strong>Only the Bet Battle (center)</strong> stakes and can burn PITS. Spin, Snake, and Glitch Popper never deduct — they only add.</li>
                  <li><strong>Balance</strong> is shown in the center panel. All earnings (Spin, Snake, Popper, bet wins) go to this balance.</li>
                  <li>Use the <strong>(i) info icon</strong> next to each panel title (Daily Spin, Snake, Glitch Popper, Bet On) for a quick reminder of how that feature works.</li>
                  <li>When your wallet is connected, you can <strong>rename your gladiator</strong> from the Dashboard. Spin count is per wallet (or session if not connected).</li>
                </ul>
              </section>

              <section data-section="lore" className="rounded border-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-pink)]">Lore</h3>
                <p className="mb-2 text-sm leading-relaxed text-gray-200">
                  <em>Bet. Pop. Spin. Pray for the glitch. Welcome to the Pit.</em>
                </p>
                <p className="text-sm leading-relaxed text-gray-400">
                  The Pits are a crucible: forge a gladiator, stake PITS on their run. The House fields its own. Battles are simulated in real time. What you win is yours until you put it back on the line. Where are your gods now? In the next round.
                </p>
              </section>
            </div>
          </div>
        </WindowedModal>
      </div>
    </div>
  );
}
