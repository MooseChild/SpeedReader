export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = await prisma.readingSession.create({
      data: {
        documentId: body?.documentId ?? "",
        technique: body?.technique ?? "rsvp",
        wordsRead: body?.wordsRead ?? 0,
        currentWordIndex: body?.currentWordIndex ?? 0,
        avgWpm: body?.avgWpm ?? 250,
        durationSeconds: body?.durationSeconds ?? 0,
        endedAt: body?.endedAt ? new Date(body.endedAt) : null,
      },
    });
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create session" },
      { status: 500 }
    );
  }
}
