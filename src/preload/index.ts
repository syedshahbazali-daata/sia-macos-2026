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
}

declare global {
  interface Window {
    electron: typeof electronAPI
    api: typeof streamAPI
    electronAPI: typeof updateAPI
  }
}
