import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyToken, extractBearer } from "@/lib/jwt";
import { readBlob } from "@/lib/storage";

const PUBLIC_PATH_PREFIXES = [
  "uploads/homepage-ads/",
  "uploads/product-images/",
  "uploads/public-projects/",
];

function isPublicAsset(blobUrl: string): boolean {
  try {
    const { pathname } = new URL(blobUrl);
    return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.includes(prefix));
  } catch {
    return false;
  }
}

/**
 * GET /api/media?url=<encoded-blob-url>
 *
 * Proxies files from the private Vercel Blob store to the browser.
 * Public assets (homepage ads, product images) are served without auth.
 * Private files require authentication via:
 *   - NextAuth session cookie (web)
 *   - Bearer token header (mobile)
 */
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (blobUrl.startsWith("/uploads/") && !blobUrl.includes("..")) {
    return NextResponse.redirect(new URL(blobUrl, req.url));
  }

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

  const publicAsset = isPublicAsset(blobUrl);

  if (!publicAsset) {
    let authenticated = false;

    const session = await auth();
    if (session?.user) {
      authenticated = true;
    }

    if (!authenticated) {
      const bearer = extractBearer(req.headers.get("authorization"));
      if (bearer) {
        const payload = await verifyToken(bearer);
        if (payload?.id) authenticated = true;
      }
    }

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
  }

  try {
    const result = await readBlob(blobUrl);

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const cacheControl = publicAsset
      ? "public, max-age=3600, stale-while-revalidate=86400"
      : "private, max-age=3600, stale-while-revalidate=86400";

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type":        result.blob.contentType ?? "application/octet-stream",
        "Content-Disposition": result.blob.contentDisposition ?? "inline",
        "Cache-Control":       cacheControl,
      },
    });
  } catch (err) {
    console.error("[GET /api/media]", err);
    return NextResponse.json({ error: "Could not load file" }, { status: 500 });
  }
}
