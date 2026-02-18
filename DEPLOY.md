# Glitch Pits – Deploy (Vercel + Railway)

Your frontend is on **Vercel** and your real-time socket server must run elsewhere (e.g. **Railway**). Here’s how to get both running and connected.

---

## 1. Deploy the Socket Server on Railway

1. Go to **[railway.app](https://railway.app)** and sign in (GitHub is easiest).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your **glitch-pits** repo. If it’s not listed, connect GitHub and grant access to the repo.
4. After the project is created, click the new **service** (the repo you just added).
5. Open **Settings** (or the **Variables** tab):
   - **Root Directory:** set to `socket-server`  
     (so Railway uses the `socket-server` folder, not the repo root).
   - **Build Command:** leave empty or set to `npm install`.
   - **Start Command:** leave as `npm start` (runs `node index.js`).
6. Add an environment variable (Settings → Variables, or the Variables tab):
   - **Name:** `CORS_ORIGIN`  
   - **Value:** your Vercel app URL, e.g. `https://glitch-pits.vercel.app`  
     (no trailing slash). This lets the browser connect to the socket from your frontend.
7. In **Settings**, find **Networking** / **Public Networking** and turn on **Generate Domain** (or add a public domain). Railway will give you a URL like:
   - `https://glitch-pits-production.up.railway.app`
8. Copy that **public URL** — this is your **Socket Server URL**. You’ll use it in the next step.

---

## 2. Point the Frontend to the Socket Server (Vercel)

1. Go to **[vercel.com](https://vercel.com)** → your **glitch-pits** project.
2. Open **Settings** → **Environment Variables**.
3. Add a new variable:
   - **Name:** `NEXT_PUBLIC_SOCKET_URL`
   - **Value:** the Railway socket URL from step 1, e.g. `https://glitch-pits-production.up.railway.app`
   - Apply to **Production** (and Preview if you want).
4. Save.
5. Trigger a new deploy: **Deployments** → **⋯** on the latest deployment → **Redeploy** (or push a new commit).  
   The frontend is built with the new env var, so the app will connect to your Railway socket server.

---

## 3. Check That It Works

- Open your Vercel app (e.g. `https://glitch-pits.vercel.app`).
- You should see **● CONNECTED** in the header when the socket server is reachable.
- If you see **○ OFFLINE**, check:
  - Railway service is running and has a **public URL**.
  - `CORS_ORIGIN` on Railway matches your Vercel URL exactly (no trailing slash).
  - `NEXT_PUBLIC_SOCKET_URL` on Vercel is the full Railway URL (including `https://`).
  - You redeployed Vercel after adding the variable.

---

## Summary

| Where   | What to set |
|--------|-------------|
| **Railway** | Root Directory: `socket-server`; `CORS_ORIGIN` = your Vercel URL (e.g. `https://glitch-pits.vercel.app`); get the service **public URL**. |
| **Vercel**  | `NEXT_PUBLIC_SOCKET_URL` = that Railway public URL (e.g. `https://glitch-pits-production.up.railway.app`), then **Redeploy**. |

After that, real-time features (lobby, rumble, lore feed, etc.) will use the socket server on Railway.
