import { test, expect } from '@playwright/test'
import {
  launch, clearStorage, reload, activateLicense, createInstance,
  mockBrowserExists, waitForToast, LICENSES
} from './helpers'

const INSTANCE_NAME = 'PwdTest'
const CORRECT_PWD = 'correct99'

async function setup(app: Parameters<typeof mockBrowserExists>[0], win: Parameters<typeof createInstance>[0]): Promise<void> {
  await mockBrowserExists(app)
  await clearStorage(win)
  await reload(win)
  await activateLicense(win, LICENSES.valid)
  await createInstance(win, INSTANCE_NAME, CORRECT_PWD)
  await win.locator('h1').filter({ hasText: 'List of Instances' }).waitFor({ timeout: 8_000 })
  await win.locator('h3', { hasText: INSTANCE_NAME }).click()
  await win.locator('button', { hasText: 'Login' }).click()
  await win.locator('h1').filter({ hasText: 'Run Instance' }).waitFor({ timeout: 8_000 })
}

test.describe('Password screen', () => {

  test('1 · empty password → error toast', async () => {
    const { app, win } = await launch()
    await setup(app, win)

    await win.locator('button', { hasText: 'Run Instance' }).click()

    const toast = await waitForToast(win)
    expect(await toast.textContent()).toContain('Field Required')

    await win.screenshot({ path: '/tmp/pw_pwd_empty.png' })
    await app.close()
  })

  test('2 · wrong password → error toast, stays on password screen', async () => {
    const { app, win } = await launch()
    await setup(app, win)

    await win.locator('input[placeholder="Enter Password"]').fill('wrongpass')
    await win.locator('button', { hasText: 'Run Instance' }).click()

    const toast = await waitForToast(win)
    expect(await toast.textContent()).toContain('Invalid Password')
    await expect(win.locator('h1').filter({ hasText: 'Run Instance' })).toBeVisible()

    await win.screenshot({ path: '/tmp/pw_pwd_wrong.png' })
    await app.close()
  })

  test('3 · correct password → navigates to dashboard', async () => {
    const { app, win } = await launch()
    await setup(app, win)

    await win.locator('input[placeholder="Enter Password"]').fill(CORRECT_PWD)
    await win.locator('button', { hasText: 'Run Instance' }).click()

    await win.locator('text=Creator earnings overview').waitFor({ timeout: 10_000 })
    await expect(win.locator('text=Creator earnings overview')).toBeVisible()

    await win.screenshot({ path: '/tmp/pw_pwd_correct.png' })
    await app.close()
  })

  test('4 · show/hide password toggle changes input type', async () => {
    const { app, win } = await launch()
    await setup(app, win)

    const input = win.locator('input[placeholder="Enter Password"]')
    await expect(input).toHaveAttribute('type', 'password')

    // The eye-toggle button is the last button[type="button"] on the card
    const toggle = win.locator('button[type="button"]').last()
    await toggle.click()
    await expect(input).toHaveAttribute('type', 'text')

    await toggle.click()
    await expect(input).toHaveAttribute('type', 'password')

    await app.close()
  })

  test('5 · cancel button returns to instance list', async () => {
    const { app, win } = await launch()
    await setup(app, win)

    await win.locator('button', { hasText: 'Cancel' }).click()
    await win.locator('h1').filter({ hasText: 'List of Instances' }).waitFor({ timeout: 6_000 })
    await expect(win.locator('h1').filter({ hasText: 'List of Instances' })).toBeVisible()

    await app.close()
  })
})
