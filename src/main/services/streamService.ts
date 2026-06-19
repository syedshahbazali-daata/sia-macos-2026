import { spawn } from 'child_process'
import { join } from 'path'
import { app } from 'electron'
import ffmpeg from 'ffmpeg-static'
import process from 'node:process'

interface StreamState {
  process: ReturnType<typeof spawn>
  streamKey: string
  startTime: number
  lastFrameTime: number
  frameCount: number
  retryCount: number
}

const activeStreams = new Map<string, StreamState>()

function getFFmpegPath(): string {
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  if (isDev) return ffmpeg as string
  const basePath = app.getAppPath().replace('app.asar', 'app.asar.unpacked')
  return join(basePath, 'node_modules', 'ffmpeg-static', 'ffmpeg')
}

export function startStream(id: string, streamKey: string): void {
  const ffmpegPath = getFFmpegPath()
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
    streamKey,
  ]

  const ffmpegProcess = spawn(ffmpegPath, options)

  ffmpegProcess.stdin.on('error', (error: NodeJS.ErrnoException) => {
    // EPIPE is expected when the stream ends — not an error
    if (error.code !== 'EPIPE') {
      console.error(`[Stream ${id}] stdin error:`, error)
    }
  })

  ffmpegProcess.stderr.on('data', (data: Buffer) => {
    const message = data.toString()
    const isFatal =
      message.includes('Error writing trailer') ||
      message.includes('Conversion failed') ||
      message.includes('Connection refused') ||
      message.includes('End of file') ||
      message.includes('Error while decoding') ||
      message.includes('Invalid data found')
    if (isFatal) handleStreamError(id, message)
  })

  ffmpegProcess.on('error', (error: Error) => {
    handleStreamError(id, error.message)
  })

  ffmpegProcess.on('exit', () => {
    cleanupStream(id)
  })

  activeStreams.set(id, {
    process: ffmpegProcess,
    streamKey,
    startTime: Date.now(),
    lastFrameTime: Date.now(),
    frameCount: 0,
    retryCount: 0,
  })
}

export function sendStreamData(id: string, data: ArrayBuffer): void {
  const stream = activeStreams.get(id)
  if (stream?.process?.stdin) {
    stream.process.stdin.write(Buffer.from(data))
  }
}

export function stopStream(id: string): void {
  cleanupStream(id)
}

function handleStreamError(id: string, errorMessage: string): void {
  const stream = activeStreams.get(id)
  if (!stream) return

  if (stream.retryCount < 3) {
    cleanupStream(id)
    setTimeout(() => {
      try {
        startStream(id, stream.streamKey)
        stream.retryCount++
      } catch (err) {
        console.error(`Failed to restart stream ${id}:`, err)
      }
    }, 1000 * (stream.retryCount + 1))
  } else {
    console.error(`Stream ${id} failed after ${stream.retryCount} retries: ${errorMessage}`)
    cleanupStream(id)
  }
}

function cleanupStream(id: string): void {
  const stream = activeStreams.get(id)
  if (!stream) return

  if (!stream.process.killed) {
    try {
      stream.process.stdin.end()
      setTimeout(() => {
        if (!stream.process.killed) stream.process.kill('SIGTERM')
      }, 1000)
    } catch (e) {
      console.error(`Error killing process for stream ${id}:`, e)
    }
  }
  activeStreams.delete(id)
}

export function cleanupAllStreams(): void {
  activeStreams.forEach(({ process: proc }) => {
    proc.stdin.end()
    proc.kill()
  })
  activeStreams.clear()
}
