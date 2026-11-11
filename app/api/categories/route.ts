export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.noteCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { notes: true, flashcards: true } } },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category = await prisma.noteCategory.create({
      data: { name: body?.name ?? "Untitled", color: body?.color ?? "#7C3AED" },
    });
    return NextResponse.json(category);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Category already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
