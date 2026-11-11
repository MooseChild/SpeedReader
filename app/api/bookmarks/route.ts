export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookmark = await prisma.bookmark.create({
      data: {
        documentId: body?.documentId ?? "",
        wordIndex: body?.wordIndex ?? 0,
        label: body?.label ?? "",
      },
    });
    return NextResponse.json(bookmark);
  } catch (error: any) {
    console.error("Create bookmark error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
