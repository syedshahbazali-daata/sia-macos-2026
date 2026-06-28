import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'

const PROJECT_ID = 'sia-testing-database'
const FIRESTORE_KEY = 'AIzaSyC_Sp3J5envUXA28055Pny7RXUO93splJE'
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const AI_CONFIG_PATH = join(app.getPath('userData'), 'ai-config.json')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AiConfig {
  openrouter_api_key?: string
}

export interface SelectorFix {
  original: string
  replacement: string
  added_by: 'ai'
  model: string
  date: string
  note: string
}

export interface InjectedStep {
  id: string
  position: 'pre' | 'post'
  code: string
  added_by: 'ai'
  model: string
  date: string
  note: string
}

export interface PlatformFixes {
  selector_fixes: SelectorFix[]
  injected_steps: InjectedStep[]
}

export interface AiFixResult {
  type: 'selector_fix' | 'new_step' | 'both' | 'none'
  selector_fix?: { replacement: string; note: string }
  new_steps?: Array<{ position: 'pre' | 'post'; code: string; note: string }>
}

// ─── Local Config ─────────────────────────────────────────────────────────────

export function readAiConfig(): AiConfig {
  if (!existsSync(AI_CONFIG_PATH)) return {}
  try {
    return JSON.parse(readFileSync(AI_CONFIG_PATH, 'utf-8')) as AiConfig
  } catch {
    return {}
  }
}

export function writeAiConfig(config: AiConfig): void {
  writeFileSync(AI_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

// ─── Firestore Helpers ────────────────────────────────────────────────────────

type FsVal =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, FsVal> } }
  | { arrayValue: { values?: FsVal[] } }

function parseFsVal(v: FsVal): unknown {
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('booleanValue' in v) return v.booleanValue
  if ('nullValue' in v) return null
  if ('mapValue' in v) return parseFsFields(v.mapValue.fields)
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(parseFsVal)
  return null
}

function parseFsFields(fields: Record<string, FsVal>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, parseFsVal(v)]))
}

function toFsVal(v: unknown): FsVal {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'number') return { integerValue: String(Math.round(v)) }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } }
  if (typeof v === 'object') return { mapValue: { fields: toFsFields(v as Record<string, unknown>) } }
  return { nullValue: null }
}

function toFsFields(obj: Record<string, unknown>): Record<string, FsVal> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFsVal(v)]))
}

