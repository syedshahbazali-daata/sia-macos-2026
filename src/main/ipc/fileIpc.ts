import { ipcMain, app, shell } from 'electron'
import { readJsonFile, writeJsonFile } from '../services/fileService'
import type { PATHS } from '../paths'
import { existsSync, readdirSync, unlinkSync } from 'fs'
import path from 'path'

export function registerFileIpc(): void {
  ipcMain.handle('read-json-file', async (_, fileName: keyof typeof PATHS) => {
    return readJsonFile(fileName)
  })

  ipcMain.handle('write-json-file', async (_, fileName: keyof typeof PATHS, data: unknown) => {
    return writeJsonFile(fileName, data)
  })

  ipcMain.handle('clear-script-cache', async () => {
    const scriptsDir = path.join(app.getPath('userData'), 'scripts')
    if (existsSync(scriptsDir)) {
      readdirSync(scriptsDir).forEach((f) => unlinkSync(path.join(scriptsDir, f)))
    }
    return true
  })

  ipcMain.handle('get-user-data-path', () => app.getPath('userData'))

  // Only allow opening paths inside userData to prevent arbitrary filesystem access
  ipcMain.handle('open-user-dir', async (_, userDir: string) => {
    const userData = app.getPath('userData')
    if (!userDir.startsWith(userData)) return false
    await shell.openPath(userDir)
    return true
  })
}
