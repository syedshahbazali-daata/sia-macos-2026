import vm from 'vm'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Page } from 'patchright'
import type { Scheduler } from '../types'
import {
  readAiConfig,
  fetchAiModelConfig,
  loadPlatformFixes,
  savePlatformFixes,
  getAiFix,
  sendAiStatus,
  updateCloudScript,
  type PlatformFixes,
  type SelectorFix,
  type InjectedStep,
} from '../services/aiService'

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

async function fetchCloudScript(
  platform: string,
): Promise<{ script: string; version: string } | null> {
  const manifest = await fetchFirestoreDoc('bot_scripts', 'manifest')
  if (!manifest) return null
  const version = manifest[platform]
  if (typeof version !== 'string') return null

  const cached = readCached(platform, version)
  if (cached) return { script: cached, version }

  const doc = await fetchFirestoreDoc('bot_scripts', `${platform}-${version}`)
  if (!doc || typeof doc.script !== 'string') return null

  writeCache(platform, version, doc.script)
  return { script: doc.script, version }
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

// Friendly display name for AI status messages
const PLATFORM_DISPLAY: Record<string, string> = {
  'twitter-post': 'Twitter',
  'tiktok-post': 'TikTok',
  'instagram-post': 'Instagram',
  'facebook-post': 'Facebook',
  'of-post': 'OnlyFans',
  'youtube-shorts': 'YouTube Shorts',
  'instagram-story': 'Instagram Story',
  'of-mass-messaging': 'OnlyFans Mass Messaging',
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

  const scriptResult = await fetchCloudScript(key)
  if (!scriptResult) return false

  let currentScript = scriptResult.script
  const scriptVersion = scriptResult.version

  // Load AI fixes, model config, and local API key in parallel
  const [fixes, aiModelCfg, aiCfg] = await Promise.all([
    loadPlatformFixes(key),
    fetchAiModelConfig(),
    Promise.resolve(readAiConfig()),
  ])

  const platformFixes: PlatformFixes = fixes
  const apiKey = aiCfg.openrouter_api_key
  const displayName = PLATFORM_DISPLAY[key] ?? platform

  // ── AI Fix Trigger ──────────────────────────────────────────────────────────
  // Called when an action fails and we have an API key configured.
  // Notifies the renderer, asks AI for a fix, saves it, then retries.
  async function triggerAiFix(
    failingSelector: string,
    error: Error,
    retryFn: (selector: string) => Promise<unknown>,
  ): Promise<unknown> {
    if (!apiKey) throw error

    sendAiStatus({ status: 'fixing', selector: failingSelector, platform: displayName })

    try {
      const [pageHtml, screenshotBuf] = await Promise.all([
        page.evaluate(() => document.body.innerHTML).catch(() => ''),
        page.screenshot().catch(() => null),
      ])

      const screenshotBase64 = screenshotBuf ? Buffer.from(screenshotBuf).toString('base64') : null

      const fix = await getAiFix({
        selector: failingSelector,
        errorMsg: error.message,
        platform: displayName,
        pageHtml: (pageHtml as string).slice(0, 50000),
        screenshotBase64,
        apiKey,
        htmlModel: aiModelCfg.html_model,
        visionModel: aiModelCfg.vision_model,
        scriptCode: currentScript,
      })

      if (fix.type === 'none') {
        sendAiStatus({ status: 'failed', selector: failingSelector, platform: displayName })
        throw error
      }

      const date = new Date().toISOString().split('T')[0]
      const model = aiModelCfg.html_model

      // Apply script_fix — patch the cloud script permanently
      if (fix.script_fix?.find && fix.script_fix?.replace) {
        if (currentScript.includes(fix.script_fix.find)) {
          const patched = currentScript.replaceAll(fix.script_fix.find, fix.script_fix.replace)
          currentScript = patched
          writeCache(key, scriptVersion, patched)
          await updateCloudScript(key, scriptVersion, patched)
          console.log(`[ai-script-fix] Patched script "${fix.script_fix.find}" → "${fix.script_fix.replace}"`)
        } else {
          console.warn('[ai-script-fix] find string not found in script, skipping script patch')
        }
      }

      // Apply selector_fix — only saved when the selector is static (not from a script_fix run)
      if (fix.selector_fix && fix.type === 'selector_fix') {
        const newFix: SelectorFix = {
          original: failingSelector,
          replacement: fix.selector_fix.replacement,
          added_by: 'ai',
          model,
          date,
          note: fix.selector_fix.note,
        }
        platformFixes.selector_fixes = platformFixes.selector_fixes.filter(
          (f) => f.original !== failingSelector,
        )
        platformFixes.selector_fixes.push(newFix)
      }

      // Apply injected steps
      if (fix.new_steps) {
        for (const step of fix.new_steps) {
          const newStep: InjectedStep = {
            id: `ai-step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            position: step.position,
            code: step.code,
            added_by: 'ai',
            model,
            date,
            note: step.note,
          }
          platformFixes.injected_steps.push(newStep)
        }
      }

      // Persist platform fixes to Firestore
      await savePlatformFixes(key, platformFixes)

      const replacement = fix.selector_fix?.replacement ?? failingSelector
      sendAiStatus({
        status: 'fixed',
        selector: failingSelector,
        replacement,
        platform: displayName,
        scriptPatched: !!fix.script_fix,
      })

      return retryFn(replacement)
    } catch (innerError) {
      // Only re-throw the original error, not any error from the AI flow
      if (innerError !== error) {
        sendAiStatus({ status: 'failed', selector: failingSelector, platform: displayName })
      }
      throw error
    }
  }

  // ── Selector race helper ────────────────────────────────────────────────────
  // Tries original and AI-fix selector in parallel; returns the winner.
  async function raceSelectors(
    original: string,
    replacement: string,
    timeout: number,
  ): Promise<string | null> {
    return Promise.any([
      page.waitForSelector(original, { timeout }).then(() => original),
      page.waitForSelector(replacement, { timeout }).then(() => replacement),
    ]).catch(() => null)
  }

  function findFix(selector: string): SelectorFix | undefined {
    return platformFixes.selector_fixes.find((f) => f.original === selector)
  }

  // ── Enhanced sandbox ────────────────────────────────────────────────────────
  const sandbox = vm.createContext({
    goto: (url: string, opts?: { timeout?: number }) =>
      page.goto(url, { timeout: opts?.timeout ?? 60000 }),

    click: async (selector: string, opts?: { force?: boolean }) => {
      const aiFix = findFix(selector)
      if (aiFix) {
        const winner = await raceSelectors(selector, aiFix.replacement, 5000)
        if (!winner) {
          return triggerAiFix(selector, new Error(`Selector timed out: ${selector}`), (s) =>
            page.click(s, opts),
          )
        }
        try {
          return await page.click(winner, opts)
        } catch (e) {
          // Element found but blocked (e.g. overlay) — try force click, then AI
          try {
            return await page.click(winner, { ...(opts ?? {}), force: true })
          } catch {
            return triggerAiFix(
              selector,
              e instanceof Error ? e : new Error(String(e)),
              (s) => page.click(s, { force: true }),
            )
          }
        }
      }
      try {
        return await page.click(selector, opts)
      } catch (e) {
        // Try force click as quick fallback before invoking AI
        try {
          return await page.click(selector, { ...(opts ?? {}), force: true })
        } catch {
          return triggerAiFix(
            selector,
            e instanceof Error ? e : new Error(String(e)),
            (s) => page.click(s, opts),
          )
        }
      }
    },

    dispatchClick: async (selector: string) => {
      const aiFix = findFix(selector)
      const target = aiFix
        ? (await raceSelectors(selector, aiFix.replacement, 5000)) ?? selector
        : selector
      return page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null
        if (!el) throw new Error(`${sel} not found`)
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
      }, target)
    },

    fill: async (selector: string, value: string) => {
      const aiFix = findFix(selector)
      if (aiFix) {
        const winner = await raceSelectors(selector, aiFix.replacement, 5000)
        const target = winner ?? selector
        return page.fill(target, value)
      }
      try {
        return await page.fill(selector, value)
      } catch (e) {
        return triggerAiFix(
          selector,
          e instanceof Error ? e : new Error(String(e)),
          (s) => page.fill(s, value),
        )
      }
    },

    typeText: async (selector: string, value: string, delay?: number) => {
      const aiFix = findFix(selector)
      if (aiFix) {
        const winner = await raceSelectors(selector, aiFix.replacement, 5000)
        const target = winner ?? selector
        return page.type(target, value, { delay: delay ?? 20 })
      }
      try {
        return await page.type(selector, value, { delay: delay ?? 20 })
      } catch (e) {
        return triggerAiFix(
          selector,
          e instanceof Error ? e : new Error(String(e)),
          (s) => page.type(s, value, { delay: delay ?? 20 }),
        )
      }
    },

    upload: (selector: string, paths: string | string[]) =>
      page.setInputFiles(selector, Array.isArray(paths) ? paths : [paths]),

    chooseFiles: async (clickSelector: string, files: string | string[]) => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click(clickSelector, { timeout: 30000 }),
      ])
      await fileChooser.setFiles(Array.isArray(files) ? files : [files])
    },

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

    press: (selector: string, key: string) => page.press(selector, key),

    keyboardPress: (key: string) => page.keyboard.press(key),

    makeVisible: (selector: string) =>
      page.evaluate((sel: string) => {
        const el = document.querySelector(sel) as HTMLElement | null
        if (el) el.style.display = 'block'
      }, selector),

    isVisible: (selector: string) => page.locator(selector).isVisible(),

    getText: (selector: string) => page.locator(selector).innerText(),

    xpathClickFirst: (xpath: string) =>
      page.evaluate((xp: string) => {
        const el = document.evaluate(
          xp,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue as HTMLElement | null
        if (el) el.click()
      }, xpath),

    clickAll: (selector: string) =>
      page.evaluate((sel: string) => {
        document.querySelectorAll(sel).forEach((el) => (el as HTMLElement).click())
      }, selector),

    wait: async (selector: string, timeout?: number) => {
      const aiFix = findFix(selector)
      const ms = timeout ?? 30000
      // Short timeouts are optional checks — don't invoke AI, let caller handle
      const shouldAiFix = ms >= 10000
      if (aiFix) {
        const winner = await raceSelectors(selector, aiFix.replacement, ms)
        if (!winner) {
          if (!shouldAiFix) throw new Error(`Wait timed out: ${selector}`)
          return triggerAiFix(selector, new Error(`Wait timed out: ${selector}`), (s) =>
            page.waitForSelector(s, { timeout: ms }),
          )
        }
        return winner
      }
      try {
        return await page.waitForSelector(selector, { timeout: ms })
      } catch (e) {
        if (!shouldAiFix) throw e
        return triggerAiFix(
          selector,
          e instanceof Error ? e : new Error(String(e)),
          (s) => page.waitForSelector(s, { timeout: ms }),
        )
      }
    },

    waitXPath: (xpath: string, timeout?: number) =>
      page.waitForSelector(`xpath=${xpath}`, { timeout: timeout ?? 0 }),

    waitMs: (ms: number) => page.waitForTimeout(ms),

    exists: async (selector: string) => (await page.locator(selector).count()) > 0,

    bodyText: () => page.evaluate(() => document.body.innerText.toLowerCase()),

    layersText: () =>
      page.evaluate(
        () => (document.getElementById('layers') as HTMLElement | null)?.innerText ?? '',
      ),

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

    vars: { schedules, jsonFilePath },
    done: (id: string) => moveToHistory(id, jsonFilePath),
    log: (...args: unknown[]) => console.log('[cloud-script]', ...args),
    console,
  })

  // ── Run AI pre-injected steps (dismiss popups, handle banners, etc.) ────────
  for (const step of platformFixes.injected_steps.filter((s) => s.position === 'pre')) {
    try {
      const fn = vm.runInContext(`(async () => { ${step.code} })()`, sandbox) as Promise<void>
      await fn
      console.log(`[ai-step] ran pre-step: ${step.id}`)
    } catch {
      // Pre-steps are optional — never block main script
    }
  }

  // ── Run main cloud script ────────────────────────────────────────────────────
  const wrapped = `(async () => { ${currentScript} })()`
  const vmScript = new vm.Script(wrapped)
  const result = vmScript.runInContext(sandbox) as Promise<void>
  await result

  // ── Run AI post-injected steps ───────────────────────────────────────────────
  for (const step of platformFixes.injected_steps.filter((s) => s.position === 'post')) {
    try {
      const fn = vm.runInContext(`(async () => { ${step.code} })()`, sandbox) as Promise<void>
      await fn
      console.log(`[ai-step] ran post-step: ${step.id}`)
    } catch {
      // Post-steps are optional
    }
  }

  return true
}
