'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Plus, Search, FileText, Tag, Trash2, Edit3, Upload, BookOpen,
  RotateCcw, ChevronRight, Folder, StickyNote, Layers, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  color: string
  _count?: { notes: number; flashcards: number }
}

interface NoteItem {
  id: string
  title: string
  content: string
  categoryId: string | null
  category: Category | null
  storagePath: string
  createdAt: string
  updatedAt: string
}

interface FlashcardItem {
  id: string
  front: string
  back: string
  categoryId: string | null
  category: Category | null
  createdAt: string
}

export function NotesView() {
  const [tab, setTab] = useState<'notes' | 'flashcards' | 'categories'>('notes')
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')

  // Dialogs
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showFlashcardDialog, setShowFlashcardDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null)
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  // Form state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteCategoryId, setNoteCategoryId] = useState<string>('')
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [fcCategoryId, setFcCategoryId] = useState<string>('')
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#7C3AED')
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [catRes, notesRes, fcRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/notes'),
        fetch('/api/flashcards'),
      ])
      if (catRes.ok) setCategories(await catRes.json())
      if (notesRes.ok) setNotes(await notesRes.json())
      if (fcRes.ok) setFlashcards(await fcRes.json())
    } catch (e) {
      console.error('Failed to fetch notes data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // --- Category CRUD ---
  const saveCategory = async () => {
    if (!catName.trim()) return
    setSaving(true)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName.trim(), color: catColor }),
        })
        if (!res.ok) throw new Error('Failed to update category')
        toast.success('Category updated')
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName.trim(), color: catColor }),
        })
        if (!res.ok) throw new Error('Failed to create category')
        toast.success('Category created')
      }
      setShowCategoryDialog(false)
      setCatName('')
      setCatColor('#7C3AED')
      setEditingCategory(null)
      fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Error saving category')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      toast.success('Category deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  // --- Note CRUD ---
  const saveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return
    setSaving(true)
    try {
      const body: any = {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        categoryId: noteCategoryId || null,
      }
      if (editingNote) {
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to update note')
        toast.success('Note updated')
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to create note')
        toast.success('Note created')
      }
      closeNoteDialog()
      fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Error saving note')
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' })
      toast.success('Note deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete note')
    }
  }

  // --- Upload notes from file ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (noteCategoryId) formData.append('categoryId', noteCategoryId)
      const res = await fetch('/api/notes/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Failed to upload note file')
      toast.success('Note imported from file')
      setShowUploadDialog(false)
      setNoteCategoryId('')
      fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Error uploading file')
    } finally {
      setSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // --- Flashcard CRUD ---
  const saveFlashcard = async () => {
    if (!fcFront.trim() || !fcBack.trim()) return
    setSaving(true)
    try {
      const body: any = {
        front: fcFront.trim(),
        back: fcBack.trim(),
        categoryId: fcCategoryId || null,
      }
      if (editingFlashcard) {
        const res = await fetch(`/api/flashcards/${editingFlashcard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to update flashcard')
        toast.success('Flashcard updated')
      } else {
        const res = await fetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to create flashcard')
        toast.success('Flashcard created')
      }
      closeFlashcardDialog()
      fetchAll()
    } catch (e: any) {
      toast.error(e?.message || 'Error saving flashcard')
    } finally {
      setSaving(false)
    }
  }

  const deleteFlashcard = async (id: string) => {
    try {
      await fetch(`/api/flashcards/${id}`, { method: 'DELETE' })
      toast.success('Flashcard deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete flashcard')
    }
  }

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- Dialog helpers ---
  const openNewNote = () => {
    setEditingNote(null)
    setNoteTitle('')
    setNoteContent('')
    setNoteCategoryId('')
    setShowNoteDialog(true)
  }
  const openEditNote = (n: NoteItem) => {
    setEditingNote(n)
    setNoteTitle(n.title)
    setNoteContent(n.content)
    setNoteCategoryId(n.categoryId || '')
    setShowNoteDialog(true)
  }
  const closeNoteDialog = () => {
    setShowNoteDialog(false)
    setEditingNote(null)
    setNoteTitle('')
    setNoteContent('')
    setNoteCategoryId('')
  }
  const openNewFlashcard = () => {
    setEditingFlashcard(null)
    setFcFront('')
    setFcBack('')
    setFcCategoryId('')
    setShowFlashcardDialog(true)
  }
  const openEditFlashcard = (fc: FlashcardItem) => {
    setEditingFlashcard(fc)
    setFcFront(fc.front)
    setFcBack(fc.back)
    setFcCategoryId(fc.categoryId || '')
    setShowFlashcardDialog(true)
  }
  const closeFlashcardDialog = () => {
    setShowFlashcardDialog(false)
    setEditingFlashcard(null)
    setFcFront('')
    setFcBack('')
    setFcCategoryId('')
  }
  const openNewCategory = () => {
    setEditingCategory(null)
    setCatName('')
    setCatColor('#7C3AED')
    setShowCategoryDialog(true)
  }
  const openEditCategory = (c: Category) => {
    setEditingCategory(c)
    setCatName(c.name)
    setCatColor(c.color)
    setShowCategoryDialog(true)
  }

  // --- Filtering ---
  const filteredNotes = notes.filter(n => {
    const matchSearch = search === '' ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || n.categoryId === filterCat
    return matchSearch && matchCat
  })

  const filteredFlashcards = flashcards.filter(fc => {
    const matchSearch = search === '' ||
      fc.front.toLowerCase().includes(search.toLowerCase()) ||
      fc.back.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'all' || fc.categoryId === filterCat
    return matchSearch && matchCat
  })

  const COLOR_PRESETS = ['#7C3AED', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6']

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6 sm:py-8">
        <FadeIn>
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Notes & <span className="text-primary">Flashcards</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create notes, import from files, and study with flashcards.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Tabs value={tab} onValueChange={(v: string) => setTab(v as any)} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="notes" className="gap-2">
                  <StickyNote className="h-4 w-4" />
                  Notes
                  {notes.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{notes.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="gap-2">
                  <Layers className="h-4 w-4" />
                  Flashcards
                  {flashcards.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{flashcards.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2">
                  <Folder className="h-4 w-4" />
                  Categories
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {tab === 'notes' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setShowUploadDialog(true)} className="gap-1 touch-manipulation">
                      <Upload className="h-3.5 w-3.5" /> Import
                    </Button>
                    <Button size="sm" onClick={openNewNote} className="gap-1 touch-manipulation">
                      <Plus className="h-3.5 w-3.5" /> New Note
                    </Button>
                  </>
                )}
                {tab === 'flashcards' && (
                  <Button size="sm" onClick={openNewFlashcard} className="gap-1 touch-manipulation">
                    <Plus className="h-3.5 w-3.5" /> New Flashcard
                  </Button>
                )}
                {tab === 'categories' && (
                  <Button size="sm" onClick={openNewCategory} className="gap-1 touch-manipulation">
                    <Plus className="h-3.5 w-3.5" /> New Category
                  </Button>
                )}
              </div>
            </div>

            {/* Search & filter bar */}
            {(tab === 'notes' || tab === 'flashcards') && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={tab === 'notes' ? 'Search notes...' : 'Search flashcards...'}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Select value={filterCat} onValueChange={setFilterCat}>
                  <SelectTrigger className="w-full sm:w-48 h-10">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* NOTES TAB */}
            <TabsContent value="notes" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <StickyNote className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No notes yet. Create one or import from a file.</p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredNotes.map(note => (
                    <Card key={note.id} className="group relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm truncate">{note.title}</h3>
                            {note.category && (
                              <Badge variant="outline" className="mt-1 text-xs" style={{ borderColor: note.category.color, color: note.category.color }}>
                                {note.category.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEditNote(note)} className="h-8 w-8">
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete note?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{note.title}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteNote(note.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-2">
                          {new Date(note.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* FLASHCARDS TAB */}
            <TabsContent value="flashcards" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredFlashcards.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No flashcards yet. Create your first one.</p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredFlashcards.map(fc => (
                    <Card
                      key={fc.id}
                      className="cursor-pointer group relative min-h-[140px] transition-all"
                      onClick={() => toggleFlip(fc.id)}
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            {flippedCards.has(fc.id) ? 'Answer' : 'Question'}
                          </Badge>
                          <div className="flex gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon-sm" onClick={() => openEditFlashcard(fc)} className="h-7 w-7">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete flashcard?</AlertDialogTitle>
                                  <AlertDialogDescription>This flashcard will be permanently deleted.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteFlashcard(fc.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-sm text-center whitespace-pre-wrap">
                            {flippedCards.has(fc.id) ? fc.back : fc.front}
                          </p>
                        </div>
                        {fc.category && (
                          <Badge variant="outline" className="mt-2 text-[10px] self-start" style={{ borderColor: fc.category.color, color: fc.category.color }}>
                            {fc.category.name}
                          </Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground/50 mt-1">Tap to flip</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* CATEGORIES TAB */}
            <TabsContent value="categories" className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Folder className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No categories yet. Create one to organize your notes.</p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map(cat => (
                    <Card key={cat.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: cat.color }} />
                            <div>
                              <h3 className="font-semibold text-sm">{cat.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {cat._count?.notes ?? 0} notes · {cat._count?.flashcards ?? 0} cards
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEditCategory(cat)} className="h-8 w-8">
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete category "{cat.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>Notes and flashcards in this category will be uncategorized.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCategory(cat.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </FadeIn>
      </main>

      {/* NOTE DIALOG */}
      <Dialog open={showNoteDialog} onOpenChange={(o: boolean) => { if (!o) closeNoteDialog() }}>
        <DialogContent className="sm:max-w-lg max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
            <DialogDescription>Write or paste your note content below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={noteTitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteTitle(e.target.value)} placeholder="Note title..." />
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea value={noteContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteContent(e.target.value)} placeholder="Write your note..." rows={8} />
            </div>
            <div className="space-y-1">
              <Label>Category (optional)</Label>
              <Select value={noteCategoryId} onValueChange={setNoteCategoryId}>
                <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeNoteDialog}>Cancel</Button>
            <Button onClick={saveNote} disabled={saving || !noteTitle.trim() || !noteContent.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingNote ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FLASHCARD DIALOG */}
      <Dialog open={showFlashcardDialog} onOpenChange={(o: boolean) => { if (!o) closeFlashcardDialog() }}>
        <DialogContent className="sm:max-w-lg max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editingFlashcard ? 'Edit Flashcard' : 'New Flashcard'}</DialogTitle>
            <DialogDescription>Enter the question (front) and answer (back).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Front (Question)</Label>
              <Textarea value={fcFront} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFcFront(e.target.value)} placeholder="Question..." rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Back (Answer)</Label>
              <Textarea value={fcBack} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFcBack(e.target.value)} placeholder="Answer..." rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Category (optional)</Label>
              <Select value={fcCategoryId} onValueChange={setFcCategoryId}>
                <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFlashcardDialog}>Cancel</Button>
            <Button onClick={saveFlashcard} disabled={saving || !fcFront.trim() || !fcBack.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingFlashcard ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CATEGORY DIALOG */}
      <Dialog open={showCategoryDialog} onOpenChange={(o: boolean) => { if (!o) { setShowCategoryDialog(false); setEditingCategory(null) } }}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>Give your category a name and color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={catName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCatName(e.target.value)} placeholder="Category name..." />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setCatColor(c)}
                    className={`h-8 w-8 rounded-full transition-all ${catColor === c ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <Input
                  type="color"
                  value={catColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCatColor(e.target.value)}
                  className="h-8 w-12 p-0.5 cursor-pointer"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCategoryDialog(false); setEditingCategory(null) }}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving || !catName.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPLOAD DIALOG */}
      <Dialog open={showUploadDialog} onOpenChange={(o: boolean) => { if (!o) setShowUploadDialog(false) }}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Import Note from File</DialogTitle>
            <DialogDescription>Upload a .txt or .md file to create a note.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Category (optional)</Label>
              <Select value={noteCategoryId} onValueChange={setNoteCategoryId}>
                <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 touch-manipulation"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Tap to select a .txt or .md file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
