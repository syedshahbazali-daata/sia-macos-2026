import { ipcMain } from 'electron'
import { readAiConfig, writeAiConfig } from '../services/aiService'

export function registerAiIpc(): void {
  ipcMain.handle('get-ai-config', () => readAiConfig())

  ipcMain.handle('save-ai-config', (_, config: { openrouter_api_key: string }) => {
    writeAiConfig({ openrouter_api_key: config.openrouter_api_key })
    return 'ok'
  })
}
