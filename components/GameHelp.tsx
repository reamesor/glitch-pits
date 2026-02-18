"use client";

import { WindowedModal } from "./WindowedModal";

interface GameHelpProps {
  onClose: () => void;
}

export function GameHelp({ onClose }: GameHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg">
        <WindowedModal title="GAME GUIDE" onClose={onClose}>
          <div className="space-y-4 font-mono text-xs text-gray-300">
            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                CONTROLS
              </h3>
              <ul className="space-y-1 text-[10px]">
                <li><span className="text-[var(--glitch-teal)]">W A S D</span> — Move</li>
                <li><span className="text-[var(--glitch-teal)]">SPACE</span> — Attack</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                THE FORGE
              </h3>
              <p className="text-[10px] leading-relaxed">
                Burn 1,000 Mock-PITS to create your character. Choose clothes and a weapon. You start with 5,000.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                KILL-TO-WIN (50/25/25)
              </h3>
              <p className="mb-2 text-[10px] leading-relaxed">
                When you DE-REZZ another player:
              </p>
              <ul className="space-y-1 text-[10px]">
                <li><span className="text-[var(--glitch-teal)]">50%</span> → You</li>
                <li><span className="text-[var(--glitch-pink)]">25%</span> → Burned (gone)</li>
                <li><span className="text-gray-500">25%</span> → Treasury</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                BLACK MARKET
              </h3>
              <p className="text-[10px] leading-relaxed">
                Buy Antidotes, Shields, and Damage Boosts. All purchases are 100% burned.
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-pixel text-[10px] text-[var(--glitch-pink)]">
                COMBAT
              </h3>
              <p className="text-[10px] leading-relaxed">
                Get close and press SPACE to attack. Attack range is about 24px. 500ms cooldown between attacks.
              </p>
            </section>
          </div>
        </WindowedModal>
      </div>
    </div>
  );
}
