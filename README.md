# ANZHAY OS – Windows 95 Retro

A retro Windows 95–themed web app with BIOS boot, desktop, PVP Flip Coin (Solana), Global chat, Leaderboard, and Community links.

## Features

- **BIOS boot** – Phoenix-style POST, then ANZHAY OS logo
- **Desktop** – Folders: Meme, X, Community, PVP, Global chat, Leaderboard
- **Meme** – Image gallery with preview
- **X** – Link to Twitter
- **Community** – Window with Discord/Telegram/X links (edit `COMMUNITY_LINKS` in code)
- **PVP Flip Coin** – Create/join rooms by nickname, flip coin (coinanjing/coinayam), wallet + nickname required
- **Global chat** – Send messages (wallet + nickname required)
- **Leaderboard** – Winstreak from PVP; persists in localStorage and syncs with API when configured
- **Solana wallet** – Connect via wallet adapter (Phantom, etc.)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Langkah lengkap (backend, program Solana, env):** lihat **[DEPLOY.md](./DEPLOY.md)**.

## Optional: Backend API

For shared rooms, chat, and leaderboard across users:

```bash
# Install deps (express, cors are in package.json)
npm install
# Run API (default port 3001)
npm run server
```

The repo includes a `.env` with `VITE_API_URL=http://localhost:3001` and `VITE_SOLANA_RPC=https://api.devnet.solana.com`. Restart `npm run dev` after changing `.env`. Leaderboard syncs with the API; see `src/api.js` for rooms/chat.

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel / Netlify)

1. Push to GitHub and connect the repo to Vercel or Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add env (if using API): `VITE_API_URL=https://your-api-url.com`
5. Deploy the backend separately (e.g. Railway, Render) and set `VITE_API_URL` to that URL.

## Solana program (on-chain escrow)

See `solana-program/README.md` for a reference on building an Anchor/native program for real SOL escrow (create room, join, resolve). The app currently uses in-memory rooms; replace with program instructions once deployed.

## Tech

- Vite, React
- Solana wallet adapter
- Optional: Express backend (see `server/index.js`)