async function fetchDoc(collection: string, docId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/${collection}/${docId}?key=${FIRESTORE_KEY}`)
    if (!res.ok) return null
    const data = (await res.json()) as { fields?: Record<string, FsVal> }
    if (!data.fields) return null
    return parseFsFields(data.fields)
  } catch {
    return null
  }
}

async function writeDoc(collection: string, docId: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/${collection}/${docId}?key=${FIRESTORE_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFsFields(data) }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── AI Model Config ──────────────────────────────────────────────────────────

export async function fetchAiModelConfig(): Promise<{ html_model: string; vision_model: string }> {
  const doc = await fetchDoc('ai_model', 'config')
  return {
    html_model: (doc?.html_model as string) ?? 'anthropic/claude-3-haiku',
    vision_model: (doc?.vision_model as string) ?? 'anthropic/claude-3.5-sonnet',
  }
}

// ─── Platform Fixes ───────────────────────────────────────────────────────────

export async function loadPlatformFixes(platformKey: string): Promise<PlatformFixes> {
  const doc = await fetchDoc('bot_script_fixes', platformKey)
  return {
    selector_fixes: (doc?.selector_fixes as SelectorFix[]) ?? [],
    injected_steps: (doc?.injected_steps as InjectedStep[]) ?? [],
  }
}

export async function savePlatformFixes(platformKey: string, fixes: PlatformFixes): Promise<void> {
  await writeDoc('bot_script_fixes', platformKey, {
    selector_fixes: fixes.selector_fixes,
    injected_steps: fixes.injected_steps,
  })
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

const SANDBOX_DOCS = `Available sandbox functions:
- click(selector) — click element
- wait(selector, timeout?) — wait for element to appear
- fill(selector, value) — fill input field
- typeText(selector, value, delay?) — type text char by char
- waitMs(ms) — wait milliseconds
- exists(selector) — returns boolean
- isVisible(selector) — returns boolean
- getText(selector) — get inner text
- upload(selector, files) — upload files via input
- chooseFiles(clickSelector, files) — open file chooser dialog
- xpathClickFirst(xpath) — click first xpath result
- clickAll(selector) — click all matching elements
- dispatchClick(selector) — dispatch JS click event
- goto(url, opts?) — navigate to URL
- press(selector, key) — press key on element
- keyboardPress(key) — global keyboard press`

function buildHtmlPrompt(selector: string, errorMsg: string, platform: string, pageHtml: string): string {
  return `You are fixing a broken Playwright browser automation script for the ${platform} platform.

Error: ${errorMsg}
Failing selector: "${selector}"

${SANDBOX_DOCS}

Page HTML (truncated to 50KB):
${pageHtml}

Analyze the HTML and return ONLY valid JSON with no explanation and no markdown code fences:
{
  "type": "selector_fix" | "new_step" | "both" | "none",
  "selector_fix": {
    "replacement": "new-selector-here",
    "note": "brief reason"
  },
  "new_steps": [
    {
      "position": "pre",
      "code": "try { await click('.dismiss-btn'); } catch(e) {}",
      "note": "dismiss popup if present"
    }
  ]
}

Rules:
- Only include fields that apply (omit selector_fix if not needed, omit new_steps if not needed)
- Prefer xpath selectors for stability
- new_steps with position "pre" run once before the main script starts
- Always wrap new_steps code in try/catch so they are safe to run
- Return {"type":"none"} if you cannot determine a fix`
}

function buildVisionPrompt(selector: string, errorMsg: string, platform: string): string {
  return `You are fixing a broken Playwright browser automation script for the ${platform} platform.

Error: ${errorMsg}
Failing selector: "${selector}"

${SANDBOX_DOCS}

Look at the screenshot and return ONLY valid JSON with no explanation and no markdown code fences:
{
  "type": "selector_fix" | "new_step" | "both" | "none",
  "selector_fix": {
    "replacement": "new-selector-here",
    "note": "brief reason"
  },
  "new_steps": [
    {
      "position": "pre",
      "code": "try { await click('.dismiss-btn'); } catch(e) {}",
      "note": "dismiss popup if present"
    }
  ]
}

Rules:
- Only include fields that apply
- Prefer xpath selectors for stability
- new_steps with position "pre" run once before the main script starts
- Always wrap new_steps code in try/catch
- Return {"type":"none"} if you cannot determine a fix`
}

type OrcMessage =
  | { role: string; content: string }
  | { role: string; content: Array<{ type: string; text?: string; image_url?: { url: string } }> }

async function callOpenRouter(messages: OrcMessage[], model: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sia-app.com',
        'X-Title': 'SiA Bot Auto-Fix',
      },
      body: JSON.stringify({ model, messages, max_tokens: 1000, temperature: 0.1 }),
    })
    if (!res.ok) {
      console.error('[aiService] OpenRouter error:', res.status, await res.text())
      return null
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content ?? null
  } catch (e) {
    console.error('[aiService] OpenRouter fetch failed:', e)
    return null
  }
}

function parseAiResponse(raw: string | null): AiFixResult {
  if (!raw) return { type: 'none' }
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned) as AiFixResult
    if (!['selector_fix', 'new_step', 'both', 'none'].includes(parsed.type)) return { type: 'none' }
    return parsed
  } catch {
    return { type: 'none' }
  }
}

export async function getAiFix(params: {
  selector: string
  errorMsg: string
  platform: string
  pageHtml: string
  screenshotBase64: string | null
  apiKey: string
  htmlModel: string
  visionModel: string
}): Promise<AiFixResult> {
  const { selector, errorMsg, platform, pageHtml, screenshotBase64, apiKey, htmlModel, visionModel } = params

  // Try HTML fix first (cheaper, no vision model needed)
  const htmlResult = parseAiResponse(
    await callOpenRouter(
      [{ role: 'user', content: buildHtmlPrompt(selector, errorMsg, platform, pageHtml) }],
      htmlModel,
      apiKey,
    ),
  )
  if (htmlResult.type !== 'none') return htmlResult

  // Fallback to screenshot + vision model
  if (screenshotBase64) {
    const visionResult = parseAiResponse(
      await callOpenRouter(
        [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildVisionPrompt(selector, errorMsg, platform) },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshotBase64}` } },
            ],
          },
        ],
        visionModel,
        apiKey,
      ),
    )
    if (visionResult.type !== 'none') return visionResult
  }

  return { type: 'none' }
}

// ─── IPC Status ───────────────────────────────────────────────────────────────

export function sendAiStatus(status: Record<string, unknown>): void {
  BrowserWindow.getAllWindows()[0]?.webContents.send('ai-fix-status', status)
}
