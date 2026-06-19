// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {Page} from 'playwright';

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
  media_path: string[];
  platform: string;
}

async function InstaFbPostScheduler(
  page: Page,
  schedules: Schedule[],
  jsonFilePath: string,
  moveToHistory: (schedule: Schedule, jsonFilePath: string) => void
): Promise<void> {
  for (const schedule of schedules) {
    const {description_text: description, platform, set_date: date, set_time: time} = schedule;

    // Navigate to the Facebook Composer page
    await page.goto('https://business.facebook.com/latest/composer', {timeout: 0});

    // Select platform (Instagram or Facebook)
    const isInstagram = platform.toLowerCase().includes('instagram');
    const platformSelector = isInstagram
      ? "xpath=//*[@alt='Facebook']/ancestor::*[@role='option']"
      : "xpath=//*[@alt='Instagram']/ancestor::*[@role='option']";

    await page.waitForSelector("xpath=//*[@aria-haspopup='listbox']");
    await page.click("xpath=//*[@aria-haspopup='listbox']", {timeout: 60000});
    await page.waitForSelector("xpath=//*[@role='option']");
    // await page.click(platformSelector, {timeout: 60000});

    await page.$(platformSelector).then(
      async (element) => {
        if (element) {
          try {
            await page.click(platformSelector, {timeout: 2000});
          } catch (error) {
            console.log('Element is not clickable:', error);
          }
        }
      }
    );


    await page.waitForTimeout(1000);
    await page.click("xpath=//*[@aria-haspopup='listbox']", {timeout: 60000});


    const mediaFiles = schedule.media_path.map(file => file.filePath);

    // Upload media files
    for (const mediaFile of mediaFiles) {
      const fileExtension = '.' + mediaFile.split('.').pop()?.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

      // if //div[contains(text(), 'Add') and contains(text(), 'photo/')] exists
      const isUploadFromExists = await page.$("xpath=//div[contains(text(), 'Add') and contains(text(), 'photo/')]");


      const fileChooserXpath = imageExtensions.includes(fileExtension)
        ? "xpath=//div[contains(text(), 'Add') and contains(text(), 'photo')]"
        : "xpath=//div[contains(text(), 'Add') and contains(text(), 'video')]";

      const fileChooserPromise = page.waitForEvent('filechooser');


      await page.click(fileChooserXpath)
      if (!isUploadFromExists) {
        await page.click("xpath=//*[contains(text(), 'Upload from')]", {timeout: 0})

      }


      const fileChooser = await fileChooserPromise;
      console.log(mediaFile, "re")
      await fileChooser.setFiles(mediaFile)

    }

    // Add description
    await page.type('xpath=//div[@aria-label="Write into the dialogue box to include text with your post."]', `${schedule.description_text}\n${schedule.signature}`);
    await page.waitForTimeout(1000);

    // Schedule post
    await page.click("xpath=//*[contains(text(), 'Scheduling')]/../..//input[@role='switch'] | //*[contains(text(), 'Scheduling')]/../..//*[text()='Schedule']", {timeout: 0});
    await page.waitForSelector("xpath=//input[@placeholder]");
    await page.click("xpath=//input[@placeholder]", {timeout: 0});

    // Convert date and time for scheduling
    const parsedDate = new Date(date);
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();
    const year = parsedDate.getFullYear();

    await page.fill("xpath=//input[@placeholder]", `${month}/${day}/${year}`, {timeout: 0});

    try {
      await page.waitForSelector("xpath=//input[@aria-label='meridiem']", {timeout: 2000});

      const [hour, minute] = time.split(':');
      const amPm = time.split(' ')[1];
      await page.type("xpath=//input[@aria-label='hours']", hour, {timeout: 0});
      await page.type("xpath=//input[@aria-label='minutes']", minute, {timeout: 0});
      await page.type("xpath=//input[@aria-label='meridiem']", amPm, {timeout: 0});
    } catch {
      let [hour, minute] = time.split(':');
      minute = minute.split(' ')[0];
      const amPm = time.split(' ')[1];

      if (amPm === 'PM') {
        hour = (parseInt(hour) + 12).toString();
      }

      await page.fill("xpath=//input[@aria-label='hours']", hour, {timeout: 0});
      await page.fill("xpath=//input[@aria-label='minutes']", minute, {timeout: 0});
    }

    // Confirm scheduling
    await page.click("xpath=//*[text()='Cancel']/../../../../../../..//*[text()='Schedule']", {timeout: 0});
    await page.waitForTimeout(5000);

    // Move to history
    moveToHistory(schedule.id, jsonFilePath);
  }
}

export {InstaFbPostScheduler}
