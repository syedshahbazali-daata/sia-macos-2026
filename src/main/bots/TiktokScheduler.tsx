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

async function TikTokPostScheduler(page: Page, schedules: Schedule[], jsonFilePath, moveToHistory): Promise<void> {

  const getHeaderScript = (city: string) => {
    return `
    (() => {
      var fullWidthDiv = document.createElement('div');
      fullWidthDiv.style.backgroundColor = '#4B586C';
      fullWidthDiv.style.color = 'white';
      fullWidthDiv.style.padding = '20px';
      fullWidthDiv.style.textAlign = 'center';
      fullWidthDiv.style.width = '100%'; // Set the width to 100% to make it full width
      fullWidthDiv.style.position = 'fixed'; // Set position to fixed
      fullWidthDiv.style.top = '0'; // Align to top of the viewport
      fullWidthDiv.style.zIndex = '9999'; // Set a high z-index to ensure it's on top
      fullWidthDiv.textContent = 'Uploading to TikTok from ${city}';
      var body = document.getElementsByTagName('body')[0];
      body.insertBefore(fullWidthDiv, body.firstChild);
    })();
    `;
  };

  try {
    for (const schedule of schedules) {
      console.log(`Scheduling post for ${schedule.id}`);
      await page.goto('https://www.tiktok.com/', {timeout: 0});
      await page.goto('https://www.tiktok.com/creator#/upload?scene=creator_center', {timeout: 0});

      // Use city as header text
      const headerText = schedule.city;
      await page.evaluate(getHeaderScript(headerText));


      const mediaFile = schedule.media_path.map(file => file.filePath);
      const caption: string = schedule.description_text  + '\n' + schedule.signature;


      // Upload media files
      await page.evaluate(() => {
        const inputFile = document.querySelector('input[type=file]') as HTMLInputElement;
        if (inputFile) {
          inputFile.style.display = 'block';
        }
      });
      await page.setInputFiles('input[type=file]', mediaFile);

      // Post content
      await page.waitForSelector('xpath=//div[@role="combobox"]');
      await page.fill('xpath=//div[@role="combobox"]', "");
      await page.type('xpath=//div[@role="combobox"]', caption);

      // Wait for the 'Post' button to become enabled and visible
      let postButtonVisible = false;
      while (!postButtonVisible) {
        const postButton = await page.locator('xpath=//button[not(@disabled)]//div[text()="Post"]');
        postButtonVisible = await postButton.isVisible() && !(await postButton.isDisabled());
        if (!postButtonVisible) {
          console.log('Waiting for the post button to become visible and enabled');
          await page.waitForTimeout(2000);
        }
      }

      // click on //label[contains(text(), 'chedule')]/../..
      const scheduleBtnXPath = '//label[contains(text(), "chedule")]/..';
      await page.locator(scheduleBtnXPath).click()

      //  for the '//*[text()='Allow']' button to become enabled and visible
      try {
        await page.waitForSelector('xpath=//*[text()="Allow"]', {timeout: 3000});
        await page.locator('//*[text()="Allow"]').click()

      } catch (error) {
        console.log("Allow button not found")
      }


      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
        'November', 'December'];
      const date = schedule.set_date
      const [year, month, day] = date.split('-');
      const datePickerXPath = "//input[contains(@value, '-')]";


      const monthTitleXPath = "//*[contains(@class, 'month-title')]"

      const yearTitleXPath = "//*[contains(@class, 'year-title')]"

      const previousMonthXPath = "//*[contains(@class, 'arrow')][1]";
      const nextMonthXPath = "//*[contains(@class, 'arrow')][2]";
      const dayXPath = `//*[contains(@class, 'day valid') or contains(@class, 'day selected')][text()='${day}']`;

      await page.click(datePickerXPath);

      while (true) {
        let monthTitle, yearTitle;

        try {
          monthTitle = await page.locator(monthTitleXPath).innerText();
        } catch (e) {
          await page.click(datePickerXPath);
          continue;
        }

        yearTitle = await page.locator(yearTitleXPath).innerText();
        const currentMonthIndex = months.indexOf(monthTitle);

        if (parseInt(yearTitle) === parseInt(year)) {
          if (currentMonthIndex === parseInt(month) - 1) {
            await page.click(dayXPath);
            break;
          }

          if (currentMonthIndex < parseInt(month) - 1) {
            await page.click(nextMonthXPath);
            continue;
          } else {
            await page.click(previousMonthXPath);
            continue;
          }
        }

        if (parseInt(yearTitle) < parseInt(year)) {
          await page.click(nextMonthXPath);
          continue;
        } else {
          await page.click(previousMonthXPath);
          continue;
        }
      }

      // Set time
      const formatTime = (time) => {
        let [hour, minute] = time.split(':').map(Number);
        if (minute % 5 === 0) {
          return `${hour}:${minute}`;
        } else {
          minute = minute + 5 - (minute % 5);
          if (minute === 60) {
            minute = 0;
            hour += 1;
            if (hour === 24) {
              hour = 0;
            }
          }
        }
        return `${hour}:${minute}`;
      };

      const time_ = schedule.set_time;
      const formattedTime = formatTime(time_).split(':');
      // convert into str items
      formattedTime[0] = formattedTime[0].toString();
      formattedTime[1] = formattedTime[1].toString();
      // if 0 then 00
      if (formattedTime[0] === '0') {
        formattedTime[0] = '00';
      }

      // if 00 then 00:00
      if (formattedTime[1] === '0') {
        formattedTime[1] = '00';
      }

      const timePickerXPath = "//input[contains(@value, ':')]";
      const timePickerHoursXPath = `//span[contains(@class, 'tiktok-timepicker-left')][text()='${formattedTime[0]}']`;
      const timePickerMinutesXPath = `//span[contains(@class, 'tiktok-timepicker-right')][text()='${formattedTime[1]}']`;

      await page.click(timePickerXPath);
      await page.click(timePickerHoursXPath);
      await page.click(timePickerMinutesXPath);
      await page.waitForTimeout(2000); // Adjust timeout if necessary


      console.log('Post button found and is visible and enabled');
      // wait for //button[not(@disabled)]//div[text()="Post"]/../..
      await page.waitForSelector('xpath=//button[not(@disabled)]//div[text()="Schedule"]/../..');
      await page.evaluate(() => {
        const postBtnXPath = '//button[not(@disabled)]//div[text()="Schedule"]/../..';
        const postBtn = document.evaluate(postBtnXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
        if (postBtn) postBtn.click();
      });


      console.log('Waiting for manage your posts button');
      await page.waitForTimeout(6000); // Adjust timeout if necessary


      // Move to history
      moveToHistory(schedule.id, jsonFilePath);

    }
  } catch (error) {
    console.error('Error in TikTokPostScheduler:', error);
    throw error
  }
}

export {TikTokPostScheduler};
