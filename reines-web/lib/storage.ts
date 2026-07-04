/**
 * Cloud storage via Vercel Blob.
 *
 * Uploads are stored on Vercel Blob and returned as HTTPS URLs.
 * Private stores require authenticated reads — use resolveStorageUrl()
 * from @/lib/storage-urls to convert stored URLs into browser-safe links.
 *
 * Required env:
 *   BLOB_READ_WRITE_TOKEN — from Vercel dashboard → Storage → Blob
 *   BLOB_ACCESS           — "private" (default) or "public"
 */

import { put, del as blobDel } from "@vercel/blob";
import { randomUUID } from "crypto";
import {
  getBlobAccessMode,
  isManagedHomepageAdLibraryImageUrl,
  isManagedProductLibraryImageUrl,
  isStoredBlobUrl,
} from "@/lib/storage-urls";

export {
  getBlobAccessMode,
  isAssignableHomepageAdImageUrl,
  isAssignableProductImageUrl,
  isManagedHomepageAdLibraryImageUrl,
  isManagedProductLibraryImageUrl,
  isPublicBlobPath,
  isSafeHomepageAdUploadUrl,
  isSafeProductImageUrl,
  isSafeStaticHomepageAdUrl,
  isSafeStaticProductImageUrl,
  isSafeUploadUrl,
  isStoredBlobUrl,
  parseBlobPathname,
  resolveStorageUrl,
} from "@/lib/storage-urls";

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_TYPES = [
  ...IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const EXT_MIME: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  gif:  "image/gif",
  pdf:  "application/pdf",
  doc:  "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const MAX_SIZE_MB = 15;
const MAX_BYTES   = MAX_SIZE_MB * 1024 * 1024;

export interface StorageResult {
  url:          string;
  filename:     string;
  sizeBytes:    number;
  mimeType:     string;
  originalName: string;
}

export class StorageError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

function isPlaceholderToken(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim() ?? "";
  return !token || token === "your-vercel-blob-token-here";
}

function resolveMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext];
  return file.type;
}

async function uploadToBlob(
  file:         File,
  folder:       string,
  allowedTypes: string[],
): Promise<StorageResult> {
  if (isPlaceholderToken()) {
    throw new StorageError(
      "File storage is not configured. Add BLOB_READ_WRITE_TOKEN to your .env file.",
      503,
    );
  }

  const mimeType = resolveMimeType(file);

  if (!mimeType || !allowedTypes.includes(mimeType)) {
    throw new StorageError(
      `Unsupported file type "${mimeType || "unknown"}". ` +
      `Allowed: images (JPEG, PNG, WEBP, GIF), PDF, and Word documents.`,
    );
  }

  if (file.size > MAX_BYTES) {
    throw new StorageError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
  }

  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const pathname = `${folder}/${filename}`;
  const access   = getBlobAccessMode();

  try {
    const { url } = await put(pathname, file, {
      access,
      contentType: mimeType,
    });

    return {
      url,
      filename,
      sizeBytes:    file.size,
      mimeType,
      originalName: file.name,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("public access on a private store")) {
      throw new StorageError(
        "Blob store is private but BLOB_ACCESS is set to public. Set BLOB_ACCESS=private in .env and restart the server.",
        500,
      );
    }
    if (msg.includes("private access on a public store")) {
      throw new StorageError(
        "Blob store is public but BLOB_ACCESS is set to private. Set BLOB_ACCESS=public in .env and restart the server.",
        500,
      );
    }

    console.error("[storage/uploadToBlob]", err);
    throw new StorageError(`Upload failed: ${msg}`, 500);
  }
}

export async function saveUpload(file: File): Promise<StorageResult> {
  return uploadToBlob(file, "uploads/gallery", ALLOWED_TYPES);
}

export async function saveProductImageUpload(file: File): Promise<StorageResult> {
  return uploadToBlob(file, "uploads/product-images", IMAGE_TYPES);
}

export async function saveHomepageAdImageUpload(file: File): Promise<StorageResult> {
  return uploadToBlob(file, "uploads/homepage-ads", IMAGE_TYPES);
}

export async function deleteProductLibraryImageFile(url: string): Promise<void> {
  if (!isManagedProductLibraryImageUrl(url)) {
    throw new StorageError("Only product catalogue images can be deleted.", 400);
  }
  if (isStoredBlobUrl(url)) await blobDel(url);
}

export async function deleteHomepageAdLibraryImageFile(url: string): Promise<void> {
  if (!isManagedHomepageAdLibraryImageUrl(url)) {
    throw new StorageError("Only homepage ad images can be deleted.", 400);
  }
  if (isStoredBlobUrl(url)) await blobDel(url);
}
