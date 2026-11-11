export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteStoredFile } from "@/lib/storage";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const note = await prisma.note.findUnique({
      where: { id: params.id },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body?.title !== undefined) data.title = body.title;
    if (body?.content !== undefined) data.content = body.content;
    if (body?.categoryId !== undefined) data.categoryId = body.categoryId || null;
    const note = await prisma.note.update({
      where: { id: params.id }, data,
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const note = await prisma.note.findUnique({ where: { id: params.id } });
    if (note?.storagePath) await deleteStoredFile(note.storagePath);
    await prisma.note.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
