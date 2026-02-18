# Glitch Pits – Deploy to GitHub & Vercel

## 1. Push to GitHub

Create a new repository on GitHub, then run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/glitch-pits.git
git push -u origin main
```

Or with SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/glitch-pits.git
git push -u origin main
```

## 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo `glitch-pits`
3. **Do not** add `NEXT_PUBLIC_SOCKET_URL` yet
4. Deploy (the build will succeed, but real-time features won’t work until step 3)

## 3. Deploy Socket Server (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `glitch-pits`
3. In **Settings**:
   - **Root Directory:** `socket-server`
   - **Build Command:** `npm install` (or leave empty)
   - **Start Command:** `npm start`
4. Add variable: `CORS_ORIGIN` = `https://your-app.vercel.app` (your Vercel URL)
5. Deploy and copy the public URL (e.g. `https://glitch-pits-socket-production.up.railway.app`)

## 4. Connect Vercel to Socket Server

1. In Vercel: **Project → Settings → Environment Variables**
2. Add: `NEXT_PUBLIC_SOCKET_URL` = your Railway socket URL
3. **Redeploy** the Vercel project

Your Glitch Pits app should now be live with real-time gameplay.
