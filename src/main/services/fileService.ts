import { existsSync, readFileSync, writeFileSync } from 'fs'
import { PATHS } from '../paths'
import type { Scheduler } from '../types'

export function readSchedulers(): Scheduler[] {
  if (!existsSync(PATHS.JSON_FILE)) {
    writeFileSync(PATHS.JSON_FILE, JSON.stringify([]), 'utf-8')
    return []
  }
  return JSON.parse(readFileSync(PATHS.JSON_FILE, 'utf-8'))
}

export function writeSchedulers(schedulers: Scheduler[]): void {
  writeFileSync(PATHS.JSON_FILE, JSON.stringify(schedulers, null, 2), 'utf-8')
}

const ALLOWED_FILE_KEYS = new Set(
  Object.keys(PATHS).filter((k) => typeof (PATHS as unknown as Record<string, unknown>)[k] === 'string')
)

export function readJsonFile(fileName: string): unknown {
  // Guard: only allow access to predefined safe paths, never arbitrary file access
  if (!ALLOWED_FILE_KEYS.has(fileName)) {
    throw new Error(`readJsonFile: unknown key "${fileName}"`)
  }
  const filePath = (PATHS as unknown as Record<string, string>)[fileName]
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf-8')
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

export function writeJsonFile(fileName: string, data: unknown): unknown {
  // Guard: only allow writing to predefined safe paths
  if (!ALLOWED_FILE_KEYS.has(fileName)) {
    throw new Error(`writeJsonFile: unknown key "${fileName}"`)
  }
  const filePath = (PATHS as unknown as Record<string, string>)[fileName]
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}
