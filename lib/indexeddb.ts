'use client'

import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'speedread-offline'
const DB_VERSION = 1
const BOOKS_STORE = 'books'
const SETTINGS_STORE = 'settings'

interface OfflineBook {
  id: string // matches the document ID from the server
  title: string
  fileName: string
  fileType: string
  fileSize: number
  wordCount: number
  contentText: string
  savedAt: number // timestamp
}

interface ReadingProgress {
  documentId: string
  currentWordIndex: number
  wpm: number
  technique: string
  fontSize: number
  chunkSize: number
  lastReadAt: number
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        db.createObjectStore(BOOKS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'documentId' })
      }
    },
  })
}

// ---- Book Storage ----

export async function saveBookOffline(book: OfflineBook): Promise<void> {
  const db = await getDB()
  await db.put(BOOKS_STORE, book)
}

export async function getBookOffline(id: string): Promise<OfflineBook | undefined> {
  const db = await getDB()
  return db.get(BOOKS_STORE, id)
}

export async function getAllBooksOffline(): Promise<OfflineBook[]> {
  const db = await getDB()
  return db.getAll(BOOKS_STORE)
}

export async function deleteBookOffline(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(BOOKS_STORE, id)
  // Also delete associated settings
  await db.delete(SETTINGS_STORE, id).catch(() => {})
}

export async function isBookSavedOffline(id: string): Promise<boolean> {
  const db = await getDB()
  const book = await db.get(BOOKS_STORE, id)
  return !!book
}

// ---- Reading Progress ----

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  const db = await getDB()
  await db.put(SETTINGS_STORE, progress)
}

export async function getReadingProgress(documentId: string): Promise<ReadingProgress | undefined> {
  const db = await getDB()
  return db.get(SETTINGS_STORE, documentId)
}

// ---- Utilities ----

export async function getOfflineStorageSize(): Promise<string> {
  try {
    if (navigator?.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      const usedMB = ((estimate?.usage ?? 0) / (1024 * 1024)).toFixed(1)
      const quotaMB = ((estimate?.quota ?? 0) / (1024 * 1024)).toFixed(0)
      return `${usedMB} MB / ${quotaMB} MB`
    }
  } catch {}
  return 'Unknown'
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB()
  await db.clear(BOOKS_STORE)
  await db.clear(SETTINGS_STORE)
}

export type { OfflineBook, ReadingProgress }
