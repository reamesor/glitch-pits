/**
 * Glitch Pits - Lore-based automated rumble. Winner takes all. Spectators can bet on warriors.
 */
const http = require("http");
const { Server } = require("socket.io");
const { runRumble } = require("./rumbleEngine");

const PORT = process.env.PORT || 3001;
const DEFAULT_BALANCE = 5000;
const FORGE_COST = 1000;
const MIN_PIT_ENTRIES = 1; // 1 = Duel vs House, 2-3 = Rumble
const MAX_PIT_PLAYERS = 3;
const BET_MIN = 50;
const HOUSE_FEE_PERCENT = 5; // Rumble: 5% to treasury; Duel: 2x payout to winner
const LORE_CLASSES = ["The Overclocked", "The Virus", "The Null", "The Glitch", "The Fork", "The Stack", "The Kernel"];
const SYSTEM_SENTINEL_ID = "SYSTEM_SENTINEL";
const SYSTEM_SENTINEL_NAME = "System Sentinel";

// Bet-only multiplier tiers: higher bet = higher multiplier (more risk, more reward)
const BET_MULTIPLIER_TIERS = [
  { min: 50, mult: 1.5 },
  { min: 100, mult: 2 },
  { min: 250, mult: 2.5 },
  { min: 500, mult: 3 },
  { min: 1000, mult: 4 },
].sort((a, b) => b.min - a.min);

function getMultiplierForAmount(amount) {
  for (const tier of BET_MULTIPLIER_TIERS) {
    if (amount >= tier.min) return tier.mult;
  }
  return 1.5;
}

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", service: "glitch-pits-socket" }));
});

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "*" },
});

const characters = new Map();
const rumbleState = {
  phase: "idle",
  participants: [],
  prizePool: 0,
  spectatorPool: 0,
  spectatorBets: {},
  winner: null,
  events: [],
  seedId: null,
  gameMode: null, // "duel" | "rumble"
};
const leaderboard = []; // last 10: { name, amount, seedId, date }

function emitLeaderboard() {
  io.emit("leaderboard", leaderboard);
}

