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
    } else if (ext === 'docx') {
      const mammoth = require('mammoth');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      text = result?.value ?? '';
    } else if (ext === 'pdf') {
      // Use LLM API for PDF extraction
      const base64Buffer = await file.arrayBuffer();
      const base64String = Buffer.from(base64Buffer).toString('base64');

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.4-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'file',
                  file: {
                    filename: fileName,
                    file_data: `data:application/pdf;base64,${base64String}`,
                  },
                },
                {
                  type: 'text',
                  text: 'Extract ALL the text content from this PDF document. Return ONLY the raw text content, preserving paragraph breaks. Do not add any commentary, headers, or formatting. Just the plain text exactly as it appears in the document.',
                },
              ],
            },
          ],
          max_tokens: 16000,
        }),
      });

      if (!response?.ok) {
        throw new Error(`LLM API error: ${response?.status}`);
      }
      const data = await response.json();
      text = data?.choices?.[0]?.message?.content ?? '';
    } else if (ext === 'epub') {
      // Read epub as zip and extract text from HTML files
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64String = buffer.toString('base64');

      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.4-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'file',
                  file: {
                    filename: fileName,
                    file_data: `data:application/epub+zip;base64,${base64String}`,
                  },
                },
                {
                  type: 'text',
                  text: 'Extract ALL the text content from this EPUB document. Return ONLY the raw text content, preserving paragraph breaks. Do not add any commentary, headers, or formatting. Just the plain text exactly as it appears in the document.',
                },
              ],
            },
          ],
          max_tokens: 16000,
        }),
      });

      if (!response?.ok) {
        throw new Error(`LLM API error for EPUB: ${response?.status}`);
      }
      const data = await response.json();
      text = data?.choices?.[0]?.message?.content ?? '';
    } else {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 });
    }

    // Clean up the text
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
