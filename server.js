const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const DEFAULT_BALANCE = 5000;
const FORGE_COST = 1000;
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const PLAYER_SIZE = 16;
const ATTACK_RANGE = 24;

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

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const players = new Map();

  io.on("connection", (socket) => {
    socket.on("forge", (data) => {
      const playerName = typeof data === "string" ? data : data?.name;
      const clothes = typeof data === "object" ? (data.clothes || "vest") : "vest";
      const weapon = typeof data === "object" ? (data.weapon || "sword") : "sword";
      const balance = DEFAULT_BALANCE;
      const x = Math.random() * (ARENA_WIDTH - PLAYER_SIZE);
      const y = Math.random() * (ARENA_HEIGHT - PLAYER_SIZE);

      players.set(socket.id, {
        id: socket.id,
        name: playerName || `Player_${socket.id.slice(0, 6)}`,
        x,
        y,
        balance: balance - FORGE_COST,
        lastAttack: 0,
        isAlive: true,
        facing: "down",
        clothes,
        weapon,
      });

      const otherPlayers = Array.from(players.entries())
        .filter(([id]) => id !== socket.id)
        .map(([, p]) => ({
          id: p.id,
          name: p.name,
          x: p.x,
          y: p.y,
          balance: p.balance,
          isAlive: p.isAlive,
          facing: p.facing || "down",
          clothes: p.clothes || "vest",
          weapon: p.weapon || "sword",
        }));

      socket.emit("spawned", {
        id: socket.id,
        balance: balance - FORGE_COST,
        x,
        y,
        clothes,
        weapon,
      });
      socket.emit("players", otherPlayers);

      io.emit("playerJoined", {
        id: socket.id,
        name: players.get(socket.id).name,
        x,
        y,
        balance: balance - FORGE_COST,
        facing: "down",
        clothes,
        weapon,
      });

      io.emit("glitchLog", {
        type: "forge",
        message: `${players.get(socket.id).name} entered the PITS.`,
      });

      io.emit("playerCount", players.size);
    });

    socket.on("move", (data) => {
      const player = players.get(socket.id);
      if (!player || !player.isAlive) return;

      let { x, y } = player;
      const speed = 4;
      let facing = player.facing || "down";

      if (data.left) {
        x = Math.max(0, x - speed);
        facing = "left";
      }
      if (data.right) {
        x = Math.min(ARENA_WIDTH - PLAYER_SIZE, x + speed);
        facing = "right";
      }
      if (data.up) {
        y = Math.max(0, y - speed);
        facing = "up";
      }
      if (data.down) {
        y = Math.min(ARENA_HEIGHT - PLAYER_SIZE, y + speed);
        facing = "down";
      }

      player.x = x;
      player.y = y;
      player.facing = facing;

      io.emit("playerMoved", { id: socket.id, x, y, facing });
    });

    socket.on("attack", () => {
      const attacker = players.get(socket.id);
      if (!attacker || !attacker.isAlive) return;

      const now = Date.now();
      if (now - attacker.lastAttack < 500) return;
      attacker.lastAttack = now;

      const ax = attacker.x + PLAYER_SIZE / 2;
      const ay = attacker.y + PLAYER_SIZE / 2;

      for (const [targetId, target] of players) {
        if (targetId === socket.id || !target.isAlive) continue;

        const tx = target.x + PLAYER_SIZE / 2;
        const ty = target.y + PLAYER_SIZE / 2;
        const dist = Math.hypot(ax - tx, ay - ty);

        if (dist < ATTACK_RANGE) {
          const victimBalance = target.balance;
          const toKiller = Math.floor(victimBalance * 0.5);
          const burned = Math.floor(victimBalance * 0.25);
          const toTreasury = Math.floor(victimBalance * 0.25);

          attacker.balance += toKiller;
          target.isAlive = false;

          socket.emit("balanceUpdate", { balance: attacker.balance, fromKill: toKiller });
          io.to(targetId).emit("killed", { killerId: socket.id, killerName: attacker.name });

          io.emit("glitchLog", {
            type: "kill",
            message: `${target.name} was DE-REZZED by ${attacker.name}!`,
            victimId: targetId,
            killerId: socket.id,
          });

          io.emit("balanceSplit", {
            killerId: socket.id,
            victimId: targetId,
            toKiller: toKiller,
            burned,
            toTreasury,
          });

          players.delete(targetId);
          io.emit("playerCount", players.size);
          return;
        }
      }
    });

    socket.on("disconnect", () => {
      const player = players.get(socket.id);
      if (player) {
        io.emit("glitchLog", {
          type: "disconnect",
          message: `${player.name} disconnected.`,
        });
        players.delete(socket.id);
        io.emit("playerCount", players.size);
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
