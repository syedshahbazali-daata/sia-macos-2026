const {chromium} = require('patchright');


let browser;
let page;


async function addAccountPlaywright(url: string, userDir: string, browserPath: string) {

  console.log('Opening browser:', browserPath, userDir);

  process.env.HOME = userDir;
  try {
    browser = await chromium.launchPersistentContext(
      `${userDir}`,

      {
        // executablePath: browserPath,
        channel: 'chrome',
        headless: false,
        viewport: null,

      },
    );

    let userLoggedIn = false;
    page = await browser.newPage();
    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36');
    console.log('OnlyFans page x');

    if (url.toLowerCase().includes('onlyfans')) {
      console.log('OnlyFans page');

      page.on('request', async request => {
        const url = request.url();

        // Handle api2/v2/users/me request after userLoggedIn is true
        if (url.includes('api2/v2/users/me') && userLoggedIn) {
          console.log('user me request');
          await page.waitForTimeout(1000);
          // await page.goto("https://onlyfans.com/my/chats/send", {timeout: 0});
          await page.click('//button/*[@data-icon-name="icon-account"]', {timeout: 0});
        }

        // Handle /api2/v2/posts/tagged-friend-users request after userLoggedIn is true
        if (url.includes('/api2/v2/posts/tagged-friend-users') && userLoggedIn) {
          console.log('tagged-friend-users request');
          const response = await request.response();
          let tagCreators = []
          if (response) {
            try {
              const body = await response.body();
              const jsonResponse = JSON.parse(body.toString('utf8')); // Convert Buffer to string
              tagCreators = jsonResponse['items'].map(creator => ({
                name: creator['name'],
                username: creator['user']['username'],
                isVerified: creator['user']['isVerified']
              }));
              console.log('Tagged creators:', tagCreators);
            } catch (error) {
              console.error('Error parsing JSON', error);
            }

          }
          // send tagged creators to renderer process
          // win?.webContents.send('social-media-stats', {"onlyfans-tag-creators": tagCreators});
          // win?.webContents.send('page-loaded', 'Message process!');


        }
      });
    }


    console.log('Opening website:', url);

    await page.goto(url, {timeout: 0});


    if (url.toLowerCase().includes('onlyfans')) {
      const response = await page.waitForResponse(response =>
          response.url().includes('api2/v2/users/login') && response.status() === 200,
        {timeout: 0}
      );

      if (response) {
        console.log('User is logged in');
        userLoggedIn = true;
      }

    }


    // Send message to renderer process
    if (!url.toLowerCase().includes('onlyfans')) {
      // win?.webContents.send('page-loaded', 'Message process!');
    }
  } catch (error) {
    console.error('Error opening website:', error);
  }
}


// close browser
async function closeBrowser() {
  if (browser) {
    await browser.close();
  }
}

export {addAccountPlaywright, closeBrowser};
