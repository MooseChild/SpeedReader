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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const fileName = file?.name ?? "file";
    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${Date.now()}-${fileName}`;
    await ensureLocalDir();
    const filePath = path.join(LOCAL_UPLOAD_DIR, uniqueName);
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ cloud_storage_path: `local://${filePath}`, isLocal: true });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: error?.message ?? "Failed to upload file" }, { status: 500 });
  }
}
