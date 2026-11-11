export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body?.wordsRead !== undefined) data.wordsRead = body.wordsRead;
    if (body?.currentWordIndex !== undefined) data.currentWordIndex = body.currentWordIndex;
    if (body?.avgWpm !== undefined) data.avgWpm = body.avgWpm;
    if (body?.durationSeconds !== undefined) data.durationSeconds = body.durationSeconds;
    if (body?.endedAt !== undefined) data.endedAt = new Date(body.endedAt);

    const session = await prisma.readingSession.update({
      where: { id: params?.id ?? "" },
      data,
    });
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update session" },
      { status: 500 }
    );
  }
}
