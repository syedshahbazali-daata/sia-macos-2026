import { chromium } from 'patchright';

async function runBrowser(userDir: string, browserPath: string) {
  console.log('Opening browser:', browserPath, userDir);
  let browser = null;

  try {
    process.env.HOME = userDir;

    browser = await chromium.launchPersistentContext(
      `${userDir}`,
      {
        channel: 'chrome',
        headless: false,
        viewport: null,
      }
    );

    const page = await browser.newPage();
    await page.goto('https://google.com');

    // Create a promise that never resolves
    const neverResolve = new Promise(() => {});

    // Set up event listener for browser close
    browser.on('close', () => {
      console.log('Browser was closed');
      process.exit(0);
    });

    // Wait indefinitely until the browser is closed
    await neverResolve;

  } catch (error) {
    console.error('Error occurred:', error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error while closing browser:', closeError);
      }
    }

    throw error;
  }
}

export default runBrowser;
