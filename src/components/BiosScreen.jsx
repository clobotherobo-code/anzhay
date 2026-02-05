import { useState, useEffect } from 'react'
import './BiosScreen.css'

const LOGO_TEXT = 'ANZHAY OS'
const BLOCK_COUNT = 24
const BLOCK_FILL_MS = 120
const TYPEWRITER_MS = 140

const BIOS_LINES = [
  { text: 'Phoenix ROM BIOS PLUS Version 1.10 A09', delay: 0 },
  { text: 'Copyright 1985-1995 Phoenix Technologies Ltd.', delay: 400 },
  { text: 'All Rights Reserved', delay: 700 },
  { text: '', delay: 900 },
  { text: 'CPU Type  : 486', delay: 1100 },
  { text: 'Base Memory: 640 KB', delay: 1400 },
  { text: 'Ext. Memory: 16384 KB', delay: 1700 },
  { text: 'Cache Memory: 256 KB', delay: 2000 },
  { text: '', delay: 2300 },
  { text: 'Floppy Drive A: 1.44M, 3.5 in.', delay: 2500 },
  { text: 'Floppy Drive B: None', delay: 2800 },
  { text: 'Pri. Master Disk: LBA, 2048 MB', delay: 3100 },
  { text: 'Pri. Slave Disk : None', delay: 3400 },
  { text: '', delay: 3700 },
  { text: 'Initializing Plug and Play Cards...', delay: 3900 },
  { text: 'Pnp Init Completed', delay: 4200 },
  { text: '', delay: 4500 },
  { text: 'Starting MS-DOS...', delay: 4700 },
  { text: 'Loading IO.SYS...', delay: 5000 },
  { text: 'Loading MSDOS.SYS...', delay: 5300 },
  { text: 'Loading CONFIG.SYS...', delay: 5600 },
  { text: 'Loading COMMAND.COM...', delay: 5900 },
  { text: '', delay: 6200 },
  { text: 'ANZHAY OS', delay: 6400 },
  { text: '(C) ANZHAY OS.', delay: 6700 },
  { text: '', delay: 7000 },
  { text: 'C:\\>win', delay: 7300 },
  { text: '', delay: 7600 },
  { text: 'Starting ANZHAY OS...', delay: 7800 },
]

export default function BiosScreen({ onBootComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [cursorVisible, setCursorVisible] = useState(true)
  const [phase, setPhase] = useState('bios') // 'bios' | 'loading' | 'click' (wait for user)
  const [filledBlocks, setFilledBlocks] = useState(0)
  const [typewriterLen, setTypewriterLen] = useState(0)

  useEffect(() => {
    const timers = BIOS_LINES.map(({ text, delay }) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, text])
      }, delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    const doneTimer = setTimeout(() => setPhase('loading'), 8500)
    return () => clearTimeout(doneTimer)
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    if (filledBlocks >= BLOCK_COUNT) {
      setPhase('click')
      return
    }
    const t = setTimeout(() => setFilledBlocks((n) => n + 1), BLOCK_FILL_MS)
    return () => clearTimeout(t)
  }, [phase, filledBlocks])

  useEffect(() => {
    if (phase !== 'loading' && phase !== 'click') return
    if (typewriterLen >= LOGO_TEXT.length) return
    const t = setTimeout(() => setTypewriterLen((n) => n + 1), TYPEWRITER_MS)
    return () => clearTimeout(t)
  }, [phase, typewriterLen])

  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  const handleClickToContinue = () => {
    if (phase === 'click') onBootComplete?.()
  }

  if (phase === 'loading' || phase === 'click') {
    return (
      <div
        className={`bios-screen bios-logo ${phase === 'click' ? 'bios-click-phase' : ''}`}
        onClick={phase === 'click' ? handleClickToContinue : undefined}
        role={phase === 'click' ? 'button' : undefined}
        tabIndex={phase === 'click' ? 0 : undefined}
        onKeyDown={(e) => phase === 'click' && (e.key === 'Enter' || e.key === ' ') && handleClickToContinue()}
        aria-label={phase === 'click' ? 'Click to continue' : undefined}
      >
        <div className="win95-logo-boot">
          <p className="win95-logo-text">
            {LOGO_TEXT.slice(0, typewriterLen)}
            <span className="win95-logo-cursor">{typewriterLen < LOGO_TEXT.length && cursorVisible ? '|' : ''}</span>
          </p>
          <div className="win95-retro-blocks">
            {Array.from({ length: BLOCK_COUNT }, (_, i) => (
              <div
                key={i}
                className={`win95-retro-block ${i < filledBlocks ? 'filled' : ''}`}
              />
            ))}
          </div>
          {phase === 'click' && (
            <p className="win95-click-continue">Click to continue</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bios-screen">
      <div className="bios-content">
        <div className="bios-header">
          <span className="bios-brand">Phoenix ROM BIOS PLUS</span>
        </div>
        <div className="bios-body">
          {visibleLines.map((line, i) => (
            <div key={i} className="bios-line">
              {line || '\u00A0'}
            </div>
          ))}
          <span className="bios-cursor">{cursorVisible ? '_' : ''}</span>
        </div>
      </div>
    </div>
  )
}
