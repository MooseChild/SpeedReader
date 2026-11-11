'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChunkReaderProps {
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

export function ChunkReader({
  words, currentIndex, isPlaying, wpm, chunkSize, fontSize, onWordAdvance, annotations,
}: ChunkReaderProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const safeChunkSize = chunkSize ?? 3
  const chunk = (words ?? []).slice(currentIndex, currentIndex + safeChunkSize)

  useEffect(() => {
    if (isPlaying && (words?.length ?? 0) > 0) {
      const msPerChunk = Math.round((60000 / (wpm ?? 250)) * safeChunkSize)
      intervalRef.current = setInterval(() => {
        const nextIndex = currentIndex + safeChunkSize
        if (nextIndex < (words?.length ?? 0)) {
          onWordAdvance(nextIndex)
        }
      }, msPerChunk)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, wpm, currentIndex, onWordAdvance, words, safeChunkSize])

  useEffect(() => {
    if (currentIndex >= (words?.length ?? 0) - 1 && isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentIndex, words, isPlaying])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative w-full max-w-2xl">
        <div
          className="flex items-center justify-center py-12 px-4"
          style={{ minHeight: fontSize ? fontSize * 3 : 96 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`chunk-${currentIndex}`}
              initial={{ opacity: 0.3, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.08 }}
              className="font-sans select-none text-center"
              style={{ fontSize: `${fontSize ?? 32}px`, lineHeight: 1.4 }}
            >
              {(chunk ?? []).map((word: string, i: number) => {
                const wordIdx = currentIndex + i
                const annotation = (annotations ?? []).find(
                  (a: any) => wordIdx >= (a?.startIndex ?? -1) && wordIdx <= (a?.endIndex ?? -1)
                )
                return (
                  <span
                    key={`${wordIdx}-${word}`}
                    className={i === Math.floor(safeChunkSize / 2) ? 'text-primary font-semibold' : 'text-foreground'}
                    style={{
                      backgroundColor: annotation?.color ? `${annotation.color}33` : undefined,
                      borderRadius: annotation ? '4px' : undefined,
                      padding: annotation ? '1px 3px' : undefined,
                    }}
                  >
                    {word ?? ''}{i < (chunk?.length ?? 0) - 1 ? ' ' : ''}
                  </span>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Context */}
      <div className="mt-6 text-center max-w-lg">
        <p className="text-xs text-muted-foreground/50 leading-relaxed">
          ...{(words ?? []).slice(Math.max(0, currentIndex - 8), currentIndex).join(' ')}
          <span className="text-primary/60"> [{(chunk ?? []).join(' ')}] </span>
          {(words ?? []).slice(currentIndex + safeChunkSize, currentIndex + safeChunkSize + 8).join(' ')}...
        </p>
      </div>
    </div>
  )
}