io.on("connection", (socket) => {
  socket.emit("rumbleState", rumbleState);
  socket.emit("characterCount", characters.size);
  socket.emit("leaderboard", leaderboard);

  socket.on("forge", (data) => {
    const name = typeof data === "string" ? data : data?.name;
    const clothes = typeof data === "object" ? (data.clothes || "vest") : "vest";
    const weapon = typeof data === "object" ? (data.weapon || "sword") : "sword";

    const loreClass = LORE_CLASSES[Math.floor(Math.random() * LORE_CLASSES.length)];
    characters.set(socket.id, {
      id: socket.id,
      name: name || `Player_${socket.id.slice(0, 6)}`,
      clothes,
      weapon,
      loreClass,
      attack: 5,
      defense: 5,
      luck: 5,
      balance: DEFAULT_BALANCE - FORGE_COST,
    });

    socket.emit("spawned", {
      id: socket.id,
      balance: DEFAULT_BALANCE - FORGE_COST,
      clothes,
      weapon,
    });

    io.emit("glitchLog", {
      type: "forge",
      message: `${characters.get(socket.id).name} forged a character.`,
    });

    io.emit("characterCount", characters.size);
    io.emit("rumbleState", rumbleState);
  });

  socket.on("upgrade", (data) => {
    const char = characters.get(socket.id);
    if (!char) return;

    const { stat, cost } = data;
    const costs = { attack: 200, defense: 200, luck: 150 };
    const c = costs[stat];
    if (!c || cost !== c || char.balance < cost) return;

    char.balance -= cost;
    char[stat] = Math.min(10, (char[stat] || 5) + 1);

    socket.emit("balanceUpdate", { balance: char.balance });
    socket.emit("statsUpdate", { attack: char.attack, defense: char.defense, luck: char.luck });
  });

  socket.on("openPit", () => {
    const chars = Array.from(characters.values());
    if (rumbleState.phase !== "idle" || chars.length < MIN_PIT_ENTRIES) return;

    rumbleState.phase = "entries";
    rumbleState.participants = [];
    rumbleState.prizePool = 0;
    rumbleState.spectatorPool = 0;
    rumbleState.spectatorBets = {};
    rumbleState.winner = null;
    rumbleState.events = [];
    rumbleState.seedId = null;
    rumbleState.gameMode = null;

    io.emit("glitchLog", {
      type: "rumble",
      message: `THE PIT IS OPEN! Enter with your bet. 1 player = Duel vs House (2x). 2-3 = Rumble (Winner Takes All). Max ${MAX_PIT_PLAYERS}.`,
    });
    io.emit("rumbleState", rumbleState);
  });

  socket.on("enterPit", (data) => {
    const char = characters.get(socket.id);
    if (!char || rumbleState.phase !== "entries") return;
    if (rumbleState.participants.length >= MAX_PIT_PLAYERS) return;

    const amount = typeof data === "number" ? data : data?.amount || 0;
    if (amount < BET_MIN || amount > char.balance) return;

    const alreadyEntered = rumbleState.participants.some((p) => p.id === socket.id);
    if (alreadyEntered) return;

    char.balance -= amount;
    rumbleState.participants.push({ ...char, isAlive: true, betAmount: amount });
    rumbleState.prizePool += amount;

    socket.emit("balanceUpdate", { balance: char.balance });
    io.emit("glitchLog", {
      type: "forge",
      message: `${char.name} entered the PIT with ${amount} PITS! (${rumbleState.participants.length}/${MAX_PIT_PLAYERS})`,
    });
    io.emit("rumbleState", rumbleState);
  });

  socket.on("betOnWarrior", (data) => {
    const char = characters.get(socket.id);
    if (!char || rumbleState.phase !== "entries") return;
    const warriorId = data?.warriorId;
    const amount = typeof data?.amount === "number" ? data.amount : 0;
    if (!warriorId || amount < BET_MIN || amount > char.balance) return;

    const isDuel = rumbleState.participants.length === 1;
    const warrior = rumbleState.participants.find((p) => p.id === warriorId) ||
      (isDuel && warriorId === SYSTEM_SENTINEL_ID ? { id: SYSTEM_SENTINEL_ID, name: SYSTEM_SENTINEL_NAME } : null);
    if (!warrior) return;
    if (rumbleState.participants.some((p) => p.id === socket.id)) return;

    const multiplier = getMultiplierForAmount(amount);
    char.balance -= amount;
    rumbleState.spectatorPool = (rumbleState.spectatorPool || 0) + amount;
    rumbleState.spectatorBets[socket.id] = { warriorId, amount, multiplier };

    socket.emit("balanceUpdate", { balance: char.balance });
    io.emit("glitchLog", {
      type: "rumble",
      message: `${char.name} bet ${amount} PITS on ${warrior.name} (${multiplier}x). Potential win: ${Math.floor(amount * multiplier)} PITS.`,
    });
    io.emit("rumbleState", rumbleState);
  });

  const RUMBLE_TICK_MS = 3000;

  socket.on("runRumble", () => {
    if (rumbleState.phase !== "entries" || rumbleState.participants.length < MIN_PIT_ENTRIES) return;

    rumbleState.phase = "battle";
    rumbleState.seedId = `rumble-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const isDuel = rumbleState.participants.length === 1;
    rumbleState.gameMode = isDuel ? "duel" : "rumble";

    if (isDuel) {
      io.emit("glitchLog", { type: "rumble", message: "[SYSTEM]: Duel Initiated. 2x Payout active." });
      io.emit("glitchLog", {
        type: "rumble",
        message: `The PIT erupts! Seed: ${rumbleState.seedId}. 1 vs House. Pot: ${rumbleState.prizePool} PITS. Defeat the Sentinel to double your data.`,
      });
    } else {
      io.emit("glitchLog", { type: "rumble", message: "[SYSTEM]: Rumble Detected. Winner Takes All." });
      io.emit("glitchLog", {
        type: "rumble",
        message: `The PIT erupts! Seed: ${rumbleState.seedId}. ${rumbleState.participants.length} fighters. Pot: ${rumbleState.prizePool} PITS. Only one can remain.`,
      });
    }

    let participantsForRumble = rumbleState.participants.map((p) => ({ ...p, isAlive: true }));
    if (isDuel) {
      participantsForRumble = [
        ...participantsForRumble,
        { id: SYSTEM_SENTINEL_ID, name: SYSTEM_SENTINEL_NAME, isAlive: true, loreClass: "The House" },
      ];
    } else {
      participantsForRumble = participantsForRumble.slice(0, MAX_PIT_PLAYERS);
    }

    const result = runRumble(participantsForRumble, { seed: rumbleState.seedId });
    const events = result.events || [];

    rumbleState.participants = rumbleState.participants.map((p) => ({ ...p, isAlive: true }));
    if (isDuel) {
      rumbleState.participants.push({ id: SYSTEM_SENTINEL_ID, name: SYSTEM_SENTINEL_NAME, isAlive: true, loreClass: "The House" });
    }
    rumbleState.events = [];
    io.emit("rumbleState", rumbleState);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= events.length) {
        clearInterval(interval);
        rumbleState.winner = result.winner;
        rumbleState.phase = "finished";

        const humanWinner = result.winner && result.winner.id !== SYSTEM_SENTINEL_ID;

        if (isDuel) {
          const entryFee = rumbleState.prizePool;
          if (humanWinner) {
            const duelPayout = entryFee * 2;
            const winnerChar = characters.get(result.winner.id);
            if (winnerChar) {
              winnerChar.balance += duelPayout;
              io.to(result.winner.id).emit("balanceUpdate", { balance: winnerChar.balance });
              io.to(result.winner.id).emit("youWon", { name: result.winner.name, amount: duelPayout });
            }
            leaderboard.unshift({
              name: result.winner.name,
              amount: duelPayout,
              seedId: rumbleState.seedId,
              date: new Date().toISOString(),
            });
            if (leaderboard.length > 10) leaderboard.pop();
            emitLeaderboard();
            io.emit("glitchLog", { type: "winner", message: `🏆 ${result.winner.name} defeated the Sentinel! +${duelPayout} PITS (2x).` });
          } else {
            io.emit("glitchLog", { type: "winner", message: `System Sentinel wins. Entry fee burned.` });
          }
        } else {
          const feeMult = 1 - HOUSE_FEE_PERCENT / 100;
          const grandPayout = Math.floor(rumbleState.prizePool * feeMult);
          const spectatorPayoutPool = Math.floor((rumbleState.spectatorPool || 0) * feeMult);

          if (result.winner) {
            const winnerChar = characters.get(result.winner.id);
            if (winnerChar) {
              winnerChar.balance += grandPayout;
              io.to(result.winner.id).emit("balanceUpdate", { balance: winnerChar.balance });
            }
            const winnerBets = Object.entries(rumbleState.spectatorBets || {}).filter(
              ([_, b]) => b.warriorId === result.winner.id
            );
            const totalOwed = winnerBets.reduce((sum, [_, b]) => sum + b.amount * (b.multiplier || 2), 0);
            const scale = totalOwed > 0 && totalOwed > spectatorPayoutPool ? spectatorPayoutPool / totalOwed : 1;
            winnerBets.forEach(([sid, bet]) => {
              const mult = bet.multiplier || 2;
              const rawPayout = bet.amount * mult;
              const share = Math.floor(rawPayout * scale);
              const c = characters.get(sid);
              if (c && share > 0) {
                c.balance += share;
                io.to(sid).emit("balanceUpdate", { balance: c.balance });
                io.to(sid).emit("glitchLog", { type: "payout", message: `You won ${share} PITS on ${result.winner.name}! (${mult}x bet)` });
              }
            });
            leaderboard.unshift({
              name: result.winner.name,
              amount: grandPayout,
              seedId: rumbleState.seedId,
              date: new Date().toISOString(),
            });
            if (leaderboard.length > 10) leaderboard.pop();
            emitLeaderboard();
            io.emit("glitchLog", {
              type: "winner",
              message: `🏆 ${result.winner.name} WINS! Took ${grandPayout} PITS (after ${HOUSE_FEE_PERCENT}% fee). Seed: ${rumbleState.seedId}`,
            });
            io.to(result.winner.id).emit("youWon", { name: result.winner.name, amount: grandPayout });
          }
        }

        io.emit("rumbleState", rumbleState);
        return;
      }

      const evt = events[idx];
      const victim = rumbleState.participants.find((p) => p.id === evt.victimId);
      if (victim) victim.isAlive = false;
      rumbleState.events.push(evt);

      const msg = evt.timeStr ? `${evt.timeStr} ${evt.message}` : evt.message;
      io.emit("glitchLog", { type: evt.type === "kill" ? "kill" : "event", message: msg });
      io.emit("rumbleEvent", evt);
      io.emit("rumbleState", rumbleState);
      idx++;
    }, RUMBLE_TICK_MS);
  });

  socket.on("resetRumble", () => {
    if (rumbleState.phase !== "finished") return;
    rumbleState.phase = "idle";
    rumbleState.participants = [];
    rumbleState.prizePool = 0;
    rumbleState.spectatorPool = 0;
    rumbleState.spectatorBets = {};
    rumbleState.winner = null;
    rumbleState.seedId = null;
    rumbleState.gameMode = null;
    io.emit("rumbleState", rumbleState);
  });

  socket.on("disconnect", () => {
    const char = characters.get(socket.id);
    if (char) {
      io.emit("glitchLog", { type: "disconnect", message: `${char.name} disconnected.` });
      characters.delete(socket.id);
      io.emit("characterCount", characters.size);
    }
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`> Glitch Pits Socket server on port ${PORT}`);
});
