import { ipcMain } from 'electron'
import { startStream, sendStreamData, stopStream } from '../services/streamService'

export function registerStreamIpc(): void {
  ipcMain.on('start-stream', (_, id: string, streamKey: string) => {
    startStream(id, streamKey)
  })

  ipcMain.on('stream-data', (_, id: string, data: ArrayBuffer) => {
    sendStreamData(id, data)
  })

  ipcMain.on('stop-stream', (_, id: string) => {
    stopStream(id)
  })
}
