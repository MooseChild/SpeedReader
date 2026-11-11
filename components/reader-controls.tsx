'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Play, Pause, SkipBack, SkipForward, BookmarkPlus,
  Gauge, Type, Layers, ChevronLeft, ChevronRight, SkipForward as SkipFwd
} from 'lucide-react'
import { ReadingTechnique } from '@/components/reader-view'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface ReaderControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  wpm: number
  onWpmChange: (v: number) => void
  technique: ReadingTechnique
  onTechniqueChange: (t: ReadingTechnique) => void
  chunkSize: number
  onChunkSizeChange: (v: number) => void
  fontSize: number
  onFontSizeChange: (v: number) => void
  currentIndex: number
  totalWords: number
  onSeek: (index: number) => void
  onBookmark: () => void
  onSetReadingStart?: () => void
  readingStartIndex?: number
  progress: number
}

const techniques: { value: ReadingTechnique; label: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', icon: '📖' },
  { value: 'rsvp', label: 'RSVP', icon: '⚡' },
  { value: 'chunk', label: 'Chunking', icon: '📦' },
  { value: 'guided', label: 'Guided', icon: '👁️' },
  { value: 'highlight', label: 'Highlight', icon: '🔦' },
]

export function ReaderControls({
  isPlaying, onPlayPause, wpm, onWpmChange,
  technique, onTechniqueChange, chunkSize, onChunkSizeChange,
  fontSize, onFontSizeChange, currentIndex, totalWords,
  onSeek, onBookmark, onSetReadingStart, readingStartIndex, progress,
}: ReaderControlsProps) {
  return (
    <div className="border-t border-border/40 bg-background/80 backdrop-blur-xl safe-area-bottom">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress ?? 0}%` }}
        />
      </div>

      <div className="mx-auto max-w-[1200px] px-2 sm:px-4 py-2 sm:py-3">
        {/* Main controls row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onSeek(Math.max(0, currentIndex - 50))}
              className="touch-manipulation min-h-[44px] min-w-[44px] hidden sm:flex"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onSeek(Math.max(0, currentIndex - 10))}
              className="touch-manipulation min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              size="sm"
              onClick={onPlayPause}
              className="gap-2 min-w-[80px] sm:min-w-[90px] h-11 sm:h-9 touch-manipulation text-base sm:text-sm"
            >
              {isPlaying ? (
                <><Pause className="h-5 w-5 sm:h-4 sm:w-4" /> Pause</>
              ) : (
                <><Play className="h-5 w-5 sm:h-4 sm:w-4" /> Play</>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onSeek(Math.min((totalWords ?? 1) - 1, currentIndex + 10))}
              className="touch-manipulation min-h-[44px] min-w-[44px]"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onSeek(Math.min((totalWords ?? 1) - 1, currentIndex + 50))}
              className="touch-manipulation min-h-[44px] min-w-[44px] hidden sm:flex"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Position info */}
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">
              {(currentIndex ?? 0).toLocaleString()} / {(totalWords ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Settings controls */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Technique selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-xs touch-manipulation min-h-[44px] px-2 sm:px-3">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {(techniques ?? []).find((t: any) => t?.value === technique)?.label ?? 'RSVP'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground px-2">Reading Technique</Label>
                  {(techniques ?? []).map((t: any) => (
                    <button
                      key={t?.value ?? ''}
                      onClick={() => onTechniqueChange(t?.value ?? 'rsvp')}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors touch-manipulation ${
                        technique === t?.value
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-accent active:bg-accent/80'
                      }`}
                    >
                      <span>{t?.icon ?? ''}</span>
                      <span>{t?.label ?? ''}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* WPM control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-xs touch-manipulation min-h-[44px] px-2 sm:px-3">
                  <Gauge className="h-4 w-4" />
                  <span className="font-mono">{wpm ?? 250}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-64 p-4" align="end">
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Words Per Minute</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[wpm ?? 250]}
                      onValueChange={(v: number[]) => onWpmChange(v?.[0] ?? 250)}
                      min={50}
                      max={1000}
                      step={10}
                      className="flex-1"
                    />
                    <span className="font-mono text-sm w-12 text-right">{wpm ?? 250}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[100, 200, 300, 400, 500].map((v: number) => (
                      <Button
                        key={v}
                        variant={wpm === v ? 'default' : 'outline'}
                        size="xs"
                        onClick={() => onWpmChange(v)}
                        className="flex-1 text-xs min-h-[40px] touch-manipulation"
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Font size & chunk size */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="touch-manipulation min-h-[44px] min-w-[44px]">
                  <Type className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-64 p-4" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Font Size</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[fontSize ?? 32]}
                        onValueChange={(v: number[]) => onFontSizeChange(v?.[0] ?? 32)}
                        min={16}
                        max={72}
                        step={2}
                        className="flex-1"
                      />
                      <span className="font-mono text-sm w-10 text-right">{fontSize ?? 32}px</span>
                    </div>
                  </div>
                  {technique === 'chunk' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Words per chunk</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[chunkSize ?? 3]}
                          onValueChange={(v: number[]) => onChunkSizeChange(v?.[0] ?? 3)}
                          min={2}
                          max={7}
                          step={1}
                          className="flex-1"
                        />
                        <span className="font-mono text-sm w-6 text-right">{chunkSize ?? 3}</span>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Set reading start */}
            {onSetReadingStart && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="touch-manipulation min-h-[44px] min-w-[44px]">
                    <SkipFwd className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Front-matter Skip</Label>
                    <p className="text-xs">Set current position as the reading start point (skips front-matter).</p>
                    {(readingStartIndex ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">Current start: word {readingStartIndex}</p>
                    )}
                    <Button size="sm" onClick={onSetReadingStart} className="w-full text-xs">
                      Set start at word {currentIndex}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Bookmark */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBookmark}
              className="touch-manipulation min-h-[44px] min-w-[44px]"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Seek bar - larger touch target on mobile */}
        <div className="mt-2 py-1">
          <Slider
            value={[currentIndex ?? 0]}
            onValueChange={(v: number[]) => onSeek(v?.[0] ?? 0)}
            min={0}
            max={Math.max(1, (totalWords ?? 1) - 1)}
            step={1}
            className="w-full"
          />
        </div>

        {/* Mobile position info */}
        <div className="flex md:hidden items-center justify-center text-[11px] text-muted-foreground mt-1">
          <span className="font-mono">
            {(currentIndex ?? 0).toLocaleString()} / {(totalWords ?? 0).toLocaleString()} words
          </span>
        </div>
      </div>
    </div>
  )
}
