export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file?.name ?? 'unknown';
    const ext = fileName?.split('.')?.pop()?.toLowerCase?.() ?? '';
    let text = '';

    if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'html' || ext === 'htm' || ext === 'xml' || ext === 'json') {
      text = await file.text();
      // Strip HTML tags for html files
      if (ext === 'html' || ext === 'htm') {
        text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    } else if (ext === 'docx') {
      const mammoth = require('mammoth');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      text = result?.value ?? '';
    } else if (ext === 'pdf') {
      text = await parsePdfServer(file);
    } else if (ext === 'epub') {
      text = await parseEpubServer(file);
    } else {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 });
    }

    text = (text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const wordCount = (text ?? '').split(/\s+/).filter((w: string) => (w?.length ?? 0) > 0)?.length ?? 0;

    return NextResponse.json({ text, wordCount });
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to parse file' },
      { status: 500 }
    );
  }
}

async function parsePdfServer(file: File): Promise<string> {
  // Use pdfjs-dist for server-side PDF parsing (no external API needed)
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item?.str ?? '')
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

async function parseEpubServer(file: File): Promise<string> {
  // Use JSZip to extract EPUB content (no external API needed)
  const JSZip = require('jszip');
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Find the container.xml to get the rootfile
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) {
    return await extractTextFromZipHtml(zip);
  }

  // Parse rootfile path
  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!rootfileMatch) {
    return await extractTextFromZipHtml(zip);
  }

  const opfPath = rootfileMatch[1];
  const opfContent = await zip.file(opfPath)?.async('string');
  if (!opfContent) {
    return await extractTextFromZipHtml(zip);
  }

  // Get the base directory of the OPF file
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // Parse spine order from OPF
  const spineMatches = opfContent.match(/<itemref[^>]*idref="([^"]+)"[^>]*\/?>/g) || [];
  const spineIds = spineMatches.map((m: string) => {
    const idMatch = m.match(/idref="([^"]+)"/);
    return idMatch ? idMatch[1] : '';
  }).filter(Boolean);

  // Parse manifest to map IDs to hrefs
  const manifestItems: Record<string, string> = {};
  const itemRegex = /<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*\/?>/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
    manifestItems[itemMatch[1]] = itemMatch[2];
  }
  // Also try reversed attribute order
  const itemRegex2 = /<item[^>]*href="([^"]+)"[^>]*id="([^"]+)"[^>]*\/?>/g;
  while ((itemMatch = itemRegex2.exec(opfContent)) !== null) {
    manifestItems[itemMatch[2]] = itemMatch[1];
  }

  // Read spine items in order
  const texts: string[] = [];
  for (const id of spineIds) {
    const href = manifestItems[id];
    if (!href) continue;
    const fullPath = opfDir + decodeURIComponent(href);
    const content = await zip.file(fullPath)?.async('string');
    if (content) {
      const cleaned = stripHtml(content);
      if (cleaned) texts.push(cleaned);
    }
  }

  return texts.join('\n\n');
}

function stripHtml(html: string): string {
  return html
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
    .trim();
}

async function extractTextFromZipHtml(zip: any): Promise<string> {
  const texts: string[] = [];
  const files = Object.keys(zip.files).sort();

  for (const name of files) {
    if (name.match(/\.(xhtml|html|htm)$/i) && !name.includes('META-INF')) {
      const content = await zip.file(name)?.async('string');
      if (content) {
        const cleaned = stripHtml(content);
        if (cleaned) texts.push(cleaned);
      }
    }
  }

  return texts.join('\n\n');
}
