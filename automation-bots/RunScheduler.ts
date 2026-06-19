import {Scheduler} from "../src/main";
const {chromium} = require('patchright');
import fs, {existsSync, readFileSync, writeFileSync} from 'fs';
import {TwitterPostScheduler} from "./TwitterScheduler";
import {TikTokPostScheduler} from "./TiktokScheduler";
import {YTVideoScheduler} from "./YTVideoScheduler";
import {InstaStoryScheduler} from "./InstaStoriesScheduler"
import {OfPostScheduler} from "./OnlyFansPostScheduler";
import {OnlyFansMassMessageScheduler} from "./OnlyFansMassMessaging";
import {InstaFbPostScheduler} from "./InstaFbPostScheduler";
import { BrowserWindow } from 'electron'



function readSchedulersFromFile(JSON_FILE_PATH): Scheduler[] {
  try {
    if (!existsSync(JSON_FILE_PATH)) {
      writeFileSync(JSON_FILE_PATH, JSON.stringify([]), 'utf-8');
      return [];
    }
    const data = readFileSync(JSON_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading schedulers file:', error);
    return [];
  }
}

function writeSchedulersToFile(
  JSON_FILE_PATH: string,
  schedulers: Scheduler[]): void {
  try {
    writeFileSync(JSON_FILE_PATH, JSON.stringify(schedulers, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing schedulers file:', error);
  }
}

function moveSchedulerToHistory(schedulerId: string, JSON_FILE_PATH: string): void {
  console.log('moveSchedulerToHistory', schedulerId)
  const schedulers = readSchedulersFromFile(JSON_FILE_PATH);
  const scheduler = schedulers.find(s => s.id === schedulerId);
  if (!scheduler) {
    console.error('Scheduler not found:', schedulerId);
    return;
  }
  scheduler.isScheduled = 1


  writeSchedulersToFile(JSON_FILE_PATH, schedulers);

  const mainWindow = BrowserWindow.getAllWindows()[0];
  mainWindow.webContents.send('scheduler-history-updated');






}

async function runScheduler(platfrom: string, schedules: Scheduler[], browserPath: string, userDir: string, jsonFilePath: string): Promise<void> {
  process.env.HOME = userDir;

  console.log(platfrom, schedules, browserPath, userDir, jsonFilePath);

  // Launch browser context (headless mode is false)
  const browserContext = await chromium.launchPersistentContext(
      `${userDir}`,

      {
        // executablePath: browserPath,
        channel: 'chrome',
        headless: false,
        viewport: null,


      },
    );


  const page = await browserContext.newPage();

  if (platfrom.toLowerCase() == 'twitter post') {
    await TwitterPostScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)
  } else if (platfrom.toLowerCase() == 'tik tok post') {
    console.log('tiktok running')
    await TikTokPostScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)
  } else if (platfrom.toLowerCase() == 'instagram post') {
    // TODO: implement instagram post scheduler
    await InstaFbPostScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)
  } else if (platfrom.toLowerCase() == 'facebook') {
    // TODO: implement instagram story scheduler
    await InstaFbPostScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)
  } else if (platfrom.toLowerCase() == 'of post') {
    await OfPostScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)
  } else if (platfrom.toLowerCase() == 'youtube shorts') {
    await YTVideoScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)

  } else if (platfrom.toLowerCase() == 'instagram story') {
    await InstaStoryScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)

  } else if (platfrom.toLowerCase() == 'of mass messaging') {

    await OnlyFansMassMessageScheduler(page, schedules, jsonFilePath,
      moveSchedulerToHistory)

  }

  // Close the browser context instead of using `browser`
  await browserContext.close();
}

export default runScheduler;
