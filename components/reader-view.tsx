'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { RsvpReader } from '@/components/readers/rsvp-reader'
import { ChunkReader } from '@/components/readers/chunk-reader'
import { GuidedReader } from '@/components/readers/guided-reader'
import { HighlightReader } from '@/components/readers/highlight-reader'
import { NormalReader } from '@/components/readers/normal-reader'
import { ReaderControls } from '@/components/reader-controls'
import { ReaderSidebar } from '@/components/reader-sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/ui/animate'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowLeft, BookOpen, PanelRightOpen, PanelRightClose, Loader2, Edit3, SkipForward
} from 'lucide-react'
import { toast } from 'sonner'
import { getBookOffline, saveReadingProgress, getReadingProgress } from '@/lib/indexeddb'

interface BookmarkItem {
  id: string
  wordIndex: number
  label: string
  createdAt: string
}

interface AnnotationItem {
  id: string
  startIndex: number
  endIndex: number
  text: string
  note: string
  color: string
  createdAt: string
}

interface DocumentData {
  id: string
  title: string
  author: string
  fileName: string
  fileType: string
  contentText: string
  wordCount: number
  readingStartIndex: number
  bookmarks: BookmarkItem[]
  annotations: AnnotationItem[]
}

export type ReadingTechnique = 'rsvp' | 'chunk' | 'guided' | 'highlight' | 'normal'

