import { promises as fs } from 'fs'
import path from 'path'

// Base storage directory - configurable via env var, defaults to /mnt/books
const STORAGE_BASE = process.env.BOOKS_STORAGE_PATH || '/mnt/books'
const NOTES_DIR = path.join(STORAGE_BASE, 'notes')

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch {}
}

export async function saveFile(buffer: Buffer, fileName: string, subfolder: string = ''): Promise<string> {
  const dir = subfolder ? path.join(STORAGE_BASE, subfolder) : STORAGE_BASE
  await ensureDir(dir)
  const uniqueName = `${Date.now()}-${fileName}`
  const filePath = path.join(dir, uniqueName)
  await fs.writeFile(filePath, buffer)
  return filePath
}

export async function saveNoteFile(buffer: Buffer, fileName: string): Promise<string> {
  await ensureDir(NOTES_DIR)
  const uniqueName = `${Date.now()}-${fileName}`
  const filePath = path.join(NOTES_DIR, uniqueName)
  await fs.writeFile(filePath, buffer)
  return filePath
}

export async function deleteStoredFile(filePath: string): Promise<void> {
  if (!filePath) return
  // Handle legacy local:// prefix
  const actualPath = filePath.startsWith('local://') ? filePath.replace('local://', '') : filePath
  try {
    await fs.unlink(actualPath)
  } catch (e: any) {
    console.warn('File delete warning:', e?.message)
  }
}

export function getStorageBase(): string {
  return STORAGE_BASE
}

export function getNotesDir(): string {
  return NOTES_DIR
}
