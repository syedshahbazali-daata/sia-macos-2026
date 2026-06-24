import { test, expect } from '@playwright/test'
import {
  launch, reachDashboard, clearStorage, reload, activateLicense,
  mockBrowserExists, clearOtp, LICENSES
} from './helpers'

test.describe('Dashboard content & license expiry', () => {

  test('1 · dashboard loads all key sections', async () => {
    const { app, win } = await launch()
    await reachDashboard(app, win)

    await expect(win.locator('text=Creator earnings overview')).toBeVisible()
    for (const period of ['Yesterday', 'Today', 'This week', 'This month']) {
      await expect(win.locator(`button:has-text("${period}")`)).toBeVisible()
    }

    await win.screenshot({ path: '/tmp/pw_dashboard_loaded.png' })
    await app.close()
  })

  test('2 · time period switcher highlights selected button', async () => {
    const { app, win } = await launch()
    await reachDashboard(app, win)

    // "Today" is the default active period
    const todayBtn = win.locator('button', { hasText: 'Today' })
    await expect(todayBtn).toHaveClass(/text-blue-600|bg-gray-100/, { timeout: 5_000 })

    // Click "This week" and verify it becomes active
    await win.locator('button', { hasText: 'This week' }).click()
    await expect(win.locator('button', { hasText: 'This week' })).toHaveClass(/text-blue-600|bg-gray-100/)

    await win.screenshot({ path: '/tmp/pw_dashboard_period.png' })
    await app.close()
  })

  test('3 · no expiry warning for long-term license (123456, ~40 days)', async () => {
    const { app, win } = await launch()
    await reachDashboard(app, win, { licenseCode: LICENSES.valid })

    await win.waitForTimeout(1_500)
    await expect(win.locator('text=License Expiration Notice')).not.toBeVisible()

    await win.screenshot({ path: '/tmp/pw_dashboard_no_warning.png' })
    await app.close()
  })

  test('4 · expiry warning shown for soon-expiring license (777777, 3 days)', async () => {
    const { app, win } = await launch()
    await reachDashboard(app, win, { licenseCode: LICENSES.soonExpiring, instanceName: 'SoonInst' })

    await expect(win.locator('text=License Expiration Notice')).toBeVisible({ timeout: 5_000 })
    await expect(win.locator('text=days')).toBeVisible()

    await win.screenshot({ path: '/tmp/pw_dashboard_expiry_warning.png' })
    await app.close()
  })

  test('5 · UTC clock is visible and formatted correctly', async () => {
    const { app, win } = await launch()
    await reachDashboard(app, win, { instanceName: 'ClockInst' })

    // Matches HH:MM:SS UTC
    const clock = win.locator('text=/\\d{2}:\\d{2}:\\d{2} UTC/')
    await expect(clock).toBeVisible({ timeout: 5_000 })

    await app.close()
  })
})

test.describe('License expiry — activation flow', () => {

  test('6 · expired license (999999) → "Expired" toast, stays on license page', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)

    await win.locator('h1').filter({ hasText: 'Activate License' }).waitFor({ timeout: 12_000 })
    await win.locator('input[data-input-otp="true"]').click()
    await win.keyboard.type(LICENSES.expired, { delay: 80 })
    await win.locator('button', { hasText: 'Activate' }).click()

    const toast = win.locator('li[role="status"][data-state="open"]').first()
    await expect(toast).toBeVisible({ timeout: 10_000 })
    expect(await toast.textContent()).toContain('Expired')

    await expect(win.locator('h1').filter({ hasText: 'Activate License' })).toBeVisible()

    await win.screenshot({ path: '/tmp/pw_license_expired_toast.png' })
    await app.close()
  })

  test('7 · attempt counter decrements and button locks after 5 failed tries', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)
    await win.locator('h1').filter({ hasText: 'Activate License' }).waitFor({ timeout: 12_000 })

    // The paragraph shows "X attempts remaining." after each failed try
    const paragraph = win.locator('p').filter({ hasText: /attempt/ })

    for (let attempt = 1; attempt <= 5; attempt++) {
      await clearOtp(win)
      await win.locator('input[data-input-otp="true"]').click()
      await win.keyboard.type(LICENSES.invalid, { delay: 60 })
      await win.locator('button', { hasText: 'Activate' }).click()

      // Wait for the toast to appear (Firebase round-trip)
      const toast = win.locator('li[role="status"][data-state="open"]').first()
      await toast.waitFor({ state: 'visible', timeout: 8_000 })

      // After each attempt the paragraph updates with remaining count
      if (attempt < 5) {
        const remaining = 5 - attempt
        await expect(paragraph).toContainText(`${remaining} attempt`, { timeout: 3_000 })
      }
      // Wait for isLoading → false before next attempt
      await win.locator('button', { hasText: 'Activate' }).waitFor({ state: 'visible', timeout: 4_000 })
      await win.waitForTimeout(200)
    }

    // After 5 attempts the Activate button must be disabled
    await expect(win.locator('button', { hasText: 'Activate' })).toBeDisabled({ timeout: 3_000 })

    await win.screenshot({ path: '/tmp/pw_license_locked.png' })
    await app.close()
  })
})
