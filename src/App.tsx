import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Msg = { role: 'user' | 'assistant'; content: string }

const fallbackApi = {
  async sendChat(message: string) {
    return { reply: `本地回显：${message}` }
  },
  async setAlwaysOnTop(_value: boolean) { return { ok: true } },
  async setOpacity(value: number) { return { opacity: value } },
  async toggleMiniMode() { return { miniMode: false } },
  async getConfig() { return { opacity: 0.95, volume: 0.9, alwaysOnTop: true, miniMode: false } },
  async setVolume(value: number) { return { volume: value } },
  async closeWindow() {},
}

function App() {
  const api = window.desktopCompanion ?? fallbackApi
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [opacity, setOpacity] = useState(0.95)
  const [miniMode, setMiniMode] = useState(false)
  const [volume, setVolume] = useState(0.9)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getConfig().then((cfg) => {
      setAlwaysOnTop(!!cfg.alwaysOnTop)
      setOpacity(Number(cfg.opacity ?? 0.95))
      setMiniMode(!!cfg.miniMode)
      setVolume(Number(cfg.volume ?? 0.9))
    })
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading])

  const latestAssistant = useMemo(() => [...messages].reverse().find((m) => m.role === 'assistant')?.content, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await api.sendChat(text)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } finally {
      setLoading(false)
    }
  }

  function speakLatest() {
    if (!latestAssistant) return
    const ut = new SpeechSynthesisUtterance(latestAssistant)
    ut.lang = 'zh-CN'
    ut.rate = 1
    ut.volume = volume
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(ut)
  }

  async function onToggleTop(value: boolean) {
    setAlwaysOnTop(value)
    await api.setAlwaysOnTop(value)
  }

  async function onOpacity(value: number) {
    setOpacity(value)
    await api.setOpacity(value)
  }

  async function onMiniMode() {
    const res = await api.toggleMiniMode()
    setMiniMode(res.miniMode)
  }

  async function onVolume(value: number) {
    setVolume(value)
    await api.setVolume(value)
  }

  return (
    <div className="shell">
      <header className="dragbar">
        <div className="title">Desktop Companion MVP</div>
        <button className="ghost" onClick={() => api.closeWindow()}>×</button>
      </header>

      <section className="controls no-drag">
        <label><input type="checkbox" checked={alwaysOnTop} onChange={(e) => onToggleTop(e.target.checked)} /> 置顶</label>
        <label>透明度 {Math.round(opacity * 100)}%
          <input type="range" min={0.35} max={1} step={0.01} value={opacity} onChange={(e) => onOpacity(Number(e.target.value))} />
        </label>
        <label>音量 {Math.round(volume * 100)}%
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onVolume(Number(e.target.value))} />
        </label>
        <button onClick={onMiniMode}>{miniMode ? '退出小窗' : '小窗模式'}</button>
      </section>

      <div className="history no-drag" ref={listRef}>
        {messages.length === 0 && <p className="hint">输入消息开始对话。支持一键播报最近回复。</p>}
        {messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.content}</div>)}
        {loading && <div className="msg assistant">思考中...</div>}
      </div>

      <footer className="inputRow no-drag">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入内容..." rows={2}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
        <div className="actions">
          <button onClick={send} disabled={loading}>发送</button>
          <button onClick={speakLatest} disabled={!latestAssistant}>播放最近回复</button>
        </div>
      </footer>
    </div>
  )
}

export default App
