export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { detectFrontMatterEnd } from "@/lib/front-matter";

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, author: true, fileName: true, fileType: true,
        fileSize: true, wordCount: true, readingStartIndex: true,
        createdAt: true, updatedAt: true,
        _count: { select: { readingSessions: true, bookmarks: true, annotations: true } },
      },
    });

    const docsWithProgress = await Promise.all(
      (documents ?? []).map(async (doc: any) => {
        const latestSession = await prisma.readingSession.findFirst({
          where: { documentId: doc?.id },
          orderBy: { startedAt: "desc" },
          select: { currentWordIndex: true, avgWpm: true, technique: true },
        });
        return {
          ...(doc ?? {}),
          lastPosition: latestSession?.currentWordIndex ?? 0,
          lastWpm: latestSession?.avgWpm ?? 250,
          lastTechnique: latestSession?.technique ?? "rsvp",
        };
      })
    );

    return NextResponse.json(docsWithProgress ?? []);
  } catch (error: any) {
    console.error("Get documents error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contentText = body?.contentText ?? "";
    
    // Auto-detect front matter
    const autoStartIndex = detectFrontMatterEnd(contentText);

    const document = await prisma.document.create({
      data: {
        title: body?.title ?? "Untitled",
        author: body?.author ?? "",
        fileName: body?.fileName ?? "file",
        fileType: body?.fileType ?? "txt",
        fileSize: body?.fileSize ?? 0,
        cloudStoragePath: body?.cloudStoragePath ?? body?.storagePath ?? "",
        storagePath: body?.storagePath ?? body?.cloudStoragePath ?? "",
        isPublic: body?.isPublic ?? false,
        contentText,
        wordCount: body?.wordCount ?? 0,
        readingStartIndex: autoStartIndex,
      },
    });
    return NextResponse.json(document);
  } catch (error: any) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to create document" }, { status: 500 });
  }
}
