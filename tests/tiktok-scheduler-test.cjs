'use strict';

/**
 * TikTok Scheduler direct bot test
 *
 * Usage:
 *   node tests/tiktok-scheduler-test.cjs login
 *   node tests/tiktok-scheduler-test.cjs video
 */

const { chromium } = require('patchright');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ─── CONFIGURE ───────────────────────────────────────────────────────────────
const USER_DIR = path.join(
  os.homedir(), 'Library', 'Application Support', 'sia',
  'userdir-20241218163439-1734539679025-sathn'
);

const SCHEDULE_DATE = '2026-06-30';
const SCHEDULE_TIME = '14:00';

const SHOT_DIR = '/tmp/tiktok-test-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July',
                'August','September','October','November','December'];

function roundUpTo5Min(time) {
  let [hour, minute] = time.split(':').map(Number);
  if (minute % 5 !== 0) {
    minute = minute + 5 - (minute % 5);
    if (minute === 60) { minute = 0; hour = (hour + 1) % 24; }
  }
  return {
    hour: String(hour).padStart(2, '0'),
    minute: String(minute).padStart(2, '0'),
  };
}

async function runTest() {
  const VIDEO = '/Users/muhammadali/Downloads/urlebird.com-@sat_edits24-20_06_26-17_15.mp4';
  const CAPTION = 'SiA bot test — TikTok\n#test #automated';

  console.log('\n────────────────────────────────────────────────────────');
  console.log('▶  TikTok Video Scheduler Test');
  console.log(`   File  : ${VIDEO}`);
  console.log(`   Date  : ${SCHEDULE_DATE} @ ${SCHEDULE_TIME}`);
  console.log('────────────────────────────────────────────────────────\n');

  if (!fs.existsSync(VIDEO)) throw new Error(`Video not found: ${VIDEO}`);

  const ctx = await chromium.launchPersistentContext(USER_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: null,
  });
  const page = await ctx.newPage();

  try {
    // 1. Navigate to TikTok upload page
    console.log('→ [1/7] Navigating to TikTok upload ...');
    await page.goto('https://www.tiktok.com/creator#/upload?scene=creator_center', { timeout: 0 });
    // Wait for the upload UI (drag-and-drop zone or file input) to appear
    await page.waitForSelector('input[type=file]', { timeout: 60000 });
    console.log('       ✓ Upload page loaded');

    // 2. Upload video
    console.log('→ [2/7] Uploading video ...');
    await page.evaluate(() => {
      const input = document.querySelector('input[type=file]');
      if (input) input.style.display = 'block';
    });
    await page.setInputFiles('input[type=file]', VIDEO);

    // 3. Wait for caption box to appear, then type caption
    console.log('→ [3/7] Typing caption ...');
    await page.waitForSelector('xpath=//div[@role="combobox"]', { timeout: 60000 });
    await page.fill('xpath=//div[@role="combobox"]', '');
    await page.type('xpath=//div[@role="combobox"]', CAPTION, { delay: 20 });

    // 4. Wait for Post button to become enabled (video processing)
    console.log('→ [4/7] Waiting for Post button to be enabled ...');
    let postVisible = false;
    for (let i = 0; i < 60; i++) {
      const btn = page.locator('xpath=//button[not(@disabled)]//div[text()="Post"]');
      postVisible = await btn.isVisible().catch(() => false);
      if (postVisible) { console.log('       ✓ Post button active'); break; }
      await page.waitForTimeout(2000);
    }
    if (!postVisible) throw new Error('Post button never became enabled after 2 minutes');

    // 5. Click Schedule radio
    console.log('→ [5/7] Clicking Schedule ...');
    await page.locator('xpath=//label[contains(text(), "chedule")]/..').click();
    await page.waitForTimeout(1000);

    // Handle optional "Allow" permission dialog
    try {
      await page.waitForSelector('xpath=//*[text()="Allow"]', { timeout: 3000 });
      await page.locator('xpath=//*[text()="Allow"]').click();
      console.log('       ✓ Allowed scheduling permission');
    } catch { /* no dialog — that is fine */ }

    // 6. Set date via calendar
    console.log(`→ [6/7] Setting date ${SCHEDULE_DATE} ...`);
    const [year, month, day] = SCHEDULE_DATE.split('-');
    const targetMonth = parseInt(month, 10) - 1; // 0-based
    const targetYear  = parseInt(year, 10);

    const dateInputXPath  = "//input[contains(@value, '-')]";
    const monthTitleXPath = "//*[contains(@class, 'month-title')]";
    const yearTitleXPath  = "//*[contains(@class, 'year-title')]";
    const prevArrowXPath  = "//*[contains(@class, 'arrow')][1]";
    const nextArrowXPath  = "//*[contains(@class, 'arrow')][2]";
    const dayXPath = `//*[contains(@class, 'day valid') or contains(@class, 'day selected')][text()='${parseInt(day, 10)}']`;

    await page.click(dateInputXPath);
    for (let attempt = 0; attempt < 50; attempt++) {
      let monthTitle;
      try {
        monthTitle = await page.locator(monthTitleXPath).innerText({ timeout: 3000 });
      } catch {
        await page.click(dateInputXPath);
        continue;
      }
      const yearTitle   = await page.locator(yearTitleXPath).innerText({ timeout: 3000 });
      const curMonth    = MONTHS.indexOf(monthTitle);
      const curYear     = parseInt(yearTitle, 10);

      if (curYear === targetYear && curMonth === targetMonth) {
        await page.click(dayXPath);
        console.log(`       ✓ Date set to ${SCHEDULE_DATE}`);
        break;
      }
      if (curYear < targetYear || (curYear === targetYear && curMonth < targetMonth)) {
        await page.click(nextArrowXPath);
      } else {
        await page.click(prevArrowXPath);
      }
      await page.waitForTimeout(300);
    }

    // Set time
    const { hour: h, minute: m } = roundUpTo5Min(SCHEDULE_TIME);
    console.log(`       Setting time to ${h}:${m} (rounded to 5-min boundary)`);
    const timeInputXPath  = "//input[contains(@value, ':')]";
    const hourSpanXPath   = `//span[contains(@class, 'tiktok-timepicker-left')][text()='${h}']`;
    const minuteSpanXPath = `//span[contains(@class, 'tiktok-timepicker-right')][text()='${m}']`;
    await page.click(timeInputXPath);
    await page.click(hourSpanXPath);
    await page.click(minuteSpanXPath);
    await page.waitForTimeout(1000);
    console.log('       ✓ Time set');

    // 7. Click the Schedule submit button
    console.log('→ [7/7] Clicking Schedule submit ...');
    await page.waitForSelector('xpath=//button[not(@disabled)]//div[text()="Schedule"]/../..', { timeout: 30000 });
    await page.evaluate(() => {
      const xpath = '//button[not(@disabled)]//div[text()="Schedule"]/../..';
      const btn = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (btn) btn.click();
    });

    await page.waitForTimeout(6000);
    const shotPath = path.join(SHOT_DIR, 'video-SUCCESS.png');
    await page.screenshot({ path: shotPath });
    console.log(`\n✅  PASSED — TikTok video scheduled`);
    console.log(`   Screenshot: ${shotPath}`);

  } catch (err) {
    const shotPath = path.join(SHOT_DIR, 'video-FAILED.png');
    try { await page.screenshot({ path: shotPath }); } catch { /* ignore */ }
    console.error(`\n❌  FAILED`);
    console.error(`   Error     : ${err.message}`);
    console.error(`   Screenshot: ${shotPath}`);
    throw err;
  } finally {
    await ctx.close();
  }
}

// ─── Login helper ─────────────────────────────────────────────────────────────
async function runLogin() {
  console.log('\n Opening TikTok in browser — log in, then close the window.\n');
  const ctx = await chromium.launchPersistentContext(USER_DIR, {
    channel: 'chrome', headless: false, viewport: null,
  });
  const page = await ctx.newPage();
  await page.goto('https://www.tiktok.com/login', { timeout: 0 });
  await ctx.waitForEvent('close', { timeout: 0 });
  console.log('✅  Session saved.');
}

const arg = process.argv[2];
if (arg === 'login') {
  runLogin().catch(e => { console.error(e.message); process.exit(1); });
} else if (arg === 'video') {
  runTest().catch(() => process.exit(1));
} else {
  console.log('Usage:');
  console.log('  node tests/tiktok-scheduler-test.cjs login');
  console.log('  node tests/tiktok-scheduler-test.cjs video');
}
