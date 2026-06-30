import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

const MAX_MB = 5;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * POST /api/payments/cash/upload
 * Uploads a cash payment receipt image.
 * Returns { url: "/uploads/receipts/filename.ext" }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WEBP, or GIF images are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File must be smaller than ${MAX_MB}MB.` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");

    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/receipts/${filename}` });
  } catch (err) {
    console.error("[/api/payments/cash/upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
