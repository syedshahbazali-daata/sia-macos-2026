'use strict';

/**
 * YouTube Shorts Scheduler direct bot test
 *
 * Usage:
 *   node tests/youtube-scheduler-test.cjs login       ← open YouTube Studio to verify login
 *   node tests/youtube-scheduler-test.cjs short        ← schedule a short (< 60s video)
 *
 * Change USER_DIR below to whichever userdir has your YouTube session.
 */

const { chromium } = require('patchright');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ─── CONFIGURE ───────────────────────────────────────────────────────────────
const USER_DATA_BASE = path.join(os.homedir(), 'Library', 'Application Support', 'sia');
const USER_DIR = path.join(USER_DATA_BASE, 'userdir-20241218163439-1734539679025-sathn');

// 10 days from 2026-06-24
const SCHEDULE_DATE = '2026-07-04';

const SHOT_DIR = '/tmp/youtube-test-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

const TEST_CASES = {
  short: {
    label: 'YouTube Short (mp4)',
    description: 'SiA bot test — YouTube Shorts',
    signature: '#SiA #automated #shorts',
    set_time: '14:00',
    media: ['/Users/muhammadali/Downloads/854692-hd_1920_1080_24fps.mp4'],
  },
};

async function runTest(key, tc) {
  console.log(`\n${'─'.repeat(56)}`);
  console.log(`▶  ${tc.label}`);
  console.log(`   File  : ${tc.media[0]}`);
  console.log(`   Date  : ${SCHEDULE_DATE} @ ${tc.set_time}`);
  console.log(`${'─'.repeat(56)}\n`);

  for (const f of tc.media) {
    if (!fs.existsSync(f)) throw new Error(`Media file not found: ${f}`);
  }

  const context = await chromium.launchPersistentContext(USER_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: null,
  });

  const page = await context.newPage();

  try {
    const scheduleDate = formatDate(SCHEDULE_DATE);
    const fullText = `${tc.description} ${tc.signature}`;

    // 1. Navigate to YouTube Studio
    console.log('→ [1/8] Navigating to studio.youtube.com ...');
    await page.goto('https://studio.youtube.com/', { timeout: 0 });
    await page.waitForTimeout(2000);

    // 2. Open upload dialog
    console.log('→ [2/8] Opening upload dialog ...');
    await page.click("xpath=//*[@id='create-icon']");
    await page.click("xpath=//*[text()='Upload videos']");

    // 3. Upload file via file chooser
    console.log('→ [3/8] Uploading video ...');
    await page.waitForSelector("xpath=//*[contains(text(),'Select ')]", { timeout: 30000 });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click("xpath=//*[contains(text(),'Select ')]", { timeout: 30000 }),
    ]);
    await fileChooser.setFiles(tc.media);
    console.log('       ✓ File set');

    // 4. Fill description
    console.log('→ [4/8] Filling description ...');
    await page.fill("xpath=//*[@id='textbox']", fullText);
    console.log('       ✓ Description filled');

    // 5. Set audience
    console.log('→ [5/8] Setting audience to Not Made for Kids ...');
    await page.click("xpath=//*[@name='VIDEO_MADE_FOR_KIDS_NOT_MFK']//*[@id='offRadio']");
    console.log('       ✓ Audience set');

    // 6. Click Next x3
    console.log('→ [6/8] Clicking Next (×3) ...');
    for (let i = 0; i < 3; i++) {
      await page.click("xpath=//*[text()='Next']");
      await page.waitForTimeout(1000);
    }
    console.log('       ✓ On visibility/monetization/checks page');

    // 7. Open schedule options and set date/time
    console.log('→ [7/8] Setting schedule ...');
    await page.click("xpath=//*[@id='second-container-expand-button']");

    await page.click("xpath=//*[@id='labelAndInputContainer']//input");
    await page.fill("xpath=//*[@id='labelAndInputContainer']//input", tc.set_time);
    await page.press("xpath=//*[@id='labelAndInputContainer']//input", 'Enter');
    await page.waitForTimeout(500);

    await page.click("xpath=//*[@id='datepicker-trigger']");
    await page.fill("xpath=(//*[@id='labelAndInputContainer']//input)[2]", scheduleDate);
    await page.press("xpath=(//*[@id='labelAndInputContainer']//input)[2]", 'Enter');

    console.log(`       ✓ Date set to ${scheduleDate} @ ${tc.set_time}`);

    // 8. Confirm schedule
    console.log('→ [8/8] Clicking Schedule ...');
    await page.waitForTimeout(2000);
    await page.click("xpath=//*[@aria-label='Schedule']");
    await page.waitForTimeout(4000);

    const shotPath = path.join(SHOT_DIR, `${key}-SUCCESS.png`);
    await page.screenshot({ path: shotPath });
    console.log(`\n✅  PASSED — ${tc.label}`);
    console.log(`   Screenshot: ${shotPath}`);

  } catch (err) {
    const shotPath = path.join(SHOT_DIR, `${key}-FAILED.png`);
    try { await page.screenshot({ path: shotPath }); } catch { /* ignore */ }
    console.error(`\n❌  FAILED — ${tc.label}`);
    console.error(`   Error     : ${err.message}`);
    console.error(`   Screenshot: ${shotPath}`);
    throw err;
  } finally {
    await context.close();
  }
}

// ─── Login helper ─────────────────────────────────────────────────────────────
async function runLogin() {
  console.log('\n─────────────────────────────────────────────────────────');
  console.log(' YouTube Login Helper');
  console.log(' A Chrome window will open at studio.youtube.com.');
  console.log(' Log in manually, then close the browser window.');
  console.log(' Session saved to: ' + USER_DIR);
  console.log('─────────────────────────────────────────────────────────\n');

  const context = await chromium.launchPersistentContext(USER_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: null,
  });

  const page = await context.newPage();
  await page.goto('https://studio.youtube.com/', { timeout: 0 });
  await context.waitForEvent('close', { timeout: 0 });
  console.log('\n✅  Browser closed — YouTube session saved.');
}

// ─── Main ────────────────────────────────────────────────────────────────────
const arg = process.argv[2];

if (arg === 'login') {
  runLogin().catch(err => { console.error(err.message); process.exit(1); });
} else if (!arg || !TEST_CASES[arg]) {
  console.log('\nUsage:');
  console.log('  node tests/youtube-scheduler-test.cjs login      ← log in to YouTube first');
  console.log('  node tests/youtube-scheduler-test.cjs <test-case>\n');
  console.log('Test cases:');
  Object.entries(TEST_CASES).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} — ${v.label}`));
  console.log('\nScreenshots saved to:', SHOT_DIR);
  process.exit(0);
} else {
  runTest(arg, TEST_CASES[arg]).catch(() => process.exit(1));
}
