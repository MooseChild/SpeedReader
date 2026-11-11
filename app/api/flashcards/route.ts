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
      { front: { contains: search, mode: 'insensitive' } },
      { back: { contains: search, mode: 'insensitive' } },
    ];

    const flashcards = await prisma.flashcard.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(flashcards);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const flashcard = await prisma.flashcard.create({
      data: {
        front: body?.front ?? "",
        back: body?.back ?? "",
        categoryId: body?.categoryId || null,
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(flashcard);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
