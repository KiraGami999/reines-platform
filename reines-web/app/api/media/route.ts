import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readBlob } from "@/lib/storage";

/**
 * GET /api/media?url=<encoded-blob-url>
 *
 * Proxies files from the private Vercel Blob store to the browser.
 * Requires the user to be logged in.
 */
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Old local files still in /public/uploads — redirect directly
  if (blobUrl.startsWith("/uploads/") && !blobUrl.includes("..")) {
    return NextResponse.redirect(new URL(blobUrl, req.url));
  }

  // Only allow Vercel Blob URLs
  try {
    const { hostname } = new URL(blobUrl);
    const isBlobHost =
      hostname.endsWith(".private.blob.vercel-storage.com") ||
      hostname.endsWith(".public.blob.vercel-storage.com");
    if (!isBlobHost) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Require login
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const result = await readBlob(blobUrl);

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type":        result.blob.contentType ?? "application/octet-stream",
        "Content-Disposition": result.blob.contentDisposition ?? "inline",
        "Cache-Control":       "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[GET /api/media]", err);
    return NextResponse.json({ error: "Could not load file" }, { status: 500 });
  }
}
