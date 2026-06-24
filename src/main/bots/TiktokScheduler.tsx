import { Page } from 'patchright'
import type { Scheduler } from '../types'

async function TikTokPostScheduler(
  page: Page,
  schedules: Scheduler[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void,
): Promise<void> {
  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue

    try {
      const mediaFile = schedule.media_path.map((f) => f.filePath)
      const caption = `${schedule.description_text}\n${schedule.signature}`
      const months = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December',
      ]
      const [year, month, day] = schedule.set_date.split('-')

      await page.goto('https://www.tiktok.com/creator#/upload?scene=creator_center', { timeout: 0 })

      // TikTok hides the file input — make it visible before setInputFiles
      await page.evaluate(() => {
        const input = document.querySelector('input[type=file]') as HTMLInputElement | null
        if (input) input.style.display = 'block'
      })
      await page.setInputFiles('input[type=file]', mediaFile)

      await page.waitForSelector('xpath=//div[@role="combobox"]')
      await page.fill('xpath=//div[@role="combobox"]', '')
      await page.type('xpath=//div[@role="combobox"]', caption)

      // Wait for Post button to be ready
      let postButtonReady = false
      while (!postButtonReady) {
        const btn = page.locator('xpath=//button[not(@disabled)]//div[text()="Post"]')
        postButtonReady = (await btn.isVisible()) && !(await btn.isDisabled())
        if (!postButtonReady) await page.waitForTimeout(2000)
      }

      await page.locator('xpath=//label[contains(text(), "chedule")]/..').click()

      try {
        await page.waitForSelector('xpath=//*[text()="Allow"]', { timeout: 3000 })
        await page.locator('xpath=//*[text()="Allow"]').click()
      } catch {
        // Allow dialog not shown
      }

      // Navigate calendar to the target month/year/day
      const datePickerXPath = '//input[contains(@value, "-")]'
      await page.click(datePickerXPath)

      while (true) {
        let monthTitle: string
        try {
          monthTitle = await page.locator('xpath=//*[contains(@class, "month-title")]').innerText()
        } catch {
          await page.click(datePickerXPath)
          continue
        }
        const yearTitle = await page.locator('xpath=//*[contains(@class, "year-title")]').innerText()
        const currentMonthIndex = months.indexOf(monthTitle)
        const targetYear = parseInt(year)
        const currentYear = parseInt(yearTitle)
        const targetMonth = parseInt(month) - 1

        if (currentYear === targetYear && currentMonthIndex === targetMonth) {
          await page.click(
            `xpath=//*[contains(@class, "day valid") or contains(@class, "day selected")][text()="${parseInt(day)}"]`,
          )
          break
        }
        const goNext =
          currentYear < targetYear ||
          (currentYear === targetYear && currentMonthIndex < targetMonth)
        await page.click(
          goNext
            ? 'xpath=//*[contains(@class, "arrow")][2]'
            : 'xpath=//*[contains(@class, "arrow")][1]',
        )
      }

      // Round time to nearest 5-minute mark
      let [h, m] = schedule.set_time.split(':').map(Number)
      if (m % 5 !== 0) {
        m = m + 5 - (m % 5)
        if (m === 60) { m = 0; h += 1; if (h === 24) h = 0 }
      }
      const hStr = h === 0 ? '00' : String(h)
      const mStr = m === 0 ? '00' : String(m)

      await page.click('xpath=//input[contains(@value, ":")]')
      await page.click(`xpath=//span[contains(@class, "tiktok-timepicker-left")][text()="${hStr}"]`)
      await page.click(`xpath=//span[contains(@class, "tiktok-timepicker-right")][text()="${mStr}"]`)
      await page.waitForTimeout(2000)

      await page.waitForSelector('xpath=//button[not(@disabled)]//div[text()="Schedule"]/../..')
      await page.evaluate(() => {
        const xp = '//button[not(@disabled)]//div[text()="Schedule"]/../..'
        const el = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
          .singleNodeValue as HTMLElement | null
        if (el) el.click()
      })

      await page.waitForTimeout(6000)
      moveToHistory(schedule.id, jsonFilePath)
    } catch (error) {
      console.error(`TikTokPostScheduler failed for ${schedule.id}:`, error)
      throw error
    }
  }
}

export { TikTokPostScheduler }
