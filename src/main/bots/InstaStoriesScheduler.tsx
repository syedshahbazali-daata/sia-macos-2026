import { Page } from 'patchright'
import type { Scheduler } from '../types'

async function InstaStoryScheduler(
  page: Page,
  schedules: Scheduler[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void,
): Promise<void> {
  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue

    try {
      const media_path = schedule.media_path.map((f) => f.filePath)

      await page.goto('https://business.facebook.com/latest/story_composer', { timeout: 0 })

      await page.waitForSelector("xpath=//*[@aria-haspopup='listbox']")
      await page.click("xpath=//*[@aria-haspopup='listbox']")
      await page.waitForSelector("xpath=//*[@role='option']")

      const fbEl = await page.$("xpath=//*[@alt='Facebook']/ancestor::*[@role='option']")
      if (fbEl) {
        try {
          await page.click("xpath=//*[@alt='Facebook']/ancestor::*[@role='option']", {
            timeout: 2000,
          })
        } catch {
          // not clickable
        }
      }

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
      for (const mediaFile of media_path) {
        const ext = '.' + (mediaFile.split('.').pop() ?? '').toLowerCase()
        const isImage = imageExtensions.includes(ext)
        const selector = isImage
          ? "xpath=//div[contains(text(), 'Add') and contains(text(), 'photo')]"
          : "xpath=//div[contains(text(), 'Add') and contains(text(), 'video')]"
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.click(selector),
        ])
        await fileChooser.setFiles([mediaFile])
      }

      await page.click(
        "xpath=//*[contains(text(), 'Scheduling')]/../..//input[@role='switch'] | //*[contains(text(), 'Scheduling')]/../..//*[text()='Schedule']",
      )
      await page.waitForSelector("xpath=//input[@placeholder]")

      const [y, mo, d] = schedule.set_date.split('-').map(Number)
      const formattedDate = `${mo}/${d}/${y}`
      await page.fill("xpath=//input[@placeholder]", '')
      await page.fill("xpath=//input[@placeholder]", formattedDate)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)

      const hours = parseInt(schedule.set_time.split(':')[0], 10)
      const minutes = schedule.set_time.split(':')[1]
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const formattedHours = hours % 12 || 12

      try {
        await page.type("xpath=//input[@aria-label='hours']", String(formattedHours))
        await page.type("xpath=//input[@aria-label='minutes']", minutes)
        await page.fill("xpath=//input[@aria-label='meridiem']", ampm)
      } catch (error) {
        console.error('Error setting story time:', error)
      }

      await page.waitForTimeout(5000)
      await page.click(
        "xpath=//*[text()='Cancel']/../../../../../../..//*[text()='Schedule']",
      )

      moveToHistory(schedule.id, jsonFilePath)
      await page.waitForTimeout(5000)
    } catch (error) {
      console.error(`InstaStoryScheduler failed for ${schedule.id}:`, error)
      throw error
    }
  }
}

export { InstaStoryScheduler }
