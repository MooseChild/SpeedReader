'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface HighlightReaderProps {
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

export function HighlightReader({
  words, currentIndex, isPlaying, wpm, fontSize, onWordAdvance, annotations,
}: HighlightReaderProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map())

  // Display a paragraph window
  const lineWords = 12
  const linesVisible = 6
  const wordsPerPage = lineWords * linesVisible
  const pageStart = Math.max(0, currentIndex - Math.floor(wordsPerPage / 3))
  const pageEnd = Math.min((words?.length ?? 0), pageStart + wordsPerPage)
  const visibleWords = (words ?? []).slice(pageStart, pageEnd)

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

  // Keep current word visible
  useEffect(() => {
    const el = wordRefs.current?.get?.(currentIndex)
    if (el) {
      el.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentIndex])

  const focusSize = Math.max(16, (fontSize ?? 32) * 0.55)

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl rounded-xl bg-card p-6 sm:p-8 border border-border/50"
        style={{ fontSize: `${focusSize}px`, lineHeight: 2.2 }}
      >
        <div className="text-center leading-loose">
          {(visibleWords ?? []).map((word: string, i: number) => {
            const wordIdx = pageStart + i
            const isCurrent = wordIdx === currentIndex
            const distance = Math.abs(wordIdx - currentIndex)
            const annotation = (annotations ?? []).find(
              (a: any) => wordIdx >= (a?.startIndex ?? -1) && wordIdx <= (a?.endIndex ?? -1)
            )

            let opacity = 1
            if (distance > 0) {
              opacity = Math.max(0.2, 1 - distance * 0.08)
            }

            return (
              <span
                key={`${wordIdx}-${word}`}
                ref={(el: HTMLSpanElement | null) => {
                  if (el) wordRefs.current?.set?.(wordIdx, el)
                }}
                className={`inline-block transition-all duration-200 ${
                  isCurrent ? 'text-primary font-bold' : ''
                }`}
                style={{
                  opacity,
                  transform: isCurrent ? `scale(1.3)` : `scale(1)`,
                  backgroundColor: isCurrent
                    ? 'hsl(var(--primary) / 0.2)'
                    : annotation?.color
                    ? `${annotation.color}33`
                    : undefined,
                  borderRadius: isCurrent || annotation ? '6px' : undefined,
                  padding: '1px 4px',
                  margin: '0 1px',
                }}
              >
                {word ?? ''}
              </span>
            )
          })}
        </div>

        {/* Focus point indicator */}
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  )
}
