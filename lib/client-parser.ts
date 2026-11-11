'use client'

/**
 * Client-side file parser using pdfjs-dist and epubjs.
 * Runs entirely in the browser — no server API calls needed.
 */

export async function parseFileClient(file: File): Promise<{ text: string; wordCount: number }> {
  const fileName = file?.name ?? 'unknown'
  const ext = fileName?.split('.')?.pop()?.toLowerCase?.() ?? ''

  let text = ''

  if (['txt', 'md', 'csv', 'json', 'xml'].includes(ext)) {
    text = await file.text()
  } else if (['html', 'htm'].includes(ext)) {
    const raw = await file.text()
    text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  } else if (ext === 'pdf') {
    text = await parsePdfClient(file)
  } else if (ext === 'epub') {
    text = await parseEpubClient(file)
  } else if (ext === 'docx') {
    text = await parseDocxClient(file)
  } else {
    // Fallback: try reading as text
    text = await file.text()
  }

  text = (text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  const wordCount = text.split(/\s+/).filter((w: string) => (w?.length ?? 0) > 0)?.length ?? 0

  return { text, wordCount }
}

async function parsePdfClient(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  
  // Set worker source
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: any) => item?.str ?? '')
      .join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n')
}

async function parseEpubClient(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Find the container.xml to get the rootfile
  const containerXml = await zip.file('META-INF/container.xml')?.async('string')
  if (!containerXml) {
    // Fallback: extract text from all html/xhtml files
    return await extractTextFromZipHtml(zip)
  }

  // Parse rootfile path
  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/)
  if (!rootfileMatch) {
    return await extractTextFromZipHtml(zip)
  }

  const opfPath = rootfileMatch[1]
  const opfContent = await zip.file(opfPath)?.async('string')
  if (!opfContent) {
    return await extractTextFromZipHtml(zip)
  }

  // Get the base directory of the OPF file
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : ''

  // Parse spine order from OPF
  const spineMatches = opfContent.match(/<itemref[^>]*idref="([^"]+)"[^>]*\/>/g) || []
  const spineIds = spineMatches.map((m: string) => {
    const idMatch = m.match(/idref="([^"]+)"/) 
    return idMatch ? idMatch[1] : ''
  }).filter(Boolean)

  // Parse manifest to map IDs to hrefs
  const manifestItems: Record<string, string> = {}
  const itemMatches = opfContent.match(/<item[^>]*\/>/g) || opfContent.match(/<item[^>]*>[^<]*<\/item>/g) || []
  for (const item of itemMatches) {
    const idMatch = item.match(/id="([^"]+)"/) 
    const hrefMatch = item.match(/href="([^"]+)"/) 
    if (idMatch && hrefMatch) {
      manifestItems[idMatch[1]] = hrefMatch[1]
    }
  }

  // Read spine items in order
  const texts: string[] = []
  for (const id of spineIds) {
    const href = manifestItems[id]
    if (!href) continue
    const fullPath = opfDir + decodeURIComponent(href)
    const content = await zip.file(fullPath)?.async('string')
    if (content) {
      const cleaned = content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#?\w+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (cleaned) texts.push(cleaned)
    }
  }

  return texts.join('\n\n')
}

async function extractTextFromZipHtml(zip: any): Promise<string> {
  const texts: string[] = []
  const files = Object.keys(zip.files).sort()

  for (const name of files) {
    if (name.match(/\.(xhtml|html|htm)$/i) && !name.includes('META-INF')) {
      const content = await zip.file(name)?.async('string')
      if (content) {
        const cleaned = content
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#?\w+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (cleaned) texts.push(cleaned)
      }
    }
  }

  return texts.join('\n\n')
}

async function parseDocxClient(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  const docXml = await zip.file('word/document.xml')?.async('string')
  if (!docXml) return ''

  // Extract text from w:t elements
  const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
  const paragraphs: string[] = []
  let currentParagraph = ''

  // Split by paragraph markers
  const parts = docXml.split(/<w:p[\s>]/)
  for (const part of parts) {
    const tMatches = part.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    const paraText = tMatches
      .map((m: string) => {
        const match = m.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
        return match ? match[1] : ''
      })
      .join('')
    if (paraText.trim()) {
      paragraphs.push(paraText.trim())
    }
  }

  return paragraphs.join('\n')
}
