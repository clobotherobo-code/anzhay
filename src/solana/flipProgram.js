/**
 * ANZHAY Flip Coin – Solana program client.
 * Use when VITE_FLIP_PROGRAM_ID is set (after deploying programs/anzhay_flip).
 */
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import idl from '../idl/anzhay_flip.json'

let PROGRAM_ID = null
try {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FLIP_PROGRAM_ID) {
    PROGRAM_ID = new PublicKey(import.meta.env.VITE_FLIP_PROGRAM_ID)
  }
} catch (_) {
  PROGRAM_ID = null
}

export function hasFlipProgram() {
  return !!PROGRAM_ID
}

export function getProgramId() {
  return PROGRAM_ID
}

// Browser-safe seed (no Buffer dependency)
const ROOM_SEED = new Uint8Array([114, 111, 111, 109]) // 'room'

export function getRoomPda(creatorPubkey, programId = PROGRAM_ID) {
  if (!programId) return null
  const [pda] = PublicKey.findProgramAddressSync(
    [ROOM_SEED, creatorPubkey.toBytes()],
    programId
  )
  return pda
}

/** Pass connection and an object with publicKey (e.g. wallet from useWallet). Used to build txs; send with wallet.sendTransaction(). */
export function createFlipProgram(connection, walletOrPublicKey) {
  if (!PROGRAM_ID || !connection) return null
  const publicKey = walletOrPublicKey?.publicKey ?? walletOrPublicKey
  if (!publicKey) return null
  const provider = new AnchorProvider(
    connection,
    { publicKey, signTransaction: async (tx) => tx },
    { commitment: 'confirmed' }
  )
  return new Program(idl, PROGRAM_ID, provider)
}

/** amount in SOL (converted to lamports). Returns transaction. */
export async function createRoomTx(program, amountSol) {
  const amount = Math.floor(amountSol * 1e9)
  if (amount <= 0) throw new Error('Invalid amount')
  const creator = program.provider.publicKey
  const roomPda = getRoomPda(creator, program.programId)
  return await program.methods
    .createRoom(new BN(amount))
    .accounts({
      creator,
      room: roomPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction()
}

/** choice: 0 = heads, 1 = tails. roomCreatorPubkey = creator of the room (for PDA). */
export async function joinRoomTx(program, roomCreatorPubkey, choice) {
  const challenger = program.provider.publicKey
  const roomPda = getRoomPda(roomCreatorPubkey, program.programId)
  return await program.methods
    .joinRoom(choice)
    .accounts({
      challenger,
      room: roomPda,
      systemProgram: SystemProgram.programId,
    })
    .transaction()
}

/** result: 0 = heads, 1 = tails. winnerPubkey = creator or challenger who wins. */
export async function resolveTx(program, roomCreatorPubkey, result, winnerPubkey) {
  const authority = program.provider.publicKey
  const roomPda = getRoomPda(roomCreatorPubkey, program.programId)
  return await program.methods
    .resolve(result)
    .accounts({
      authority,
      room: roomPda,
      winner: winnerPubkey,
      systemProgram: SystemProgram.programId,
    })
    .transaction()
}

/** Fetch all Room accounts from the program. */
export async function fetchAllRooms(program) {
  const accounts = await program.account.room.all()
  return accounts.map((a) => ({
    publicKey: a.publicKey,
    creator: a.account.creator,
    amount: a.account.amount,
    challenger: a.account.challenger,
    challengerChoice: a.account.challengerChoice,
    result: a.account.result,
  }))
}

