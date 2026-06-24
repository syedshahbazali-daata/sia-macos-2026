import { _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import path from 'path'

export const MAIN = path.resolve(__dirname, '../out/main/index.js')

export const LICENSES = {
  valid: '123456',         // pro, expires 2026-07-31
  expired: '999999',      // expired 2024-01-01
  soonExpiring: '777777', // expires 2026-06-23 (3 days away → shows expiry warning)
  invalid: '000000',      // does not exist in Firestore
}

export async function launch(): Promise<{ app: ElectronApplication; win: Page }> {
  const app = await electron.launch({ args: [MAIN] })
  const win = await app.firstWindow()
  await win.waitForLoadState('domcontentloaded')
  return { app, win }
}

export async function clearStorage(win: Page): Promise<void> {
  await win.evaluate(() => window.localStorage.clear())
}

export async function reload(win: Page): Promise<void> {
  await win.reload()
  await win.waitForLoadState('domcontentloaded')
}

export async function fillOtp(win: Page, code: string): Promise<void> {
  const input = win.locator('input[data-input-otp="true"]')
  await input.waitFor({ state: 'visible', timeout: 8_000 })
  await input.click()
  await win.keyboard.type(code, { delay: 80 })
}

/** Clear the OTP input before re-entering a code */
export async function clearOtp(win: Page): Promise<void> {
  const input = win.locator('input[data-input-otp="true"]')
  await input.click()
  await win.keyboard.press('Meta+A')
  await win.keyboard.press('Backspace')
  for (let i = 0; i < 6; i++) await win.keyboard.press('Backspace')
  await win.waitForTimeout(100)
}

/** Wait for a Radix toast notification to appear */
export async function waitForToast(win: Page, timeout = 8_000): Promise<ReturnType<Page['locator']>> {
  const toast = win.locator('li[role="status"][data-state="open"]').first()
  await toast.waitFor({ state: 'visible', timeout })
  return toast
}

/**
 * Override the main-process `browser-exists` IPC handler so it always responds `true`.
 * This prevents tests from being blocked by the /browser/download page when Chromium
 * isn't present in the Playwright temp userData directory.
 * Call this BEFORE reloading so the LicensePage's getBrowserExists() call gets `true`.
 */
export async function mockBrowserExists(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ ipcMain }) => {
    ipcMain.removeAllListeners('browser-exists')
    ipcMain.on('browser-exists', (event) => {
      event.reply('browser-exists-response', true)
    })
  })
}

/**
 * Activate a license from the license page.
 * Assumes splash → /license already happened (clearStorage + reload called before).
 */
export async function activateLicense(win: Page, code = LICENSES.valid): Promise<void> {
  await win.locator('h1').filter({ hasText: 'Activate License' }).waitFor({ timeout: 12_000 })
  await fillOtp(win, code)
  await win.locator('button', { hasText: 'Activate' }).click()
  await win.locator('h1').filter({ hasText: 'Activate License' }).waitFor({ state: 'hidden', timeout: 20_000 })
}

export async function createInstance(win: Page, name: string, password: string): Promise<void> {
  await win.locator('h1').filter({ hasText: 'Setup Instance' }).waitFor({ timeout: 10_000 })
  await win.locator('input[placeholder="Instance Name"]').fill(name)
  await win.locator('input[placeholder="Set Password"]').fill(password)
  await win.locator('button', { hasText: 'Create Instance' }).click()
}

export async function selectAndLoginInstance(win: Page, instanceName: string, password: string): Promise<void> {
  await win.locator('h1').filter({ hasText: 'List of Instances' }).waitFor({ timeout: 8_000 })
  await win.locator('h3', { hasText: instanceName }).click()
  await win.locator('button', { hasText: 'Login' }).click()
  await win.locator('h1').filter({ hasText: 'Run Instance' }).waitFor({ timeout: 8_000 })
  await win.locator('input[placeholder="Enter Password"]').fill(password)
  await win.locator('button', { hasText: 'Run Instance' }).click()
  await win.locator('text=Creator earnings overview').waitFor({ timeout: 10_000 })
}

/**
 * Full flow to reach the dashboard:
 * mockBrowserExists → clearStorage → reload → activateLicense → createInstance → password
 */
export async function reachDashboard(
  app: ElectronApplication,
  win: Page,
  opts: { licenseCode?: string; instanceName?: string; password?: string } = {}
): Promise<void> {
  const { licenseCode = LICENSES.valid, instanceName = 'TestInstance', password = 'pass123' } = opts

  await mockBrowserExists(app)
  await clearStorage(win)
  await reload(win)
  await activateLicense(win, licenseCode)
  await createInstance(win, instanceName, password)
  await selectAndLoginInstance(win, instanceName, password)
}
