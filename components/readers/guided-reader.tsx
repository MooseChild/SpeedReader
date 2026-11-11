'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface GuidedReaderProps {
  words: string[]
  currentIndex: number
  isPlaying: boolean
  wpm: number
  chunkSize: number
  fontSize: number
  onWordAdvance: (newIndex: number) => void
  annotations: Array<{ startIndex: number; endIndex: number; color: string }>
  readingStartIndex?: number
}

export function GuidedReader({
  words, currentIndex, isPlaying, wpm, fontSize, onWordAdvance, annotations,
}: GuidedReaderProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map())

  // Show a window of words around current position
  const windowSize = 100
  const windowStart = Math.max(0, currentIndex - 20)
  const windowEnd = Math.min((words?.length ?? 0), windowStart + windowSize)
  const visibleWords = (words ?? []).slice(windowStart, windowEnd)

  useEffect(() => {
    if (isPlaying && (words?.length ?? 0) > 0) {
      const msPerWord = Math.round(60000 / (wpm ?? 250))
      intervalRef.current = setInterval(() => {
        onWordAdvance(currentIndex + 1)
      }, msPerWord)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, wpm, currentIndex, onWordAdvance, words])

  useEffect(() => {
    if (currentIndex >= (words?.length ?? 0) - 1 && isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentIndex, words, isPlaying])

  // Auto-scroll to current word
  useEffect(() => {
    const el = wordRefs.current?.get?.(currentIndex)
    if (el) {
      el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    }
  }, [currentIndex])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl overflow-y-auto max-h-[400px] rounded-xl bg-card p-6 border border-border/50"
        style={{ fontSize: `${Math.max(14, (fontSize ?? 32) * 0.5)}px`, lineHeight: 2 }}
      >
        {/* Guide line overlay */}
        <div className="sticky top-1/2 left-0 right-0 h-px bg-primary/20 pointer-events-none z-10" />

        <div className="relative z-0 leading-loose">
          {(visibleWords ?? []).map((word: string, i: number) => {
            const wordIdx = windowStart + i
            const isCurrent = wordIdx === currentIndex
            const isPast = wordIdx < currentIndex
            const annotation = (annotations ?? []).find(
              (a: any) => wordIdx >= (a?.startIndex ?? -1) && wordIdx <= (a?.endIndex ?? -1)
            )

            return (
              <span
                key={`${wordIdx}-${word}`}
                ref={(el: HTMLSpanElement | null) => {
                  if (el) wordRefs.current?.set?.(wordIdx, el)
                }}
                className={`inline transition-all duration-150 ${
                  isCurrent
                    ? 'text-primary font-bold scale-105'
                    : isPast
                    ? 'text-muted-foreground/40'
                    : 'text-foreground/70'
                }`}
                style={{
                  backgroundColor: isCurrent
                    ? 'hsl(var(--primary) / 0.15)'
                    : annotation?.color
                    ? `${annotation.color}33`
                    : undefined,
                  borderRadius: isCurrent || annotation ? '4px' : undefined,
                  padding: isCurrent || annotation ? '1px 3px' : undefined,
                }}
              >
                {word ?? ''}{' '}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
