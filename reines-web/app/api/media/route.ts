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
      // Mobile clients authenticate with a JWT. Images loaded by the native
      // image component can send it via the Authorization header; files opened
      // in an external/in-app browser tab (which can't set headers) fall back
      // to a ?token= query param.
      const bearer     = extractBearer(req.headers.get("authorization"));
      const queryToken = req.nextUrl.searchParams.get("token");
      const rawToken   = bearer ?? queryToken;
      if (rawToken) {
        const payload = await verifyToken(rawToken);
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

    // Buffer the body so mobile image loaders get a Content-Length and a
    // complete response. Chunked streams without Content-Length frequently
    // fail silently on Android / Expo Go Image components.
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.stream as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c)));

    const cacheControl = publicAsset
      ? "public, max-age=3600, stale-while-revalidate=86400"
      : "private, max-age=3600, stale-while-revalidate=86400";

    // Force inline so native image decoders display the bytes (Blob may
    // return Content-Disposition: attachment, which Android refuses to render).
    return new NextResponse(body, {
      headers: {
        "Content-Type":        result.blob.contentType ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "Content-Length":      String(body.length),
        "Cache-Control":       cacheControl,
      },
    });
  } catch (err) {
    console.error("[GET /api/media]", err);
    return NextResponse.json({ error: "Could not load file" }, { status: 500 });
  }
}
