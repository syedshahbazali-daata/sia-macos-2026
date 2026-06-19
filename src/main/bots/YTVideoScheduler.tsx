// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck


import { Page } from 'playwright';

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
  set_date: string; // Example: "Oct 10 2021"
  created_at: number;
  set_time: string; // Example: "12:00 AM"
  media_path: MediaPath[];
  platform: string;
}

function formatDateToMMMDDYYYY(dateString) {
  // Convert the input date string to a Date object
  let dateObj = new Date(dateString);

  // Use Intl.DateTimeFormat to format the date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', // "Jan"
    day: 'numeric', // "11"
    year: 'numeric' // "2025"
  }).format(dateObj);
}

async function YTVideoScheduler(
  page: Page,
  schedules: Schedule[],
  jsonFilePath: string,
  moveToHistory: (schedulerId: string, jsonFilePath: string) => void
): Promise<void> {
  try {
    for (const schedule of schedules) {
      console.log(`Processing schedule for ID: ${schedule.id}`);

      // Navigate to YouTube Studio
      await page.goto('https://studio.youtube.com/', { timeout: 0 });

      // Open upload dialog
      await page.waitForTimeout(2000);
      await page.click("xpath=//*[@id='create-icon']");
      await page.click("xpath=//*[text()='Upload videos']");

      // Wait for the file chooser and upload media
      const media_path = schedule.media_path.map(file => file.filePath);
      await page.waitForSelector("xpath=//*[contains(text(),'Select ')]", { timeout: 30000 });
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click("xpath=//*[contains(text(),'Select ')]", { timeout: 30000 }),
      ]);

      await fileChooser.setFiles(media_path)


      console.log('Filling city as description...');
      await page.fill("xpath=//*[@id='textbox']",
        `${schedule.description_text} ${schedule.signature}`);

      // Set video as "Not Made for Kids"
      console.log('Setting video audience...');
      await page.click("xpath=//*[@name='VIDEO_MADE_FOR_KIDS_NOT_MFK']//*[@id='offRadio']");

      // Navigate through the Next buttons
      for (let i = 0; i < 3; i++) {
        await page.click("xpath=//*[text()='Next']");
        await page.waitForTimeout(1000);
      }

      // Open the scheduling options
      await page.click("xpath=//*[@id='second-container-expand-button']");

      //
      //

      let scheduleDate = formatDateToMMMDDYYYY(schedule.set_date);

      console.log(`Setting schedule date: ${scheduleDate} and time: ${schedule.set_time}`);

      await page.click("xpath=//*[@id='labelAndInputContainer']//input");
      await page.fill("xpath=//*[@id='labelAndInputContainer']//input", schedule.set_time);
      await page.press("xpath=//*[@id='labelAndInputContainer']//input", "Enter");

      await page.waitForTimeout(500);

      await page.click("xpath=//*[@id='datepicker-trigger']");
      await page.fill("xpath=(//*[@id='labelAndInputContainer']//input)[2]", scheduleDate);
      await page.press("xpath=(//*[@id='labelAndInputContainer']//input)[2]", "Enter");

      // Confirm scheduling
      console.log('Confirming schedule...');
      await page.waitForTimeout(2000);
      await page.click("xpath=//*[@aria-label='Schedule']");
      await page.waitForTimeout(4000);

      console.log(`Schedule for ID: ${schedule.id} completed.`);

      // Move schedule to history
      moveToHistory(schedule.id, jsonFilePath);
    }
  } catch (error) {
    console.error('Error during scheduling:', error);
  }
}

export { YTVideoScheduler };
