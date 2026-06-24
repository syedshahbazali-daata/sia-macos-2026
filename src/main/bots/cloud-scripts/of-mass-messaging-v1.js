const schedules = vars.schedules;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

for (const schedule of schedules) {
  if (schedule.isScheduled !== 0) continue;

  const dateParts = schedule.set_date.split('-').map(Number);
  const year = dateParts[0], month = dateParts[1], day = dateParts[2];
  const monthName = MONTHS[month - 1];
  const hour = parseInt(schedule.set_time.split(':')[0], 10);
  const minute = schedule.set_time.split(':')[1];
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const adjustedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);

  await goto('https://onlyfans.com/my/queue');
  await click('//button[@at-attr="add_event_header"]');

  await click('(//input[@class="vdatetime-input form-control g-input"])[1]');
  await click('//div[@class="vdatetime-popup__year"]');
  await click('//div[contains(text(), "' + year + '")]');
  await click('//button[text()=" Save "]');
  await click('//div[@class="vdatetime-popup__date"]');
  await click('//div[contains(@class,"vdatetime-month-picker") and contains(text(), "' + monthName + '")]');
  await click('//button[text()=" Save "]');
  await click('//div[@class="vdatetime-calendar__month__day"]//span[text()="' + day + '"]');
  await click('//button[text()=" Next "]');

  await click('(//input[@class="vdatetime-input form-control g-input"])[2]');
  await click('//div[text()="' + amPm.toLowerCase() + '"]');
  await click('//div[contains(@class,"vdatetime-time-picker__list--hours")]//*[text()="' + adjustedHour + '"]');
  await click('//div[contains(@class,"vdatetime-time-picker__list--minutes")]//*[text()="' + minute + '"]');
  await click('//button[text()=" Save "]');

  await click('xpath=//button[text()=" Mass message "]');
  await wait('//*[@id="attach_file_photo"]');
  await waitMs(1000);

  const paidFiles = schedule.media_path.filter(function(f) { return f.isPaid === true; }).map(function(f) { return f.filePath; });
  const freeFiles = schedule.media_path.filter(function(f) { return f.isPaid === false; }).map(function(f) { return f.filePath; });

  if (schedule.set_price > 0) {
    await chooseFiles('xpath=//*[@id="attach_file_photo"]', freeFiles);
    await waitMs(1000);
    await click('//button[@at-attr="price_btn"]');
    await fill('//input[contains(@id, "price")]', String(schedule.set_price));
    await click('//button[text()=" Save "]');

    if (freeFiles.length > 0) {
      await click('xpath=//*[@data-icon-name="icon-arrow-left"]/..');
      await wait('xpath=//button[contains(@class, "checkbox-item")]');
      await clickAll('button.checkbox-item');
      await click('xpath=//*[@data-icon-name="icon-arrow-left"]/..');
      await click('xpath=//button[@aria-label="Save"]//*[@data-icon-name="icon-done"]/..');
    }
  }

  await chooseFiles('xpath=//*[@id="attach_file_photo"]', paidFiles);
  await typeText('xpath=//div[contains(@data-placeholder,"a message")]', schedule.description_text + '\n' + schedule.signature);
  await waitMs(1000);

  await click('xpath=//a//*[contains(text(), "Fans")]/../..');
  await waitMs(1000);
  await click('xpath=//button[@at-attr="send_btn" and not(@disabled)]');
  await click('xpath=//button[text()=" Yes "]');
  await waitMs(4000);

  done(schedule.id);
  log('OnlyFans mass message complete: ' + schedule.id);
}
