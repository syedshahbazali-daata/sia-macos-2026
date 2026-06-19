import { ElectronAPI } from '@electron-toolkit/preload'
import { Scheduler } from 'timers/promises'

declare global {
  interface Window {
    electron: ElectronAPI & {
      scheduler: {
        set: (schedule) => Promise<void>
        get: (instanceId) => Promise<Scheduler[]>
        delete: (platform) => Promise<string>
        deleteScheduler: (schedulerId) => Promise<string>
      }
    }
    api: {
      setScheduler: (schedule) => Promise<void>
      getScheduler: (instanceId, platform) => Promise<Scheduler[]>
    }
  }
}
