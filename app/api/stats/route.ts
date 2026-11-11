export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const sessions = await prisma.readingSession.findMany({
      include: { document: { select: { title: true, wordCount: true } } },
      orderBy: { startedAt: "desc" },
    });

    const totalSessions = sessions?.length ?? 0;
    const totalWordsRead = (sessions ?? []).reduce((sum: number, s: any) => sum + (s?.wordsRead ?? 0), 0);
    const totalTimeSeconds = (sessions ?? []).reduce((sum: number, s: any) => sum + (s?.durationSeconds ?? 0), 0);
    const avgWpm = totalSessions > 0
      ? Math.round((sessions ?? []).reduce((sum: number, s: any) => sum + (s?.avgWpm ?? 0), 0) / totalSessions)
      : 0;

    // Sessions by technique
    const techniqueMap: Record<string, { sessions: number; wordsRead: number; time: number }> = {};
    for (const s of (sessions ?? [])) {
      const t = s?.technique ?? "rsvp";
      if (!techniqueMap[t]) {
        techniqueMap[t] = { sessions: 0, wordsRead: 0, time: 0 };
      }
      techniqueMap[t].sessions += 1;
      techniqueMap[t].wordsRead += s?.wordsRead ?? 0;
      techniqueMap[t].time += s?.durationSeconds ?? 0;
    }

    // Daily reading stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = (sessions ?? []).filter(
      (s: any) => new Date(s?.startedAt ?? 0) >= thirtyDaysAgo
    );
    const dailyMap: Record<string, { wordsRead: number; time: number; sessions: number }> = {};
    for (const s of recentSessions) {
      const day = new Date(s?.startedAt ?? 0).toISOString().split('T')[0] ?? '';
      if (!dailyMap[day]) {
        dailyMap[day] = { wordsRead: 0, time: 0, sessions: 0 };
      }
      dailyMap[day].wordsRead += s?.wordsRead ?? 0;
      dailyMap[day].time += s?.durationSeconds ?? 0;
      dailyMap[day].sessions += 1;
    }

    const dailyStats = Object.entries(dailyMap ?? {})
      .map(([date, data]: [string, any]) => ({
        date,
        wordsRead: data?.wordsRead ?? 0,
        timeMinutes: Math.round((data?.time ?? 0) / 60),
        sessions: data?.sessions ?? 0,
      }))
      .sort((a: any, b: any) => (a?.date ?? '').localeCompare(b?.date ?? ''));

    // WPM over time
    const wpmOverTime = (sessions ?? []).slice(0, 50).reverse().map((s: any, i: number) => ({
      session: i + 1,
      wpm: s?.avgWpm ?? 0,
      technique: s?.technique ?? 'rsvp',
      date: new Date(s?.startedAt ?? 0).toISOString().split('T')[0] ?? '',
    }));

    const documentCount = await prisma.document.count();

    return NextResponse.json({
      totalSessions,
      totalWordsRead,
      totalTimeMinutes: Math.round(totalTimeSeconds / 60),
      avgWpm,
      techniqueStats: Object.entries(techniqueMap ?? {}).map(([name, data]: [string, any]) => ({
        name,
        sessions: data?.sessions ?? 0,
        wordsRead: data?.wordsRead ?? 0,
        timeMinutes: Math.round((data?.time ?? 0) / 60),
      })),
      dailyStats,
      wpmOverTime,
      documentCount,
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
