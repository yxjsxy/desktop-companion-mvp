import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Store from 'electron-store'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

const store = new Store({
  name: 'desktop-companion-config',
  defaults: {
    opacity: 0.95,
    volume: 0.9,
    alwaysOnTop: true,
    miniMode: false,
    bounds: { width: 420, height: 620 },
  },
})

let win

function createWindow() {
  const savedBounds = store.get('bounds')
  win = new BrowserWindow({
    width: savedBounds?.width || 420,
    height: savedBounds?.height || 620,
    x: savedBounds?.x,
    y: savedBounds?.y,
    alwaysOnTop: store.get('alwaysOnTop'),
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setOpacity(store.get('opacity'))

  if (store.get('miniMode')) {
    win.setSize(320, 240)
  }

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
  } else {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }

  win.on('moved', saveBounds)
  win.on('resized', saveBounds)
}

function saveBounds() {
  if (!win) return
  const b = win.getBounds()
  store.set('bounds', b)
}

ipcMain.handle('chat:send', async (_event, payload) => {
  const prompt = payload?.message?.trim()
  if (!prompt) return { reply: '请输入内容再发送。' }

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY
  const baseURL = process.env.LLM_BASE_URL || (process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined)
  const model = process.env.LLM_MODEL || (process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini')

  if (!apiKey) {
    return {
      reply: `本地陪伴模式：我收到了“${prompt}”。\n\n提示：配置 OPENAI_API_KEY 或 OPENROUTER_API_KEY 可启用真实 LLM。`,
    }
  }

  try {
    const client = new OpenAI({ apiKey, baseURL })
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a friendly desktop AI companion. Keep responses concise and useful.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    })

    const reply = completion.choices?.[0]?.message?.content?.trim() || '我暂时没有生成到回复。'
    return { reply }
  } catch (error) {
    return { reply: `LLM 调用失败，已降级：${error.message}` }
  }
})

ipcMain.handle('window:setAlwaysOnTop', (_event, value) => {
  store.set('alwaysOnTop', !!value)
  win?.setAlwaysOnTop(!!value)
  return { ok: true }
})

ipcMain.handle('window:setOpacity', (_event, value) => {
  const opacity = Math.max(0.35, Math.min(1, Number(value) || 1))
  store.set('opacity', opacity)
  win?.setOpacity(opacity)
  return { opacity }
})

ipcMain.handle('window:toggleMiniMode', () => {
  const current = !!store.get('miniMode')
  const next = !current
  store.set('miniMode', next)
  if (win) {
    if (next) {
      win.setSize(320, 240)
    } else {
      const b = store.get('bounds')
      win.setSize(Math.max(420, b?.width || 420), Math.max(620, b?.height || 620))
    }
  }
  return { miniMode: next }
})

ipcMain.handle('config:get', () => {
  return {
    opacity: store.get('opacity'),
    volume: store.get('volume'),
    alwaysOnTop: store.get('alwaysOnTop'),
    miniMode: store.get('miniMode'),
  }
})

ipcMain.handle('config:setVolume', (_event, value) => {
  const volume = Math.max(0, Math.min(1, Number(value) || 1))
  store.set('volume', volume)
  return { volume }
})

ipcMain.handle('window:close', () => {
  win?.close()
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
