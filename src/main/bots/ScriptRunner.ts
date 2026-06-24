import vm from 'vm'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Page } from 'patchright'
import type { Scheduler } from '../types'

const PROJECT_ID = 'sia-testing-database'
const API_KEY = 'AIzaSyC_Sp3J5envUXA28055Pny7RXUO93splJE'
const FIRESTORE_REST = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { mapValue: { fields: Record<string, FirestoreValue> } }

function parseFields(fields: Record<string, FirestoreValue>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if ('stringValue' in value) result[key] = value.stringValue
    else if ('integerValue' in value) result[key] = Number(value.integerValue)
    else if ('booleanValue' in value) result[key] = value.booleanValue
    else if ('mapValue' in value) result[key] = parseFields(value.mapValue.fields)
  }
  return result
}

async function fetchFirestoreDoc(
  collection: string,
  docId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const url = `${FIRESTORE_REST}/${collection}/${docId}?key=${API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { fields?: Record<string, FirestoreValue> }
    if (!data.fields) return null
    return parseFields(data.fields)
  } catch {
    return null
  }
}

function getScriptsCacheDir(): string {
  const dir = path.join(app.getPath('userData'), 'scripts')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function readCached(platform: string, version: string): string | null {
  const file = path.join(getScriptsCacheDir(), `${platform}-${version}.js`)
  return existsSync(file) ? readFileSync(file, 'utf-8') : null
}

function writeCache(platform: string, version: string, script: string): void {
  const file = path.join(getScriptsCacheDir(), `${platform}-${version}.js`)
  writeFileSync(file, script, 'utf-8')
}

async function fetchCloudScript(platform: string): Promise<string | null> {
  // 1. Get version from manifest
  const manifest = await fetchFirestoreDoc('bot_scripts', 'manifest')
  if (!manifest) return null
  const version = manifest[platform]
  if (typeof version !== 'string') return null

  // 2. Check local cache
  const cached = readCached(platform, version)
  if (cached) return cached

  // 3. Download from Firestore script document
  const doc = await fetchFirestoreDoc('bot_scripts', `${platform}-${version}`)
  if (!doc || typeof doc.script !== 'string') return null

  writeCache(platform, version, doc.script)
  return doc.script
}

// Maps RunScheduler platform keys to Firestore document keys
const PLATFORM_KEY: Record<string, string> = {
  'twitter post': 'twitter-post',
  'tik tok post': 'tiktok-post',
  'instagram post': 'instagram-post',
  facebook: 'facebook-post',
  'of post': 'of-post',
  'youtube shorts': 'youtube-shorts',
  'instagram story': 'instagram-story',
  'of mass messaging': 'of-mass-messaging',
}

export async function runCloudScript(
  platform: string,
  page: Page,
  schedules: Scheduler[],
  jsonFilePath: string,
  moveToHistory: (id: string, path: string) => void,
): Promise<boolean> {
  const key = PLATFORM_KEY[platform.toLowerCase()]
  if (!key) return false

  const script = await fetchCloudScript(key)
  if (!script) return false

  const sandbox = vm.createContext({
    // Navigation
    goto: (url: string, opts?: { timeout?: number }) =>
      page.goto(url, { timeout: opts?.timeout ?? 60000 }),

    // Clicking
    click: (selector: string, opts?: { force?: boolean }) => page.click(selector, opts),
    dispatchClick: (selector: string) =>
      page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null
        if (!el) throw new Error(`${sel} not found`)
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
      }, selector),

    // Text input
    fill: (selector: string, value: string) => page.fill(selector, value),
    typeText: (selector: string, value: string, delay?: number) =>
      page.type(selector, value, { delay: delay ?? 20 }),

    // File upload via setInputFiles (for hidden file inputs — Twitter)
    upload: (selector: string, paths: string | string[]) =>
      page.setInputFiles(selector, Array.isArray(paths) ? paths : [paths]),

    // File upload via OS file chooser dialog (YouTube Studio, TikTok etc.)
    chooseFiles: async (clickSelector: string, files: string | string[]) => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click(clickSelector, { timeout: 30000 }),
      ])
      await fileChooser.setFiles(Array.isArray(files) ? files : [files])
    },

    // File chooser with an optional intermediate click before the dialog opens (Meta Business Suite)
    chooseFilesViaIntermediate: async (
      primarySelector: string,
      intermediateSelector: string | null,
      files: string | string[],
    ) => {
      const promise = page.waitForEvent('filechooser')
      await page.click(primarySelector)
      if (intermediateSelector) {
        try {
          await page.click(intermediateSelector, { timeout: 3000 })
        } catch {
          // intermediate step is conditional — ignore if not present
        }
      }
      const fileChooser = await promise
      await fileChooser.setFiles(Array.isArray(files) ? files : [files])
    },

    // Keyboard key press on a specific element
    press: (selector: string, key: string) => page.press(selector, key),

    // Global keyboard press (no element target) — used by Meta story composer
    keyboardPress: (key: string) => page.keyboard.press(key),

    // Make a DOM element visible (TikTok hides the file input)
    makeVisible: (selector: string) =>
      page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null
        if (el) el.style.display = 'block'
      }, selector),

    // Check if an element is visible
    isVisible: (selector: string) => page.locator(selector).isVisible(),

    // Get inner text of an element
    getText: (selector: string) => page.locator(selector).innerText(),

    // Click first XPath result via document.evaluate (bypasses Playwright selector engine)
    xpathClickFirst: (xpath: string) =>
      page.evaluate((xp: string) => {
        const el = document.evaluate(
          xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null,
        ).singleNodeValue as HTMLElement | null
        if (el) el.click()
      }, xpath),

    // Click every element matching a CSS selector
    clickAll: (selector: string) =>
      page.evaluate((sel: string) => {
        document.querySelectorAll(sel).forEach((el) => (el as HTMLElement).click())
      }, selector),

    // Waiting
    wait: (selector: string, timeout?: number) =>
      page.waitForSelector(selector, { timeout: timeout ?? 30000 }),
    waitXPath: (xpath: string, timeout?: number) =>
      page.waitForSelector(`xpath=${xpath}`, { timeout: timeout ?? 0 }),
    waitMs: (ms: number) => page.waitForTimeout(ms),

    // DOM queries
    exists: async (selector: string) => (await page.locator(selector).count()) > 0,
    bodyText: () => page.evaluate(() => document.body.innerText.toLowerCase()),
    layersText: () =>
      page.evaluate(
        () => (document.getElementById('layers') as HTMLElement | null)?.innerText ?? '',
      ),

    // Set <select> element value by ID (used for Twitter's schedule date picker)
    setSelectById: (id: string, value: string) =>
      page.evaluate(
        ([elId, val]: string[]) => {
          const el = document.getElementById(elId) as HTMLSelectElement | null
          if (!el) throw new Error(`${elId} not found`)
          el.value = val
          el.dispatchEvent(new Event('change', { bubbles: true }))
        },
        [id, value],
      ),

    // Find element by exact trimmed innerText and dispatch a click
    clickByText: (text: string) =>
      page.evaluate((txt: string) => {
        const el = Array.from(document.querySelectorAll('*')).find(
          (e) => (e as HTMLElement).innerText?.trim() === txt,
        )
        if (!el) throw new Error(`Element with text "${txt}" not found`)
        el.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
        )
      }, text),

    // Variables injected at runtime
    vars: { schedules, jsonFilePath },

    // Callbacks
    done: (id: string) => moveToHistory(id, jsonFilePath),
    log: (...args: unknown[]) => console.log('[cloud-script]', ...args),

    // Expose console so scripts can use console.log if needed
    console,
  })

  const wrapped = `(async () => { ${script} })()`
  const vmScript = new vm.Script(wrapped)
  const result = vmScript.runInContext(sandbox) as Promise<void>
  await result
  return true
}
