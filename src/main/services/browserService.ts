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

export async function downloadBrowser(
  onProgress: (pct: number) => void,
  onComplete: () => void
): Promise<void> {
  if (!existsSync(PATHS.DOWNLOAD_DIR)) {
    mkdirSync(PATHS.DOWNLOAD_DIR, { recursive: true })
  }

  const fileStream = createWriteStream(PATHS.FIREFOX_ZIP)

  await new Promise<void>((resolve, reject) => {
    const handleResponse = (response: import('http').IncomingMessage): void => {
      // Follow redirects
      if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        https.get(response.headers.location, handleResponse).on('error', reject)
        return
      }

      const total = parseInt(response.headers['content-length'] ?? '0', 10)
      let downloaded = 0

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length
        if (total > 0) {
          onProgress(Math.round((downloaded / total) * 90)) // 0-90% for download
        }
      })

      response.pipe(fileStream)
      fileStream.on('finish', resolve)
      fileStream.on('error', reject)
    }

    https.get(PATHS.DOWNLOAD_URL, handleResponse).on('error', reject)
  })

  onProgress(92)
  await extract(PATHS.FIREFOX_ZIP, { dir: PATHS.FIREFOX_EXTRACT })
  onProgress(98)
  unlink(PATHS.FIREFOX_ZIP, () => {})
  onProgress(100)
  onComplete()
}
