'use client'

import { useRef, useEffect, useCallback } from 'react'

interface NormalReaderProps {
  words: string[]
  currentIndex: number
  isPlaying?: boolean
  wpm?: number
  chunkSize?: number
  fontSize: number
  onWordAdvance: (index: number) => void
  annotations: { startIndex: number; endIndex: number; color: string }[]
  readingStartIndex?: number
}

export function NormalReader({ words, currentIndex, fontSize, onWordAdvance, annotations, readingStartIndex = 0 }: NormalReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentWordRef = useRef<HTMLSpanElement>(null)
  const isScrollingRef = useRef(false)

  // Scroll to current word on mount
  useEffect(() => {
    if (currentWordRef.current && !isScrollingRef.current) {
      currentWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentIndex])

  const getAnnotationColor = useCallback((idx: number): string | null => {
    for (const ann of annotations ?? []) {
      if (idx >= ann.startIndex && idx <= ann.endIndex) return ann.color
    }
    return null
  }, [annotations])

  // Reconstruct paragraphs from words
  const text = words.join(' ')
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim())
  
  let globalWordIndex = 0

  const handleWordClick = (idx: number) => {
    onWordAdvance(idx)
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-h-[60vh] sm:max-h-[65vh] overflow-y-auto rounded-xl bg-card/50 p-4 sm:p-8 scroll-smooth"
      style={{ fontSize: `${Math.max(14, Math.min(fontSize * 0.6, 24))}px` }}
    >
      {paragraphs.map((para, pIdx) => {
        const paraWords = para.split(/\s+/).filter(w => w.length > 0)
        const startIdx = globalWordIndex
        globalWordIndex += paraWords.length

        return (
          <p key={pIdx} className="mb-4 leading-relaxed text-foreground/90">
            {paraWords.map((word, wIdx) => {
              const absIdx = startIdx + wIdx
              const isCurrent = absIdx === currentIndex
              const isBeforeStart = absIdx < readingStartIndex
              const annColor = getAnnotationColor(absIdx)

              return (
                <span
                  key={absIdx}
                  ref={isCurrent ? currentWordRef : undefined}
                  onClick={() => handleWordClick(absIdx)}
                  className={`cursor-pointer transition-colors inline ${
                    isCurrent
                      ? 'bg-primary/20 text-primary font-semibold rounded px-0.5'
                      : isBeforeStart
                        ? 'text-muted-foreground/40'
                        : 'hover:bg-accent/30'
                  }`}
                  style={annColor ? { backgroundColor: `${annColor}33` } : undefined}
                >
                  {word}{' '}
                </span>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}
