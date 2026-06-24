const schedules = vars.schedules;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

for (const schedule of schedules) {
  if (schedule.isScheduled !== 0) continue;

  const mediaFile = schedule.media_path.map(function(f) { return f.filePath; });
  const caption = schedule.description_text + '\n' + schedule.signature;
  const [year, month, day] = schedule.set_date.split('-');

  await goto('https://www.tiktok.com/creator#/upload?scene=creator_center');

  await makeVisible('input[type=file]');
  await upload('input[type=file]', mediaFile);

  await wait('xpath=//div[@role="combobox"]');
  await fill('xpath=//div[@role="combobox"]', '');
  await typeText('xpath=//div[@role="combobox"]', caption);

  let postButtonReady = false;
  while (!postButtonReady) {
    postButtonReady = await isVisible('xpath=//button[not(@disabled)]//div[text()="Post"]');
    if (!postButtonReady) await waitMs(2000);
  }

  await click('xpath=//label[contains(text(), "chedule")]/..');

  try {
    await wait('xpath=//*[text()="Allow"]', 3000);
    await click('xpath=//*[text()="Allow"]');
  } catch (e) { /* Allow dialog not shown */ }

  const datePickerXPath = 'xpath=//input[contains(@value, "-")]';
  await click(datePickerXPath);

  while (true) {
    let monthTitle;
    try {
      monthTitle = await getText('xpath=//*[contains(@class, "month-title")]');
    } catch (e) {
      await click(datePickerXPath);
      continue;
    }
    const yearTitle = await getText('xpath=//*[contains(@class, "year-title")]');
    const currentMonthIndex = MONTHS.indexOf(monthTitle);
    const targetYear = parseInt(year);
    const currentYear = parseInt(yearTitle);
    const targetMonth = parseInt(month) - 1;

    if (currentYear === targetYear && currentMonthIndex === targetMonth) {
      await click('xpath=//*[contains(@class, "day valid") or contains(@class, "day selected")][text()="' + parseInt(day) + '"]');
      break;
    }
    const goNext = currentYear < targetYear || (currentYear === targetYear && currentMonthIndex < targetMonth);
    await click(goNext ? 'xpath=//*[contains(@class, "arrow")][2]' : 'xpath=//*[contains(@class, "arrow")][1]');
  }

  let h = parseInt(schedule.set_time.split(':')[0]);
  let m = parseInt(schedule.set_time.split(':')[1]);
  if (m % 5 !== 0) {
    m = m + 5 - (m % 5);
    if (m === 60) { m = 0; h += 1; if (h === 24) h = 0; }
  }
  const hStr = h === 0 ? '00' : String(h);
  const mStr = m === 0 ? '00' : String(m);

  await click('xpath=//input[contains(@value, ":")]');
  await click('xpath=//span[contains(@class, "tiktok-timepicker-left")][text()="' + hStr + '"]');
  await click('xpath=//span[contains(@class, "tiktok-timepicker-right")][text()="' + mStr + '"]');
  await waitMs(2000);

  await wait('xpath=//button[not(@disabled)]//div[text()="Schedule"]/../..');
  await xpathClickFirst('//button[not(@disabled)]//div[text()="Schedule"]/../..');
  await waitMs(6000);

  done(schedule.id);
  log('TikTok schedule complete: ' + schedule.id);
}
