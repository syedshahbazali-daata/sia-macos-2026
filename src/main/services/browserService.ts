import { existsSync, mkdirSync, createWriteStream, readdirSync } from 'fs'
import { unlink } from 'fs'
import https from 'https'
import extract from 'extract-zip'
import { PATHS } from '../paths'

export function findBrowserPath(): string | null {
  return PATHS.BROWSER_PATHS.find((p) => existsSync(p)) || null
}

export function browserExists(): boolean {
  return PATHS.BROWSER_PATHS.some((p) => existsSync(p) && readdirSync(p).length > 0)
}

export async function downloadBrowser(onComplete: () => void): Promise<void> {
  if (!existsSync(PATHS.DOWNLOAD_DIR)) {
    mkdirSync(PATHS.DOWNLOAD_DIR, { recursive: true })
  }

  const fileStream = createWriteStream(PATHS.FIREFOX_ZIP)
  await new Promise<void>((resolve, reject) => {
    https
      .get(PATHS.DOWNLOAD_URL, (response) => {
        if (response.statusCode && [301, 302].includes(response.statusCode)) {
          https.get(response.headers.location!, (redirectResponse) => {
            redirectResponse.pipe(fileStream)
            fileStream.on('finish', resolve)
          })
          return
        }
        response.pipe(fileStream)
        fileStream.on('finish', resolve)
      })
      .on('error', reject)
  })

  await extract(PATHS.FIREFOX_ZIP, { dir: PATHS.FIREFOX_EXTRACT })
  unlink(PATHS.FIREFOX_ZIP, () => {})
  onComplete()
}
