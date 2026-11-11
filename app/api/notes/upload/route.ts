export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveNoteFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const categoryId = formData.get('categoryId') as string | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const fileName = file?.name ?? 'note.txt';
    const ext = fileName?.split('.')?.pop()?.toLowerCase?.() ?? 'txt';
    if (!['txt', 'md'].includes(ext)) {
      return NextResponse.json({ error: 'Only .txt and .md files are supported for notes' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = await saveNoteFile(buffer, fileName);
    const content = buffer.toString('utf-8');
    const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    const note = await prisma.note.create({
      data: { title, content, categoryId: categoryId || null, storagePath },
      include: { category: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to upload note' }, { status: 500 });
  }
}
