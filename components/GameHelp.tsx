"use client";

import { WindowedModal } from "./WindowedModal";
import { LORE } from "@/lib/lore";

interface GameHelpProps {
  onClose: () => void;
}

export function GameHelp({ onClose }: GameHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg">
        <WindowedModal title="GAME GUIDE" onClose={onClose}>
          <div className="space-y-4 font-mono text-xs text-gray-300">
            <section className="rounded border-2 border-[var(--glitch-teal)]/40 bg-[var(--bg-card)] p-3">
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-teal)]">
                VISION & MISSION
              </h3>
              <p className="mb-2 text-[10px] leading-relaxed text-gray-300">
                {LORE.vision}
              </p>
              <p className="text-[10px] leading-relaxed text-gray-400">
                {LORE.mission}
              </p>
            </section>

            <section className="rounded border-2 border-[var(--glitch-pink)]/40 bg-[var(--bg-card)] p-3">
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                WHY IT WORKS — GAIN OR BURN
              </h3>
              <p className="text-[10px] leading-relaxed">
                Glitch Pits is a gamble with clear utility. You bet PITS; the House holds the other side. Every round is 50/50. <strong>Win</strong> and you gain (bet × multiplier). <strong>Lose</strong> and your tokens are burned — they leave circulation. No partial refunds. The utility is in the token: use PITS to play, upgrade in the Black Market, or walk away. Simple gain or burn.
              </p>
            </section>

            <section className="rounded border-2 border-[var(--glitch-pink)]/30 bg-[var(--bg-card)] p-3">
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                LORE — THE GLITCH PITS
              </h3>
              <p className="mb-2 text-[10px] leading-relaxed text-gray-400">
                {LORE.tagline}
              </p>
              {LORE.sections.map((s) => (
                <div key={s.heading} className="mb-3">
                  <h4 className="mb-1 font-pixel text-[9px] text-[var(--glitch-teal)]">
                    {s.heading}
                  </h4>
                  <p className="text-[10px] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                HOW IT WORKS
              </h3>
              <p className="text-[10px] leading-relaxed">
                Forge a character (free — you get 1,000 PITS to start). Bet on your character vs the House. Each round is 50/50; win and your bet is multiplied, lose and the House burns your stake. Upgrade in the Black Market. Watch the Glitch Log for lore.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                THE FORGE
              </h3>
              <p className="text-[10px] leading-relaxed">
                Enter a character (name, clothes, weapon, avatar). You get 1,000 PITS to start — no cost. Then bet in the Pit.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                BET FLOW
              </h3>
              <ol className="list-inside list-decimal space-y-1 text-[10px]">
                <li>Choose bet amount (50–1000 PITS) and see the multiplier</li>
                <li>PLACE BET — Your character vs the House, 50/50</li>
                <li>Battle is simulated; lore appears in the Glitch Log</li>
                <li>Win → gain (bet × multiplier). Lose → your PITS are burned</li>
              </ol>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                UPGRADES (Black Market)
              </h3>
              <p className="text-[10px] leading-relaxed">
                Spend PITS on Attack, Defense, Luck. Higher stats increase your character&apos;s
                chance to win in the simulated battle.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                GLITCH LOG
              </h3>
              <p className="text-[10px] leading-relaxed">
                Lore-rich text describes every event: who eliminated whom, freak accidents,
                poison, and glory. Where are your gods now?
              </p>
            </section>
          </div>
        </WindowedModal>
      </div>
    </div>
  );
}
