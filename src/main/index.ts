import {app, shell, BrowserWindow, ipcMain} from 'electron'
import {join} from 'path'
import {electronApp, optimizer, is} from '@electron-toolkit/utils'
import {existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlink, createWriteStream} from 'fs'
import {spawn} from 'child_process'
import https from 'https'
import extract from 'extract-zip'
import process from 'node:process'
import ffmpeg from 'ffmpeg-static'

// Import automation bots
import {addAccountPlaywright, closeBrowser} from "../../automation-bots/AddAccount"
import runScheduler from "../../automation-bots/RunScheduler"
import runBrowser from "../../automation-bots/Browser"
import {StreamKeysAutoFetch} from "../../automation-bots/StreamKeysAutoFetch"

// Types
interface Scheduler {
  id: string
  Instance_id: string
  description_type: string
  city: string
  isScheduled: number
  description_text: string
  signature: string
  set_price: number
  set_date: string
  set_time: string
  media_path: mediaPathType[]
  platform: string
  created_at: number
}

type mediaPathType = {
  previewUrl: string
  filePath: string
  isPaid: boolean
}

// Application paths configuration
const PATHS = {
  JSON_FILE: join(app.getPath('userData'), 'schedulers.json'),
  STREAM_KEYS: join(app.getPath('userData'), 'stream-keys.json'),
  SIGNATURES: join(app.getPath('userData'), 'signatures.json'),
  ATTACHED_ACCOUNTS: join(app.getPath('userData'), 'attached-accounts.json'),
  CUSTOM_DESCRIPTIONS: join(app.getPath('userData'), 'custom-descriptions.json'),
  FREQUENT_QUESTIONS: join(app.getPath('userData'), 'frequent-questions.json'),
  DOWNLOAD_URL: 'https://playwright.azureedge.net/builds/chromium/1148/chromium-mac-arm64.zip',
  DOWNLOAD_DIR: app.getPath('userData'),
  FIREFOX_ZIP: join(app.getPath('userData'), 'chromium.zip'),
  FIREFOX_EXTRACT: join(app.getPath('userData'), 'chromium'),
  BROWSER_PATHS: [
    join(app.getPath('userData'), 'chromium', 'chrome-mac', 'Chromium.app'),
    join(app.getPath('userData'), 'chromium', 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
  ]
}

console.log(PATHS)
// Stream Management
const activeStreams = new Map()

// File Management Functions
function readSchedulersFromFile() {
  if (!existsSync(PATHS.JSON_FILE)) {
    writeFileSync(PATHS.JSON_FILE, JSON.stringify([]), 'utf-8')
    return []
  }
  return JSON.parse(readFileSync(PATHS.JSON_FILE, 'utf-8'))
}

function writeSchedulersToFile(schedulers) {
  writeFileSync(PATHS.JSON_FILE, JSON.stringify(schedulers, null, 2), 'utf-8')
}

function findBrowserPath() {
  return PATHS.BROWSER_PATHS.find(path => existsSync(path)) || null
}

// Browser Management Functions
async function downloadBrowser(event) {
  if (!existsSync(PATHS.DOWNLOAD_DIR)) {
    mkdirSync(PATHS.DOWNLOAD_DIR, {recursive: true})
  }

  const fileStream = createWriteStream(PATHS.FIREFOX_ZIP)
  await new Promise((resolve, reject) => {
    https.get(PATHS.DOWNLOAD_URL, response => {
      if ([301, 302].includes(response.statusCode)) {
        https.get(response.headers.location, redirectResponse => {
          redirectResponse.pipe(fileStream)
          fileStream.on('finish', resolve)
        })
        return
      }
      response.pipe(fileStream)
      fileStream.on('finish', resolve)
    }).on('error', reject)
  })

  await extract(PATHS.FIREFOX_ZIP, {dir: PATHS.FIREFOX_EXTRACT})
  unlink(PATHS.FIREFOX_ZIP, () => {
  })
  event.reply('download-browser-complete')
}

function getFFmpegPath() {
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  if (isDev) return ffmpeg
  const basePath = app.getAppPath().replace('app.asar', 'app.asar.unpacked')
  return join(basePath, 'node_modules', 'ffmpeg-static', 'ffmpeg')
}

// Window Management
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 780,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  ipcMain.on('set-focus', () => {
    console.log('Setting focus')
    mainWindow.focus()

  })


  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {action: 'deny'}
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Streaming Functions
function startFFmpegProcess(id: string, streamKey: string) {
  try {
    const ffmpegPath = getFFmpegPath()
    // const ffmpegPath = "/Users/muhammadali/PycharmProjects/ClientProjects/TestJupyter/ffmpeg"
    const options = [
      '-i', '-',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-r', '30',
      '-g', '60',
      '-keyint_min', '30',
      '-b:v', '2500k',
      '-maxrate', '2500k',
      '-bufsize', '5000k',
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'main',
      '-level', '3.1',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-threads', '4',
      '-f', 'flv',
      streamKey
    ]

    const ffmpegProcess = spawn(ffmpegPath, options)
    setupStreamProcessHandlers(ffmpegProcess, id)
    setupStreamBufferManagement(ffmpegProcess, id)

    activeStreams.set(id, {
      process: ffmpegProcess,
      streamKey,
      startTime: Date.now(),
      lastFrameTime: Date.now(),
      frameCount: 0,
      retryCount: 0
    })

    return ffmpegProcess
  } catch (error) {
    console.error(`Error starting stream ${id}:`, error)
    cleanupStream(id)
    throw error
  }
}

function setupStreamProcessHandlers(ffmpegProcess, id) {
  ffmpegProcess.stdin.on('error', (error) => {
    if (error.code !== 'EPIPE') {
      console.error(`[Stream ${id}] stdin error:`, error)
    }
  })

  ffmpegProcess.stdout.on('error', (error) => {
    console.error(`[Stream ${id}] stdout error:`, error)
  })

  ffmpegProcess.stderr.on('data', (data) => {
    const message = data.toString()
    console.log(`[Stream ${id}]:`, message)

    if (message.includes('Error writing trailer') ||
      message.includes('Conversion failed') ||
      message.includes('Connection refused') ||
      message.includes('End of file') ||
      message.includes('Error while decoding') ||
      message.includes('Invalid data found')) {
      console.error(`Critical error in stream ${id}:`, message)
      handleStreamError(id, message)
    }
  })

  ffmpegProcess.on('error', (error) => {
    console.error(`[Stream ${id}] FFmpeg process error:`, error)
    handleStreamError(id, error.message)
  })

  ffmpegProcess.on('exit', (code, signal) => {
    console.log(`[Stream ${id}] FFmpeg process exited with code ${code} and signal ${signal}`)
    cleanupStream(id)
  })
}

function setupStreamBufferManagement(ffmpegProcess, id) {
  let inputBuffer = Buffer.alloc(0)
  let isProcessingFrame = false

  ffmpegProcess.stdin.on('drain', () => {
    isProcessingFrame = false
    if (inputBuffer.length > 0) {
      processNextFrame()
    }
  })

  function processNextFrame() {
    if (isProcessingFrame || inputBuffer.length === 0) return

    isProcessingFrame = true
    const chunk = inputBuffer
    inputBuffer = Buffer.alloc(0)

    if (!ffmpegProcess.stdin.write(chunk)) {
      isProcessingFrame = false
    }
  }
}

function handleStreamError(id: string, errorMessage: string) {
  const stream = activeStreams.get(id)
  if (!stream) return

  if (stream.retryCount < 3) {
    console.log(`Attempting to restart stream ${id} (attempt ${stream.retryCount + 1})`)
    cleanupStream(id)
    setTimeout(() => {
      try {
        startFFmpegProcess(id, stream.streamKey)
        stream.retryCount++
      } catch (error) {
        console.error(`Failed to restart stream ${id}:`, error)
      }
    }, 1000 * (stream.retryCount + 1))
  } else {
    console.error(`Stream ${id} failed after ${stream.retryCount} retries`)
    cleanupStream(id)
  }
}

function cleanupStream(id: string) {
  if (activeStreams.has(id)) {
    const stream = activeStreams.get(id)
    if (stream?.process && !stream.process.killed) {
      try {
        stream.process.stdin.end()
        setTimeout(() => {
          if (!stream.process.killed) {
            stream.process.kill('SIGTERM')
          }
        }, 1000)
      } catch (e) {
        console.error(`Error killing process for stream ${id}:`, e)
      }
    }
    activeStreams.delete(id)
  }
}

// IPC Handlers
// Stream Management


ipcMain.on('start-stream', (_, id, streamKey) => {
  try {
    startFFmpegProcess(id, streamKey)
  } catch (error) {
    console.error('Failed to start stream:', error)
  }
})

ipcMain.on('stream-data', (_, id, data) => {
  try {
    const process = activeStreams.get(id)?.process
    if (process?.stdin) {
      process.stdin.write(Buffer.from(data))
    }
  } catch (error) {
    console.error(`Error sending data to stream ${id}:`, error)
    cleanupStream(id)
  }
})

ipcMain.on('stop-stream', (_, id) => {
  try {
    cleanupStream(id)
  } catch (error) {
    console.error('Failed to stop stream:', error)
  }
})

// Scheduler Management
ipcMain.handle('read-schedules', async () => readSchedulersFromFile())
ipcMain.handle('get-scheduler', async () => readSchedulersFromFile())

ipcMain.on('add-scheduler', (_, scheduler) => {
  const schedulers = readSchedulersFromFile()
  schedulers.push(scheduler)
  writeSchedulersToFile(schedulers)
})

ipcMain.handle('move-scheduler-to-history', async (_, id) => {
  const schedulers = readSchedulersFromFile()
  const scheduler = schedulers.find(s => s.id === id)
  if (scheduler) {
    scheduler.isScheduled = 1
    writeSchedulersToFile(schedulers)
    return 'success'
  }
  return 'error'
})

ipcMain.handle('delete-scheduler', async (_, id) => {
  const schedulers = readSchedulersFromFile()
  writeSchedulersToFile(schedulers.filter(s => s.id !== id))
  return 'success'
})

ipcMain.handle('delete-scheduler-by-platform', async (_, platform) => {
  const schedulers = readSchedulersFromFile()
  writeSchedulersToFile(schedulers.filter(s => s.platform !== platform || s.isScheduled))
  return 'success'
})


ipcMain.handle('run-scheduler', async (_, platform: string, schedulers: Scheduler[], userDirId: string): Promise<string> => {
  try {
    const userDir = join(app.getPath('userData'), userDirId);
    const browserPath = join(findBrowserPath(), 'Contents', 'MacOS', 'Chromium');
    console.log('Running scheduler with:', {platform, userDir, browserPath});

    await runScheduler(platform, schedulers, browserPath, userDir, PATHS.JSON_FILE);
    return 'success';
  } catch (error) {
    console.error('Error running scheduler:', error);
    throw error;
  }
});


// Instance Management
const {rm} = require('fs/promises');
ipcMain.on('delete-instance', async (_, id) => {
  const userDir = join(app.getPath('userData'), `userdir-${id}`);
  try {
    await rm(userDir, {recursive: true, force: true}); // Deletes the folder and its contents
    console.log(`Folder ${userDir} deleted successfully.`);
  } catch (error) {
    console.error(`Failed to delete folder ${userDir}:`, error);
  }
});

// Account Management
ipcMain.on('show-attached-accounts', (event) => {
  if (!existsSync(PATHS.ATTACHED_ACCOUNTS)) {
    writeFileSync(PATHS.ATTACHED_ACCOUNTS, '[]', 'utf-8')
  }
  event.reply('attached-accounts', JSON.parse(readFileSync(PATHS.ATTACHED_ACCOUNTS, 'utf-8')))
})

ipcMain.on('add-account', (event, website, userDirId) => {
  const userDir = join(app.getPath('userData'), userDirId)
  const browserPath = join(findBrowserPath(), 'Contents', 'MacOS', 'Chromium')
  addAccountPlaywright(website, userDir, browserPath)
})

ipcMain.on('account-added', (event, jsonData) => {
  try {
    writeFileSync(PATHS.ATTACHED_ACCOUNTS, JSON.stringify(jsonData), 'utf-8');
    event.reply('account-added-response', 'success');
  } catch (error) {
    console.error('Error saving attached accounts file:', error);
    event.reply('account-added-response', 'error');
  }
});

// Browser Management
ipcMain.on('browser-exists', (event) => {
  event.reply('browser-exists-response',
    PATHS.BROWSER_PATHS.some(path => existsSync(path) && readdirSync(path).length > 0)
  )
})

ipcMain.on('get-browser-path', (event) => {
  event.reply('browser-path-response', findBrowserPath())
})

ipcMain.on('download-browser', async (event) => {
  await downloadBrowser(event)
})

ipcMain.on('run-browser', (event, userDirId) => {
  const userDir = join(app.getPath('userData'), 'userdir-' + userDirId)
  const browserPath = join(findBrowserPath(), 'Contents', 'MacOS', 'Chromium')
  runBrowser(userDir, browserPath)
})

ipcMain.on('close-add-account-browser', () => {
  closeBrowser()
})

// File Management
ipcMain.handle('read-json-file', async (_, fileName) => {

  const filePath = PATHS[fileName]
  console.log(filePath, "filePath")
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf-8')
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
})


ipcMain.handle('write-json-file', async (_, fileName, data) => {
    const filePath = PATHS[fileName]
    console.log(filePath, "writing filePath")
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  }
)

// Stream Key Management
ipcMain.handle('fetch-stream-key', async (_, platform, userDirId) => {
  try {
    const userDir = join(app.getPath('userData'), `userdir-${userDirId}`)
    const browserPath = join(findBrowserPath(), 'Contents', 'MacOS', 'Chromium')
    const streamKey = await StreamKeysAutoFetch(platform, userDir, browserPath, userDirId)
    return streamKey
  } catch (error) {
    console.error('Error fetching stream key:', error)
    return error.message
  }
})

// App Lifecycle Management
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  // Clean up all active streams
  activeStreams.forEach(({process}) => {
    process.stdin.end()
    process.kill()
  })
  activeStreams.clear()

  // Quit app on all platforms except macOS
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

export type {Scheduler, mediaPathType}
