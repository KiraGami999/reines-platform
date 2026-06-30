import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { saveUpload, StorageError } from "@/lib/storage";

/**
 * POST /api/mobile/upload
 *
 * Accepts a multipart/form-data request with a single `file` field.
 * Validates the MIME type (images only) and file size (≤ 15 MB).
 * Saves to /public/uploads/gallery/ and returns the public URL.
 *
 * The returned URL will pass isSafeUploadUrl() so it can be submitted
 * directly to POST /api/mobile/projects/:id/gallery.
 *
 * Auth: Bearer token (mobile JWT — PROJECT_MANAGER or ADMIN only).
 */
export async function POST(req: NextRequest) {
  const token   = extractBearer(req.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token invalid or expired." }, { status: 401 });

  if (!["PROJECT_MANAGER", "ADMIN"].includes(payload.role)) {
    return NextResponse.json({ error: "Only project managers may upload images." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided. Send a 'file' field." }, { status: 400 });
  }

  try {
    const result = await saveUpload(file as File);
    return NextResponse.json({
      url:          result.url,
      filename:     result.filename,
      sizeBytes:    result.sizeBytes,
      originalName: result.originalName,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[POST /api/mobile/upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
