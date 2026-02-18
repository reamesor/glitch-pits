/**
 * Lore for Glitch Pits — the world, the Pits, and the purpose of the betting game.
 */

export const LORE = {
  title: "THE GLITCH PITS",
  tagline: "Where the House holds the line. You hold the tokens.",

  sections: [
    {
      heading: "ORIGIN",
      body: "Beyond the firewalled sectors, the Glitch is a layer where logic stutters and outcomes fork. There, the Pits were dug — not by hand, but by runaway processes and failed rollbacks. What remains is an arena that doesn't care who you were. Only who you bet on.",
    },
    {
      heading: "THE PITS",
      body: "Each Pit is a 50/50 crucible. You forge a gladiator, feed them through the Black Market, then stake PITS on their run. The House fields its own. No script is written in advance; the battle is simulated in real time. Win, and your bet is multiplied. Lose, and the House burns your tokens. That burn feeds the system. That's the deal.",
    },
    {
      heading: "PITS TOKENS",
      body: "PITS are the only currency the Pits accept. You earn them by entering a character and by winning rounds. You spend them on bets and on upgrades — Attack, Defense, Luck — in the Black Market. The House always keeps a cut. What gets burned is gone. What you win is yours until you put it back on the line.",
    },
    {
      heading: "REVENGE",
      body: "After every round the only move is forward: Start Revenge. Pick your amount, place your bet again. The Pit doesn't remember the last fight. It only cares about the next one. Revenge isn't narrative. It's the next bet.",
    },
    {
      heading: "PURPOSE",
      body: "The Glitch Pits exist to resolve one question: who wins when the odds are even and the House holds the other side? You don't control the fight. You choose the stake. The rest is probability, lore in the Log, and the slow burn of tokens. Where are your gods now? In the next round.",
    },
  ],
} as const;

export type Lore = typeof LORE;
