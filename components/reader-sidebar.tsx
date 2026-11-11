'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookMarked, MessageSquare, X, Trash2, MapPin
} from 'lucide-react'

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

interface ReaderSidebarProps {
  bookmarks: BookmarkItem[]
  annotations: AnnotationItem[]
  onJumpTo: (index: number) => void
  onRemoveBookmark: (id: string) => void
  onRemoveAnnotation: (id: string) => void
  onAddAnnotation: (startIdx: number, endIdx: number, note: string, color: string) => void
  currentIndex: number
  words: string[]
  onClose: () => void
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD']

export function ReaderSidebar({
  bookmarks, annotations, onJumpTo, onRemoveBookmark, onRemoveAnnotation,
  onAddAnnotation, currentIndex, words, onClose,
}: ReaderSidebarProps) {
  const [annotNote, setAnnotNote] = useState('')
  const [annotColor, setAnnotColor] = useState(COLORS[0] ?? '#FFD700')
  const [annotRange, setAnnotRange] = useState(5)

  const handleAddAnnotation = () => {
    const endIdx = Math.min(currentIndex + annotRange, (words?.length ?? 1) - 1)
    onAddAnnotation(currentIndex, endIdx, annotNote, annotColor)
    setAnnotNote('')
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-[320px] md:w-80 md:relative md:top-auto md:bottom-auto z-50 md:z-auto border-l border-border/40 bg-card flex flex-col h-full md:h-[calc(100vh-3.5rem)]">
        <div className="flex items-center justify-between p-3 border-b border-border/40">
          <h3 className="font-display text-sm font-semibold">Notes & Bookmarks</h3>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="touch-manipulation min-h-[44px] min-w-[44px]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="bookmarks" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2">
            <TabsTrigger value="bookmarks" className="gap-1.5 text-xs touch-manipulation">
              <BookMarked className="h-3 w-3" />
              Bookmarks ({(bookmarks?.length ?? 0)})
            </TabsTrigger>
            <TabsTrigger value="annotations" className="gap-1.5 text-xs touch-manipulation">
              <MessageSquare className="h-3 w-3" />
              Notes ({(annotations?.length ?? 0)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {(bookmarks?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No bookmarks yet. Tap the bookmark button to save your position.
                  </p>
                ) : (
                  (bookmarks ?? []).map((bm: BookmarkItem) => (
                    <div
                      key={bm?.id ?? ''}
                      className="flex items-center gap-2 rounded-lg border border-border/50 p-3 hover:bg-accent/50 active:bg-accent/70 transition-colors cursor-pointer touch-manipulation"
                      onClick={() => onJumpTo(bm?.wordIndex ?? 0)}
                    >
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bm?.label ?? ''}</p>
                        <p className="text-xs text-muted-foreground">
                          Word {(bm?.wordIndex ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 touch-manipulation min-h-[40px] min-w-[40px]"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          onRemoveBookmark(bm?.id ?? '')
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="annotations" className="flex-1 mt-0 flex flex-col overflow-hidden">
            {/* Add annotation form */}
            <div className="p-3 border-b border-border/40 space-y-2">
              <Label className="text-xs">Add note at current position</Label>
              <Input
                placeholder="Write a note..."
                value={annotNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnotNote(e?.target?.value ?? '')}
                className="text-sm h-10"
              />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Color:</Label>
                <div className="flex gap-1.5">
                  {(COLORS ?? []).map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setAnnotColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all touch-manipulation ${
                        annotColor === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Range:</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={annotRange}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnnotRange(parseInt(e?.target?.value ?? '5') || 5)
                  }
                  className="w-20 text-sm h-10"
                />
                <span className="text-xs text-muted-foreground">words</span>
              </div>
              <Button size="sm" onClick={handleAddAnnotation} className="w-full text-sm h-10 touch-manipulation" disabled={!annotNote}>
                Add Note
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {(annotations?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No annotations yet.
                  </p>
                ) : (
                  (annotations ?? []).map((ann: AnnotationItem) => (
                    <div
                      key={ann?.id ?? ''}
                      className="rounded-lg border border-border/50 p-3 hover:bg-accent/50 active:bg-accent/70 transition-colors cursor-pointer touch-manipulation"
                      onClick={() => onJumpTo(ann?.startIndex ?? 0)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: ann?.color ?? '#FFD700' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            &quot;{ann?.text ?? ''}&quot;
                          </p>
                          {(ann?.note ?? '') && (
                            <p className="text-sm font-medium mt-1">{ann.note}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Words {ann?.startIndex ?? 0}-{ann?.endIndex ?? 0}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 touch-manipulation min-h-[40px] min-w-[40px]"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            onRemoveAnnotation(ann?.id ?? '')
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
