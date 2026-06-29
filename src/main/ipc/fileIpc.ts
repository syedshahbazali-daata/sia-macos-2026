import { ipcMain, app, shell } from 'electron'
import { readJsonFile, writeJsonFile } from '../services/fileService'
import type { PATHS } from '../paths'
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import path from 'path'

const FIRESTORE_KEY = 'AIzaSyC_Sp3J5envUXA28055Pny7RXUO93splJE'
const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/sia-testing-database/databases/(default)/documents'

const SCRIPT_DISPLAY: Record<string, string> = {
  'tiktok-post': 'TikTok Post',
  'twitter-post': 'Twitter Post',
  'instagram-post': 'Instagram Post',
  'instagram-story': 'Instagram Story',
  'facebook-post': 'Facebook Post',
  'youtube-shorts': 'YouTube Shorts',
  'of-post': 'OnlyFans Post',
  'of-mass-messaging': 'OnlyFans Mass Msg',
}

const SCRIPT_ORDER = [
  'tiktok-post',
  'twitter-post',
  'instagram-post',
  'instagram-story',
  'facebook-post',
  'youtube-shorts',
  'of-post',
  'of-mass-messaging',
]

export interface BotScriptInfo {
  key: string
  name: string
  latestVersion: string
  cachedVersion: string | null
}

async function fetchManifest(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/bot_scripts/manifest?key=${FIRESTORE_KEY}`)
    if (!res.ok) return null
    const data = (await res.json()) as { fields?: Record<string, { stringValue: string }> }
    if (!data.fields) return null
    return Object.fromEntries(Object.entries(data.fields).map(([k, v]) => [k, v.stringValue]))
  } catch {
    return null
  }
}

function getScriptsDir(): string {
  return path.join(app.getPath('userData'), 'scripts')
}

function getCachedVersion(scriptsDir: string, key: string): string | null {
  if (!existsSync(scriptsDir)) return null
  for (const f of readdirSync(scriptsDir)) {
    if (f.startsWith(`${key}-`) && f.endsWith('.js')) {
      return f.slice(key.length + 1, -3)
    }
  }
  return null
}

function buildScriptList(manifest: Record<string, string> | null, scriptsDir: string): BotScriptInfo[] {
  return SCRIPT_ORDER.map((key) => ({
    key,
    name: SCRIPT_DISPLAY[key] ?? key,
    latestVersion: manifest?.[key] ?? '—',
    cachedVersion: getCachedVersion(scriptsDir, key),
  }))
}

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

  ipcMain.handle('get-bot-scripts', async (): Promise<BotScriptInfo[]> => {
    const [manifest] = await Promise.all([fetchManifest()])
    return buildScriptList(manifest, getScriptsDir())
  })

  ipcMain.handle('update-bot-scripts', async (): Promise<BotScriptInfo[]> => {
    const scriptsDir = getScriptsDir()
    // Clear existing cached scripts
    if (existsSync(scriptsDir)) {
      readdirSync(scriptsDir)
        .filter((f) => f.endsWith('.js'))
        .forEach((f) => unlinkSync(path.join(scriptsDir, f)))
    } else {
      mkdirSync(scriptsDir, { recursive: true })
    }

    const manifest = await fetchManifest()
    if (manifest) {
      // Download all scripts in parallel
      await Promise.all(
        SCRIPT_ORDER.map(async (key) => {
          const version = manifest[key]
          if (!version) return
          try {
            const res = await fetch(
              `${FIRESTORE_BASE}/bot_scripts/${key}-${version}?key=${FIRESTORE_KEY}`,
            )
            if (!res.ok) return
            const data = (await res.json()) as {
              fields?: { script?: { stringValue: string } }
            }
            const script = data.fields?.script?.stringValue
            if (!script) return
            writeFileSync(path.join(scriptsDir, `${key}-${version}.js`), script)
          } catch {
            // Silently skip scripts that fail to download
          }
        }),
      )
    }

    return buildScriptList(manifest, scriptsDir)
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
