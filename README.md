# Glitch Pits ($PITS)

Spectator betting "Rumble Royale" — forge characters, upgrade stats, bet on who wins. Lore-rich text describes what happens in the pit. **Users don't control characters during battle.**

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Game Flow

1. **The Forge** – Burn 1,000 Mock-PITS to create your character (start with 5,000)
2. **Upgrades** – Black Market: spend PITS on Attack, Defense, Luck (increases win chance)
3. **Start Rumble** – When 2+ characters exist
4. **Bet** – Place PITS on who you think will win
5. **Run Rumble** – Battle is simulated; lore text streams to Glitch Log
6. **Winner** gets prize pool; bettors who picked them get 2× their bet

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Socket.io (real-time multiplayer)
- Zustand (state)
- HTML5 Canvas (game arena)

## Deployment

### Vercel (Frontend) + Railway/Render (Socket Server)

Vercel is serverless and doesn't support WebSockets. Use a split deployment:

1. **Deploy frontend to Vercel**
   - Connect this repo to Vercel
   - Add env var: `NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app` (or your socket server URL)

2. **Deploy socket server to Railway** (or Render, Fly.io)
   - Create new project, connect this repo
   - Set root directory to `socket-server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add env var: `CORS_ORIGIN=https://your-app.vercel.app` (your Vercel URL)
   - Copy the public URL → use as `NEXT_PUBLIC_SOCKET_URL` in Vercel

### Local Development

Runs both Next.js and Socket.io from one server – no split needed.

## Mock Economy

Focus is on a mock economy first; blockchain integration will come later.
