# Glitch Pits ($PITS)

High-stakes 8-bit Multiplayer "Rumble Royale" with a glitch-horror pixel aesthetic.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Controls

- **WASD** – Movement
- **Space** – Attack

## Game Flow

1. **The Forge** – Burn 1,000 Mock-PITS to enter (start with 5,000)
2. **Kill-to-Win** – When you kill another player:
   - 50% of their balance → you
   - 25% → burned (removed)
   - 25% → Treasury
3. **Black Market** – Shop for items; 100% burn on purchase

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
