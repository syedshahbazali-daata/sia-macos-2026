import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Streaming API — passed directly to FFmpeg via main process
const streamAPI = {
  startStream: (id: string, streamKey: string) =>
    ipcRenderer.send('start-stream', id, streamKey),
  sendStreamData: (id: string, data: ArrayBuffer) =>
    ipcRenderer.send('stream-data', id, data),
  stopStream: (id: string) =>
    ipcRenderer.send('stop-stream', id),

  // Wraps the send/reply browser-exists channel as a Promise
  getBrowserExists: (): Promise<boolean> =>
    new Promise((resolve) => {
      ipcRenderer.once('browser-exists-response', (_, exists: boolean) => resolve(exists))
      ipcRenderer.send('browser-exists')
    }),
}

// File utilities
const fileAPI = {
  getUserDataPath: (): Promise<string> => ipcRenderer.invoke('get-user-data-path'),
  openUserDir: (userDir: string): Promise<boolean> =>
    ipcRenderer.invoke('open-user-dir', userDir),
}

// AI fix API
const aiAPI = {
  getConfig: (): Promise<{ openrouter_api_key?: string }> =>
    ipcRenderer.invoke('get-ai-config'),
  saveConfig: (config: { openrouter_api_key: string }): Promise<string> =>
    ipcRenderer.invoke('save-ai-config', config),
  onFixStatus: (cb: (data: Record<string, unknown>) => void) =>
    ipcRenderer.on('ai-fix-status', (_event, data) => cb(data)),
  offFixStatus: (cb: (data: Record<string, unknown>) => void) =>
    ipcRenderer.removeListener('ai-fix-status', (_event, data) => cb(data)),
}

// Auto-updater events
const updateAPI = {
  checkForUpdates: () => ipcRenderer.send('manual-update-check'),
  installUpdate: () => ipcRenderer.send('install-update'),
  onUpdateAvailable: (cb: (...args: unknown[]) => void) =>
    ipcRenderer.on('update-available', cb),
  onUpdateNotAvailable: (cb: (...args: unknown[]) => void) =>
    ipcRenderer.on('update-not-available', cb),
  onDownloadProgress: (cb: (...args: unknown[]) => void) =>
    ipcRenderer.on('download-progress', cb),
  onUpdateDownloaded: (cb: (...args: unknown[]) => void) =>
    ipcRenderer.on('update-downloaded', cb),
  onUpdateError: (cb: (...args: unknown[]) => void) =>
    ipcRenderer.on('update-error', cb),
}

if (process.contextIsolated) {
  try {
    // electronAPI provides window.electron.ipcRenderer.invoke/send/on
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', streamAPI)
    contextBridge.exposeInMainWorld('electronAPI', updateAPI)
    contextBridge.exposeInMainWorld('aiAPI', aiAPI)
    contextBridge.exposeInMainWorld('fileAPI', fileAPI)
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = streamAPI
  // @ts-ignore
  window.electronAPI = updateAPI
  // @ts-ignore
  window.aiAPI = aiAPI
  // @ts-ignore
  window.fileAPI = fileAPI
}

declare global {
  interface Window {
    electron: typeof electronAPI
    api: typeof streamAPI
    electronAPI: typeof updateAPI
    aiAPI: typeof aiAPI
    fileAPI: typeof fileAPI
  }
}
