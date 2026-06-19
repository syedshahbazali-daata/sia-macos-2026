import { app } from 'electron'
import { join } from 'path'

// All persistent file paths and the Chromium download URL in one place.
// Keys here double as the string argument to read-json-file / write-json-file IPC calls.
export const PATHS = {
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
  ],
}
