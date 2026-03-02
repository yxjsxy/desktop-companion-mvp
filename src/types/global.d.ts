export {}

declare global {
  interface Window {
    desktopCompanion?: {
      sendChat: (message: string) => Promise<{ reply: string }>
      setAlwaysOnTop: (value: boolean) => Promise<{ ok: boolean }>
      setOpacity: (value: number) => Promise<{ opacity: number }>
      toggleMiniMode: () => Promise<{ miniMode: boolean }>
      getConfig: () => Promise<{ opacity: number; volume: number; alwaysOnTop: boolean; miniMode: boolean }>
      setVolume: (value: number) => Promise<{ volume: number }>
      closeWindow: () => Promise<void>
    }
  }
}
