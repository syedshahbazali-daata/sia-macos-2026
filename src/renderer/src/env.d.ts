/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface Window {
  fileAPI: {
    getUserDataPath: () => Promise<string>
    openUserDir: (userDir: string) => Promise<boolean>
  }
  aiAPI: {
    getConfig: () => Promise<{ openrouter_api_key?: string }>
    saveConfig: (config: { openrouter_api_key: string }) => Promise<string>
    onFixStatus: (cb: (data: Record<string, unknown>) => void) => void
    offFixStatus: (cb: (data: Record<string, unknown>) => void) => void
  }
}