export function ReaderView({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [doc, setDoc] = useState<DocumentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(250)
  const [technique, setTechnique] = useState<ReadingTechnique>('rsvp')
  const [chunkSize, setChunkSize] = useState(3)
  const [fontSize, setFontSize] = useState(32)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editStartIndex, setEditStartIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number>(0)
  const [wordsReadInSession, setWordsReadInSession] = useState(0)

  // Load document (try server first, fallback to IndexedDB)
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        let data: any = null

        // Try server first
        try {
          const res = await fetch(`/api/documents/${documentId}`)
          if (res?.ok) {
            data = await res.json()
          }
        } catch {
          // Server unreachable — try offline
        }

        // Fallback to IndexedDB
        if (!data) {
          const offlineBook = await getBookOffline(documentId)
          if (offlineBook) {
            data = {
              id: offlineBook.id,
              title: offlineBook.title,
              fileName: offlineBook.fileName,
              fileType: offlineBook.fileType,
              contentText: offlineBook.contentText,
              wordCount: offlineBook.wordCount,
              bookmarks: [],
              annotations: [],
            }
          }
        }

        if (!data) {
          toast.error('Document not found')
          router.push('/')
          return
        }

        setDoc(data ?? null)
        const w = (data?.contentText ?? '').split(/\s+/).filter((s: string) => (s?.length ?? 0) > 0)
        setWords(w ?? [])

        // Restore reading progress from IndexedDB first, then localStorage
        try {
          const offlineProgress = await getReadingProgress(documentId)
          if (offlineProgress) {
            setCurrentIndex(offlineProgress.currentWordIndex ?? 0)
            setWpm(offlineProgress.wpm ?? 250)
            setTechnique((offlineProgress.technique as ReadingTechnique) ?? 'rsvp')
            setChunkSize(offlineProgress.chunkSize ?? 3)
            setFontSize(offlineProgress.fontSize ?? 32)
          } else {
            const saved = localStorage?.getItem?.(`reader-${documentId}`)
            if (saved) {
              const parsed = JSON.parse(saved)
              setCurrentIndex(parsed?.currentIndex ?? 0)
              setWpm(parsed?.wpm ?? 250)
              setTechnique(parsed?.technique ?? 'rsvp')
              setChunkSize(parsed?.chunkSize ?? 3)
              setFontSize(parsed?.fontSize ?? 32)
            }
          }
        } catch {
          // storage not available
        }
      } catch (e: any) {
        console.error('Failed to load document:', e)
        toast.error('Failed to load document')
      } finally {
        setLoading(false)
      }
    }
    if (documentId) fetchDoc()
  }, [documentId, router])

  // Save progress to both localStorage and IndexedDB
  useEffect(() => {
    if (!documentId || !doc) return
    try {
      localStorage?.setItem?.(`reader-${documentId}`, JSON.stringify({
        currentIndex,
        wpm,
        technique,
        chunkSize,
        fontSize,
      }))
    } catch {}

    // Also save to IndexedDB for offline access
    saveReadingProgress({
      documentId,
      currentWordIndex: currentIndex,
      wpm,
      technique,
      fontSize,
      chunkSize,
      lastReadAt: Date.now(),
    }).catch(() => {})
  }, [currentIndex, wpm, technique, chunkSize, fontSize, documentId, doc])

  // Start session
  const startSession = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          technique,
          currentWordIndex: currentIndex,
          avgWpm: wpm,
        }),
      })
      if (res?.ok) {
        const data = await res.json()
        setSessionId(data?.id ?? null)
        setSessionStartTime(Date.now())
        setWordsReadInSession(0)
      }
    } catch {
      // Offline — still allow reading
      setSessionStartTime(Date.now())
      setWordsReadInSession(0)
    }
  }, [documentId, technique, currentIndex, wpm])

  // Update session
  const updateSession = useCallback(async () => {
    if (!sessionId) return
    try {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000)
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordsRead: wordsReadInSession,
          currentWordIndex: currentIndex,
          avgWpm: wpm,
          durationSeconds: duration,
          endedAt: new Date().toISOString(),
        }),
      })
    } catch {
      // Offline — ignore
    }
  }, [sessionId, sessionStartTime, wordsReadInSession, currentIndex, wpm])

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true)
      if (!sessionId) {
        startSession()
      }
    } else {
      setIsPlaying(false)
      updateSession()
    }
  }, [isPlaying, sessionId, startSession, updateSession])

  // Word advance handler
  const onWordAdvance = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex)
    setWordsReadInSession((prev) => prev + 1)
  }, [])

  // Jump to position
  const jumpTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, (words?.length ?? 1) - 1)))
    setIsPlaying(false)
    updateSession()
  }, [words, updateSession])

  // Bookmark management
  const addBookmark = useCallback(async (label?: string) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          wordIndex: currentIndex,
          label: label || `Position ${currentIndex}`,
        }),
      })
      if (res?.ok) {
        const bm = await res.json()
        setDoc((prev) => {
          if (!prev) return prev
          return { ...prev, bookmarks: [...(prev?.bookmarks ?? []), bm] }
        })
        toast.success('Bookmark added')
      }
    } catch {
      toast.error('Bookmarks require an internet connection')
    }
  }, [documentId, currentIndex])

  const removeBookmark = useCallback(async (id: string) => {
    try {
      await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
      setDoc((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          bookmarks: (prev?.bookmarks ?? []).filter((b: BookmarkItem) => b?.id !== id),
        }
      })
      toast.success('Bookmark removed')
    } catch {
      toast.error('Failed to remove bookmark')
    }
  }, [])

  // Annotation management
  const addAnnotation = useCallback(async (startIdx: number, endIdx: number, note: string, color: string) => {
    const annotText = (words ?? []).slice(startIdx, endIdx + 1).join(' ')
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          startIndex: startIdx,
          endIndex: endIdx,
          text: annotText,
          note,
          color,
        }),
      })
      if (res?.ok) {
        const ann = await res.json()
        setDoc((prev) => {
          if (!prev) return prev
          return { ...prev, annotations: [...(prev?.annotations ?? []), ann] }
        })
        toast.success('Annotation added')
      }
    } catch {
      toast.error('Annotations require an internet connection')
    }
  }, [documentId, words])

  const removeAnnotation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/annotations/${id}`, { method: 'DELETE' })
      setDoc((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          annotations: (prev?.annotations ?? []).filter((a: AnnotationItem) => a?.id !== id),
        }
      })
      toast.success('Annotation removed')
    } catch {
      toast.error('Failed to remove annotation')
    }
  }, [])

  // Edit document metadata
  const openEditDialog = useCallback(() => {
    if (!doc) return
    setEditTitle(doc.title)
    setEditAuthor(doc.author || '')
    setEditStartIndex(doc.readingStartIndex || 0)
    setShowEditDialog(true)
  }, [doc])

  const saveDocumentEdit = useCallback(async () => {
    if (!doc) return
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim() || doc.title,
          author: editAuthor.trim(),
          readingStartIndex: editStartIndex,
        }),
      })
      if (res?.ok) {
        const updated = await res.json()
        setDoc(prev => prev ? { ...prev, title: updated.title, author: updated.author || '', readingStartIndex: updated.readingStartIndex || 0 } : prev)
        toast.success('Document updated')
        setShowEditDialog(false)
      }
    } catch {
      toast.error('Failed to update document')
    }
  }, [doc, editTitle, editAuthor, editStartIndex])

  const setReadingStartHere = useCallback(async () => {
    if (!doc) return
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingStartIndex: currentIndex }),
      })
      setDoc(prev => prev ? { ...prev, readingStartIndex: currentIndex } : prev)
      toast.success(`Reading start set to word ${currentIndex}`)
    } catch {
      toast.error('Failed to update reading start')
    }
  }, [doc, currentIndex])

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        const duration = Math.round((Date.now() - sessionStartTime) / 1000)
        fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordsRead: wordsReadInSession,
            currentWordIndex: currentIndex,
            avgWpm: wpm,
            durationSeconds: duration,
            endedAt: new Date().toISOString(),
          }),
        }).catch(() => {})
      }
    }
  }, []) // intentionally empty deps for cleanup only

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4 px-4">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Document not found</p>
          <Button onClick={() => router.push('/')} className="touch-manipulation">Back to Library</Button>
        </div>
      </div>
    )
  }

  const progress = (words?.length ?? 0) > 0
    ? Math.round((currentIndex / (words?.length ?? 1)) * 100)
    : 0

  const ReaderComponent = {
    rsvp: RsvpReader,
    chunk: ChunkReader,
    guided: GuidedReader,
    highlight: HighlightReader,
    normal: NormalReader,
  }[technique] ?? RsvpReader

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <div className="flex-1 flex relative">
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <FadeIn>
            <div className="border-b border-border/40 px-3 sm:px-4 py-2">
              <div className="mx-auto max-w-[1200px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateSession()
                      router.push('/')
                    }}
                    className="touch-manipulation shrink-0 min-h-[44px]"
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Library</span>
                  </Button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h2 className="text-sm font-medium truncate">{doc?.title ?? 'Untitled'}</h2>
                      <Button variant="ghost" size="icon-sm" onClick={openEditDialog} className="h-6 w-6 shrink-0">
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {doc?.author && <span className="truncate max-w-[120px]">{doc.author}</span>}
                      <Badge variant="secondary" className="uppercase text-[10px]">{doc?.fileType ?? ''}</Badge>
                      <span className="hidden sm:inline">{(doc?.wordCount ?? 0).toLocaleString()} words</span>
                      <span>{progress}%</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="touch-manipulation min-h-[44px] min-w-[44px] shrink-0"
                >
                  {sidebarOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Reading area */}
          <div className="flex-1 flex items-center justify-center p-3 sm:p-8">
            <div className="w-full max-w-[800px]">
              <ReaderComponent
                words={words}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                wpm={wpm}
                chunkSize={chunkSize}
                fontSize={fontSize}
                onWordAdvance={onWordAdvance}
                annotations={doc?.annotations ?? []}
                readingStartIndex={doc?.readingStartIndex ?? 0}
              />
            </div>
          </div>

          {/* Controls */}
          <ReaderControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            wpm={wpm}
            onWpmChange={setWpm}
            technique={technique}
            onTechniqueChange={(t: ReadingTechnique) => {
              setTechnique(t)
              setIsPlaying(false)
            }}
            chunkSize={chunkSize}
            onChunkSizeChange={setChunkSize}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            currentIndex={currentIndex}
            totalWords={words?.length ?? 0}
            onSeek={jumpTo}
            onBookmark={() => addBookmark()}
            onSetReadingStart={setReadingStartHere}
            readingStartIndex={doc?.readingStartIndex ?? 0}
            progress={progress}
          />
        </main>

        {/* Edit Document Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>Update title, author, and front-matter skip point.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Author</Label>
                <Input value={editAuthor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditAuthor(e.target.value)} placeholder="Author name..." />
              </div>
              <div className="space-y-1">
                <Label>Reading Start Index (skip front-matter)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={words.length - 1}
                    value={editStartIndex}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditStartIndex(parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-xs text-muted-foreground">of {words.length} words</span>
                </div>
                <p className="text-xs text-muted-foreground">Words before this index are considered front-matter and skipped by default.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={saveDocumentEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sidebar */}
        {sidebarOpen && (
          <ReaderSidebar
            bookmarks={doc?.bookmarks ?? []}
            annotations={doc?.annotations ?? []}
            onJumpTo={jumpTo}
            onRemoveBookmark={removeBookmark}
            onRemoveAnnotation={removeAnnotation}
            onAddAnnotation={addAnnotation}
            currentIndex={currentIndex}
            words={words}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
