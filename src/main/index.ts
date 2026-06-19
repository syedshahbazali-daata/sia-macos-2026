import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import process from 'node:process'

import { registerStreamIpc } from './ipc/streamIpc'
import { registerSchedulerIpc } from './ipc/schedulerIpc'
import { registerBrowserIpc } from './ipc/browserIpc'
import { registerFileIpc } from './ipc/fileIpc'
import { cleanupAllStreams } from './services/streamService'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 780,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      // webSecurity disabled to allow local file:// media paths from userData
      webSecurity: false,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  ipcMain.on('set-focus', () => mainWindow.focus())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerStreamIpc()
  registerSchedulerIpc()
  registerBrowserIpc()
  registerFileIpc()

  createWindow()
})

app.on('window-all-closed', () => {
  cleanupAllStreams()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

export type { Scheduler, MediaPath } from './types'
