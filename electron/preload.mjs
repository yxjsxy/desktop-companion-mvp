import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('desktopCompanion', {
  sendChat: (message) => ipcRenderer.invoke('chat:send', { message }),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('window:setAlwaysOnTop', value),
  setOpacity: (value) => ipcRenderer.invoke('window:setOpacity', value),
  toggleMiniMode: () => ipcRenderer.invoke('window:toggleMiniMode'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  setVolume: (value) => ipcRenderer.invoke('config:setVolume', value),
  closeWindow: () => ipcRenderer.invoke('window:close'),
})
