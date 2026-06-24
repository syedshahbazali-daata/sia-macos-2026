const schedules = vars.schedules;
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

for (const schedule of schedules) {
  if (schedule.isScheduled !== 0) continue;

  const { description_text, signature, platform, set_date, set_time } = schedule;
  const isInstagram = platform.toLowerCase().includes('instagram');

  await goto('https://business.facebook.com/latest/composer');

  const platformToDeselect = isInstagram
    ? 'xpath=//*[@alt="Facebook"]/ancestor::*[@role="option"]'
    : 'xpath=//*[@alt="Instagram"]/ancestor::*[@role="option"]';

  await wait('xpath=//*[@aria-haspopup="listbox"]');
  await click('xpath=//*[@aria-haspopup="listbox"]');
  await wait('xpath=//*[@role="option"]');

  if (await exists(platformToDeselect)) {
    try { await click(platformToDeselect); } catch (e) { /* not clickable */ }
  }
  await waitMs(1000);
  await click('xpath=//*[@aria-haspopup="listbox"]');

  for (const mediaItem of schedule.media_path) {
    const ext = '.' + mediaItem.filePath.split('.').pop().toLowerCase();
    const isImage = IMAGE_EXTS.includes(ext);
    const addSelector = isImage
      ? 'xpath=//div[contains(text(), "Add") and contains(text(), "photo")]'
      : 'xpath=//div[contains(text(), "Add") and contains(text(), "video")]';

    const hasPhotoSlash = await exists('xpath=//div[contains(text(), "Add") and contains(text(), "photo/")]');
    await chooseFilesViaIntermediate(
      addSelector,
      hasPhotoSlash ? null : 'xpath=//*[contains(text(), "Upload from")]',
      [mediaItem.filePath]
    );
  }

  await typeText('xpath=//div[@aria-label="Write into the dialogue box to include text with your post."]', description_text + '\n' + signature);
  await waitMs(1000);

  await click('xpath=//*[contains(text(), "Scheduling")]/../..//input[@role="switch"] | //*[contains(text(), "Scheduling")]/../..//*[text()="Schedule"]');
  await wait('xpath=//input[@placeholder]');
  await click('xpath=//input[@placeholder]');

  const parsedDate = new Date(set_date);
  const m = parsedDate.getMonth() + 1;
  const d = parsedDate.getDate();
  const y = parsedDate.getFullYear();
  await fill('xpath=//input[@placeholder]', m + '/' + d + '/' + y);

  const timeParts = set_time.split(':');
  let hour = timeParts[0];
  let minute = timeParts[1];
  const amPm = set_time.split(' ')[1];

  try {
    await wait('xpath=//input[@aria-label="meridiem"]', 2000);
    await typeText('xpath=//input[@aria-label="hours"]', hour);
    await typeText('xpath=//input[@aria-label="minutes"]', minute);
    await typeText('xpath=//input[@aria-label="meridiem"]', amPm);
  } catch (e) {
    minute = minute.split(' ')[0];
    if (amPm === 'PM') hour = String(parseInt(hour) + 12);
    await fill('xpath=//input[@aria-label="hours"]', hour);
    await fill('xpath=//input[@aria-label="minutes"]', minute);
  }

  await click('xpath=//*[text()="Cancel"]/../../../../../../..//*[text()="Schedule"]');
  await waitMs(5000);

  done(schedule.id);
  log('Instagram/Facebook schedule complete: ' + schedule.id);
}
