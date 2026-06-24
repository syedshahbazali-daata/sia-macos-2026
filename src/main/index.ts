import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import process from 'node:process'
import { autoUpdater } from 'electron-updater'

import { registerStreamIpc } from './ipc/streamIpc'
import { registerSchedulerIpc } from './ipc/schedulerIpc'
import { registerBrowserIpc } from './ipc/browserIpc'
import { registerFileIpc } from './ipc/fileIpc'
import { cleanupAllStreams } from './services/streamService'

function setupAutoUpdater(win: BrowserWindow): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  const send = (channel: string, ...args: unknown[]): void => {
    if (!win.isDestroyed()) win.webContents.send(channel, ...args)
  }

  autoUpdater.on('update-available', (info) => send('update-available', info))
  autoUpdater.on('update-not-available', (info) => send('update-not-available', info))
  autoUpdater.on('download-progress', (progress) => send('download-progress', progress))
  autoUpdater.on('update-downloaded', (info) => send('update-downloaded', info))
  autoUpdater.on('error', (err) => send('update-error', err.message))

  ipcMain.on('manual-update-check', () => { autoUpdater.checkForUpdates() })
  ipcMain.on('install-update', () => { autoUpdater.quitAndInstall() })

  if (app.isPackaged) {
    // Check for update 6 seconds after launch so the UI is fully loaded
    setTimeout(() => { autoUpdater.checkForUpdates() }, 6000)
  }
}

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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    setupAutoUpdater(mainWindow)
  })

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
  electronApp.setAppUserModelId('com.sia.app')

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
