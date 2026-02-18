/**
 * Lore for Glitch Pits — the world, the Pits, and the purpose of the betting game.
 */

export const LORE = {
  title: "THE GLITCH PITS",
  tagline: "Stake your PITS. Multiply or burn. No middle ground.",

  vision: "A transparent pit: you stake PITS, the House holds the other side. One round, one outcome — win and your stake is multiplied; lose and it burns. No hidden odds.",
  mission: "One character. One bet. One outcome. Win and your stake multiplies. Lose and it burns. Use PITS to play, upgrade in the Black Market, or walk away.",

  sections: [
    {
      heading: "GAIN OR BURN",
      body: "Glitch Pits is a gamble with clear utility. You bet PITS. If you win, you gain (bet × multiplier). If you lose, the House burns your bet — those tokens leave circulation. The only outcomes are gain or burn. No partial refunds, no rollbacks. That simplicity is the utility: every token is either won or burned.",
    },
    {
      heading: "ORIGIN",
      body: "Beyond the firewalled sectors, the Glitch is a layer where logic stutters and outcomes fork. There, the Pits were dug — not by hand, but by runaway processes and failed rollbacks. What remains is an arena that doesn't care who you were. Only who you bet on.",
    },
    {
      heading: "THE PITS",
      body: "Each Pit is a crucible. You forge a gladiator, feed them through the Black Market, then stake PITS on their run. The House fields its own. No script is written in advance; the battle is simulated in real time. Win, and your bet is multiplied. Lose, and the House burns your tokens. That burn feeds the system. That's the deal.",
    },
    {
      heading: "PITS TOKENS",
      body: "PITS are the only currency the Pits accept. You earn them by entering a character and by winning rounds. You spend them on bets and on upgrades — Attack, Defense, Luck — in the Black Market. The House always keeps a cut. What gets burned is gone. What you win is yours until you put it back on the line.",
    },
    {
      heading: "NEXT ROUND",
      body: "After every round the only move is forward. Pick your amount, place your bet again. The Pit doesn't remember the last fight. It only cares about the next one.",
    },
    {
      heading: "PURPOSE",
      body: "The Glitch Pits exist to resolve one question: who wins when the odds are even and the House holds the other side? You don't control the fight. You choose the stake. The rest is probability, lore in the Log, and the slow burn of tokens. Where are your gods now? In the next round.",
    },
  ],
} as const;

export type Lore = typeof LORE;
