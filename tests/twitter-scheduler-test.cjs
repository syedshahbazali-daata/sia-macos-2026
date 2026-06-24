'use strict';

/**
 * Twitter Scheduler direct bot test
 *
 * Usage:
 *   node tests/twitter-scheduler-test.cjs login            ← log in to Twitter first
 *   node tests/twitter-scheduler-test.cjs single-image
 *   node tests/twitter-scheduler-test.cjs multiple-images
 *   node tests/twitter-scheduler-test.cjs video
 *
 * Change USER_DIR below to whichever userdir has your Twitter session.
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

const SHOT_DIR = '/tmp/twitter-test-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });
// ─────────────────────────────────────────────────────────────────────────────

const TEST_CASES = {
  'text-only': {
    label: 'Text Only (no media)',
    description: 'SiA cloud-script engine test — text only',
    signature: '#SiA #automated',
    set_time: '15:00',
    media: [],
  },
  'single-image': {
    label: 'Single Image (1.jpeg)',
    description: 'SiA bot test — single image',
    signature: '#test #automated',
    set_time: '14:00',
    media: ['/Users/muhammadali/Downloads/1.jpeg'],
  },
  'multiple-images': {
    label: 'Multiple Images (3 JPEGs)',
    description: 'SiA bot test — multiple images',
    signature: '#test #automated',
    set_time: '14:10',
    media: [
      '/Users/muhammadali/Downloads/1.jpeg',
      '/Users/muhammadali/Downloads/brown-cotton-suit-how-to-wear-with-t-shirt-mens-summer-outfit-idea.jpg',
      '/Users/muhammadali/Downloads/ic_camera_group_2.jpg',
    ],
  },
  'video': {
    label: 'Video (mp4)',
    description: 'SiA bot test — video',
    signature: '#test #automated',
    set_time: '14:20',
    media: ['/Users/muhammadali/Downloads/854692-hd_1920_1080_24fps.mp4'],
  },
};

async function runTest(key, tc) {
  console.log(`\n${'─'.repeat(56)}`);
  console.log(`▶  ${tc.label}`);
  console.log(`   Files : ${tc.media.join('\n           ')}`);
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
    // Parse date → numeric strings, no leading zeros (Twitter native selects)
    const [year, monthStr, dayStr] = SCHEDULE_DATE.split('-');
    const monthNum  = String(+monthStr);   // "06" → "6"
    const dayNum    = String(+dayStr);     // "09" → "9"
    const [hourStr, minuteStr] = tc.set_time.split(':');
    const hourNum   = String(+hourStr);    // "14" → "14"
    const minuteNum = String(+minuteStr);  // "00" → "0"
    const fullText  = `${tc.description}\n${tc.signature}`;

    // 1. Navigate to home
    console.log('→ [1/8] Navigating to x.com/home ...');
    await page.goto('https://x.com/home', { timeout: 0 });

    // 2. Focus compose area to activate the toolbar
    console.log('→ [2/8] Focusing compose textarea ...');
    await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 30000 });
    await page.click('[data-testid="tweetTextarea_0"]');
    await page.waitForTimeout(500);

    // 3. Type description + signature
    console.log('→ [3/8] Typing description ...');
    await page.type('[data-testid="tweetTextarea_0"]', fullText, { delay: 20 });

    // 4. Upload media
    if (tc.media.length > 0) {
      console.log(`→ [4/8] Uploading ${tc.media.length} file(s) ...`);
      await page.waitForSelector('[data-testid="fileInput"]', { timeout: 10000 });
      await page.setInputFiles('[data-testid="fileInput"]', tc.media);
      await page.waitForSelector('[data-testid="attachments"]', { timeout: 120000 });
      console.log('       ✓ Attachment visible in compose box');
    } else {
      console.log('→ [4/8] No media — skipping');
    }

    // Wait for any upload progress to complete (video uploads take longer than images).
    // Can't use waitForFunction here — Twitter's CSP blocks the eval it uses internally.
    for (let i = 0; i < 60; i++) {
      const uploading = await page.evaluate(() =>
        document.body.innerText.toLowerCase().includes('uploading')
      );
      if (!uploading) break;
      await page.waitForTimeout(2000);
    }

    // Re-focus the compose area (video upload can cause it to lose focus)
    await page.click('[data-testid="tweetTextarea_0"]', { force: true });
    await page.waitForTimeout(500);

    // 5. Open schedule picker — use dispatchEvent (Playwright's native click blocked by #layers overlay)
    console.log('→ [5/8] Opening schedule date picker ...');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="scheduleOption"]');
      if (!btn) throw new Error('scheduleOption not found');
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    });
    // Give React time to render the picker, then verify via evaluate
    // (can't use waitForSelector/waitForFunction — Twitter's CSP blocks eval injection)
    await page.waitForTimeout(2000);
    const pickerOpen = await page.evaluate(() =>
      document.getElementById('layers')?.innerText?.includes('Confirm') ?? false
    );
    if (!pickerOpen) {
      // Retry once — the compose area may need another re-click to activate the toolbar
      await page.evaluate(() => {
        document.querySelector('[data-testid="tweetTextarea_0"]')
          ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
      });
      await page.waitForTimeout(500);
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="scheduleOption"]');
        if (!btn) throw new Error('scheduleOption not found on retry');
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
      });
      await page.waitForTimeout(2000);
    }
    console.log('       ✓ Date picker open');

    // 6. Fill date/time via JavaScript — the picker renders in #layers and Playwright's CSS
    //    selector engine can't resolve it; getElementById works fine.
    console.log(`→ [6/8] Setting date ${SCHEDULE_DATE} @ ${tc.set_time} ...`);
    console.log(`       month=${monthNum} day=${dayNum} year=${year} hour=${hourNum} min=${minuteNum}`);
    await page.evaluate(([m, d, y, h, mn]) => {
      const setSelect = (id, val) => {
        const el = document.getElementById(id);
        if (!el) throw new Error(id + ' not found');
        el.value = val;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setSelect('SELECTOR_1', m);
      setSelect('SELECTOR_2', d);
      setSelect('SELECTOR_3', y);
      setSelect('SELECTOR_4', h);
      setSelect('SELECTOR_5', mn);
    }, [monthNum, dayNum, year, hourNum, minuteNum]);
    await page.waitForTimeout(500);
    console.log('       ✓ Date and time set');

    // 7. Confirm — same overlay issue inside #layers; use dispatchEvent
    console.log('→ [7/8] Clicking Confirm ...');
    await page.evaluate(() => {
      const confirm = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.trim() === 'Confirm');
      if (!confirm) throw new Error('Confirm button not found');
      confirm.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    });
    await page.waitForTimeout(500);

    // 8. Wait for submit button to activate, then click via dispatchEvent
    console.log('→ [8/8] Waiting for Schedule button to activate ...');
    await page.waitForSelector(
      'xpath=//*[@data-testid="tweetButtonInline" and not(@aria-disabled)]',
      { timeout: 0 }
    );
    console.log('       ✓ Submit button active — clicking Schedule');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="tweetButtonInline"]:not([aria-disabled])');
      if (!btn) throw new Error('tweetButtonInline not found');
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    });

    await page.waitForTimeout(3000);
    const shotPath = path.join(SHOT_DIR, `${key}-SUCCESS.png`);
    await page.screenshot({ path: shotPath });
    console.log(`\n✅  PASSED — ${tc.label}`);
    console.log(`   Screenshot: ${shotPath}`);

  } catch (err) {
    const shotPath = path.join(SHOT_DIR, `${key}-FAILED.png`);
    try { await page.screenshot({ path: shotPath }); } catch { /* ignore */ }
    console.error(`\n❌  FAILED — ${tc.label}`);
    console.error(`   Error    : ${err.message}`);
    console.error(`   Screenshot: ${shotPath}`);
    throw err;
  } finally {
    await context.close();
  }
}

