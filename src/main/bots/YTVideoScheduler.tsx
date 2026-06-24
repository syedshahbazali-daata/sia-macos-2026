import { Page } from 'patchright'
import type { Scheduler } from '../types'

function formatDateToMMMDDYYYY(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString))
}

async function YTVideoScheduler(
  page: Page,
  schedules: Scheduler[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void,
): Promise<void> {
  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue

    try {
      const media_path = schedule.media_path.map((f) => f.filePath)
      const scheduleDate = formatDateToMMMDDYYYY(schedule.set_date)
      const fullText = `${schedule.description_text} ${schedule.signature}`

      await page.goto('https://studio.youtube.com/', { timeout: 0 })
      await page.waitForTimeout(2000)

      await page.click("xpath=//*[@id='create-icon']")
      await page.click("xpath=//*[text()='Upload videos']")

      await page.waitForSelector("xpath=//*[contains(text(),'Select ')]", { timeout: 30000 })
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click("xpath=//*[contains(text(),'Select ')]", { timeout: 30000 }),
      ])
      await fileChooser.setFiles(media_path)

      await page.fill("xpath=//*[@id='textbox']", fullText)

      await page.click("xpath=//*[@name='VIDEO_MADE_FOR_KIDS_NOT_MFK']//*[@id='offRadio']")

      for (let i = 0; i < 3; i++) {
        await page.click("xpath=//*[text()='Next']")
        await page.waitForTimeout(1000)
      }

      await page.click("xpath=//*[@id='second-container-expand-button']")

      await page.click("xpath=//*[@id='labelAndInputContainer']//input")
      await page.fill("xpath=//*[@id='labelAndInputContainer']//input", schedule.set_time)
      await page.press("xpath=//*[@id='labelAndInputContainer']//input", 'Enter')
      await page.waitForTimeout(500)

      await page.click("xpath=//*[@id='datepicker-trigger']")
      await page.fill("xpath=(//*[@id='labelAndInputContainer']//input)[2]", scheduleDate)
      await page.press("xpath=(//*[@id='labelAndInputContainer']//input)[2]", 'Enter')

      await page.waitForTimeout(2000)
      await page.click("xpath=//*[@aria-label='Schedule']")
      await page.waitForTimeout(4000)

      moveToHistory(schedule.id, jsonFilePath)
    } catch (error) {
      console.error(`YTVideoScheduler failed for schedule ${schedule.id}:`, error)
      throw error
    }
  }
}

export { YTVideoScheduler }
