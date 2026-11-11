export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const note = await prisma.note.create({
      data: {
        title: body?.title ?? "Untitled Note",
        content: body?.content ?? "",
        categoryId: body?.categoryId || null,
        storagePath: body?.storagePath ?? "",
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
