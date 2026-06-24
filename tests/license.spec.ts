import { test, expect, _electron as electron } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import path from 'path'

const MAIN = path.resolve(__dirname, '../out/main/index.js')

const VALID_LICENSE = '123456'   // pro, expires 2026-07-31 in sia-testing-database
const INVALID_LICENSE = '000000'

async function launch(): Promise<{ app: ElectronApplication; win: Page }> {
  const app = await electron.launch({ args: [MAIN] })
  const win = await app.firstWindow()
  await win.waitForLoadState('domcontentloaded')
  return { app, win }
}

/** Clear all localStorage (including encrypt-storage prefixed keys) */
async function clearStorage(win: Page): Promise<void> {
  await win.evaluate(() => window.localStorage.clear())
}

/** Reload the window and wait for DOM */
async function reload(win: Page): Promise<void> {
  await win.reload()
  await win.waitForLoadState('domcontentloaded')
}

/** Type into the OTP input — input-otp renders a single real input with data-input-otp="true" */
async function fillOtp(win: Page, code: string): Promise<void> {
  const otpInput = win.locator('input[data-input-otp="true"]')
  await otpInput.waitFor({ state: 'visible', timeout: 8_000 })
  await otpInput.click()
  await win.keyboard.type(code, { delay: 80 })
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('License & Firebase integration', () => {

  test('1 · no stored license → license page shown', async () => {
    const { app, win } = await launch()

    await clearStorage(win)
    await reload(win)

    // SplashScreen waits 3 s then navigates — wait up to 10 s for the heading
    const heading = win.locator('h1')
    await expect(heading).toContainText('Activate License', { timeout: 10_000 })

    await win.screenshot({ path: '/tmp/pw_1_license_page.png' })
    console.log('✓ License page shown after storage clear')

    await app.close()
  })

  test('2 · invalid code → Firebase returns nothing → error toast', async () => {
    const { app, win } = await launch()

    await clearStorage(win)
    await reload(win)

    const heading = win.locator('h1')
    await expect(heading).toContainText('Activate License', { timeout: 10_000 })

    await fillOtp(win, INVALID_LICENSE)
    await win.locator('button', { hasText: 'Activate' }).click()

    // Radix Toast renders <li role="status" data-state="open"> for each notification
    const toast = win.locator('li[role="status"][data-state="open"]').first()
    await expect(toast).toBeVisible({ timeout: 8_000 })

    // Heading should still say Activate License (we did NOT navigate away)
    await expect(heading).toContainText('Activate License')

    await win.screenshot({ path: '/tmp/pw_2_invalid_toast.png' })
    const toastText = await toast.textContent()
    console.log('✓ Toast shown:', toastText?.trim())

    await app.close()
  })

  test('3 · valid code → Firebase validates → navigates away from license', async () => {
    const { app, win } = await launch()

    await clearStorage(win)
    await reload(win)

    const heading = win.locator('h1')
    await expect(heading).toContainText('Activate License', { timeout: 10_000 })
    await win.screenshot({ path: '/tmp/pw_3a_license_page.png' })

    await fillOtp(win, VALID_LICENSE)
    await win.locator('button', { hasText: 'Activate' }).click()

    // After activation the app navigates away — "Activate License" heading disappears
    // Firebase round-trip + navigation: allow up to 20 s
    await expect(heading).not.toContainText('Activate License', { timeout: 20_000 })

    await win.screenshot({ path: '/tmp/pw_3b_after_activation.png' })
    console.log('✓ Navigated away from license page after Firebase validation')

    await app.close()
  })

  test('4 · stored valid license → splash skips license page', async () => {
    // Seed: activate once so license persists in localStorage
    {
      const { app, win } = await launch()
      await clearStorage(win)
      await reload(win)
      await expect(win.locator('h1')).toContainText('Activate License', { timeout: 10_000 })
      await fillOtp(win, VALID_LICENSE)
      await win.locator('button', { hasText: 'Activate' }).click()
      await expect(win.locator('h1')).not.toContainText('Activate License', { timeout: 20_000 })
      await app.close()
    }

    // Second launch: license in localStorage, splash should NOT land on license page
    {
      const { app, win } = await launch()

      // Wait for splash to resolve (up to 8 s) then assert we're NOT on the license page
      // The license heading should never appear
      await win.waitForTimeout(5_000) // splash delay is 3 s
      const heading = win.locator('h1')

      // Give it a moment and confirm we never hit /license
      const licenseVisible = await heading.filter({ hasText: 'Activate License' }).isVisible()
      expect(licenseVisible).toBe(false)

      await win.screenshot({ path: '/tmp/pw_4_skip_license.png' })
      console.log('✓ License page skipped on second launch')

      await app.close()
    }
  })
})
