import { _electron as electron } from 'playwright-core';
import * as path from 'node:path';
import * as fs from 'node:fs';

const APP_DIR = '/Users/muhammadali/Desktop/sia-macos-2026';
const SHOT_DIR = '/tmp/sia-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(
  APP_DIR,
  'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
);

console.log('Launching app...');
const app = await electron.launch({
  executablePath: electronBin,
  args: [APP_DIR],
  env: { ...process.env },
  timeout: 30_000,
});

// Wait for first window
const page = await app.firstWindow();
await page.waitForLoadState('domcontentloaded');
console.log('Window URL:', page.url());

// Screenshot 1: initial load
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: path.join(SHOT_DIR, '01-initial.png') });
console.log('shot 01-initial.png');

// Wait for splash screen to navigate (3s delay in SplashScreen)
console.log('Waiting for splash to navigate...');
await new Promise(r => setTimeout(r, 5000));
console.log('Current URL:', page.url());

await page.screenshot({ path: path.join(SHOT_DIR, '02-post-splash.png') });
console.log('shot 02-post-splash.png');

// Check current route from the hash
const hash = await page.evaluate(() => window.location.hash);
console.log('Hash route:', hash);

// If on license page, report it
if (hash.includes('license')) {
  console.log('>> On license page — no stored license in this context.');
}

// If on dashboard, screenshot it
if (hash.includes('dashboard')) {
  console.log('>> On dashboard!');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SHOT_DIR, '03-dashboard.png') });
  console.log('shot 03-dashboard.png');

  // Also navigate to settings
  const navResult = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a, [data-route], button')];
    const settingsLink = links.find(el => el.textContent?.toLowerCase().includes('settings'));
    if (settingsLink) { settingsLink.click(); return 'clicked settings'; }
    return 'settings link not found';
  });
  console.log('Settings nav:', navResult);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(SHOT_DIR, '04-settings.png') });
  console.log('shot 04-settings.png');
}

// Get text content of the header area
const headerText = await page.evaluate(() => {
  const header = document.querySelector('header') || document.querySelector('[class*="header"]') || document.querySelector('nav');
  return header?.innerText ?? document.body.innerText.slice(0, 500);
});
console.log('\n--- Visible text (header/body) ---\n', headerText);

console.log('\nAll screenshots saved to', SHOT_DIR);
await app.close();
