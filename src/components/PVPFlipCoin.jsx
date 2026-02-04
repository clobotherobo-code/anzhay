import { useState, useEffect, useRef } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import './PVPFlipCoin.css'
import coinHead from './Anzhay/coinanjing.png'
import coinTail from './Anzhay/coinayam.png'
import { PublicKey } from '@solana/web3.js'
import {
  hasFlipProgram,
  createFlipProgram,
  createRoomTx,
  joinRoomTx,
  resolveTx,
  fetchAllRooms,
  getRoomPda,
} from '../solana/flipProgram'

const HEADS = 'heads'
const TAILS = 'tails'
const FLIP_DURATION_MS = 3500

// In-memory room storage (for demo - production needs backend or Solana program)
// Room key = creator's nickname
const roomsStore = {}

export default function PVPFlipCoin({ nickname, onClose, onTitleBarMouseDown, onGameEnd }) {
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [mode, setMode] = useState('create') // 'create' | 'join'
  const [betAmount, setBetAmount] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [selectedChainRoomCreator, setSelectedChainRoomCreator] = useState(null) // Pubkey (base58) when joining on-chain room
  const [myChoice, setMyChoice] = useState(HEADS)
  const [createdRoom, setCreatedRoom] = useState(null) // { code, amount, onChain?, creatorPubkey? }
  const [joinedRoom, setJoinedRoom] = useState(null)
  const [flipResult, setFlipResult] = useState(null) // 'heads' | 'tails'
  const [status, setStatus] = useState('')
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipAnimationResult, setFlipAnimationResult] = useState(null) // 'heads' | 'tails' during animation
  const [chainRooms, setChainRooms] = useState([]) // rooms from chain when hasFlipProgram()
  const [txPending, setTxPending] = useState(false)
  const gameReportedRef = useRef(false)

  const useOnChain = hasFlipProgram() && connected && publicKey
  const program = useOnChain ? createFlipProgram(connection, { publicKey }) : null

  useEffect(() => {
    if (!useOnChain || !program) return
    fetchAllRooms(program).then(setChainRooms).catch(() => setChainRooms([]))
  }, [useOnChain, program, mode])

  const handleCreateRoom = async () => {
    const amount = parseFloat(betAmount)
    const creatorNickname = (nickname || '').trim()
    if (!amount || amount <= 0) {
      setStatus('Enter bet amount (SOL)')
      return
    }
    if (amount > 10000) {
      setStatus('Max bet is 10,000 SOL')
      return
    }
    if (!connected) {
      setStatus('Connect wallet first!')
      return
    }
    if (!creatorNickname) {
      setStatus('Nickname required to create a room')
      return
    }
    if (creatorNickname.length < 2 || creatorNickname.length > 24) {
      setStatus('Nickname must be 2–24 characters')
      return
    }

    if (useOnChain && program && sendTransaction) {
      setTxPending(true)
      setStatus('Sending transaction...')
      try {
        const tx = await createRoomTx(program, amount)
        const sig = await sendTransaction(tx, connection, { skipPreflight: false })
        setStatus(`Room created on-chain! Tx: ${sig.slice(0, 8)}...`)
        setCreatedRoom({ code: creatorNickname, amount, onChain: true, creatorPubkey: publicKey.toBase58() })
      } catch (e) {
        setStatus(e?.message || 'Transaction failed')
      }
      setTxPending(false)
      return
    }

    roomsStore[creatorNickname] = {
      creator: publicKey?.toBase58(),
      creatorNickname,
      amount: amount,
      challenger: null,
      challengerChoice: null,
      result: null,
    }
    setCreatedRoom({ code: creatorNickname, amount })
    setStatus(`Room created! Others can join by selecting your nickname in the list.`)
  }

  const handleJoinRoom = async () => {
    if (!connected) {
      setStatus('Connect wallet first!')
      return
    }

    if (selectedChainRoomCreator && program && sendTransaction) {
      setTxPending(true)
      setStatus('Sending join transaction...')
      try {
        const choiceNum = myChoice === HEADS ? 0 : 1
        const tx = await joinRoomTx(program, new PublicKey(selectedChainRoomCreator), choiceNum)
        await sendTransaction(tx, connection, { skipPreflight: false })
        const chainRoom = chainRooms.find((r) => r.creator.toBase58() === selectedChainRoomCreator)
        const amount = chainRoom ? Number(chainRoom.amount) : 0
        setJoinedRoom({
          code: selectedChainRoomCreator,
          amount,
          choice: myChoice,
          onChain: true,
          roomCreatorPubkey: selectedChainRoomCreator,
        })
        setStatus('Joined! Flip will run; then resolve on-chain.')
        const result = Math.random() < 0.5 ? 'heads' : 'tails'
        setFlipAnimationResult(result)
        setIsFlipping(true)
      } catch (e) {
        setStatus(e?.message || 'Join transaction failed')
      }
      setTxPending(false)
      return
    }

    const code = (roomCode || '').trim()
    if (!code) {
      setStatus('Select or enter a creator nickname')
      return
    }
    const room = roomsStore[code]
    if (!room) {
      setStatus('Room not found')
      return
    }
    if (room.creator === publicKey?.toBase58()) {
      setStatus("You can't join your own room")
      return
    }
    roomsStore[code].challenger = publicKey?.toBase58()
    roomsStore[code].challengerNickname = nickname
    roomsStore[code].challengerChoice = myChoice
    setJoinedRoom({ code, amount: room.amount, choice: myChoice })
    setStatus('Joined! Click Flip to play.')

    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    roomsStore[code].result = result
    setFlipAnimationResult(result)
    setIsFlipping(true)
  }

  const handleFlip = () => {
    if (!createdRoom) return
    if (createdRoom.onChain) {
      const result = Math.random() < 0.5 ? 'heads' : 'tails'
      setFlipAnimationResult(result)
      setIsFlipping(true)
      return
    }
    const room = roomsStore[createdRoom.code]
    const result = Math.random() < 0.5 ? 'heads' : 'tails'
    room.result = result
    setFlipAnimationResult(result)
    setIsFlipping(true)
  }

  useEffect(() => {
    if (!isFlipping || !flipAnimationResult) return
    const t = setTimeout(() => {
      setFlipResult(flipAnimationResult)
      setIsFlipping(false)
      setStatus(`Result: ${flipAnimationResult.toUpperCase()}!`)
    }, FLIP_DURATION_MS)
    return () => clearTimeout(t)
  }, [isFlipping, flipAnimationResult])

  useEffect(() => {
    if (isFlipping) {
      gameReportedRef.current = false
      resolveSentRef.current = false
    }
  }, [isFlipping])

  const hasChallenger = createdRoom && (createdRoom.onChain ? true : roomsStore[createdRoom.code]?.challenger)
  const isCreatorWinner = flipResult && createdRoom && hasChallenger && roomsStore[createdRoom.code]?.challengerChoice !== flipResult
  const isChallengerWinner = flipResult && joinedRoom && joinedRoom.choice === flipResult

  // On-chain resolve: after flip, send resolve tx so winner receives SOL
  const resolveSentRef = useRef(false)
  useEffect(() => {
    if (!flipResult || !program || !sendTransaction || resolveSentRef.current) return
    const run = async () => {
      const resultNum = flipResult === 'heads' ? 0 : 1
      let winnerPubkey
      if (joinedRoom?.onChain && joinedRoom?.roomCreatorPubkey) {
        winnerPubkey = isChallengerWinner ? publicKey : new PublicKey(joinedRoom.roomCreatorPubkey)
      } else if (createdRoom?.onChain && createdRoom?.creatorPubkey) {
        try {
          const roomPda = getRoomPda(new PublicKey(createdRoom.creatorPubkey))
          const acc = await connection.getAccountInfo(roomPda)
          if (!acc) return
          const roomData = await program.account.room.fetch(roomPda)
          const choice = roomData.challengerChoice != null ? Number(roomData.challengerChoice) : 0
          winnerPubkey = resultNum === choice ? roomData.challenger : roomData.creator
        } catch (_) {
          return
        }
      } else return
      resolveSentRef.current = true
      try {
        const creatorPk = joinedRoom?.onChain ? joinedRoom.roomCreatorPubkey : createdRoom?.creatorPubkey
        const tx = await resolveTx(program, new PublicKey(creatorPk), resultNum, winnerPubkey)
        await sendTransaction(tx, connection, { skipPreflight: false })
      } catch (_) {}
    }
    run()
  }, [flipResult, program, sendTransaction, connection, joinedRoom, createdRoom, isChallengerWinner, publicKey])

  // Report winner/loser for leaderboard (winstreak) — once per game
  useEffect(() => {
    if (!flipResult || !onGameEnd || gameReportedRef.current) return
    const creatorNickname = createdRoom?.code ?? joinedRoom?.code
    if (!creatorNickname) return
    const room = roomsStore[creatorNickname]
    if (!room?.challenger) return
    const challengerNickname = room.challengerNickname ?? (joinedRoom ? nickname : null)
    if (!challengerNickname) return
    const winner = createdRoom
      ? (isCreatorWinner ? creatorNickname : challengerNickname)
      : (isChallengerWinner ? nickname : creatorNickname)
    const loser = winner === creatorNickname ? challengerNickname : creatorNickname
    gameReportedRef.current = true
    onGameEnd(winner, loser)
  }, [flipResult, createdRoom, joinedRoom, hasChallenger, isCreatorWinner, isChallengerWinner, nickname, onGameEnd])

  // Room list: in-memory (nickname) + on-chain (creator pubkey)
  const roomList = Object.entries(roomsStore).map(([creatorNickname, room]) => ({
    code: creatorNickname,
    amount: room.amount,
    creator: room.creator,
    hasChallenger: !!room.challenger,
    onChain: false,
  }))

  const selectRoom = (code, chainCreator = null) => {
    setRoomCode(code || '')
    setSelectedChainRoomCreator(chainCreator || null)
  }

  return (
    <div className="pvp-flip-coin" onClick={(e) => e.stopPropagation()}>
      <div
        className="pvp-titlebar pvp-titlebar-draggable"
        onMouseDown={onTitleBarMouseDown}
      >
        <span className="pvp-title">PVP Flip Coin</span>
        <div className="pvp-titlebar-buttons">
          <button type="button" className="win95-btn-close" onClick={onClose}>
            <span className="win95-btn-icon-close" />
          </button>
        </div>
      </div>

      <div className="pvp-body">
      {!connected && (
        <div className="pvp-wallet-hint">
          <p>Connect your wallet via the top-right panel first.</p>
          <p className="pvp-hint">Click the connect button on the desktop, then come back here.</p>
        </div>
      )}

      {connected && (
          <>
            <div className="pvp-tabs">
              <button
                type="button"
                className={`pvp-tab ${mode === 'create' ? 'pvp-tab-active' : ''}`}
                onClick={() => setMode('create')}
              >
                Create Room (User A)
              </button>
              <button
                type="button"
                className={`pvp-tab ${mode === 'join' ? 'pvp-tab-active' : ''}`}
                onClick={() => setMode('join')}
              >
                Join Room (User B)
              </button>
            </div>

            {mode === 'create' && (
              <div className="pvp-form">
                <label>Bet Amount (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="pvp-input"
                />
                <button type="button" className="pvp-btn" onClick={handleCreateRoom} disabled={txPending}>
                  {txPending ? 'Sending...' : 'Create Room'}
                </button>
                {createdRoom && (
                  <div className="pvp-room-info">
                    <p>Your room: <strong>{createdRoom.code}</strong></p>
                    <p>Amount: {createdRoom.amount} SOL</p>
                    <p className="pvp-hint">Test: you can Flip without a challenger. In production: share the code with the challenger.</p>
                    <button type="button" className="pvp-btn" onClick={handleFlip}>
                      Flip Coin
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'join' && (
              <div className="pvp-form">
                <label>Room list (creator nickname or on-chain)</label>
                <div className="pvp-room-list">
                  {roomList.length === 0 && (!chainRooms || chainRooms.length === 0) ? (
                    <p className="pvp-room-list-empty">No rooms yet. Ask User A to create one.</p>
                  ) : (
                    <>
                      {roomList.map((room) => (
                        <button
                          key={room.code}
                          type="button"
                          className={`pvp-room-list-item ${roomCode === room.code && !selectedChainRoomCreator ? 'pvp-room-list-item-selected' : ''}`}
                          onClick={() => selectRoom(room.code, null)}
                        >
                          <span className="pvp-room-list-nickname">{room.code}</span>
                          <span className="pvp-room-list-amount">{room.amount} SOL</span>
                          <span className="pvp-room-list-status">{room.hasChallenger ? 'In game' : 'Waiting'}</span>
                        </button>
                      ))}
                      {chainRooms.length > 0 && (
                        <>
                          <p className="pvp-room-list-section">On-chain (real SOL)</p>
                          {chainRooms.map((room) => {
                            const creatorStr = room.creator.toBase58()
                            const short = `${creatorStr.slice(0, 4)}...${creatorStr.slice(-4)}`
                            return (
                              <button
                                key={creatorStr}
                                type="button"
                                className={`pvp-room-list-item ${selectedChainRoomCreator === creatorStr ? 'pvp-room-list-item-selected' : ''}`}
                                onClick={() => selectRoom('', creatorStr)}
                              >
                                <span className="pvp-room-list-nickname">{short}</span>
                                <span className="pvp-room-list-amount">{(Number(room.amount) / 1e9).toFixed(2)} SOL</span>
                                <span className="pvp-room-list-status">{room.challenger ? 'In game' : 'Waiting'}</span>
                              </button>
                            )
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>
                <label>Creator nickname</label>
                <input
                  type="text"
                  placeholder="Select from list or type nickname"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.trim())}
                  className="pvp-input"
                />
                <label>Choose Head or Tail</label>
                <div className="pvp-choice">
                  <label>
                    <input
                      type="radio"
                      name="choice"
                      value={HEADS}
                      checked={myChoice === HEADS}
                      onChange={() => setMyChoice(HEADS)}
                    />
                    Head
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="choice"
                      value={TAILS}
                      checked={myChoice === TAILS}
                      onChange={() => setMyChoice(TAILS)}
                    />
                    Tail
                  </label>
                </div>
                <button type="button" className="pvp-btn" onClick={handleJoinRoom}>
                  Join & Deposit
                </button>
                {joinedRoom && flipResult && !isFlipping && (
                  <div className={`pvp-result ${isChallengerWinner ? 'pvp-win' : 'pvp-lose'}`}>
                    <p>Result: {flipResult.toUpperCase()}</p>
                    <p>{isChallengerWinner ? 'You win!' : 'You lose.'}</p>
                  </div>
                )}
              </div>
            )}

            {createdRoom && flipResult && !isFlipping && (
              <div className={`pvp-result ${hasChallenger ? (isCreatorWinner ? 'pvp-win' : 'pvp-lose') : ''}`}>
                <p>Result: {flipResult.toUpperCase()}</p>
                {hasChallenger && <p>{isCreatorWinner ? 'You win!' : 'You lose.'}</p>}
              </div>
            )}

            <div className="pvp-coin-container">
              <div
                className={`pvp-coin ${
                  isFlipping && flipAnimationResult
                    ? flipAnimationResult === 'tails'
                      ? 'pvp-coin-flip-tails'
                      : 'pvp-coin-flip-heads'
                    : `pvp-coin-static pvp-coin-show-${flipResult || 'heads'}`
                }`}
              >
                <div className="pvp-coin-face pvp-coin-face-head">
                  <img src={coinHead} alt="Head" />
                </div>
                <div className="pvp-coin-face pvp-coin-face-tail">
                  <img src={coinTail} alt="Tail" />
                </div>
              </div>
            </div>

            {status && <p className="pvp-status">{status}</p>}
          </>
        )}
      </div>
    </div>
  )
}
