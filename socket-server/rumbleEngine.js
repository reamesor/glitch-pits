/**
 * Rumble Royale-style battle simulation with lore-rich narrative events.
 * Characters fight automatically - users bet on outcomes and upgrade stats.
 */

const LORE_EVENTS = {
  kill: [
    (killer, victim) => `${killer} DE-REZZED ${victim} with a vicious strike!`,
    (killer, victim) => `${killer} the Joker eliminated ${victim}. Git Gud.`,
    (killer, victim) => `${killer} crushed ${victim} into digital dust.`,
    (killer, victim) => `${victim} fell to ${killer}'s blade.`,
    (killer, victim) => `${killer} outplayed ${victim} in the Pits.`,
  ],
  poison: [
    (killer, victim) => `${killer} dosed ${victim}'s meal with a slow-acting poison. Bye!`,
    (killer, victim) => `${victim} ingested ${killer}'s toxin. Fatal.`,
  ],
  self: [
    (name) => `${name} spun too hard and died of toxicity.`,
    (name) => `${name} tripped over their own ego.`,
    (name) => `${name} glitched out of existence.`,
    (name) => `${name} met their end in a fit of rage.`,
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function simulateRound(participants, stats) {
  const alive = participants.filter((p) => p.isAlive);
  if (alive.length <= 1) return null;

  const roll = Math.random();

  if (roll < 0.15 && alive.length >= 2) {
    const victim = pick(alive);
    victim.isAlive = false;
    return {
      type: "self",
      victim: victim.name,
      message: pick(LORE_EVENTS.self)(victim.name),
    };
  }

  if (alive.length >= 2) {
    const attacker = pick(alive);
    const others = alive.filter((p) => p.id !== attacker.id);
    if (others.length === 0) return simulateRound(participants, stats);
    const victim = pick(others);

    const aStat = (stats[attacker.id] || { attack: 5 }).attack;
    const vStat = (stats[victim.id] || { defense: 5 }).defense;
    const hitChance = 0.4 + (aStat - vStat) * 0.05;
    const hit = Math.random() < hitChance;

    if (hit) {
      victim.isAlive = false;
      const usePoison = Math.random() < 0.25;
      const templates = usePoison ? LORE_EVENTS.poison : LORE_EVENTS.kill;
      return {
        type: "kill",
        killer: attacker.name,
        victim: victim.name,
        killerId: attacker.id,
        victimId: victim.id,
        message: pick(templates)(attacker.name, victim.name),
      };
    }
  }

  return null;
}

function runRumble(participants, stats, onEvent) {
  const p = participants.map((x) => ({ ...x, isAlive: true }));
  const events = [];
  let round = 0;

  while (p.filter((x) => x.isAlive).length > 1) {
    round++;
    const evt = simulateRound(p, stats);
    if (evt) {
      events.push(evt);
      onEvent(evt);
    }
    if (events.length > 50) break;
  }

  const winner = p.find((x) => x.isAlive);
  return { winner, events, rounds: round };
}

module.exports = { runRumble };
