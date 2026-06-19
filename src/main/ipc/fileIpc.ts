import { ipcMain } from 'electron'
import { readJsonFile, writeJsonFile } from '../services/fileService'
import type { PATHS } from '../paths'

export function registerFileIpc(): void {
  ipcMain.handle('read-json-file', async (_, fileName: keyof typeof PATHS) => {
    return readJsonFile(fileName)
  })

  ipcMain.handle('write-json-file', async (_, fileName: keyof typeof PATHS, data: unknown) => {
    return writeJsonFile(fileName, data)
  })
}
