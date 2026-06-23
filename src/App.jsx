import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const COLORS = [
  { id: 'black',    label: 'Czarny',         hex: '#404040' },
  { id: 'red',      label: 'Czerwony',        hex: '#E85555' },
  { id: 'orange',   label: 'Pomarańczowy',    hex: '#F08040' },
  { id: 'yellow',   label: 'Żółty',           hex: '#E8B800' },
  { id: 'lime',     label: 'Limonkowy',       hex: '#7CC040' },
  { id: 'green',    label: 'Zielony',         hex: '#30B878' },
  { id: 'teal',     label: 'Turkusowy',       hex: '#1AAFAF' },
  { id: 'sky',      label: 'Błękitny',        hex: '#40A8D8' },
  { id: 'blue',     label: 'Niebieski',       hex: '#4466CC' },
  { id: 'navy',     label: 'Granatowy',       hex: '#2244AA' },
  { id: 'purple',   label: 'Fioletowy',       hex: '#7744BB' },
  { id: 'lavender', label: 'Lawendowy',       hex: '#9966CC' },
  { id: 'pink',     label: 'Różowy',          hex: '#CC44AA' },
  { id: 'rose',     label: 'Koralowy',        hex: '#EE5577' },
  { id: 'peach',    label: 'Brzoskwiniowy',   hex: '#E88855' },
  { id: 'brown',    label: 'Brązowy',         hex: '#996644' },
]

const STORAGE_KEY = 'gabi-word-settings'
const DEFAULT_SETTINGS = { selectedColors: ['black'], fontSize: 54 }

// Zero-width space keeps the textarea non-empty so Backspace always fires an input event
const SENTINEL = '​'

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

let uid = 0
function nextId() { return ++uid }

function pickColor(selectedIds) {
  if (!selectedIds.length) return '#404040'
  const chosen = selectedIds[Math.floor(Math.random() * selectedIds.length)]
  return COLORS.find(c => c.id === chosen)?.hex ?? '#404040'
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [chars, setChars] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(settings)
  const settingsOpenRef = useRef(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { settingsRef.current = settings }, [settings])
  useEffect(() => { settingsOpenRef.current = settingsOpen }, [settingsOpen])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chars])

  // Auto-focus the hidden textarea on mount so desktop keyboard works immediately
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = SENTINEL
      inputRef.current.focus()
    }
  }, [])

  // Re-focus when settings close
  useEffect(() => {
    if (!settingsOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [settingsOpen])

  const focusInput = useCallback(() => {
    if (!settingsOpenRef.current) inputRef.current?.focus()
  }, [])

  // Single input handler — works on both desktop and mobile
  const handleInput = useCallback((e) => {
    if (settingsOpenRef.current) {
      e.target.value = SENTINEL
      return
    }

    const { inputType, data } = e.nativeEvent

    if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
      setChars(p => p.slice(0, -1))
    } else if (inputType === 'insertLineBreak') {
      setChars(p => [...p, { char: '\n', color: null, id: nextId() }])
    } else if (data) {
      for (const char of data) {
        if (/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(char)) {
          const color = pickColor(settingsRef.current.selectedColors)
          setChars(p => [...p, { char: char.toUpperCase(), color, id: nextId() }])
        } else if (/\d/.test(char)) {
          const color = pickColor(settingsRef.current.selectedColors)
          setChars(p => [...p, { char, color, id: nextId() }])
        } else if (char === ' ') {
          setChars(p => [...p, { char: ' ', color: null, id: nextId() }])
        }
        // Other characters silently ignored
      }
    }

    // Reset to sentinel so next Backspace always triggers an input event
    e.target.value = SENTINEL
  }, [])

  // Prevent Tab from stealing focus away from the hidden textarea
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') e.preventDefault()
  }, [])

  const toggleColor = useCallback((id) => {
    setSettings(prev => {
      const cur = prev.selectedColors
      if (cur.includes(id)) {
        if (cur.length <= 1) return prev
        return { ...prev, selectedColors: cur.filter(c => c !== id) }
      }
      return { ...prev, selectedColors: [...cur, id] }
    })
  }, [])

  return (
    <div className="app">
      {/* Hidden textarea — captures keyboard input on both desktop and mobile */}
      <textarea
        ref={inputRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="hidden-input"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Header */}
      <header className="header">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Literki</span>
        </div>
        <div className="header-controls">
          <button
            className="btn btn-clear"
            onClick={() => { setChars([]); focusInput() }}
          >
            Wyczyść
          </button>
          <button
            className={`btn btn-settings${settingsOpen ? ' active' : ''}`}
            onClick={() => setSettingsOpen(s => !s)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Ustawienia
          </button>
        </div>
      </header>

      {/* Typing Area — tap anywhere to (re)focus keyboard on mobile */}
      <main className="typing-area" style={{ fontSize: settings.fontSize }} onClick={focusInput}>
        <div className="text-content">
          {chars.map(({ char, color, id }) => {
            if (char === '\n') return <br key={id} />
            if (char === ' ') return <span key={id} className="space">{' '}</span>
            return (
              <span key={id} className="letter" style={{ color }}>
                {char}
              </span>
            )
          })}
          <span className="cursor" aria-hidden="true" />
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </main>

      {/* Settings Overlay */}
      {settingsOpen && (
        <div className="overlay" onClick={() => setSettingsOpen(false)} />
      )}

      {/* Settings Drawer */}
      <aside className={`settings-drawer${settingsOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <h2>Ustawienia</h2>
          <button className="btn-close" onClick={() => setSettingsOpen(false)} aria-label="Zamknij">
            ✕
          </button>
        </div>

        <section className="setting-section">
          <div className="section-title">
            <span>Wielkość liter</span>
            <span className="section-badge">{settings.fontSize} px</span>
          </div>
          <input
            className="size-slider"
            type="range"
            min={12}
            max={96}
            step={2}
            value={settings.fontSize}
            onChange={e => setSettings(p => ({ ...p, fontSize: +e.target.value }))}
          />
          <div
            className="slider-preview"
            style={{ fontSize: settings.fontSize, color: pickColor(settings.selectedColors) }}
          >
            Abc
          </div>
        </section>

        <section className="setting-section">
          <div className="section-title">
            <span>Kolory liter</span>
            <span className="section-badge">
              {settings.selectedColors.length === 1
                ? '1 wybrany'
                : `${settings.selectedColors.length} wybrane`}
            </span>
          </div>
          <div className="color-grid">
            {COLORS.map(col => {
              const active = settings.selectedColors.includes(col.id)
              return (
                <button
                  key={col.id}
                  className={`swatch${active ? ' swatch-active' : ''}`}
                  style={{ backgroundColor: col.hex }}
                  onClick={() => toggleColor(col.id)}
                  title={col.label}
                  aria-label={`${col.label}${active ? ', wybrano' : ''}`}
                  aria-pressed={active}
                >
                  {active && <span className="swatch-check">✓</span>}
                </button>
              )
            })}
          </div>
        </section>
      </aside>
    </div>
  )
}
