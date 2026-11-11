export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const annotation = await prisma.annotation.create({
      data: {
        documentId: body?.documentId ?? "",
        startIndex: body?.startIndex ?? 0,
        endIndex: body?.endIndex ?? 0,
        text: body?.text ?? "",
        note: body?.note ?? "",
        color: body?.color ?? "#FFD700",
      },
    });
    return NextResponse.json(annotation);
  } catch (error: any) {
    console.error("Create annotation error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create annotation" },
      { status: 500 }
    );
  }
}
