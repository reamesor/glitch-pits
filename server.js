/**
 * Local dev: Next.js + Glitch Pits Socket (Bettor vs House only)
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

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

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const characters = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, { cors: { origin: "*" } });

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
      io.emit("glitchLog", { type: "upgrade", message: `${char.name} upgraded ${stat}!` });
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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Glitch Pits running at http://${hostname}:${port} (Bettor vs House)`);
    });
});
