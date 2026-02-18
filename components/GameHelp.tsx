"use client";

import { useRef } from "react";
import { WindowedModal } from "./WindowedModal";

interface GameHelpProps {
  onClose: () => void;
}

const SECTIONS = [
  { id: "quick", label: "Quick Start" },
  { id: "play", label: "How to Play" },
  { id: "rules", label: "Rules" },
  { id: "market", label: "Black Market" },
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
                <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-gray-200">
                  <li>Connect your wallet, then enter the Pits.</li>
                  <li>Create a character in <strong>The Forge</strong> (name, clothes, weapon, avatar). You get <strong>2,000 PITS</strong> to start.</li>
                  <li>Place a bet (50–1000 PITS). Your gladiator faces the House. Win = bet × multiplier; lose = tokens burned.</li>
                  <li>Use the Black Market to upgrade Attack, Defense, Luck.</li>
                </ul>
              </section>

              <section data-section="play" className="rounded border-2 border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-pink)]">How to Play</h3>
                <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-gray-200">
                  <li>Choose bet amount (50, 100, 250, 500, or 1000 PITS). Higher bet = higher multiplier (1.5× to 4×).</li>
                  <li>Click <strong>PLACE BET</strong>. A battle runs; the Glitch Log shows what happens.</li>
                  <li>Win → you get your bet back plus (bet × multiplier). Lose → your PITS are burned.</li>
                  <li>Use <strong>AUTOBET</strong> to run multiple rounds (pick count, then START/STOP).</li>
                </ol>
              </section>

              <section data-section="rules" className="rounded border-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-pink)]">Rules</h3>
                <p className="mb-2 text-sm leading-relaxed text-gray-200">
                  <strong>Multiply or burn.</strong> Every round: you stake PITS, the House holds the other side. One outcome — no partial refunds.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-gray-300">
                  <li>Win → gain (bet × multiplier).</li>
                  <li>Lose → your stake is burned.</li>
                  <li>PITS are the only currency: earn by winning, spend on bets and Black Market upgrades.</li>
                </ul>
              </section>

              <section data-section="market" className="rounded border-2 border-[var(--glitch-teal)]/40 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-teal)]">Black Market</h3>
                <p className="text-sm leading-relaxed text-gray-200">
                  Spend PITS on <strong>Attack</strong>, <strong>Defense</strong>, and <strong>Luck</strong>. Higher stats improve your character’s chance to win in the simulated battle. Open from the header to upgrade.
                </p>
              </section>

              <section data-section="lore" className="rounded border-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-card)] p-4">
                <h3 className="mb-2 font-pixel text-sm text-[var(--glitch-pink)]">Lore</h3>
                <p className="mb-2 text-sm leading-relaxed text-gray-200">
                  <em>Stake your PITS. Multiply or burn. No middle ground.</em>
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
