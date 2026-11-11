'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { UploadModal } from '@/components/upload-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeIn, Stagger, StaggerItem, HoverLift } from '@/components/ui/animate'
import {
  Plus, FileText, BookOpen, Clock, Hash, Trash2, BookMarked, MessageSquare, Search, WifiOff, Edit3, User
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { deleteBookOffline } from '@/lib/indexeddb'

interface DocumentItem {
  id: string
  title: string
  author: string
  fileName: string
  fileType: string
  fileSize: number
  wordCount: number
  createdAt: string
  updatedAt: string
  lastPosition: number
  lastWpm: number
  lastTechnique: string
  readingStartIndex: number
  _count: {
    readingSessions: number
    bookmarks: number
    annotations: number
  }
}

function formatFileSize(bytes: number): string {
  if ((bytes ?? 0) < 1024) return `${bytes ?? 0} B`
  if ((bytes ?? 0) < 1024 * 1024) return `${((bytes ?? 0) / 1024).toFixed(1)} KB`
  return `${((bytes ?? 0) / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
  const t = (fileType ?? '').toLowerCase()
  if (t === 'pdf') return '📄'
  if (t === 'epub') return '📚'
  if (t === 'docx') return '📝'
  return '📃'
}

export function LibraryView() {
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      if (res?.ok) {
        const data = await res.json()
        setDocuments(data ?? [])
      }
    } catch (e: any) {
      console.error('Failed to fetch documents:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleEdit = async () => {
    if (!editDoc) return
    try {
      const res = await fetch(`/api/documents/${editDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() || editDoc.title, author: editAuthor.trim() }),
      })
      if (res?.ok) {
        toast.success('Document updated')
        setEditDoc(null)
        fetchDocuments()
      }
    } catch {
      toast.error('Failed to update document')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res?.ok) {
        setDocuments((prev) => (prev ?? []).filter((d: DocumentItem) => d?.id !== id))
        // Also delete from IndexedDB
        await deleteBookOffline(id).catch(() => {})
        toast.success('Document deleted')
      }
    } catch (e: any) {
      toast.error('Failed to delete document')
    }
  }

  const filtered = (documents ?? []).filter((d: DocumentItem) =>
    (d?.title ?? '').toLowerCase().includes((search ?? '').toLowerCase()) ||
    (d?.fileName ?? '').toLowerCase().includes((search ?? '').toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6 sm:py-8">
        <FadeIn>
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Your Reading <span className="text-primary">Library</span>
            </h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Upload documents and start speed reading.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e?.target?.value ?? '')}
                className="pl-10 h-11 text-base"
              />
            </div>
            <Button onClick={() => setShowUpload(true)} className="gap-2 h-11 text-base touch-manipulation">
              <Plus className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i: number) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 sm:p-6">
                  <div className="h-6 w-3/4 rounded bg-muted mb-3" />
                  <div className="h-4 w-1/2 rounded bg-muted mb-2" />
                  <div className="h-4 w-1/3 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (filtered?.length ?? 0) === 0 ? (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold">No documents yet</h2>
              <p className="mt-2 text-muted-foreground max-w-md text-sm sm:text-base">
                Upload a PDF, EPUB, DOCX, or TXT file to start speed reading.
              </p>
              <Button onClick={() => setShowUpload(true)} className="mt-4 gap-2 h-11 touch-manipulation">
                <Plus className="h-4 w-4" />
                Upload Your First Document
              </Button>
            </div>
          </FadeIn>
        ) : (
          <Stagger staggerDelay={0.05}>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {(filtered ?? []).map((doc: DocumentItem) => {
                const progress = (doc?.wordCount ?? 0) > 0
                  ? Math.round(((doc?.lastPosition ?? 0) / (doc?.wordCount ?? 1)) * 100)
                  : 0
                return (
                  <StaggerItem key={doc?.id ?? ''}>
                    <HoverLift>
                      <Card
                        className="cursor-pointer transition-all hover:shadow-lg active:shadow-md group relative overflow-hidden touch-manipulation"
                        onClick={() => router.push(`/reader/${doc?.id ?? ''}`)}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{getFileIcon(doc?.fileType ?? '')}</span>
                              <Badge variant="secondary" className="uppercase text-xs">
                                {doc?.fileType ?? 'txt'}
                              </Badge>
                            </div>
                            <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation min-h-[40px] min-w-[40px]"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                setEditDoc(doc)
                                setEditTitle(doc.title)
                                setEditAuthor(doc.author || '')
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation min-h-[40px] min-w-[40px]"
                                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent
                                className="max-w-[90vw] sm:max-w-lg"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete document?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete &quot;{doc?.title ?? ''}&quot; and all associated
                                    bookmarks, annotations, and reading sessions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="touch-manipulation">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation()
                                      handleDelete(doc?.id ?? '')
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-manipulation"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            </div>
                          </div>

                          <h3 className="font-display font-semibold text-base leading-tight mb-1 line-clamp-2">
                            {doc?.title ?? 'Untitled'}
                          </h3>
                          {doc?.author && (
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <User className="h-3 w-3" /> {doc.author}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mb-3 truncate">
                            {doc?.fileName ?? ''}
                          </p>

                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {(doc?.wordCount ?? 0).toLocaleString()} words
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {formatFileSize(doc?.fileSize ?? 0)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {(doc?._count?.bookmarks ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <BookMarked className="h-3 w-3" />
                                {doc._count.bookmarks}
                              </span>
                            )}
                            {(doc?._count?.annotations ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {doc._count.annotations}
                              </span>
                            )}
                            {(doc?._count?.readingSessions ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {doc._count.readingSessions} sessions
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </HoverLift>
                  </StaggerItem>
                )
              })}
            </div>
          </Stagger>
        )}
      </main>

      {/* Edit Document Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(o: boolean) => { if (!o) setEditDoc(null) }}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update the title and author for this document.</DialogDescription>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => {
          setShowUpload(false)
          fetchDocuments()
        }}
      />
    </div>
  )
}
