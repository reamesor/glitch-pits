# Glitch Pits — Investor Pitch Document

**Product:** Glitch Pits | $PITS  
**Tagline:** *Stake your PITS. Multiply or burn. No middle ground.*  
**One-liner:** A transparent, real-time betting game where players stake PITS tokens on gladiator battles; wins multiply the stake, losses burn tokens permanently.

---

## 1. Executive Summary

Glitch Pits is a web-based, real-time betting game built on a retro arcade aesthetic. Players connect a Solana wallet, create a gladiator character, and stake **PITS** tokens on 50/50 battles against the House. **Win:** the player receives their stake back plus a multiplier payout. **Lose:** the staked PITS are **burned** — removed from circulation permanently. There are no partial refunds, no rollbacks, and no hidden odds. The only outcomes are multiply or burn. PITS function as the sole in-game currency: earned by entering and winning, spent on bets and character upgrades in the Black Market. The burning mechanism is core to the product: it creates clear token utility, transparent deflationary pressure, and a simple value story for investors and players.

---

## 2. What the Website and Game Are

### 2.1 The Product

- **Platform:** A responsive web app (Next.js) with a real-time backend (Socket.io). Players use Solana wallets (e.g. Phantom, Solflare) to connect; no app-store install required.
- **Experience:** Dark, retro/cyberpunk UI (CRT-style scanlines, pixel fonts, neon accents). Sound effects and click feedback keep the experience arcade-like and engaging.
- **Flow:**  
  1. **Landing** — User sees “ENTER” and lore.  
  2. **Connect wallet** — Required to proceed (Solana).  
  3. **Enter the Pits** — User is prompted to create a character in **The Forge**.  
  4. **The Forge** — Name, clothes, weapon, and avatar. On creation, the player receives **2,000 PITS** to start (1,000 base + 1,000 for forging).  
  5. **Main arena** — Player sees balance, places bets, watches simulated battles, and uses **AUTOBET** for multiple rounds with live session P&amp;L.  
  6. **Black Market** — Spend PITS on Attack, Defense, and Luck upgrades.  
  7. **Dashboard** — Per-wallet stats (wagered, won, lost, net, upgrades) and **Total Burned (all players)** from the server.

### 2.2 Core Loop

- **Stake** → Choose bet size (50, 100, 250, 500, or 1,000 PITS).  
- **Battle** → A simulated “gladiator vs House” round runs in real time (flavor text in the Glitch Log).  
- **Outcome** → 50/50: **Win** = stake × multiplier paid out; **Lose** = stake is **burned**.  
- **Repeat** → Place another bet, use AUTOBET, or spend PITS in the Black Market.

There is no “house edge” in the sense of skewed odds; the economic edge comes from **burn on loss** and optional spending on upgrades.

---

## 3. Betting Mechanics (Full Details)

### 3.1 Bet Amounts and Multipliers

| Bet (PITS) | Multiplier | Potential win (if win) |
|------------|------------|-------------------------|
| 50         | 1.5×       | 75 PITS                 |
| 100        | 2×         | 200 PITS                |
| 250        | 2.5×       | 625 PITS                |
| 500        | 3×         | 1,500 PITS              |
| 1,000      | 4×         | 4,000 PITS              |

- **Minimum bet:** 50 PITS.  
- **Maximum bet:** Player’s current balance (capped per round).  
- **Payout on win:** `floor(bet × multiplier)` (no “stake back + profit” double-count; the multiplier already represents total payout).  
- **On loss:** Entire stake is burned; player receives nothing.

### 3.2 Round Flow

1. Player clicks **PLACE BET** (or AUTOBET runs the next bet).  
2. Stake is deducted from balance immediately.  
3. Server (or client fallback) resolves win/loss with 50/50 probability.  
4. **Win:** Balance is credited with `bet × multiplier`.  
5. **Lose:** Balance is unchanged (already deducted); the staked amount is added to **total burned** and is gone forever.  
6. Glitch Log and Dashboard (and optional AUTOBET panel) update; next round can start.

### 3.3 AUTOBET and Risk Transparency

- Players can run multiple bets in sequence (e.g. 5, 10, 20, 50, 100, or unlimited).  
- **Live session stats** are shown: current bet number, **session P&amp;L** (e.g. +120 or −50 PITS), and status (Fighting / Result / Next in 0.6s).  
- This supports risk management and keeps the “multiply or burn” loop clear and engaging.

---

## 4. PITS Token — Role and Flows

### 4.1 What PITS Are

- **In-game currency:** The only currency used in the Pits.  
- **Earned by:**  
  - Entering the Pits and forging a character: **2,000 PITS** (one-time per character).  
  - Winning rounds: payout = `bet × multiplier`.  
- **Spent on:**  
  - **Bets** — Every round consumes PITS as stake; on loss, that stake is **burned**.  
  - **Black Market** — Attack (+1 hit chance): 200 PITS; Defense (−1 hit taken): 200 PITS; Luck (+1 survival luck): 150 PITS.  

So PITS have **clear utility**: access (via forge reward), betting (stake and multiply), and upgrades (stronger character). Every loss removes PITS from circulation.

### 4.2 Token Flows (Simplified)

