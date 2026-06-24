const schedules = vars.schedules;
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

for (const schedule of schedules) {
  if (schedule.isScheduled !== 0) continue;

  const media_path = schedule.media_path.map(function(f) { return f.filePath; });

  await goto('https://business.facebook.com/latest/story_composer');

  await wait('xpath=//*[@aria-haspopup="listbox"]');
  await click('xpath=//*[@aria-haspopup="listbox"]');
  await wait('xpath=//*[@role="option"]');

  if (await exists('xpath=//*[@alt="Facebook"]/ancestor::*[@role="option"]')) {
    try { await click('xpath=//*[@alt="Facebook"]/ancestor::*[@role="option"]'); } catch (e) { /* not clickable */ }
  }

  for (const file of media_path) {
    const ext = '.' + file.split('.').pop().toLowerCase();
    const isImage = IMAGE_EXTS.includes(ext);
    const selector = isImage
      ? 'xpath=//div[contains(text(), "Add") and contains(text(), "photo")]'
      : 'xpath=//div[contains(text(), "Add") and contains(text(), "video")]';
    await chooseFiles(selector, [file]);
  }

  await click('xpath=//*[contains(text(), "Scheduling")]/../..//input[@role="switch"] | //*[contains(text(), "Scheduling")]/../..//*[text()="Schedule"]');
  await wait('xpath=//input[@placeholder]');

  const dateParts = schedule.set_date.split('-').map(Number);
  const formattedDate = dateParts[1] + '/' + dateParts[2] + '/' + dateParts[0];
  await fill('xpath=//input[@placeholder]', '');
  await fill('xpath=//input[@placeholder]', formattedDate);
  await keyboardPress('Enter');
  await waitMs(1000);

  const hours = parseInt(schedule.set_time.split(':')[0], 10);
  const minutes = schedule.set_time.split(':')[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;

  try {
    await typeText('xpath=//input[@aria-label="hours"]', String(formattedHours));
    await typeText('xpath=//input[@aria-label="minutes"]', minutes);
    await fill('xpath=//input[@aria-label="meridiem"]', ampm);
  } catch (e) {
    log('Error setting story time: ' + e.message);
  }

  await waitMs(5000);
  await click('xpath=//*[text()="Cancel"]/../../../../../../..//*[text()="Schedule"]');

  done(schedule.id);
  await waitMs(5000);
  log('Instagram Story complete: ' + schedule.id);
}
