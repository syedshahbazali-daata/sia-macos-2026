const {chromium} = require('patchright');



async function startTwitterBroadcast(page) {
    try {
        // Navigate to the broadcasts page
        await page.goto('https://studio.x.com/producer/broadcasts');

        // Wait for initial page load
        await page.waitForTimeout(1000);

        // Wait for and click the Create broadcast button
        await page.waitForSelector('text="Create broadcast"');
        await page.click('text="Create broadcast"');

        // Fill in the broadcast title
        await page.fill('input[name="broadcast.title"]', 'We are Live');

        // Wait for and handle the Source dropdown
        await page.waitForSelector('xpath=//span[text()="Source"]/..//select');
        await page.selectOption('xpath=//span[text()="Source"]/..//select', 'SiA');

        // Wait for animation or loading
        await page.waitForTimeout(1000);

        // Handle category selection
        await page.click('input[placeholder="Add Category"]');
        await page.click('//*[@class="Dropdown-menuItemContent" and contains(text(),"Life")]');

        await page.waitForTimeout(1000);
        await page.click('//button[@aria-label="Create broadcast"]')
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('Error during broadcast setup:', error);
        throw error; // Re-throw the error for handling by the caller
    }
}

async function StreamKeysAutoFetch(platform: string, userDir: string, browserPath: string, userDirId: string) {
  console.log(platform, userDir, browserPath);
  process.env.HOME = userDir;

  const clipboardy = await import('clipboardy');


  const browser = await chromium.launchPersistentContext(`${userDir}`, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await browser.newPage();

  try {
    if (platform.toLowerCase().includes('twitch')) {
      // Navigate to Twitch dashboard and fetch stream key
      await page.goto('https://dashboard.twitch.tv/');
      await page.waitForTimeout(1000);

      const username = page.url().split('/u/')?.[1]?.split('/')[0];
      if (!username) {
        throw new Error('Unable to extract Twitch username.');
      }

      await page.goto(`https://dashboard.twitch.tv/u/${username}/settings/stream`);
      await page.waitForTimeout(1000);
      await page.waitForSelector('//button[text()="Show"]');
      await page.click('//button[text()="Show"]');
      await page.click('//*[text()="I Understand"]')
      await page.waitForTimeout(1000);

      const streamKey = await page.evaluate(() => {
        const input = document.querySelector('input[id="primary-stream-key"]') as HTMLInputElement;
        return input?.value || null;
      });

      if (!streamKey) {
        throw new Error('Failed to retrieve Twitch stream key.');
      }

      console.log('Stream Key:', streamKey);
      await browser.close();
      return streamKey;

    } else if (platform.toLowerCase().includes('youtube')) {
      // Navigate to YouTube studio and fetch stream key
      await page.goto('https://studio.youtube.com/channel/UC/livestreaming');
      await page.waitForTimeout(3000);
      await page.click('//*[@id="copy-button"]'); // Copy the stream key

      console.log('Stream Key copied to clipboard');

      await page.waitForTimeout(1000);

      // Retrieve clipboard content from mac

      const streamKey = await clipboardy.default.read()
      console.log('Stream Key:', streamKey);
      await browser.close();
      return streamKey;

    } else if (platform.toLowerCase().includes('twitter')) {

      await page.goto('https://studio.x.com/producer/sources');
      await page.waitForTimeout(1000);

      const broadcastingSource = await page.$('xpath=//table//*[text()="SiA"]');
      const createSource = await page.$('text="Create source"')
      if (!broadcastingSource &&!createSource) {
        return ""
      }

      if (broadcastingSource) {
        console.log("SiA exists");
        await broadcastingSource.click();
        await page.waitForTimeout(1000);
        await page.click('text="RTMP(s) stream key"');
        await page.waitForTimeout(1000);

        const rtmpKey = await page.$('xpath=//*[text()="RTMP(s) stream key"]/../../span');
        const rtmpKeyText = await rtmpKey.innerText();
        console.log(rtmpKeyText);
        await page.click('text="Done"');

        await startTwitterBroadcast(page)
        await browser.close();

        return rtmpKeyText;
      } else {
        console.log("SiA does not exist");


        await page.click('text="Create source"');

        await page.fill('input[name="ingest.name"]', 'SiA');
        await page.selectOption('select[name="ingest.region"]', 'sa-east-1');
        await page.waitForTimeout(1000);

        await page.click('text="Create"');
        await page.waitForTimeout(2000);
        await page.click('text="RTMP(s) stream key"');
        await page.waitForTimeout(1000);

        const rtmpKey = await page.$('xpath=//*[text()="RTMP(s) stream key"]/../../span');
        const rtmpKeyText = await rtmpKey.innerText();
        console.log(rtmpKeyText);
        await page.click('text="Done"');

        await startTwitterBroadcast(page)
        await browser.close();
        return rtmpKeyText;
      }


    } else if (platform.toLowerCase().includes('instagram')) {
      // Add Instagram logic here
      console.log('Instagram logic is not implemented yet.');

      await page.goto('https://www.instagram.com/')
      await page.click('//*[@aria-label="New post"]')
      await page.click('//*[@aria-label="Live video"]')
      await page.fill("//input[contains(@placeholder, 'Add a title')]", 'We are Live')
      await page.click('//*[@aria-label="Audience"]')
      await page.click("//button[text()='Public']")
      await page.click("//*[text()='Next']")
      await page.waitForTimeout(1000)
      await page.waitForSelector('//input[@name="live-creation-modal-start-pane-stream-key"]')
      const stream_key = await page.$('//input[@name="live-creation-modal-start-pane-stream-key"]')
      const stream_key_text = await stream_key.getAttribute('value')
      console.log(stream_key_text)
      await page.waitForTimeout(3000)
      return stream_key_text


    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }



}

export {StreamKeysAutoFetch};
