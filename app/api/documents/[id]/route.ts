export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteStoredFile } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: params?.id ?? "" },
      include: {
        bookmarks: { orderBy: { wordIndex: "asc" } },
        annotations: { orderBy: { startIndex: "asc" } },
      },
    });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error: any) {
    console.error("Get document error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to fetch document" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updateData: any = {};
    if (body?.title !== undefined) updateData.title = body.title;
    if (body?.author !== undefined) updateData.author = body.author;
    if (body?.readingStartIndex !== undefined) updateData.readingStartIndex = body.readingStartIndex;

    const doc = await prisma.document.update({
      where: { id: params?.id ?? "" },
      data: updateData,
    });
    return NextResponse.json(doc);
  } catch (error: any) {
    console.error("Update document error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await prisma.document.findUnique({ where: { id: params?.id ?? "" } });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    // Delete stored file
    const filePath = doc?.storagePath || doc?.cloudStoragePath;
    if (filePath) await deleteStoredFile(filePath);

    await prisma.document.delete({ where: { id: params?.id ?? "" } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete document error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to delete document" }, { status: 500 });
  }
}
