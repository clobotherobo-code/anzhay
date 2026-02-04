/**
 * ANZHAY OS – Backend API (optional)
 * Run: node server/index.js
 * Set VITE_API_URL=http://localhost:3001 in frontend .env to use this API.
 */
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// In-memory stores (replace with DB in production)
const rooms = {}       // { [creatorNickname]: { creator, creatorNickname, amount, challenger, challengerNickname, challengerChoice, result } }
const chatMessages = [] // { id, nickname, text, time }[]
const leaderboard = {}  // { [nickname]: winStreak }

// --- Rooms ---
app.get('/api/rooms', (req, res) => {
  const list = Object.entries(rooms).map(([code, room]) => ({
    code,
    amount: room.amount,
    creator: room.creator,
    hasChallenger: !!room.challenger,
  }))
  res.json(list)
})

app.post('/api/rooms', (req, res) => {
  const { creatorNickname, creator, amount } = req.body
  if (!creatorNickname || !amount || amount <= 0) {
    return res.status(400).json({ error: 'creatorNickname and amount required' })
  }
  rooms[creatorNickname] = {
    creator: creator || null,
    creatorNickname,
    amount: Number(amount),
    challenger: null,
    challengerNickname: null,
    challengerChoice: null,
    result: null,
  }
  res.json({ code: creatorNickname, amount: rooms[creatorNickname].amount })
})

app.get('/api/rooms/:nickname', (req, res) => {
  const room = rooms[req.params.nickname]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json(room)
})

app.patch('/api/rooms/:nickname/join', (req, res) => {
  const room = rooms[req.params.nickname]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const { challenger, challengerNickname, challengerChoice } = req.body
  room.challenger = challenger || null
  room.challengerNickname = challengerNickname || null
  room.challengerChoice = challengerChoice || null
  res.json(room)
})

app.patch('/api/rooms/:nickname/result', (req, res) => {
  const room = rooms[req.params.nickname]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const { result } = req.body
  room.result = result || null
  res.json(room)
})

// --- Chat ---
app.get('/api/chat', (req, res) => {
  res.json(chatMessages)
})

app.post('/api/chat', (req, res) => {
  const { nickname, text } = req.body
  if (!nickname || !text || !String(text).trim()) {
    return res.status(400).json({ error: 'nickname and text required' })
  }
  const msg = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    nickname: String(nickname).slice(0, 24),
    text: String(text).trim().slice(0, 500),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
  chatMessages.push(msg)
  if (chatMessages.length > 500) chatMessages.shift()
  res.json(msg)
})

// --- Leaderboard ---
app.get('/api/leaderboard', (req, res) => {
  const list = Object.entries(leaderboard)
    .map(([nickname, winStreak]) => ({ nickname, winStreak }))
    .filter((e) => e.winStreak > 0)
    .sort((a, b) => b.winStreak - a.winStreak)
  res.json(list)
})

app.post('/api/leaderboard/game-end', (req, res) => {
  const { winnerNickname, loserNickname } = req.body
  if (!winnerNickname) return res.status(400).json({ error: 'winnerNickname required' })
  leaderboard[winnerNickname] = (leaderboard[winnerNickname] || 0) + 1
  if (loserNickname) leaderboard[loserNickname] = 0
  res.json(leaderboard)
})

app.listen(PORT, () => {
  console.log(`ANZHAY API running at http://localhost:${PORT}`)
})
