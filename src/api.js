/**
 * API client for ANZHAY backend. Used when VITE_API_URL is set.
 */
const base = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : ''

export function hasApi() {
  return !!base
}

export async function getRooms() {
  if (!base) return []
  const res = await fetch(`${base}/api/rooms`)
  if (!res.ok) return []
  return res.json()
}

export async function createRoom({ creatorNickname, creator, amount }) {
  if (!base) return null
  const res = await fetch(`${base}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorNickname, creator, amount }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function getRoom(nickname) {
  if (!base) return null
  const res = await fetch(`${base}/api/rooms/${encodeURIComponent(nickname)}`)
  if (!res.ok) return null
  return res.json()
}

export async function joinRoom(nickname, { challenger, challengerNickname, challengerChoice }) {
  if (!base) return null
  const res = await fetch(`${base}/api/rooms/${encodeURIComponent(nickname)}/join`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenger, challengerNickname, challengerChoice }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function setRoomResult(nickname, result) {
  if (!base) return null
  const res = await fetch(`${base}/api/rooms/${encodeURIComponent(nickname)}/result`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function getChatMessages() {
  if (!base) return []
  const res = await fetch(`${base}/api/chat`)
  if (!res.ok) return []
  return res.json()
}

export async function sendChatMessage(nickname, text) {
  if (!base) return null
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, text }),
  })
  if (!res.ok) return null
  return res.json()
}

export async function getLeaderboard() {
  if (!base) return []
  const res = await fetch(`${base}/api/leaderboard`)
  if (!res.ok) return []
  return res.json()
}

export async function postGameEnd(winnerNickname, loserNickname) {
  if (!base) return
  await fetch(`${base}/api/leaderboard/game-end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerNickname, loserNickname }),
  })
}
