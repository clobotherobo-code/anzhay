# ANZHAY OS – Langkah deploy & jalanin semua

## 1. Jalanin app (tanpa backend / tanpa program)

```bash
npm install
npm run dev
```

Buka http://localhost:5173. PVP jalan mode demo (in-memory).

---

## 2. Jalanin backend (leaderboard sync)

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run dev
```

File `.env` sudah berisi `VITE_API_URL=http://localhost:3001`. Leaderboard sync ke backend.

---

## 3. Taruhan SOL beneran (program on-chain)

### 3.1 Install Anchor

- macOS/Linux: https://www.anchor-lang.com/docs/installation  
- Setelah install: `anchor --version`

### 3.2 Build & deploy program

```bash
cd solana-program
anchor build
```

Ambil program ID:

```bash
anchor keys list
```

Copy **Program Id** yang keluar (mis. `Abc123...`).

Deploy ke devnet (butuh wallet devnet + SOL):

```bash
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
```

Kalau deploy berhasil, program ID yang tampil harus sama dengan `anchor keys list`. Kalau beda, pakai yang dari output `anchor deploy`.

### 3.3 Set program ID di frontend

Buka file **`.env`** di root project. Isi (ganti dengan program ID kamu):

```
VITE_FLIP_PROGRAM_ID=Abc123...program_id_kamu...
```

Simpan, lalu restart:

```bash
npm run dev
```

Sekarang Create Room / Join / Resolve pakai SOL beneran di devnet.

---

## 4. Ringkasan env (`.env`)

| Variable | Fungsi |
|----------|--------|
| `VITE_API_URL` | Backend API (localhost:3001 kalau jalanin `npm run server`) |
| `VITE_SOLANA_RPC` | RPC Solana (sudah di-set devnet di kode) |
| `VITE_FLIP_PROGRAM_ID` | Program ID setelah `anchor deploy` (taruhan SOL on-chain) |

Semua sudah diatur di `.env`; tinggal isi `VITE_FLIP_PROGRAM_ID` setelah deploy program.
