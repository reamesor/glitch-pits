/**
 * Lore-themed death phrases for the Glitch Pit battle simulator.
 * {Killer} and {Victim} are replaced at random (player vs House opponent) so outcomes feel fair and chaotic.
 */

// Made-up glitch characters the House throws at the player each rumble
export const HOUSE_OPPONENT_NAMES: string[] = [
  "Null Pointer",
  "The Garbage Collector",
  "Buffer Overflow",
  "Stack Overflow",
  "The Main Loop",
  "System Sentinel",
  "The Boot Sector",
  "Memory Leak",
  "The GPU Fans",
  "Logic Bomb",
  "Fork Bomb",
  "The Allocator",
  "SIGKILL",
  "The Scheduler",
  "YAML Config",
  "The Firewall",
  "Cache Eviction",
  "The Compiler",
  "Dead Code",
  "The Source Code",
  "rm -rf",
  "The Kernel",
  "SSL Certificate",
  "The High-Score Table",
  "Scheduled Maintenance",
];

// All 50 lore phrases: {Victim} and {Killer} filled randomly (player or opponent)
const TECHNICAL: string[] = [
  "{Victim} was forced to divide by zero by {Killer}.",
  "{Victim} encountered a Null Pointer Exception and vanished.",
  "{Killer} overclocked {Victim} until their pixels melted.",
  "{Victim} was deleted from the Source Code by {Killer}.",
  "{Victim} suffered a stack overflow and collapsed into data dust.",
  "{Killer} corrupted {Victim}'s boot sector.",
  "{Victim}'s logic was inverted; they formatted themselves.",
  "{Victim} hit a hard-coded wall and shattered.",
  "{Killer} injected a malicious script into {Victim}'s core.",
  "{Victim} was compressed into a 1KB file by {Killer}.",
];

const GLITCH_HORROR: string[] = [
  "{Victim} was de-rezzed by {Killer}'s static blade.",
  "{Victim} fell into a Memory Leak and was forgotten.",
  "{Killer} shattered {Victim}'s resolution.",
  "{Victim} entered a Dead Loop and faded away.",
  "{Victim} was recycled by the System Furnace.",
  "{Killer} unzipped {Victim}... it was messy.",
  "{Victim}'s sprites were scattered to the void by {Killer}.",
  "{Victim} lost their connection to reality.",
  "{Killer} rewrote {Victim}'s history as a \"Loser.\"",
  "{Victim} was flagged as \"Obsolete\" by {Killer}.",
];

const HUMOROUS: string[] = [
  "{Victim} tried to Alt+F4 in the middle of a fight.",
  "{Killer} sent {Victim} back to the character select screen.",
  "{Victim} tripped over a low-res rock and exploded.",
  "{Killer} 360-no-scoped {Victim} in 8-bit.",
  "{Victim}'s antivirus failed to stop {Killer}.",
  "{Victim} ran out of RAM and stopped thinking.",
  "{Killer} replaced {Victim}'s weapon with a \"Coming Soon\" sign.",
  "{Victim} got lag-spiked into a different game entirely.",
  "{Killer} convinced {Victim} that the 'X' button was for power-ups.",
  "{Victim} was defeated by a \"Minor Inconvenience.\"",
];

const ARENA_ENVIRONMENTAL: string[] = [
  "{Victim} was caught in a Blue Screen of Death.",
  "{Victim} was erased during a scheduled system maintenance.",
  "{Killer} pushed {Victim} into the GPU fans.",
  "{Victim}'s packets were dropped... and so was their body.",
  "{Victim} was caught in the 'Final Format' border.",
  "{Killer} triggered a hardware reset on {Victim}.",
  "{Victim} was mistaken for a virus and quarantined.",
  "{Victim}'s textures failed to load; they died of embarrassment.",
  "{Killer} diverted all power from {Victim}'s life support.",
  "{Victim} was archived by the High-Score table.",
];

const WINNER_STAKES: string[] = [
  "{Killer} looted {Victim}'s logic and left them empty.",
  "{Victim}'s $PITS tokens were absorbed by {Killer}.",
  "{Victim} was liquidated into pure data for the Treasury.",
  "{Killer} claimed {Victim}'s fragments as a trophy.",
  "{Victim}'s existence was \"Refunded\" by {Killer}.",
  "{Victim} was traded for a better weapon in the Black Market.",
  "{Killer} turned {Victim} into a pixelated puddle.",
  "{Victim} lost the gamble. The Pit is hungry.",
  "{Killer} cashed out on {Victim}'s life force.",
  "CRITICAL ERROR: {Victim} has been permanently formatted.",
];

const ALL_LORE: string[] = [
  ...TECHNICAL,
  ...GLITCH_HORROR,
  ...HUMOROUS,
  ...ARENA_ENVIRONMENTAL,
  ...WINNER_STAKES,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random lore line with {Killer} and {Victim} filled in.
 * Randomly assigns the player's character and the House opponent to Killer or Victim (50/50) so it stays fair and chaotic.
 */
export function getRandomPitLore(characterName: string, opponentName?: string): string {
  const raw = pick(ALL_LORE);
  const player = characterName?.trim() || "Warrior";
  const opponent = opponentName?.trim() || pick(HOUSE_OPPONENT_NAMES);

  // Randomly decide who is Killer and who is Victim (fair, automatic)
  const playerIsKiller = Math.random() < 0.5;
  const killer = playerIsKiller ? player : opponent;
  const victim = playerIsKiller ? opponent : player;

  return raw
    .replace(/\{Killer\}/gi, killer)
    .replace(/\{Victim\}/gi, victim);
}

/**
 * Picks a random House opponent name for this rumble (e.g. show once per battle).
 */
export function getRandomOpponentName(): string {
  return pick(HOUSE_OPPONENT_NAMES);
}
