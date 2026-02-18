/**
 * Local dev server: Next.js + Glitch Pits Socket (Rumble Royale style)
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { runRumble } = require("./socket-server/rumbleEngine");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const DEFAULT_BALANCE = 5000;
const FORGE_COST = 1000;
const MIN_PIT_ENTRIES = 2;
const BET_MIN = 50;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const characters = new Map();
const rumbleState = {
  phase: "idle",
  participants: [],
  events: [],
  winner: null,
  prizePool: 0,
};

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
    socket.emit("rumbleState", rumbleState);
    socket.emit("characterCount", characters.size);

    socket.on("forge", (data) => {
      const name = typeof data === "string" ? data : data?.name;
      const clothes = typeof data === "object" ? (data.clothes || "vest") : "vest";
      const weapon = typeof data === "object" ? (data.weapon || "sword") : "sword";

      characters.set(socket.id, {
        id: socket.id,
        name: name || `Player_${socket.id.slice(0, 6)}`,
        clothes,
        weapon,
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
        message: `${characters.get(socket.id).name} entered the PITS.`,
      });
      io.emit("characterCount", characters.size);
      io.emit("rumbleState", rumbleState);
    });

    socket.on("openPit", () => {
      const chars = Array.from(characters.values());
      if (rumbleState.phase !== "idle" || chars.length < MIN_PIT_ENTRIES) return;

      rumbleState.phase = "entries";
      rumbleState.participants = [];
      rumbleState.prizePool = 0;
      rumbleState.winner = null;
      rumbleState.events = [];

      io.emit("glitchLog", {
        type: "rumble",
        message: `THE PIT IS OPEN! Enter with your character and bet amount. Winner takes all.`,
      });
      io.emit("rumbleState", rumbleState);
    });

    socket.on("enterPit", (data) => {
      const char = characters.get(socket.id);
      if (!char || rumbleState.phase !== "entries") return;

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
        message: `${char.name} entered the PIT with ${amount} PITS!`,
      });
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
      io.emit("glitchLog", { type: "upgrade", message: `${char.name} upgraded ${stat}!` });
    });

    socket.on("runRumble", () => {
      if (rumbleState.phase !== "entries" || rumbleState.participants.length < MIN_PIT_ENTRIES) return;
      rumbleState.phase = "battle";

      io.emit("glitchLog", {
        type: "rumble",
        message: `The PIT erupts! ${rumbleState.participants.length} fighters. Total pot: ${rumbleState.prizePool} PITS.`,
      });

      const stats = Object.fromEntries(
        rumbleState.participants.map((p) => [
          p.id,
          { attack: p.attack, defense: p.defense, luck: p.luck },
        ])
      );

    const participantsCopy = rumbleState.participants.map((p) => ({ ...p }));
    const result = runRumble(
      participantsCopy,
      stats,
      (evt) => {
          io.emit("glitchLog", { type: evt.type === "kill" ? "kill" : "event", message: evt.message });
          io.emit("rumbleEvent", evt);
          rumbleState.events.push(evt);
        }
      );

      rumbleState.participants = participantsCopy;
      rumbleState.winner = result.winner;
      rumbleState.phase = "finished";

      if (result.winner) {
        const winnerChar = characters.get(result.winner.id);
        if (winnerChar) {
          winnerChar.balance += rumbleState.prizePool;
          io.to(result.winner.id).emit("balanceUpdate", { balance: winnerChar.balance });
        }

        io.emit("glitchLog", {
          type: "winner",
          message: `🏆 ${result.winner.name} WINS! Took all ${rumbleState.prizePool} PITS. Where are your gods now?`,
        });

        io.to(result.winner.id).emit("youWon", {
          name: result.winner.name,
          amount: rumbleState.prizePool,
        });
      }
      io.emit("rumbleState", rumbleState);
    });

    socket.on("resetRumble", () => {
      if (rumbleState.phase !== "finished") return;
      rumbleState.phase = "idle";
      rumbleState.participants = [];
      rumbleState.winner = null;
      rumbleState.prizePool = 0;
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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Glitch Pits running at http://${hostname}:${port}`);
    });
});
