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

export function readJsonFile(fileName: keyof typeof PATHS): unknown {
  const filePath = PATHS[fileName] as string
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf-8')
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

export function writeJsonFile(fileName: keyof typeof PATHS, data: unknown): unknown {
  const filePath = PATHS[fileName] as string
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}
