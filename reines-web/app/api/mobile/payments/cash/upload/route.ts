import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { checkMobileVerification } from "@/lib/api-guards";

const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/mobile/payments/cash/upload
 *
 * Uploads a cash payment receipt image for clients using Bearer JWT auth.
 */
export async function POST(req: NextRequest) {
  const { errorResponse, payload } = await checkMobileVerification(req);
  if (errorResponse) return errorResponse;

  if (payload!.role !== "CLIENT") {
    return NextResponse.json({ error: "Only clients may upload payment receipts." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") ?? formData.get("receipt");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const uploadFile = file as File;

    if (!ALLOWED.includes(uploadFile.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WEBP, or GIF images are allowed." },
        { status: 400 }
      );
    }

    if (uploadFile.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File must be smaller than ${MAX_MB}MB.` },
        { status: 400 }
      );
    }

    const ext = uploadFile.name.split(".").pop() ?? "jpg";
    const filename = `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { url } = await put(`uploads/receipts/${filename}`, uploadFile, {
      access: "private",
      contentType: uploadFile.type,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mobile/payments/cash/upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
