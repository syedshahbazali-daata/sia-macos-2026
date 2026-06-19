import {Page} from 'patchright';
interface MediaPath { filePath: string; previewUrl: string; isPaid: boolean }

interface Schedule {
  id: string;
  Instance_id: string;
  description_type: string;
  city: string;
  isScheduled: number;
  description_text: string;
  signature: string;
  set_price: number;
  set_date: string;
  created_at: number;
  set_time: string;
  media_path: MediaPath[];
  platform: string;
}


async function InstaStoryScheduler(
  page: Page,
  schedules: Schedule[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void
): Promise<void> {
  for (const schedule of schedules) {
    try {
      const media_path = schedule.media_path.map(file => file.filePath);

      // Navigate to the story composer page
      await page.goto('https://business.facebook.com/latest/story_composer', { timeout: 0 });

      // Select platform (Facebook)
      await page.waitForSelector("xpath=//*[@aria-haspopup='listbox']");
      await page.click("xpath=//*[@aria-haspopup='listbox']");
      await page.waitForSelector("xpath=//*[@role='option']");
      await page.$("xpath=//*[@alt='Facebook']/ancestor::*[@role='option']").then(
        async (element) => {
          if (element) {
            // check is it clickable
            try {
              await page.click("xpath=//*[@alt='Facebook']/ancestor::*[@role='option']",
                {timeout: 2000});
            } catch (error) {
              console.log('Element is not clickable:', error);
            }
          }
        }
      );

      // Upload media files
      for (const mediaFile of media_path) {
        const fileExtension = '.' + (mediaFile.split('.').pop() ?? '').toLowerCase()
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
        const fileChooserSelector = imageExtensions.includes(fileExtension)
          ? "xpath=//div[contains(text(), 'Add') and contains(text(), 'photo')]"
          : "xpath=//div[contains(text(), 'Add') and contains(text(), 'video')]";

        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.click(fileChooserSelector)
        ]);
        await fileChooser.setFiles([mediaFile]);
      }

      // Set scheduling options
      await page.click(
        "xpath=//*[contains(text(), 'Scheduling')]/../..//input[@role='switch'] | //*[contains(text(), 'Scheduling')]/../..//*[text()='Schedule']"
      );
      await page.waitForSelector("xpath=//input[@placeholder]");

      // converting ('2025-01-11') to 01/11/2025
      const [year, month, day] = schedule.set_date.split('-').map(Number);
      const formattedDate = `${month}/${day}/${year}`;

      await page.fill("xpath=//input[@placeholder]", "");
      await page.fill("xpath=//input[@placeholder]", formattedDate);
      // press enter
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000)

      // MANAGING TIME converting 18:17 to 6:17 PM
      const [hoursStr, minutes] = schedule.set_time.split(':')
      const hours = parseInt(hoursStr, 10)
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const formattedHours = hours % 12 || 12

      console.log(`Scheduling story for ${schedule.id} on ${formattedDate} at ${formattedHours}:${minutes} ${ampm}`);

      try {
        await page.type("xpath=//input[@aria-label='hours']", formattedHours.toString());
        await page.type("xpath=//input[@aria-label='minutes']", minutes.toString());
        await page.fill("xpath=//input[@aria-label='meridiem']", ampm);
      } catch (error) {
        console.error('Error setting time:', error);
      }


      await page.waitForTimeout(5000)

      // Schedule the story
      await page.click(
        "xpath=//*[text()='Cancel']/../../../../../../..//*[text()='Schedule']"
      );

      // Notify completion
      moveToHistory(schedule.id, jsonFilePath);
      await page.waitForTimeout(5000);


    } catch (error) {
      console.error(`Error scheduling story for ${schedule.id}:`, error);
    }
  }
}

export { InstaStoryScheduler };
