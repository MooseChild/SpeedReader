export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.bookmark.delete({ where: { id: params?.id ?? "" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete bookmark error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
