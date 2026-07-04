/**
 * Cloud file storage via Vercel Blob.
 *
 * All uploads go to Vercel Blob's CDN. The store is PRIVATE, so files
 * cannot be accessed directly by URL — they are served to browsers via
 * the /api/media proxy route which checks authentication.
 *
 * Required env:
 *   BLOB_READ_WRITE_TOKEN — from Vercel dashboard → Storage → Blob
 */

import { put, del as blobDel, get as blobGet } from "@vercel/blob";
import { randomUUID } from "crypto";

// ─── Allowed types ────────────────────────────────────────────────────────────

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

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── MIME resolution (Windows often sends empty types) ────────────────────────

function resolveMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext];
  return file.type || "application/octet-stream";
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

function isVercelBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      (hostname.endsWith(".public.blob.vercel-storage.com") ||
       hostname.endsWith(".private.blob.vercel-storage.com"))
    );
  } catch {
    return false;
  }
}

/**
 * Convert a stored URL into something the browser can load.
 * - Old local paths (/uploads/…) pass through unchanged.
 * - Vercel Blob URLs become /api/media?url=… so the proxy serves them.
 */
export function resolveStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.includes("..")) return url;
  if (isVercelBlobUrl(url)) return `/api/media?url=${encodeURIComponent(url)}`;
  return url;
}

export function isSafeUploadUrl(url: string): boolean {
  return isVercelBlobUrl(url) || (url.startsWith("/uploads/gallery/") && !url.includes(".."));
}

export function isSafeProductImageUrl(url: string): boolean {
  return isVercelBlobUrl(url) || (url.startsWith("/uploads/product-images/") && !url.includes(".."));
}

export function isSafeStaticProductImageUrl(url: string): boolean {
  return url.startsWith("/product-images/") && !url.includes("..");
}

export function isManagedProductLibraryImageUrl(url: string): boolean {
  return isSafeProductImageUrl(url) || isSafeStaticProductImageUrl(url);
}

export function isAssignableProductImageUrl(url: string): boolean {
  return isManagedProductLibraryImageUrl(url);
}

export function isSafeHomepageAdUploadUrl(url: string): boolean {
  return isVercelBlobUrl(url) || (url.startsWith("/uploads/homepage-ads/") && !url.includes(".."));
}

export function isSafeStaticHomepageAdUrl(url: string): boolean {
  return url.startsWith("/homepage-ads/") && !url.includes("..");
}

export function isManagedHomepageAdLibraryImageUrl(url: string): boolean {
  return isSafeHomepageAdUploadUrl(url) || isSafeStaticHomepageAdUrl(url);
}

export function isAssignableHomepageAdImageUrl(url: string): boolean {
  return isManagedHomepageAdLibraryImageUrl(url);
}

// ─── Upload ───────────────────────────────────────────────────────────────────

async function uploadToBlob(
  file:         File,
  folder:       string,
  allowedTypes: string[],
): Promise<StorageResult> {
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

  try {
    const { url } = await put(pathname, file, {
      access:      "private",
      contentType: mimeType,
    });

    return { url, filename, sizeBytes: file.size, mimeType, originalName: file.name };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[storage/uploadToBlob]", msg);
    throw new StorageError(`Blob upload failed: ${msg}`, 500);
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

// ─── Read (used by /api/media proxy) ──────────────────────────────────────────

export async function readBlob(url: string) {
  return blobGet(url, { access: "private" });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteProductLibraryImageFile(url: string): Promise<void> {
  if (!isManagedProductLibraryImageUrl(url)) {
    throw new StorageError("Only product catalogue images can be deleted.", 400);
  }
  if (isVercelBlobUrl(url)) await blobDel(url);
}

export async function deleteHomepageAdLibraryImageFile(url: string): Promise<void> {
  if (!isManagedHomepageAdLibraryImageUrl(url)) {
    throw new StorageError("Only homepage ad images can be deleted.", 400);
  }
  if (isVercelBlobUrl(url)) await blobDel(url);
}
