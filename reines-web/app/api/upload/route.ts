import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveUpload, StorageError } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * POST /api/upload
 * Accepts multipart/form-data with a single `file` field.
 * Only PROJECT_MANAGER and ADMIN roles may upload.
 * Returns { url } on success.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { role } = session.user;
  if (role === "CLIENT") {
    return NextResponse.json({ error: "Clients may not upload files" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await saveUpload(file as File);
    return NextResponse.json({
      url: result.url,
      sizeBytes: result.sizeBytes,
      mimeType: result.mimeType,
      originalName: result.originalName,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[UPLOAD]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
