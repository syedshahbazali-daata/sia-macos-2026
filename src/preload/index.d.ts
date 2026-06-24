import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      startStream: (id: string, streamKey: string) => void
      sendStreamData: (id: string, data: ArrayBuffer) => void
      stopStream: (id: string) => void
      getBrowserExists: () => Promise<boolean>
    }
    electronAPI: {
      checkForUpdates: () => void
      installUpdate: () => void
      onUpdateAvailable: (cb: (...args: unknown[]) => void) => void
      onUpdateNotAvailable: (cb: (...args: unknown[]) => void) => void
      onDownloadProgress: (cb: (...args: unknown[]) => void) => void
      onUpdateDownloaded: (cb: (...args: unknown[]) => void) => void
      onUpdateError: (cb: (...args: unknown[]) => void) => void
    }
  }
}
