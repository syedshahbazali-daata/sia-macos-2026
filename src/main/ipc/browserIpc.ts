import { ipcMain, app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { rm } from 'fs/promises'
import { findBrowserPath, browserExists, downloadBrowser } from '../services/browserService'
import { PATHS } from '../paths'
import { addAccountPlaywright, closeBrowser } from '../bots/AddAccount'
import runBrowser from '../bots/Browser'
import { StreamKeysAutoFetch } from '../bots/StreamKeysAutoFetch'

export function registerBrowserIpc(): void {
  ipcMain.on('browser-exists', (event) => {
    event.reply('browser-exists-response', browserExists())
  })

  ipcMain.on('get-browser-path', (event) => {
    event.reply('browser-path-response', findBrowserPath())
  })

  ipcMain.on('download-browser', async (event) => {
    await downloadBrowser(() => event.reply('download-browser-complete'))
  })

  ipcMain.on('run-browser', (_, userDirId: string) => {
    const userDir = join(app.getPath('userData'), `userdir-${userDirId}`)
    const browserPath = join(findBrowserPath()!, 'Contents', 'MacOS', 'Chromium')
    runBrowser(userDir, browserPath)
  })

  ipcMain.on('close-add-account-browser', () => {
    closeBrowser()
  })

  ipcMain.on('add-account', (_, website: string, userDirId: string) => {
    const userDir = join(app.getPath('userData'), userDirId)
    const browserPath = join(findBrowserPath()!, 'Contents', 'MacOS', 'Chromium')
    addAccountPlaywright(website, userDir, browserPath)
  })

  ipcMain.on('account-added', (event, jsonData: unknown) => {
    try {
      writeFileSync(PATHS.ATTACHED_ACCOUNTS, JSON.stringify(jsonData), 'utf-8')
      event.reply('account-added-response', 'success')
    } catch (error) {
      console.error('Error saving attached accounts:', error)
      event.reply('account-added-response', 'error')
    }
  })

  ipcMain.on('show-attached-accounts', (event) => {
    if (!existsSync(PATHS.ATTACHED_ACCOUNTS)) {
      writeFileSync(PATHS.ATTACHED_ACCOUNTS, '[]', 'utf-8')
    }
    event.reply('attached-accounts', JSON.parse(readFileSync(PATHS.ATTACHED_ACCOUNTS, 'utf-8')))
  })

  ipcMain.on('delete-instance', async (_, id: string) => {
    const userDir = join(app.getPath('userData'), `userdir-${id}`)
    await rm(userDir, { recursive: true, force: true })
  })

  ipcMain.handle('fetch-stream-key', async (_, platform: string, userDirId: string) => {
    const userDir = join(app.getPath('userData'), `userdir-${userDirId}`)
    const browserPath = join(findBrowserPath()!, 'Contents', 'MacOS', 'Chromium')
    return StreamKeysAutoFetch(platform, userDir, browserPath, userDirId)
  })
}
