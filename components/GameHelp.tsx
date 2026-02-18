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
                Glitch Pits is a spectator betting game. You don&apos;t control characters during battle.
                Forge a character, upgrade their stats, bet on who wins — then watch the lore unfold
                in the Glitch Log.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                THE FORGE
              </h3>
              <p className="text-[10px] leading-relaxed">
                Burn 1,000 Mock-PITS to create your character. Choose clothes and weapon. Start with 5,000.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                RUMBLE FLOW
              </h3>
              <ol className="list-inside list-decimal space-y-1 text-[10px]">
                <li>START RUMBLE — When 2+ characters exist</li>
                <li>BET — Place PITS on who you think will win</li>
                <li>RUN RUMBLE — Battle is simulated</li>
                <li>Winner gets prize pool; bettors who picked them get 2× bet</li>
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
