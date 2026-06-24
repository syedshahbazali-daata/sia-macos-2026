import { ipcMain, app } from 'electron'
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
}
