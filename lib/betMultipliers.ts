/**
 * Multiplier tiers for bet-only mode. Higher bet = higher multiplier (more risk, more reward).
 * Must match socket-server.
 */
export const BET_MULTIPLIER_TIERS = [
  { min: 50, mult: 1.5 },
  { min: 100, mult: 2 },
  { min: 250, mult: 2.5 },
  { min: 500, mult: 3 },
  { min: 1000, mult: 4 },
].sort((a, b) => a.min - b.min);

export function getMultiplierForAmount(amount: number): number {
  let out = 1.5;
  for (const tier of BET_MULTIPLIER_TIERS) {
    if (amount >= tier.min) out = tier.mult;
  }
  return out;
}

export const SYSTEM_SENTINEL_ID = "SYSTEM_SENTINEL";
export const SYSTEM_SENTINEL_NAME = "System Sentinel";
