import { ipcMain, app } from 'electron'
import { join } from 'path'
import { readSchedulers, writeSchedulers } from '../services/fileService'
import { findBrowserPath } from '../services/browserService'
import { PATHS } from '../paths'
import runScheduler from '../bots/RunScheduler'
import type { Scheduler } from '../types'

export function registerSchedulerIpc(): void {
  ipcMain.handle('read-schedules', async () => readSchedulers())
  ipcMain.handle('get-scheduler', async () => readSchedulers())

  ipcMain.on('add-scheduler', (_, scheduler: Scheduler) => {
    const schedulers = readSchedulers()
    schedulers.push(scheduler)
    writeSchedulers(schedulers)
  })

  ipcMain.handle('move-scheduler-to-history', async (_, id: string) => {
    const schedulers = readSchedulers()
    const scheduler = schedulers.find((s) => s.id === id)
    if (scheduler) {
      scheduler.isScheduled = 1
      writeSchedulers(schedulers)
      return 'success'
    }
    return 'error'
  })

  ipcMain.handle('delete-scheduler', async (_, id: string) => {
    writeSchedulers(readSchedulers().filter((s) => s.id !== id))
    return 'success'
  })

  ipcMain.handle('delete-scheduler-by-platform', async (_, platform: string) => {
    writeSchedulers(readSchedulers().filter((s) => s.platform !== platform || s.isScheduled))
    return 'success'
  })

  ipcMain.handle(
    'run-scheduler',
    async (_, platform: string, schedulers: Scheduler[], userDirId: string): Promise<string> => {
      const userDir = join(app.getPath('userData'), userDirId)
      const browserExecPath = join(findBrowserPath()!, 'Contents', 'MacOS', 'Chromium')
      await runScheduler(platform, schedulers, browserExecPath, userDir, PATHS.JSON_FILE)
      return 'success'
    },
  )
}
