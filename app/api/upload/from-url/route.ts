export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
const LOCAL_UPLOAD_DIR = "/mnt/books";
async function ensureLocalDir() {
  try { await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true }); } catch {}
}
export async function POST(request: NextRequest) {
  try {
    const { url, fileName } = await request.json();
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file from URL");
    const buffer = Buffer.from(await response.arrayBuffer());
    const uniqueName = `${Date.now()}-${fileName ?? "file"}`;
    await ensureLocalDir();
    const filePath = path.join(LOCAL_UPLOAD_DIR, uniqueName);
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ cloud_storage_path: `local://${filePath}`, isLocal: true });
  } catch (error: any) {
    console.error("From-URL upload error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to upload from URL" }, { status: 500 });
  }
}
