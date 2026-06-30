import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveProductImageUpload, StorageError } from "@/lib/storage";

/**
 * POST /api/admin/products/upload
 * Accepts multipart/form-data with a single `file` field (image only).
 * Admin-only — used when populating the product catalogue.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await saveProductImageUpload(file as File);
    return NextResponse.json(
      {
        url: result.url,
        sizeBytes: result.sizeBytes,
        mimeType: result.mimeType,
        originalName: result.originalName,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof StorageError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[PRODUCT_UPLOAD]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
