import { test, expect } from '@playwright/test'
import {
  launch, clearStorage, reload, activateLicense, createInstance,
  mockBrowserExists, waitForToast, LICENSES
} from './helpers'

test.describe('Instance creation & management', () => {

  test('1 · empty fields → error toast', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)
    await activateLicense(win, LICENSES.valid)

    // Already on Setup Instance (no instances, browser mocked as present)
    await win.locator('h1').filter({ hasText: 'Setup Instance' }).waitFor({ timeout: 10_000 })
    await win.locator('button', { hasText: 'Create Instance' }).click()

    const toast = await waitForToast(win)
    expect(await toast.textContent()).toContain('Missing Information')

    await win.screenshot({ path: '/tmp/pw_instance_empty.png' })
    await app.close()
  })

  test('2 · name too short (< 3 chars) → error toast', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)
    await activateLicense(win, LICENSES.valid)

    await win.locator('h1').filter({ hasText: 'Setup Instance' }).waitFor({ timeout: 10_000 })
    await win.locator('input[placeholder="Instance Name"]').fill('Ab')
    await win.locator('input[placeholder="Set Password"]').fill('pass123')
    await win.locator('button', { hasText: 'Create Instance' }).click()

    const toast = await waitForToast(win)
    expect(await toast.textContent()).toContain('too Short')

    await app.close()
  })

  test('3 · valid details → instance created, navigates to list', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)
    await activateLicense(win, LICENSES.valid)

    await createInstance(win, 'MyInstance', 'secret123')

    await win.locator('h1').filter({ hasText: 'List of Instances' }).waitFor({ timeout: 8_000 })
    await expect(win.locator('h3', { hasText: 'MyInstance' })).toBeVisible()

    await win.screenshot({ path: '/tmp/pw_instance_created.png' })
    await app.close()
  })

  test('4 · duplicate instance name → error toast', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)
    await activateLicense(win, LICENSES.valid)

    await createInstance(win, 'Unique', 'pass123')
    await win.locator('h1').filter({ hasText: 'List of Instances' }).waitFor({ timeout: 8_000 })

    // "Add Instance" is an h3 that navigates to /instance/create
    await win.locator('h3', { hasText: 'Add Instance' }).click()
    await createInstance(win, 'Unique', 'pass456')

    const toast = await waitForToast(win)
    expect(await toast.textContent()).toContain('already exists')

    await win.screenshot({ path: '/tmp/pw_instance_duplicate.png' })
    await app.close()
  })

  test('5 · instance appears in list with avatar and delete button', async () => {
    const { app, win } = await launch()
    await mockBrowserExists(app)
    await clearStorage(win)
    await reload(win)
    await activateLicense(win, LICENSES.valid)

    await createInstance(win, 'AvatarTest', 'pass123')
    await win.locator('h1').filter({ hasText: 'List of Instances' }).waitFor({ timeout: 8_000 })

    const row = win.locator('div').filter({ has: win.locator('h3', { hasText: 'AvatarTest' }) }).first()
    await expect(row.locator('img[alt="avatar"]').first()).toBeVisible()
    await expect(row.locator('button', { hasText: 'Delete' })).toBeVisible()

    await win.screenshot({ path: '/tmp/pw_instance_list.png' })
    await app.close()
  })
})
