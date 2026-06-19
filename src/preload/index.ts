import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Define streaming API types
interface StreamAPI {
  startStream: (id: string, streamKey: string) => void
  sendStreamData: (id: string, data: ArrayBuffer) => void
  stopStream: (id: string) => void
}

// Define update API types
interface UpdateAPI {
  checkForUpdates: () => void
  onUpdateAvailable: (callback: (...args: any[]) => void) => void
  onUpdateNotAvailable: (callback: (...args: any[]) => void) => void
  onDownloadProgress: (callback: (...args: any[]) => void) => void
  onUpdateDownloaded: (callback: (...args: any[]) => void) => void
  onUpdateError: (callback: (...args: any[]) => void) => void
}

// Define electron IPC API type
interface ElectronIPC {
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, func: (...args: any[]) => void) => () => void
}

// Stream-related APIs
const streamAPI: StreamAPI = {
  startStream: (id: string, streamKey: string) =>
    ipcRenderer.send('start-stream', id, streamKey),

  sendStreamData: (id: string, data: ArrayBuffer) =>
    ipcRenderer.send('stream-data', id, data),

  stopStream: (id: string) =>
    ipcRenderer.send('stop-stream', id)
}

// Update-related APIs
const updateAPI: UpdateAPI = {
  checkForUpdates: () =>
    ipcRenderer.send('manual-update-check'),

  onUpdateAvailable: (callback) =>
    ipcRenderer.on('update-available', callback),

  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on('update-not-available', callback),

  onDownloadProgress: (callback) =>
    ipcRenderer.on('download-progress', callback),

  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', callback),

  onUpdateError: (callback) =>
    ipcRenderer.on('update-error', callback)
}

// IPC communication APIs
const ipcAPI: ElectronIPC = {
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args)
  },

  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (event: any, ...args: any[]) => func(...args)
    ipcRenderer.on(channel, subscription)

    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  }
}

// Expose APIs to renderer process
if (process.contextIsolated) {
  try {
    // Expose the base electron API
    contextBridge.exposeInMainWorld('electron', electronAPI)

    // Expose streaming API
    contextBridge.exposeInMainWorld('api', streamAPI)

    // Expose update API
    contextBridge.exposeInMainWorld('electronAPI', updateAPI)

    // Expose IPC API
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: ipcAPI
    })
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = streamAPI
  // @ts-ignore (define in dts)
  window.electronAPI = updateAPI
}

// Type declarations for TypeScript
declare global {
  interface Window {
    electron: typeof electronAPI & {
      ipcRenderer: ElectronIPC
    }
    api: StreamAPI
    electronAPI: UpdateAPI
  }
}
