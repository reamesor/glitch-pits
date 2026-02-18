/**
 * Glitch Pits - Bettor vs House only. Tokens from bet amount × multiplier on win.
 */
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;
const DEFAULT_BALANCE = 5000;
const FORGE_COST = 1000;
const BET_MIN = 50;
const LORE_CLASSES = ["The Overclocked", "The Virus", "The Null", "The Glitch", "The Fork", "The Stack", "The Kernel"];

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

io.on("connection", (socket) => {
  socket.emit("characterCount", characters.size);

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

  socket.on("placeBet", (data) => {
    const char = characters.get(socket.id);
    if (!char) return;

    const amount = typeof data === "number" ? data : data?.amount || 0;
    if (amount < BET_MIN || amount > char.balance) return;

    char.balance -= amount;
    const multiplier = getMultiplierForAmount(amount);
    const won = Math.random() < 0.5;

    if (won) {
      const payout = Math.floor(amount * multiplier);
      char.balance += payout;
      socket.emit("balanceUpdate", { balance: char.balance });
      socket.emit("betResult", { won: true, amount, multiplier, payout });
      socket.emit("youWon", { name: char.name, amount: payout });
      io.emit("glitchLog", {
        type: "winner",
        message: `${char.name} bet ${amount} PITS (${multiplier}x) and won ${payout} PITS!`,
      });
    } else {
      socket.emit("balanceUpdate", { balance: char.balance });
      socket.emit("betResult", { won: false, amount, multiplier, payout: 0 });
      io.emit("glitchLog", {
        type: "rumble",
        message: `${char.name} bet ${amount} PITS (${multiplier}x). House wins.`,
      });
    }
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
  console.log(`> Glitch Pits Socket server on port ${PORT} (Bettor vs House)`);
});
