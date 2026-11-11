export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: { id: "global", accentColor: "#7C3AED", highlightColor: "#FBBF24", readingFont: "system" },
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body?.accentColor !== undefined) data.accentColor = body.accentColor;
    if (body?.highlightColor !== undefined) data.highlightColor = body.highlightColor;
    if (body?.readingFont !== undefined) data.readingFont = body.readingFont;

    const settings = await prisma.appSettings.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", ...data },
    });
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to update settings" }, { status: 500 });
  }
}
