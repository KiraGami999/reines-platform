import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getBlobAccessMode,
  isPublicBlobPath,
  isStoredBlobUrl,
  parseBlobPathname,
} from "@/lib/storage-urls";

/**
 * GET /api/media?url=<encoded-blob-url>
 *
 * Streams a file from Vercel Blob to the browser.
 * - Marketing assets (homepage ads, product images) are public.
 * - Gallery files require login + project access.
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Legacy local files still under /public/uploads
  if (rawUrl.startsWith("/uploads/") && !rawUrl.includes("..")) {
    return NextResponse.redirect(new URL(rawUrl, req.url));
  }

  if (!isStoredBlobUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
  }

  const pathname = parseBlobPathname(rawUrl);
  if (!pathname) {
    return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
  }

  // Gallery files are project-scoped — require auth + access check.
  if (pathname.startsWith("uploads/gallery/")) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const allowed = await userCanAccessGalleryFile(
      session.user.id,
      session.user.role,
      rawUrl,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!isPublicBlobPath(pathname)) {
    // Unknown blob path — deny by default.
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await get(rawUrl, { access: getBlobAccessMode() });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const cacheControl = isPublicBlobPath(pathname)
      ? "public, max-age=86400, stale-while-revalidate=604800"
      : "private, max-age=3600";

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type":  result.blob.contentType ?? "application/octet-stream",
        "Cache-Control": cacheControl,
        "Content-Disposition": result.blob.contentDisposition,
      },
    });
  } catch (err) {
    console.error("[GET /api/media]", err);
    return NextResponse.json({ error: "Could not load file" }, { status: 500 });
  }
}

async function userCanAccessGalleryFile(
  userId: string,
  role:   string,
  fileUrl: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;

  const update = await prisma.projectUpdate.findFirst({
    where: {
      OR: [{ imageUrl: fileUrl }, { documentUrl: fileUrl }],
    },
    select: {
      project: { select: { clientId: true, managerId: true } },
    },
  });

  if (!update) return false;

  if (role === "CLIENT")          return update.project.clientId  === userId;
  if (role === "PROJECT_MANAGER") return update.project.managerId === userId;

  return false;
}
