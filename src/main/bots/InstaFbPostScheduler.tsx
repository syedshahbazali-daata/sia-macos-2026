import { Page } from 'patchright'
import type { Scheduler } from '../types'

async function InstaFbPostScheduler(
  page: Page,
  schedules: Scheduler[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void,
): Promise<void> {
  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue

    try {
      const { description_text, signature, platform, set_date: date, set_time: time } = schedule
      const isInstagram = platform.toLowerCase().includes('instagram')

      await page.goto('https://business.facebook.com/latest/composer', { timeout: 0 })

      // Deselect the other platform (Meta pre-selects both; click to toggle off the unwanted one)
      const platformToDeselect = isInstagram
        ? "xpath=//*[@alt='Facebook']/ancestor::*[@role='option']"
        : "xpath=//*[@alt='Instagram']/ancestor::*[@role='option']"

      await page.waitForSelector("xpath=//*[@aria-haspopup='listbox']")
      await page.click("xpath=//*[@aria-haspopup='listbox']", { timeout: 60000 })
      await page.waitForSelector("xpath=//*[@role='option']")

      const el = await page.$(platformToDeselect)
      if (el) {
        try {
          await page.click(platformToDeselect, { timeout: 2000 })
        } catch {
          // not clickable — already deselected
        }
      }

      await page.waitForTimeout(1000)
      await page.click("xpath=//*[@aria-haspopup='listbox']", { timeout: 60000 })

      // Upload each media file
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
      for (const mediaItem of schedule.media_path) {
        const ext = '.' + (mediaItem.filePath.split('.').pop() ?? '').toLowerCase()
        const isImage = imageExtensions.includes(ext)
        const addSelector = isImage
          ? "xpath=//div[contains(text(), 'Add') and contains(text(), 'photo')]"
          : "xpath=//div[contains(text(), 'Add') and contains(text(), 'video')]"

        const hasPhotoSlash = await page.$("xpath=//div[contains(text(), 'Add') and contains(text(), 'photo/')]")
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.click(addSelector)
        if (!hasPhotoSlash) {
          await page.click("xpath=//*[contains(text(), 'Upload from')]", { timeout: 0 })
        }
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles(mediaItem.filePath)
      }

      await page.type(
        'xpath=//div[@aria-label="Write into the dialogue box to include text with your post."]',
        `${description_text}\n${signature}`,
      )
      await page.waitForTimeout(1000)

      await page.click(
        "xpath=//*[contains(text(), 'Scheduling')]/../..//input[@role='switch'] | //*[contains(text(), 'Scheduling')]/../..//*[text()='Schedule']",
        { timeout: 0 },
      )
      await page.waitForSelector("xpath=//input[@placeholder]")
      await page.click("xpath=//input[@placeholder]", { timeout: 0 })

      const parsedDate = new Date(date)
      const month = parsedDate.getMonth() + 1
      const day = parsedDate.getDate()
      const year = parsedDate.getFullYear()
      await page.fill("xpath=//input[@placeholder]", `${month}/${day}/${year}`, { timeout: 0 })

      try {
        await page.waitForSelector("xpath=//input[@aria-label='meridiem']", { timeout: 2000 })
        const [hour, minute] = time.split(':')
        const amPm = time.split(' ')[1]
        await page.type("xpath=//input[@aria-label='hours']", hour, { timeout: 0 })
        await page.type("xpath=//input[@aria-label='minutes']", minute, { timeout: 0 })
        await page.type("xpath=//input[@aria-label='meridiem']", amPm, { timeout: 0 })
      } catch {
        let [hour, minute] = time.split(':')
        minute = minute.split(' ')[0]
        const amPm = time.split(' ')[1]
        if (amPm === 'PM') hour = String(parseInt(hour) + 12)
        await page.fill("xpath=//input[@aria-label='hours']", hour, { timeout: 0 })
        await page.fill("xpath=//input[@aria-label='minutes']", minute, { timeout: 0 })
      }

      await page.click(
        "xpath=//*[text()='Cancel']/../../../../../../..//*[text()='Schedule']",
        { timeout: 0 },
      )
      await page.waitForTimeout(5000)

      moveToHistory(schedule.id, jsonFilePath)
    } catch (error) {
      console.error(`InstaFbPostScheduler failed for ${schedule.id}:`, error)
      throw error
    }
  }
}

export { InstaFbPostScheduler }