// ─── Login helper ─────────────────────────────────────────────────────────────
async function runLogin() {
  console.log('\n─────────────────────────────────────────────────────────');
  console.log(' Twitter Login Helper');
  console.log(' A Chrome window will open at x.com/login.');
  console.log(' Log in manually, then close the browser window.');
  console.log(' Session saved to: ' + USER_DIR);
  console.log('─────────────────────────────────────────────────────────\n');

  const context = await chromium.launchPersistentContext(USER_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: null,
  });

  const page = await context.newPage();
  await page.goto('https://x.com/login', { timeout: 0 });
  await context.waitForEvent('close', { timeout: 0 });
  console.log('\n✅  Browser closed — Twitter session saved.');
}

// ─── Main ────────────────────────────────────────────────────────────────────
const arg = process.argv[2];

if (arg === 'login') {
  runLogin().catch(err => { console.error(err.message); process.exit(1); });
} else if (!arg || !TEST_CASES[arg]) {
  console.log('\nUsage:');
  console.log('  node tests/twitter-scheduler-test.cjs login           ← log in to Twitter first');
  console.log('  node tests/twitter-scheduler-test.cjs <test-case>\n');
  console.log('Test cases:');
  Object.entries(TEST_CASES).forEach(([k, v]) => console.log(`  ${k.padEnd(18)} — ${v.label}`));
  console.log('\nScreenshots saved to:', SHOT_DIR);
  process.exit(0);
} else {
  runTest(arg, TEST_CASES[arg]).catch(() => process.exit(1));
}
