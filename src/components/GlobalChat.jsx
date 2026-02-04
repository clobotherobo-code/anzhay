import { useState, useRef, useEffect } from 'react'
import './GlobalChat.css'

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function GlobalChat({ nickname, onClose, onTitleBarMouseDown }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { id: makeId(), nickname: 'System', text: 'Welcome to Global chat. Connect wallet and set a nickname to start.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ])
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const trimmed = message.trim().slice(0, 500)
    if (!trimmed || !nickname) return
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        nickname,
        text: trimmed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setMessage('')
  }

  return (
    <div className="global-chat" onClick={(e) => e.stopPropagation()}>
      <div
        className="global-chat-titlebar global-chat-titlebar-draggable"
        onMouseDown={onTitleBarMouseDown}
      >
        <span className="global-chat-title">Global chat</span>
        <div className="global-chat-titlebar-buttons">
          <button type="button" className="win95-btn-close" onClick={onClose}>
            <span className="win95-btn-icon-close" />
          </button>
        </div>
      </div>

      <div className="global-chat-body">
        <div className="global-chat-messages" ref={listRef}>
          {messages.map((m) => (
            <div key={m.id} className="global-chat-msg">
              <span className="global-chat-msg-meta">
                [{m.time}] {m.nickname}:
              </span>
              <span className="global-chat-msg-text">{m.text}</span>
            </div>
          ))}
        </div>
        <form className="global-chat-form" onSubmit={handleSend}>
          <input
            type="text"
            className="global-chat-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          <button type="submit" className="global-chat-send">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
