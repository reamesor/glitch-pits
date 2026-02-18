/**
 * No-Bias Simulation Engine — 100% fair, verifiable RNG.
 * Each turn: pick random victim (and killer for lore), pick random lore action.
 * Lore-classes affect flavor text only, not probability.
 */
const path = require("path");
const fs = require("fs");

const LORE_PATH = path.join(__dirname, "loreDatabase.json");
let LORE = null;
function getLore() {
  if (!LORE) {
    LORE = JSON.parse(fs.readFileSync(LORE_PATH, "utf8"));
  }
  return LORE;
}

/** Seeded PRNG (mulberry32) for verifiable randomness. */
function createSeededRng(seedStr) {
  let h = 0;
  const s = String(seedStr);
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  let state = h >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0; // mulberry32
    let t = state >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return (t ^ (t >>> 14)) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function formatTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template
  );
}

/**
 * Run a turn-based elimination simulation. 100% fair: each turn one random
 * victim is eliminated; killer and lore action are chosen at random for flavor only.
 * @param {Array} participants - List of { id, name, loreClass?, ... }
 * @param {{ seed?: string, onEvent?: (evt) => void }} options - seed for RNG, onEvent callback
 * @returns {{ winner, events, rounds, seedId }}
 */
function runRumble(participants, options = {}) {
  const lore = getLore();
  const seedId = options.seed || `rumble-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const rng = createSeededRng(seedId);

  const p = participants.map((x) => ({ ...x, isAlive: true }));
  const events = [];
  let elapsedSec = 0;

  const emit = (evt) => {
    const ts = String(Math.floor(elapsedSec / 60)).padStart(2, "0") + ":" + String(elapsedSec % 60).padStart(2, "0");
    const payload = { ...evt, timestamp: ts, timeStr: `[${ts}]` };
    events.push(payload);
    if (options.onEvent) options.onEvent(payload);
    elapsedSec += 1;
  };

  while (p.filter((x) => x.isAlive).length > 1) {
    const alive = p.filter((x) => x.isAlive);

    // 10% chance: arena event (no death, just flavor)
    if (alive.length > 2 && rng() < 0.1) {
      const template = pick(rng, lore.arena);
      const message = formatTemplate(template, { count: alive.length });
      emit({ type: "arena", message });
      continue;
    }

    // One victim this round — 100% random who dies
    const victimIndex = Math.floor(rng() * alive.length);
    const victim = alive[victimIndex];
    victim.isAlive = false;

    const remaining = alive.filter((x) => x.id !== victim.id);
    const killer = remaining.length > 0 ? pick(rng, remaining) : victim;

    let type = "kill";
    let message;

    if (killer.id === victim.id || remaining.length === 0) {
      type = "self";
      const template = pick(rng, lore.self);
      message = formatTemplate(template, { name: victim.name });
    } else if (killer.id === "SYSTEM_SENTINEL" && lore.sentinelKill) {
      type = "kill";
      const template = pick(rng, lore.sentinelKill);
      message = formatTemplate(template, { killer: killer.name, victim: victim.name });
    } else if (victim.id === "SYSTEM_SENTINEL" && lore.sentinelDeath) {
      type = "kill";
      const template = pick(rng, lore.sentinelDeath);
      message = formatTemplate(template, { killer: killer.name, victim: victim.name });
    } else if (rng() < 0.2) {
      type = "critical";
      const template = pick(rng, lore.critical);
      message = formatTemplate(template, { victim: victim.name });
    } else {
      const template = pick(rng, lore.kill);
      message = formatTemplate(template, { killer: killer.name, victim: victim.name });
    }

    emit({
      type,
      killer: killer.name,
      killerId: killer.id,
      victim: victim.name,
      victimId: victim.id,
      message,
    });
  }

  const winner = p.find((x) => x.isAlive);
  return { winner, events, rounds: events.length, seedId };
}

module.exports = { runRumble, createSeededRng };
