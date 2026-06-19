import type { Scheduler } from '../types'
const { chromium } = require('patchright')
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { TwitterPostScheduler } from './TwitterScheduler'
import { TikTokPostScheduler } from './TiktokScheduler'
import { YTVideoScheduler } from './YTVideoScheduler'
import { InstaStoryScheduler } from './InstaStoriesScheduler'
import { OfPostScheduler } from './OnlyFansPostScheduler'
import { OnlyFansMassMessageScheduler } from './OnlyFansMassMessaging'
import { InstaFbPostScheduler } from './InstaFbPostScheduler'
import { BrowserWindow } from 'electron'

function readSchedulersFromFile(jsonFilePath: string): Scheduler[] {
  try {
    if (!existsSync(jsonFilePath)) {
      writeFileSync(jsonFilePath, JSON.stringify([]), 'utf-8')
      return []
    }
    return JSON.parse(readFileSync(jsonFilePath, 'utf-8'))
  } catch (error) {
    console.error('Error reading schedulers file:', error)
    return []
  }
}

function writeSchedulersToFile(jsonFilePath: string, schedulers: Scheduler[]): void {
  try {
    writeFileSync(jsonFilePath, JSON.stringify(schedulers, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing schedulers file:', error)
  }
}

function moveSchedulerToHistory(schedulerId: string, jsonFilePath: string): void {
  const schedulers = readSchedulersFromFile(jsonFilePath)
  const scheduler = schedulers.find((s) => s.id === schedulerId)
  if (!scheduler) {
    console.error('Scheduler not found:', schedulerId)
    return
  }
  scheduler.isScheduled = 1
  writeSchedulersToFile(jsonFilePath, schedulers)

  const mainWindow = BrowserWindow.getAllWindows()[0]
  mainWindow?.webContents.send('scheduler-history-updated')
}

// Bots each define their own local Schedule + Page types — use any to bridge them all
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchedulerHandler = (...args: any[]) => Promise<void>

const PLATFORM_MAP: Record<string, SchedulerHandler> = {
  'twitter post': TwitterPostScheduler,
  'tik tok post': TikTokPostScheduler,
  'instagram post': InstaFbPostScheduler,
  facebook: InstaFbPostScheduler,
  'of post': OfPostScheduler,
  'youtube shorts': YTVideoScheduler,
  'instagram story': InstaStoryScheduler,
  'of mass messaging': OnlyFansMassMessageScheduler,
}

async function runScheduler(
  platform: string,
  schedules: Scheduler[],
  _browserPath: string,
  userDir: string,
  jsonFilePath: string,
): Promise<void> {
  process.env.HOME = userDir

  // patchright uses a persistent browser profile per instance for session persistence
  const browserContext = await chromium.launchPersistentContext(userDir, {
    channel: 'chrome',
    headless: false,
    viewport: null,
  })

  const page = await browserContext.newPage()
  const handler = PLATFORM_MAP[platform.toLowerCase()]
  if (handler) {
    await handler(page, schedules, jsonFilePath, moveSchedulerToHistory)
  } else {
    console.error(`No handler registered for platform: ${platform}`)
  }

  await browserContext.close()
}

export default runScheduler
