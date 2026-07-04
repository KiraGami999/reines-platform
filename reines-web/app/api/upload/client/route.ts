import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
];

const MAX_SIZE_BYTES = 15 * 1024 * 1024;

/**
 * POST /api/upload/client
 *
 * Token-exchange endpoint for client-side uploads via @vercel/blob/client.
 * The browser sends a small JSON request here (never the file data), gets
 * back a signed token, then uploads the file directly to Vercel Blob's CDN.
 *
 * This bypasses the serverless function body-size limit entirely.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (session.user.role === "CLIENT") {
    return NextResponse.json({ error: "Clients may not upload files" }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            role: session.user.role,
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[client-upload] completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[POST /api/upload/client]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
