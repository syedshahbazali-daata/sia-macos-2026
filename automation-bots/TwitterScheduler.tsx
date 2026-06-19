import path from 'path';
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

async function TwitterPostScheduler(page: Page, schedules: Schedule[], jsonFilePath, moveToHistory): Promise<void> {
  const parseDate = (dateString: string): { month: string, day: string, year: string } => {
    // date is 2024-12-31 to December, 31, 2024
    const [year, month, day] = dateString.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {month: months[+month - 1], day, year};
  };


  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue;
    console.log(`Scheduling post for ${schedule}`);


    const {set_date, set_time, description_text} = schedule;


    // I want only list of filePaths, not objects with filePath and previewUrl
    const media_path = schedule.media_path.map(file => file.filePath);
    console.log('media_path:', media_path);

    const {month: post_month, day: post_day, year: post_year} = parseDate(set_date);
    console.log('post_date:', post_month, post_day, post_year);
    const [post_hour, post_minute] = set_time.split(':');
    const post_ampm = +post_hour >= 12 ? 'PM' : 'AM';


    await page.goto('https://x.com/home', {timeout: 0});


    await page.waitForSelector('xpath=//*[@aria-label="Schedule Tweet" or @aria-label="Schedule post"]', {timeout: 0});
    console.log('clicking schedule button');

    while (true) {
      try {
        // check //*[text()="Confirm"] is there or not

        let confirmButton = false

        await page.$('xpath=//*[text()="Confirm"]').then(async (element) => {
          if (element) {
            console.log('Confirm button is present');
            confirmButton = true;

          } else {
            console.log('Confirm button is not present');
          }
        });

        if (confirmButton) {

          break;
        }


        await page.click('xpath=//*[@aria-label="Schedule Tweet" or @aria-label="Schedule post"]', {timeout: 2000});
        // click using js

        await page.waitForSelector('xpath=//*[text()="Confirm"]', {timeout: 2000});
        break;
      } catch (error) {

        console.log('Error clicking schedule button:');
        await page.waitForTimeout(1000); // wait for 1 second before trying again
      }
    }


    // click using the playwright
    console.log(post_month, post_day, post_year, post_hour, post_minute, post_ampm, +post_hour % 12 || 12);

    await page.waitForSelector('xpath=//*[text()="Confirm"]', {state: 'visible'});
    await page.selectOption(
      'xpath=//select/..//*[contains(text(),"Month")]/../../select',
      post_month
    )

    // day should be without leading 0
    await page.selectOption('xpath=//select/..//*[contains(text(),"Day")]/../../select',
      (+post_day).toString());
    await page.selectOption('xpath=//select/..//*[contains(text(),"Year")]/../../select', post_year);
    await page.selectOption(
      'xpath=//select/..//*[contains(text(),"Min")]/../../select',
      post_minute);

    await page.$('xpath=//select/..//*[contains(text(),"AM/")]/../../select').then(async (element) => {
      if (element) {
        await page.selectOption('xpath=//select/..//*[contains(text(),"AM/")]/../../select', post_ampm);
        // hour should be 12 hour format and without leading 0

        await page.selectOption('xpath=//select/..//*[contains(text(),"Hour")]/../../select',
          (+post_hour % 12 || 12).toString());


      } else {
        await page.selectOption('xpath=//select/..//*[contains(text(),"Hour")]/../../select', post_hour);

      }
    });


    await page.waitForTimeout(1000); // Delay for stability

    await page.waitForSelector('xpath=//*[text()="Confirm"]', {state: 'visible'});

    await page.click('xpath=//*[text()="Confirm"]');
    await page.type('xpath=//*[@data-testid="tweetTextarea_0"]',
      `${description_text}\n${schedule.signature}`);


    if (media_path.length) {
      console.log('uploading media');

      await page.setInputFiles('xpath=//input[@accept]', media_path);

      await page.waitForTimeout(20000); // Delay for stability
    }


    await page.waitForSelector('xpath=//*[@data-testid="tweetButtonInline" and not(@aria-disabled)]', {timeout: 0});
    await page.click('xpath=//*[@data-testid="tweetButtonInline" and not(@aria-disabled)]');

    await page.waitForTimeout(3000); // Delay for stability
    moveToHistory(schedule.id, jsonFilePath);
  }


}

export {TwitterPostScheduler};
