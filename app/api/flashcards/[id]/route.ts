export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body?.front !== undefined) data.front = body.front;
    if (body?.back !== undefined) data.back = body.back;
    if (body?.categoryId !== undefined) data.categoryId = body.categoryId || null;
    const fc = await prisma.flashcard.update({
      where: { id: params.id }, data,
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(fc);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.flashcard.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
