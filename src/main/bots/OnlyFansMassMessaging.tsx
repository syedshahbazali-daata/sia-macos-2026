import { Page } from 'patchright'
import type { Scheduler } from '../types'

const OF_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

async function OnlyFansMassMessageScheduler(
  page: Page,
  schedules: Scheduler[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void,
): Promise<void> {
  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue

    try {
      const [year, month, day] = schedule.set_date.split('-').map(Number)
      const monthName = OF_MONTHS[month - 1]
      const [hourStr, minute] = schedule.set_time.split(':')
      const hour = parseInt(hourStr, 10)
      const amPm = hour >= 12 ? 'PM' : 'AM'
      const adjustedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour

      await page.goto('https://onlyfans.com/my/queue')
      await page.click('//button[@at-attr="add_event_header"]')

      // Date picker
      await page.click('(//input[@class="vdatetime-input form-control g-input"])[1]')
      await page.click('//div[@class="vdatetime-popup__year"]')
      await page.click(`//div[contains(text(), "${year}")]`)
      await page.click('//button[text()=" Save "]')
      await page.click('//div[@class="vdatetime-popup__date"]')
      await page.click(
        `//div[contains(@class,"vdatetime-month-picker") and contains(text(), "${monthName}")]`,
      )
      await page.click('//button[text()=" Save "]')
      await page.click(`//div[@class="vdatetime-calendar__month__day"]//span[text()="${day}"]`)
      await page.click('//button[text()=" Next "]')

      // Time picker
      await page.click('(//input[@class="vdatetime-input form-control g-input"])[2]')
      await page.click(`//div[text()="${amPm.toLowerCase()}"]`)
      await page.click(
        `//div[contains(@class,"vdatetime-time-picker__list--hours")]//*[text()="${adjustedHour}"]`,
      )
      await page.click(
        `//div[contains(@class,"vdatetime-time-picker__list--minutes")]//*[text()="${minute}"]`,
      )
      await page.click('//button[text()=" Save "]')

      await page.click('xpath=//button[text()=" Mass message "]', { timeout: 30000 })
      await page.waitForSelector('//*[@id="attach_file_photo"]')
      await page.waitForTimeout(1000)

      const paidFiles = schedule.media_path
        .filter((f) => f.isPaid === true)
        .map((f) => f.filePath)
      const freeFiles = schedule.media_path
        .filter((f) => f.isPaid === false)
        .map((f) => f.filePath)

      if (schedule.set_price > 0) {
        const freeChooserPromise = page.waitForEvent('filechooser')
        await page.click('xpath=//*[@id="attach_file_photo"]')
        const freeChooser = await freeChooserPromise
        await freeChooser.setFiles(freeFiles)
        await page.waitForTimeout(1000)

        await page.click('//button[@at-attr="price_btn"]', { timeout: 122000 })
        await page.fill('//input[contains(@id, "price")]', String(schedule.set_price))
        await page.click('//button[text()=" Save "]')

        if (freeFiles.length > 0) {
          await page.click('xpath=//*[@data-icon-name="icon-arrow-left"]/..')
          await page.waitForSelector("xpath=//button[contains(@class, 'checkbox-item')]", {
            timeout: 0,
          })
          await page.evaluate(() => {
            document.querySelectorAll('button.checkbox-item').forEach((el) =>
              (el as HTMLElement).click(),
            )
          })
          await page.click('xpath=//*[@data-icon-name="icon-arrow-left"]/..')
          await page.click('xpath=//button[@aria-label="Save"]//*[@data-icon-name="icon-done"]/..')
        }
      }

      const paidChooserPromise = page.waitForEvent('filechooser')
      await page.click('xpath=//*[@id="attach_file_photo"]')
      const paidChooser = await paidChooserPromise
      await paidChooser.setFiles(paidFiles)

      await page.type(
        'xpath=//div[contains(@data-placeholder,"a message")]',
        `${schedule.description_text}\n${schedule.signature}`,
        { timeout: 30000 },
      )
      await page.waitForTimeout(1000)

      await page.click("xpath=//a//*[contains(text(), 'Fans')]/../..", { timeout: 0 })
      await page.waitForTimeout(1000)
      await page.click("xpath=//button[@at-attr='send_btn' and not(@disabled)]", { timeout: 0 })
      await page.click("xpath=//button[text()=' Yes ']", { timeout: 0 })

      await page.waitForTimeout(4000)
      moveToHistory(schedule.id, jsonFilePath)
    } catch (error) {
      console.error(`OnlyFansMassMessageScheduler failed for ${schedule.id}:`, error)
      throw error
    }
  }
}

export { OnlyFansMassMessageScheduler }
