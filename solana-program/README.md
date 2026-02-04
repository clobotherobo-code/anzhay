# ANZHAY Flip Coin – Solana Program

On-chain escrow for PVP Flip Coin. Creator and challenger each lock SOL; after the flip, the winner receives all.

## Flow

1. **create_room(amount)** – Creator deposits `amount` lamports into a PDA (seeds: `["room", creator_pubkey]`).
2. **join_room(choice)** – Challenger deposits the same amount; `choice`: 0 = heads, 1 = tails.
3. **resolve(result)** – After the flip, result 0 = heads, 1 = tails. Winner (creator or challenger) receives all escrowed SOL.

## Build & deploy

**Prereqs:** [Rust](https://rustup.rs/), [Solana CLI](https://docs.solana.com/cli/install-cli-tools), [Anchor](https://www.anchor-lang.com/docs/installation) (0.29.x).

```bash
cd solana-program
anchor build
# Program ID is in target/deploy/anzhay_flip-keypair.json and in declare_id! in lib.rs
# Deploy to devnet:
solana config set --url devnet
anchor deploy --provider.cluster devnet
# Copy the program ID from the deploy output
```

Then in the **frontend** `.env`:

```
VITE_FLIP_PROGRAM_ID=<your_deployed_program_id>
```

Restart `npm run dev`. Create Room will send real SOL to the escrow; Join and Resolve will use the program.

## Frontend

When `VITE_FLIP_PROGRAM_ID` is set:

- **Create Room** sends a `create_room` transaction (SOL locked on-chain).
- **Room list** shows on-chain rooms (creator address, amount).
- **Join** sends `join_room(choice)` (challenger locks same amount).
- After the flip, **Resolve** sends `resolve(result)` so the winner receives SOL.

Without the env var, PVP runs in demo mode (in-memory, no real SOL).
