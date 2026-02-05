import { useState, useRef, useEffect, Component } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { hasApi, getLeaderboard, postGameEnd } from '../api'
import BiosScreen from './BiosScreen'
import PVPFlipCoin from './PVPFlipCoin'

/** Catches errors in PVP window so we show a message instead of blank white. */
class PVPWindowErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error)
      return (
        <div className="pvp-flip-coin" style={{ minHeight: 200 }}>
          <div className="pvp-titlebar pvp-titlebar-draggable" onMouseDown={this.props.onTitleBarMouseDown}>
            <span className="pvp-title">PVP Flip Coin</span>
            <div className="pvp-titlebar-buttons">
              <button type="button" className="win95-btn-close" onClick={this.props.onClose}>
                <span className="win95-btn-icon-close" />
              </button>
            </div>
          </div>
          <div className="pvp-body" style={{ padding: 16, background: '#c0c0c0' }}>
            <p style={{ color: '#c00', marginBottom: 8 }}>Something went wrong loading PVP.</p>
            <p style={{ fontSize: 11, color: '#333', wordBreak: 'break-all' }}>{msg}</p>
            <button type="button" className="pvp-btn" style={{ marginTop: 12 }} onClick={this.props.onClose}>
              Close
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
import GlobalChat from './GlobalChat'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import './Windows95Desktop.css'
import bgImage from './Anzhay/bg.png'
import petImage from './Anzhay/pet.png'
import anjingGif from './Anzhay/anjing.gif'
import clickSnd from './Anzhay/click.mp3'
import tadaSnd from './Anzhay/tada.mp3'
import meme1 from './Anzhay/meme1.jpeg'
import meme2 from './Anzhay/meme2.png'
import meme3 from './Anzhay/meme3.png'
import meme4 from './Anzhay/meme4.png'
import meme5 from './Anzhay/meme5.png'
import meme6 from './Anzhay/meme6.png'
import meme7 from './Anzhay/meme7.png'
import meme8 from './Anzhay/meme8.png'
import meme9 from './Anzhay/meme9.png'
import xIcon from './Anzhay/x.png'
import commIcon from './Anzhay/comm.png'
import memeIcon from './Anzhay/meme.png'
import chatIcon from './Anzhay/chat.png'
import pvpIcon from './Anzhay/coinanjing.png'
import tanggaIcon from './Anzhay/tangga.svg'

const MEME_FILES = [
  { name: 'meme1.jpeg', src: meme1 },
  { name: 'meme2.png', src: meme2 },
  { name: 'meme3.png', src: meme3 },
  { name: 'meme4.png', src: meme4 },
  { name: 'meme5.png', src: meme5 },
  { name: 'meme6.png', src: meme6 },
  { name: 'meme7.png', src: meme7 },
  { name: 'meme8.png', src: meme8 },
  { name: 'meme9.png', src: meme9 },
]

const COMMUNITY_LINKS = [
  { label: 'X Community', url: 'https://x.com/i/communities/2019405481496965334' },
  { label: 'Discord', url: 'https://discord.gg/' },
  { label: 'Telegram', url: 'https://t.me/' },
]

const DESKTOP_ICONS = [
  { label: 'Meme', icon: 'folder', iconSrc: memeIcon, x: 16, y: 16 },
  { label: 'X', icon: 'folder', iconSrc: xIcon, x: 16, y: 96 },
  { label: 'Community', icon: 'folder', iconSrc: commIcon, x: 16, y: 176 },
  { label: 'PVP', icon: 'folder', iconSrc: pvpIcon, x: 16, y: 256 },
  { label: 'Global chat', icon: 'folder', iconSrc: chatIcon, iconSize: 'lg', x: 16, y: 336 },
  { label: 'Leaderboard', icon: 'folder', iconSrc: tanggaIcon, iconClass: 'win95-icon-tangga-dark', x: 16, y: 416 },
]

const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' // replace with actual address
const CA_SHORT = CONTRACT_ADDRESS.length >= 8
  ? `CA: ${CONTRACT_ADDRESS.slice(0, 4)}..${CONTRACT_ADDRESS.slice(-2)}`
  : `CA: ${CONTRACT_ADDRESS}`

const NICKNAMES_STORAGE_KEY = 'anzhay_nicknames' // { [walletAddress]: nickname } per wallet
const LEADERBOARD_STORAGE_KEY = 'anzhay_leaderboard'
const INITIAL_WINDOW_POS = { x: 80, y: 60 }
const WINDOW_Z_INDEX = 50
const WINDOW_Z_INDEX_FOCUSED = 60

function getStoredNicknames() {
  try {
    const raw = localStorage.getItem(NICKNAMES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function getStoredNickname(walletAddress) {
  if (!walletAddress) return ''
  return getStoredNicknames()[walletAddress] || ''
}

function setStoredNickname(walletAddress, value) {
  if (!walletAddress) return
  const obj = getStoredNicknames()
  obj[walletAddress] = value
  try {
    localStorage.setItem(NICKNAMES_STORAGE_KEY, JSON.stringify(obj))
  } catch (_) {}
}

function getStoredLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export default function Windows95Desktop() {
  const { connected, publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58() ?? ''
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [bootVisible, setBootVisible] = useState(true) // true | 'fadeout' | false
  const [memeWindowOpen, setMemeWindowOpen] = useState(false)
  const [pvpWindowOpen, setPvpWindowOpen] = useState(false)
  const [globalChatWindowOpen, setGlobalChatWindowOpen] = useState(false)
  const [leaderboardWindowOpen, setLeaderboardWindowOpen] = useState(false)
  const [communityWindowOpen, setCommunityWindowOpen] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState(() => getStoredLeaderboard())
  const [nickname, setNickname] = useState('')
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false)

  // Sync nickname from storage when wallet changes (setiap wallet punya nickname sendiri)
  useEffect(() => {
    setNickname(getStoredNickname(walletAddress))
  }, [walletAddress])
  const [nicknameInput, setNicknameInput] = useState('')
  const [pendingOpen, setPendingOpen] = useState(null) // 'pvp' | 'globalchat' | null
  const [memeWindowPos, setMemeWindowPos] = useState(INITIAL_WINDOW_POS)
  const [memeWindowZIndex, setMemeWindowZIndex] = useState(WINDOW_Z_INDEX)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewImage, setPreviewImage] = useState(null) // { src, name } | null
  const [previewPos, setPreviewPos] = useState({ x: 120, y: 100 })
  const [isDraggingPreview, setIsDraggingPreview] = useState(false)
  const [pvpWindowPos, setPvpWindowPos] = useState({ x: 100, y: 80 })
  const [isDraggingPvp, setIsDraggingPvp] = useState(false)
  const [globalChatWindowPos, setGlobalChatWindowPos] = useState({ x: 120, y: 90 })
  const [isDraggingGlobalChat, setIsDraggingGlobalChat] = useState(false)
  const [leaderboardWindowPos, setLeaderboardWindowPos] = useState({ x: 140, y: 70 })
  const [isDraggingLeaderboard, setIsDraggingLeaderboard] = useState(false)
  const [communityWindowPos, setCommunityWindowPos] = useState({ x: 160, y: 50 })
  const [isDraggingCommunity, setIsDraggingCommunity] = useState(false)
  const dragStart = useRef({ clientX: 0, clientY: 0, left: 0, top: 0 })
  const previewDragStart = useRef({ clientX: 0, clientY: 0, left: 0, top: 0 })
  const pvpDragStart = useRef({ clientX: 0, clientY: 0, left: 0, top: 0 })
  const globalChatDragStart = useRef({ clientX: 0, clientY: 0, left: 0, top: 0 })
  const leaderboardDragStart = useRef({ clientX: 0, clientY: 0, left: 0, top: 0 })
  const communityDragStart = useRef({ clientX: 0, clientY: 0, left: 0, top: 0 })

  const copyContractAddress = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  const playClick = () => {
    if (bootVisible) return
    const a = new Audio(clickSnd)
    a.volume = 0.5
    a.play().catch(() => {})
  }

  const handleBootComplete = () => {
    const t = new Audio(tadaSnd)
    t.volume = 0.6
    t.play().catch(() => {})
    setBootVisible('fadeout')
    setTimeout(() => setBootVisible(false), 600)
  }

  const handleTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: memeWindowPos.x,
      top: memeWindowPos.y,
    }
    setIsDragging(true)
    setMemeWindowZIndex(WINDOW_Z_INDEX_FOCUSED)
  }

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e) => {
      setMemeWindowPos({
        x: dragStart.current.left + (e.clientX - dragStart.current.clientX),
        y: dragStart.current.top + (e.clientY - dragStart.current.clientY),
      })
    }
    const onUp = () => setIsDragging(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDragging])

  const focusMemeWindow = () => {
    setMemeWindowZIndex(WINDOW_Z_INDEX_FOCUSED)
  }

  useEffect(() => {
    if (memeWindowOpen) setMemeWindowZIndex(WINDOW_Z_INDEX_FOCUSED)
  }, [memeWindowOpen])

  const handlePreviewTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    previewDragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: previewPos.x,
      top: previewPos.y,
    }
    setIsDraggingPreview(true)
  }

  useEffect(() => {
    if (!isDraggingPreview) return
    const onMove = (e) => {
      setPreviewPos({
        x: previewDragStart.current.left + (e.clientX - previewDragStart.current.clientX),
        y: previewDragStart.current.top + (e.clientY - previewDragStart.current.clientY),
      })
    }
    const onUp = () => setIsDraggingPreview(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingPreview])

  const handlePvpTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    pvpDragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: pvpWindowPos.x,
      top: pvpWindowPos.y,
    }
    setIsDraggingPvp(true)
  }

  useEffect(() => {
    if (!isDraggingPvp) return
    const onMove = (e) => {
      setPvpWindowPos({
        x: pvpDragStart.current.left + (e.clientX - pvpDragStart.current.clientX),
        y: pvpDragStart.current.top + (e.clientY - pvpDragStart.current.clientY),
      })
    }
    const onUp = () => setIsDraggingPvp(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingPvp])

  const handleGlobalChatTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    globalChatDragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: globalChatWindowPos.x,
      top: globalChatWindowPos.y,
    }
    setIsDraggingGlobalChat(true)
  }

  useEffect(() => {
    if (!isDraggingGlobalChat) return
    const onMove = (e) => {
      setGlobalChatWindowPos({
        x: globalChatDragStart.current.left + (e.clientX - globalChatDragStart.current.clientX),
        y: globalChatDragStart.current.top + (e.clientY - globalChatDragStart.current.clientY),
      })
    }
    const onUp = () => setIsDraggingGlobalChat(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingGlobalChat])

  const handleLeaderboardTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    leaderboardDragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: leaderboardWindowPos.x,
      top: leaderboardWindowPos.y,
    }
    setIsDraggingLeaderboard(true)
  }

  useEffect(() => {
    if (!isDraggingLeaderboard) return
    const onMove = (e) => {
      setLeaderboardWindowPos({
        x: leaderboardDragStart.current.left + (e.clientX - leaderboardDragStart.current.clientX),
        y: leaderboardDragStart.current.top + (e.clientY - leaderboardDragStart.current.clientY),
      })
    }
    const onUp = () => setIsDraggingLeaderboard(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingLeaderboard])

  const handleCommunityTitleBarMouseDown = (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    communityDragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: communityWindowPos.x,
      top: communityWindowPos.y,
    }
    setIsDraggingCommunity(true)
  }

  useEffect(() => {
    if (!isDraggingCommunity) return
    const onMove = (e) => {
      setCommunityWindowPos({
        x: communityDragStart.current.left + (e.clientX - communityDragStart.current.clientX),
        y: communityDragStart.current.top + (e.clientY - communityDragStart.current.clientY),
      })
    }
    const onUp = () => setIsDraggingCommunity(false)
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingCommunity])

  const handleDesktopItemClick = (label) => {
    const key = label.toLowerCase().replace(/\s+/g, '')
    if (key === 'meme') {
      setMemeWindowOpen(true)
      return
    }
    if (key === 'x') {
      window.open('https://x.com/anzhay_os', '_blank', 'noopener,noreferrer')
      return
    }
    if (key === 'community') {
      setCommunityWindowOpen(true)
      return
    }
    if (key === 'leaderboard') {
      setLeaderboardWindowOpen(true)
      return
    }
    if (key === 'pvp' || key === 'globalchat') {
      if (!connected) {
        alert('Connect wallet first.')
        return
      }
      if (!nickname.trim()) {
        setNicknameInput(nickname)
        setPendingOpen(key === 'pvp' ? 'pvp' : 'globalchat')
        setNicknameModalOpen(true)
        return
      }
      if (key === 'pvp') setPvpWindowOpen(true)
      else setGlobalChatWindowOpen(true)
    }
  }

  const handleGameEnd = (winnerNickname, loserNickname) => {
    setLeaderboardData((prev) => {
      const next = { ...prev }
      next[winnerNickname] = (next[winnerNickname] || 0) + 1
      next[loserNickname] = 0
      return next
    })
    if (hasApi()) postGameEnd(winnerNickname, loserNickname)
  }

  useEffect(() => {
    try {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboardData))
    } catch (_) {}
  }, [leaderboardData])

  useEffect(() => {
    if (!hasApi() || !leaderboardWindowOpen) return
    getLeaderboard().then((list) => {
      const next = {}
      list.forEach(({ nickname, winStreak }) => { next[nickname] = winStreak })
      setLeaderboardData((prev) => ({ ...prev, ...next }))
    }).catch(() => {})
  }, [leaderboardWindowOpen])

  const leaderboardEntries = Object.entries(leaderboardData)
    .map(([nickname, winStreak]) => ({ nickname, winStreak }))
    .filter((e) => e.winStreak > 0)
    .sort((a, b) => b.winStreak - a.winStreak)

  const handleNicknameSubmit = (e) => {
    e.preventDefault()
    const value = nicknameInput.trim().slice(0, 24)
    if (!value) return
    if (value.length < 2) {
      alert('Nickname must be at least 2 characters.')
      return
    }
    if (!walletAddress) return
    setNickname(value)
    setStoredNickname(walletAddress, value)
    setNicknameModalOpen(false)
    setNicknameInput('')
    if (pendingOpen === 'pvp') setPvpWindowOpen(true)
    if (pendingOpen === 'globalchat') setGlobalChatWindowOpen(true)
    setPendingOpen(null)
  }

  return (
    <div className="win95-desktop" onClickCapture={playClick}>
      {bootVisible && (
        <div className={`win95-bios-layer ${bootVisible === 'fadeout' ? 'win95-bios-fadeout' : ''}`}>
          <BiosScreen onBootComplete={handleBootComplete} />
        </div>
      )}

      <div className="win95-anjing-strip">
        <div className="win95-anjing-wrapper">
          <img src={anjingGif} alt="" className="win95-anjing-gif" />
        </div>
      </div>

      <div className="win95-wallet-panel">
        <WalletMultiButton className="win95-wallet-button" />
      </div>

      <div className="win95-taskbar">
        <button
          className="win95-start-button"
          onClick={() => setStartMenuOpen((o) => !o)}
          aria-pressed={startMenuOpen}
        >
          <img src={petImage} alt="" className="win95-start-icon" />
          <span>Start</span>
        </button>
        {pvpWindowOpen && (
          <button
            type="button"
            className="win95-taskbar-window-btn win95-taskbar-window-btn-active"
            onClick={() => setPvpWindowOpen(false)}
            title="Click to close"
          >
            PVP
          </button>
        )}
        {globalChatWindowOpen && (
          <button
            type="button"
            className="win95-taskbar-window-btn"
            onClick={() => setGlobalChatWindowOpen(false)}
            title="Click to close"
          >
            Global chat
          </button>
        )}
        {leaderboardWindowOpen && (
          <button
            type="button"
            className="win95-taskbar-window-btn"
            onClick={() => setLeaderboardWindowOpen(false)}
            title="Click to close"
          >
            Leaderboard
          </button>
        )}
        {communityWindowOpen && (
          <button
            type="button"
            className="win95-taskbar-window-btn"
            onClick={() => setCommunityWindowOpen(false)}
            title="Click to close"
          >
            Community
          </button>
        )}
        {memeWindowOpen && (
          <button
            type="button"
            className={`win95-taskbar-window-btn ${memeWindowZIndex >= WINDOW_Z_INDEX_FOCUSED ? 'win95-taskbar-window-btn-active' : ''}`}
            onClick={focusMemeWindow}
          >
            meme
          </button>
        )}
        <div className="win95-taskbar-tray">
          <button
            type="button"
            className="win95-tray-ca"
            onClick={copyContractAddress}
            title={`${CONTRACT_ADDRESS} — Click to copy`}
          >
            {copied ? 'Copied!' : CA_SHORT}
          </button>
          <div className="win95-tray-time-box">
            <span className="win95-tray-time">4:20 PM</span>
          </div>
        </div>
      </div>

      {startMenuOpen && (
        <>
          <div
            className="win95-start-overlay"
            onClick={() => setStartMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="win95-start-menu">
            <div className="win95-start-menu-header">
              <img src={petImage} alt="" className="win95-start-menu-logo" />
              <span className="win95-start-menu-title"> ANZHAY OS </span>
            </div>
            <ul className="win95-start-menu-list">
              {DESKTOP_ICONS.map((item, i) => (
                <li
                  key={i}
                  className="win95-start-menu-item"
                  onClick={() => {
                    handleDesktopItemClick(item.label)
                    setStartMenuOpen(false)
                  }}
                >
                  {item.iconSrc ? (
                    <img src={item.iconSrc} alt="" className={`win95-start-menu-item-icon ${item.iconSize === 'lg' ? 'win95-icon-lg' : ''} ${item.iconClass || ''}`} />
                  ) : (
                    <span className="win95-icon-folder win95-start-menu-item-icon" />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="win95-wallpaper" style={{ backgroundImage: `url(${bgImage})` }} />

      <div className="win95-icons">
        {DESKTOP_ICONS.map((item, i) => (
          <div
            key={i}
            className="win95-desktop-icon"
            style={{ left: item.x, top: item.y }}
            onClick={() => handleDesktopItemClick(item.label)}
            onDoubleClick={() => handleDesktopItemClick(item.label)}
          >
            {item.iconSrc ? (
              <img src={item.iconSrc} alt="" className={`win95-desktop-icon-img ${item.iconSize === 'lg' ? 'win95-icon-lg' : ''} ${item.iconClass || ''}`} />
            ) : (
              <div className={`win95-icon-${item.icon}`} />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {communityWindowOpen && (
        <div
          className="win95-window win95-community-window"
          role="dialog"
          aria-label="Community"
          style={{
            left: communityWindowPos.x,
            top: communityWindowPos.y,
            zIndex: WINDOW_Z_INDEX_FOCUSED + 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="win95-window-titlebar win95-window-titlebar-draggable"
            onMouseDown={handleCommunityTitleBarMouseDown}
          >
            <span className="win95-window-icon win95-icon-folder" />
            <span className="win95-window-title">Community</span>
            <div className="win95-window-buttons">
              <button type="button" className="win95-btn-close" aria-label="Close" title="Close" onClick={(e) => { e.stopPropagation(); setCommunityWindowOpen(false) }}>
                <span className="win95-btn-icon-close" />
              </button>
            </div>
          </div>
          <div className="win95-window-body win95-community-body">
            <p className="win95-community-intro">Join the ANZHAY community:</p>
            <ul className="win95-community-list">
              {COMMUNITY_LINKS.map((link, i) => (
                <li key={i}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="win95-community-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="win95-community-hint">Add your Discord/Telegram links above in COMMUNITY_LINKS.</p>
          </div>
        </div>
      )}

      {memeWindowOpen && (
        <div
          className="win95-window"
          role="dialog"
          aria-label="meme"
          style={{
            left: memeWindowPos.x,
            top: memeWindowPos.y,
            zIndex: memeWindowZIndex,
          }}
          onClick={(e) => { e.stopPropagation(); setMemeWindowZIndex(WINDOW_Z_INDEX_FOCUSED) }}
        >
          <div
            className="win95-window-titlebar win95-window-titlebar-draggable"
            onMouseDown={handleTitleBarMouseDown}
          >
            <span className="win95-window-icon win95-icon-folder" />
            <span className="win95-window-title">meme</span>
            <div className="win95-window-buttons">
              <button type="button" className="win95-btn-minimize" aria-label="Minimize" title="Minimize">
                <span className="win95-btn-icon-minimize" />
              </button>
              <button type="button" className="win95-btn-maximize" aria-label="Maximize" title="Maximize">
                <span className="win95-btn-icon-maximize" />
              </button>
              <button type="button" className="win95-btn-close" aria-label="Close" title="Close" onClick={(e) => { e.stopPropagation(); setMemeWindowOpen(false) }}>
                <span className="win95-btn-icon-close" />
              </button>
            </div>
          </div>
          <div className="win95-window-menubar">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Help</span>
          </div>
          <div className="win95-window-body win95-folder-body">
            {MEME_FILES.map((file, i) => (
              <div
                key={i}
                className="win95-folder-item"
                onClick={() => setPreviewImage({ src: file.src, name: file.name })}
                title={`Click to open ${file.name}`}
              >
                <img src={file.src} alt={file.name} className="win95-folder-thumb" />
                <span className="win95-folder-label">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {nicknameModalOpen && (
        <>
          <div className="win95-modal-overlay" onClick={() => { setNicknameModalOpen(false); setPendingOpen(null) }} aria-hidden="true" />
          <div className="win95-modal win95-nickname-modal" onClick={(e) => e.stopPropagation()}>
            <div className="win95-modal-titlebar">
              <span className="win95-modal-title">Set nickname</span>
            </div>
            <div className="win95-modal-body">
              <p className="win95-modal-text">Global chat and PVP require a nickname. Enter one to continue. (Saved per wallet—each wallet has its own nickname.)</p>
              <form onSubmit={handleNicknameSubmit}>
                <input
                  type="text"
                  className="win95-modal-input"
                  placeholder="Your nickname"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value.slice(0, 24))}
                  maxLength={24}
                  autoFocus
                />
                <div className="win95-modal-buttons">
                  <button type="submit" className="win95-btn-ok">OK</button>
                  <button type="button" className="win95-btn-cancel" onClick={() => { setNicknameModalOpen(false); setPendingOpen(null) }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {pvpWindowOpen && (
        <div
          className="win95-window-wrapper"
          style={{
            left: pvpWindowPos.x,
            top: pvpWindowPos.y,
            zIndex: WINDOW_Z_INDEX_FOCUSED + 5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <PVPWindowErrorBoundary onClose={() => setPvpWindowOpen(false)} onTitleBarMouseDown={handlePvpTitleBarMouseDown}>
            <PVPFlipCoin nickname={nickname} onClose={() => setPvpWindowOpen(false)} onTitleBarMouseDown={handlePvpTitleBarMouseDown} onGameEnd={handleGameEnd} />
          </PVPWindowErrorBoundary>
        </div>
      )}

      {globalChatWindowOpen && (
        <div
          className="win95-window-wrapper"
          style={{
            left: globalChatWindowPos.x,
            top: globalChatWindowPos.y,
            zIndex: WINDOW_Z_INDEX_FOCUSED + 6,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GlobalChat nickname={nickname} onClose={() => setGlobalChatWindowOpen(false)} onTitleBarMouseDown={handleGlobalChatTitleBarMouseDown} />
        </div>
      )}

      {leaderboardWindowOpen && (
        <div
          className="win95-window-wrapper"
          style={{
            left: leaderboardWindowPos.x,
            top: leaderboardWindowPos.y,
            zIndex: WINDOW_Z_INDEX_FOCUSED + 5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="win95-window win95-leaderboard-window">
            <div
              className="win95-window-titlebar win95-window-titlebar-draggable"
              onMouseDown={handleLeaderboardTitleBarMouseDown}
            >
              <img src={tanggaIcon} alt="" className="win95-window-icon win95-leaderboard-icon" />
              <span className="win95-window-title">Leaderboard</span>
              <div className="win95-window-buttons">
                <button type="button" className="win95-btn-close" aria-label="Close" title="Close" onClick={() => setLeaderboardWindowOpen(false)}>
                  <span className="win95-btn-icon-close" />
                </button>
              </div>
            </div>
            <div className="win95-window-body win95-leaderboard-body">
              <p className="win95-leaderboard-title">Winstreak leaderboard</p>
              {leaderboardEntries.length === 0 ? (
                <p className="win95-leaderboard-empty">No wins yet. Play PVP to appear here!</p>
              ) : (
                <table className="win95-leaderboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nickname</th>
                      <th>Winstreak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardEntries.map((entry, i) => (
                      <tr key={entry.nickname}>
                        <td>{i + 1}</td>
                        <td>{entry.nickname}</td>
                        <td>{entry.winStreak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="win95-window win95-preview-window"
          style={{
            left: previewPos.x,
            top: previewPos.y,
            zIndex: WINDOW_Z_INDEX_FOCUSED + 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="win95-window-titlebar win95-window-titlebar-draggable"
            onMouseDown={handlePreviewTitleBarMouseDown}
          >
            <span className="win95-window-title">{previewImage.name}</span>
            <div className="win95-window-buttons">
              <button
                type="button"
                className="win95-btn-close"
                aria-label="Close"
                title="Close"
                onClick={(e) => { e.stopPropagation(); setPreviewImage(null) }}
              >
                <span className="win95-btn-icon-close" />
              </button>
            </div>
          </div>
          <div className="win95-preview-body">
            <img src={previewImage.src} alt={previewImage.name} className="win95-preview-img" />
          </div>
        </div>
      )}
    </div>
  )
}
