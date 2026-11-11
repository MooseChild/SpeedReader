'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RsvpReaderProps {
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

function getOptimalRecognitionPoint(word: string): number {
  const len = word?.length ?? 0
  if (len <= 1) return 0
  if (len <= 5) return 1
  if (len <= 9) return 2
  if (len <= 13) return 3
  return 4
}

export function RsvpReader({
  words, currentIndex, isPlaying, wpm, fontSize, onWordAdvance, annotations,
}: RsvpReaderProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentWord = words?.[currentIndex] ?? ''
  const orp = getOptimalRecognitionPoint(currentWord)

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

  // Stop at end
  useEffect(() => {
    if (currentIndex >= (words?.length ?? 0) - 1 && isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentIndex, words, isPlaying])

  // Check if current word is annotated
  const annotation = (annotations ?? []).find(
    (a: any) => currentIndex >= (a?.startIndex ?? -1) && currentIndex <= (a?.endIndex ?? -1)
  )

  const beforeOrp = currentWord?.substring(0, orp) ?? ''
  const orpChar = currentWord?.[orp] ?? ''
  const afterOrp = currentWord?.substring(orp + 1) ?? ''

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      {/* Focus guide lines */}
      <div className="relative w-full max-w-lg">
        {/* Top guide line */}
        <div className="absolute left-1/2 -translate-x-px top-0 w-0.5 h-4 bg-primary/30" />

        <div
          className="flex items-center justify-center py-12 px-4"
          style={{ minHeight: fontSize ? fontSize * 3 : 96 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${currentWord}`}
              initial={{ opacity: 0.3, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.05 }}
              className="font-mono select-none"
              style={{
                fontSize: `${fontSize ?? 32}px`,
                lineHeight: 1.2,
                backgroundColor: annotation?.color ? `${annotation.color}33` : undefined,
                borderRadius: annotation ? '4px' : undefined,
                padding: annotation ? '2px 6px' : undefined,
              }}
            >
              <span className="text-muted-foreground">{beforeOrp}</span>
              <span className="text-primary font-bold">{orpChar}</span>
              <span className="text-foreground">{afterOrp}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom guide line */}
        <div className="absolute left-1/2 -translate-x-px bottom-0 w-0.5 h-4 bg-primary/30" />
      </div>

      {/* Context preview */}
      <div className="mt-6 text-center max-w-lg">
        <p className="text-xs text-muted-foreground/50 leading-relaxed">
          {(words ?? []).slice(Math.max(0, currentIndex - 5), currentIndex).join(' ')}
          <span className="text-primary font-medium"> {currentWord} </span>
          {(words ?? []).slice(currentIndex + 1, currentIndex + 6).join(' ')}
        </p>
      </div>
    </div>
  )
}
