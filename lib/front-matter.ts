/**
 * Heuristic-based front matter detection for books.
 * Attempts to find where the actual reading content starts.
 */

const FRONT_MATTER_PATTERNS = [
  // Common front matter section headers
  /^(copyright|all rights reserved|published by|isbn|library of congress)/i,
  /^(table of contents|contents|toc)$/i,
  /^(dedication|acknowledgments?|acknowledgements?|foreword|preface|prologue|introduction)$/i,
  /^(title page|half title|cover|frontispiece)$/i,
  /^(first published|first edition|printed in|typeset)/i,
  /^(editor|translator|illustrator|designer)\s*:/i,
]

const CHAPTER_START_PATTERNS = [
  /^chapter\s+(one|1|i)\b/i,
  /^part\s+(one|1|i)\b/i,
  /^(chapter|section)\s+\d/i,
  /^\d+\.\s+\w/,  // "1. Something"
  /^(once upon a time|in the beginning|it was|the |a |an |i )/i,
]

const JUNK_LINE_PATTERNS = [
  /^\s*$/,
  /^\*{3,}$/,
  /^-{3,}$/,
  /^_{3,}$/,
  /^page\s+\d+/i,
  /^\d+$/,
]

/**
 * Detect the word index where actual content likely begins.
 * Returns 0 if no front matter is detected.
 */
export function detectFrontMatterEnd(text: string): number {
  const lines = text.split('\n')
  const words = text.split(/\s+/).filter(w => w.length > 0)
  
  if (words.length < 100) return 0 // Too short to have meaningful front matter

  let wordIndex = 0
  let lastFrontMatterWordEnd = 0
  let inFrontMatter = true
  let consecutiveContentLines = 0
  
  for (let i = 0; i < lines.length && i < 200; i++) {
    const line = lines[i].trim()
    const lineWords = line.split(/\s+/).filter(w => w.length > 0)
    
    if (JUNK_LINE_PATTERNS.some(p => p.test(line))) {
      wordIndex += lineWords.length
      continue
    }
    
    // Check if this line looks like front matter
    const isFrontMatter = FRONT_MATTER_PATTERNS.some(p => p.test(line))
    
    // Check if this looks like a chapter start
    const isChapterStart = CHAPTER_START_PATTERNS.some(p => p.test(line))
    
    if (isChapterStart) {
      return wordIndex
    }
    
    if (isFrontMatter) {
      inFrontMatter = true
      consecutiveContentLines = 0
      lastFrontMatterWordEnd = wordIndex + lineWords.length
    } else if (line.length > 50) {
      // A long line is likely real content
      consecutiveContentLines++
      if (consecutiveContentLines >= 3 && inFrontMatter) {
        // Found 3+ consecutive content lines after front matter
        return wordIndex
      }
    }
    
    wordIndex += lineWords.length
  }
  
  // If we detected front matter, skip past it
  if (lastFrontMatterWordEnd > 0 && lastFrontMatterWordEnd < words.length * 0.15) {
    return lastFrontMatterWordEnd
  }
  
  return 0
}

/**
 * Get a preview of text around a word index for display.
 */
export function getTextPreview(text: string, wordIndex: number, wordCount: number = 20): string {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const start = Math.max(0, wordIndex)
  const end = Math.min(words.length, start + wordCount)
  return words.slice(start, end).join(' ')
}
