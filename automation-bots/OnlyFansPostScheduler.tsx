// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck


import {Page} from 'patchright';

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

async function OfPostScheduler(
  page: Page,
  schedules: Schedule[],
  jsonFilePath: string,
  moveToHistory: (schedule: Schedule, jsonFilePath: string) => void
): Promise<void> {
  const parseDate = (dateString: string): [string, number, number] => {
    // Convert a date string like "2025-01-11" into [year, month, day]
    const [year, month, day] = dateString.split('-').map(Number);
    return [year, month, day];
  };


  for (const schedule of schedules) {
    try {
      console.log(`Processing schedule: ${schedule.id}`);

      const [year, month, day] = parseDate(schedule.set_date);

      let [hour, minute] = schedule.set_time.split(":")

      // if  hour is greater than 12, then it is PM
      let am_pm = "AM";
      if (hour > 12) {
        am_pm = "PM";
      }

      await page.goto('https://onlyfans.com/my/queue');
      await page.click('//button[@at-attr="add_event_header"]');

      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = months[month - 1];
      console.log(`Scheduling post for: ${schedule.id} on ${monthName} ${day}, ${year} at ${hour}:${minute} ${am_pm}`);

      // Set date
      await page.click('(//input[@class="vdatetime-input form-control g-input"])[1]');
      await page.click('//div[@class="vdatetime-popup__year"]');
      await page.click(`//div[contains(text(), "${year}")]`);
      await page.click('//button[text()=" Save "]');
      await page.click('//div[@class="vdatetime-popup__date"]');
      await page.click(`//div[contains(@class,"vdatetime-month-picker") and contains(text(), "${monthName}")]`);
      await page.click('//button[text()=" Save "]');
      await page.click(`//div[@class="vdatetime-calendar__month__day"]//span[text()="${day}"]`);
      await page.click('//button[text()=" Next "]');

      // Set time hour are in 00 to 24 range but we need 1 to 12 range for AM/PM

      let adjustedHour = hour
      // convert to int
      hour = parseInt(hour);
      console.log(`Hour: ${hour}`);
      if (hour > 12) {
        adjustedHour = hour - 12;
      } else if (hour === 0) {
        adjustedHour = 12;
      } else {
        adjustedHour = hour;
      }


      console.log(`Adjusted hour: ${adjustedHour}`);

      await page.click('(//input[@class="vdatetime-input form-control g-input"])[2]');
      await page.click(`//div[text()="${am_pm.toLowerCase()}"]`);
      // //div[contains(@class,"vdatetime-time-picker__list--hours")]//*[text()='11']
      await page.click(`//div[contains(@class,"vdatetime-time-picker__list--hours")]//*[text()='${adjustedHour}']`);
      await page.click(`//div[contains(@class,"vdatetime-time-picker__list--minutes")]//*[text()='${minute}']`);
      await page.click('//button[text()=" Save "]');

      await page.click('//button[contains(text(), "Post")]');

      await page.waitForSelector('//*[@id="attach_file_photo"]');
      await page.waitForTimeout(1000);


      // Add media, I want filePath if isPaid = True

      let paidMediaFiles = schedule.media_path.filter(file => file.isPaid === true);
      paidMediaFiles = paidMediaFiles.map(file => file.filePath);

      console.log(`Paid Media Files: ${paidMediaFiles}`);


      let freeMediaFiles = schedule.media_path.filter(file => file.isPaid === false);
      freeMediaFiles = freeMediaFiles.map(file => file.filePath);

      console.log(`Free Media Files: ${freeMediaFiles}`);

      // Set price if applicable
      if (schedule.set_price > 0) {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('xpath=//*[@id="attach_file_photo"]');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(freeMediaFiles);
        await page.waitForTimeout(1000);


        await page.click('//button[@at-attr="price_btn"]');
        await page.fill('//input[contains(@id, "price")]', schedule.set_price.toString());
        await page.click('//button[text()=" Save "]');


        if (freeMediaFiles.length > 0) {
          await page.click('xpath=//*[@data-icon-name="icon-arrow-left"]/..');
          await page.waitForSelector("xpath=//button[contains(@class, 'checkbox-item')]", {timeout: 0});
          // select all //button[contains(@class, 'checkbox-item')] using js
          await page.evaluate(() => {
            const elements = document.querySelectorAll('button.checkbox-item');
            elements.forEach((element) => {
              element.click();
            });
          });
          await page.click('xpath=//*[@data-icon-name="icon-arrow-left"]/..');
          await page.click('xpath=//*[@data-icon-name="icon-done"]/..');
        }

      }


      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('xpath=//*[@id="attach_file_photo"]');
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(paidMediaFiles);


      // Add description
      await page.type('//div[@data-placeholder="Compose new post..."]',

`${schedule.description_text}\n${schedule.signature}`
      );


      // Submit post
      await page.click('//button[@at-attr="submit_post" and not(@disabled)]');
      // wait for 5
      await page.waitForTimeout(5000);
      console.log(`Post scheduled successfully for: ${schedule.id}`);

      // Move to history
      moveToHistory(schedule.id, jsonFilePath);


    } catch (error) {
      console.error(`Error processing schedule ID: ${schedule.id}`, error);
    }
  }
}

export {OfPostScheduler};