```
[Player] ── forge ──► +2,000 PITS (one-time)
[Player] ── win round ──► + (bet × multiplier) PITS
[Player] ── lose round ──► − bet PITS (burned)
[Player] ── Black Market upgrade ──► − 150 or 200 PITS (spent to House/system)
```

Burned PITS are not recycled; they leave circulation. Upgrades are a separate sink (tokens spent, not necessarily “burned” in the same ledger — can be framed as revenue or treasury depending on token design).

---

## 5. Burning System — How It Works

### 5.1 Definition of “Burn”

- **Burn** = permanent removal of PITS from circulation.  
- **When:** Every time a player **loses** a round, the **entire staked amount** is burned.  
- **Where:** The server (and client) maintain a **total burned** counter: `totalBurnedAllPits`.  
- **Visibility:** The Dashboard shows **Total Burned (all Glitch Pits)** — the sum of all lost stakes across all players, in real time from the server.

### 5.2 Mechanics (Technical)

1. Player places a bet of **X** PITS.  
2. Balance is reduced by **X** immediately.  
3. Round is resolved (50/50).  
4. **If win:** Balance is increased by `X × multiplier`. No burn.  
5. **If lose:**  
   - Balance is not credited (X was already deducted).  
   - The server adds **X** to `totalBurnedAllPits`.  
   - The server broadcasts `totalBurned` to all clients so the global burned count stays in sync.  
6. Burned tokens are **not** sent to any wallet or pool; they are accounted for as “removed from play” and never re-minted for this game.

### 5.3 Why Burning Matters (Investor Angle)

- **Deflationary pressure:** As play continues, losses continuously remove PITS from circulation.  
- **Transparent:** Every loss is a burn; no hidden mechanics.  
- **Simple story:** “Multiply or burn” is easy to explain and to audit.  
- **Utility-driven:** Tokens are used to play and to upgrade; burn is the cost of losing, which ties token demand to engagement and risk-taking.  
- **Scalable narrative:** If PITS later become a tradable or listed token, the burn mechanic supports a clear value proposition (reduced supply over time with activity).

---

## 6. Black Market (Upgrades)

- **Purpose:** Let players spend PITS to improve their gladiator’s stats (Attack, Defense, Luck).  
- **Costs:** Attack 200 PITS, Defense 200 PITS, Luck 150 PITS (per upgrade).  
- **Effect (lore):** “+1 Hit chance”, “−1 Hit taken”, “+1 Survival luck” — in a future version these could influence win probability; today they are a PITS sink and progression hook.  
- **Result:** Another use case for PITS beyond betting, increasing retention and token velocity.

---

## 7. Dashboard and Stats

- **Per wallet:** Total wagered, total won, total lost, net (won − lost), upgrade count, current in-game balance.  
- **Global:** **Total Burned (all Glitch Pits)** — live from server, all players.  
- **Optional:** “View another address” — paste any address to see its stored stats (for transparency or community tracking).  
- Stats are persisted locally and synced with server balance and burn events so the dashboard is useful for both players and (in a pitch) for demonstrating engagement and burn volume.

---

## 8. Technical Snapshot (For Due Diligence)

- **Frontend:** Next.js, React, Tailwind, Zustand (state).  
- **Real-time:** Socket.io (custom server) for forge, placeBet, balance updates, glitch log, character count, and **totalBurned** broadcast.  
- **Wallet:** Solana (Wallet Adapter); Phantom, Solflare, etc. Connect required to enter; address used for dashboard and (if needed later) for on-chain PITS.  
- **Backend:** Node + Socket.io server; in-memory character/balance and `totalBurnedAllPits`; can be replaced or extended with a DB and on-chain settlement.  
- **Deployment:** Web app and socket server can run on standard cloud (e.g. Vercel + a Node host for sockets).

---

## 9. Vision and Differentiation

- **Transparent odds:** 50/50 per round; only stake size and multiplier vary. No hidden house edge.  
- **Single outcome:** Win (multiply) or lose (burn). No partial refunds or complex side bets.  
- **Token-native:** PITS are the only in-game currency; burn on loss ties tokenomics directly to gameplay.  
- **Retro/arcade feel:** Distinct aesthetic and UX (sound, click feedback, AUTOBET session stats) to stand out in the gaming/betting space.  
- **Ready to extend:** Design supports future steps such as on-chain PITS, staking, or tournaments without changing the core “multiply or burn” message.

---

## 10. Summary Table (Quick Reference)

| Topic              | Detail |
|--------------------|--------|
| **Game type**      | Real-time, 50/50 gladiator vs House betting |
| **Currency**      | PITS only (earn by forge + wins; spend on bets + Black Market) |
| **Bet range**      | 50–1,000 PITS per round |
| **Multipliers**    | 1.5× to 4× by stake tier |
| **On win**         | Payout = bet × multiplier |
| **On loss**        | Stake **burned** (permanent), added to total burned |
| **Burn visibility**| Dashboard: “Total Burned (all Glitch Pits)” — live, all players |
| **Starting PITS**  | 2,000 after forging one character |
| **Sinks**          | Bets (burn on loss), Black Market upgrades |

---

*Document generated from the Glitch Pits codebase and product design. For the live product, see the deployed app and in-app HELP / Lore.*
