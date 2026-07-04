/**
 * Cloud storage via Vercel Blob.
 *
 * All uploads are stored on Vercel Blob's global CDN and returned as full
 * HTTPS URLs.  The local-filesystem approach that was here before only worked
 * on the developer's machine; it failed in every server / cloud environment
 * because the Next.js runtime has no writable filesystem.
 *
 * Required env variable:
 *   BLOB_READ_WRITE_TOKEN  — obtained from the Vercel dashboard (Storage tab).
 *   Works both locally and in production; just add it to .env.
 */

import { put, del as blobDel } from "@vercel/blob";
import { randomUUID } from "crypto";

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

const MAX_SIZE_MB = 15;
const MAX_BYTES   = MAX_SIZE_MB * 1024 * 1024;

// ─── Public types ─────────────────────────────────────────────────────────────

export interface StorageResult {
  url:          string; // Full HTTPS URL on Vercel Blob's CDN
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

// ─── Internal helper ──────────────────────────────────────────────────────────

async function uploadToBlob(
  file:         File,
  folder:       string,
  allowedTypes: string[],
): Promise<StorageResult> {
  if (!allowedTypes.includes(file.type)) {
    throw new StorageError(
      `Unsupported file type "${file.type}". Allowed: ${allowedTypes.join(", ")}`,
    );
  }

  if (file.size > MAX_BYTES) {
    throw new StorageError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
  }

  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const pathname = `${folder}/${filename}`;

  // `put` streams the file directly to Vercel Blob.
  // access: "public" means the URL is publicly readable (no signed URL needed).
  const { url } = await put(pathname, file, { access: "public" });

  return {
    url,
    filename,
    sizeBytes:    file.size,
    mimeType:     file.type,
    originalName: file.name,
  };
}

// ─── Public upload functions ──────────────────────────────────────────────────

/** Gallery updates (photos + documents) posted by admins / project managers. */
export async function saveUpload(file: File): Promise<StorageResult> {
  return uploadToBlob(file, "uploads/gallery", ALLOWED_TYPES);
}

/** Product catalogue images. */
export async function saveProductImageUpload(file: File): Promise<StorageResult> {
  return uploadToBlob(file, "uploads/product-images", IMAGE_TYPES);
}

/** Homepage advertisement images. */
export async function saveHomepageAdImageUpload(file: File): Promise<StorageResult> {
  return uploadToBlob(file, "uploads/homepage-ads", IMAGE_TYPES);
}

// ─── URL validation helpers ───────────────────────────────────────────────────
//
// After moving to Vercel Blob, all new uploads return full HTTPS URLs like:
//   https://xxxx.public.blob.vercel-storage.com/uploads/gallery/uuid.jpg
//
// The helpers below accept both the new Blob URLs and the old local paths
// (e.g. /uploads/gallery/…) that may already exist in the database.

function isVercelBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return (
      protocol === "https:" &&
      hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export function isSafeUploadUrl(url: string): boolean {
  return (
    isVercelBlobUrl(url) ||
    (url.startsWith("/uploads/gallery/") && !url.includes(".."))
  );
}

export function isSafeProductImageUrl(url: string): boolean {
  return (
    isVercelBlobUrl(url) ||
    (url.startsWith("/uploads/product-images/") && !url.includes(".."))
  );
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
  return (
    isVercelBlobUrl(url) ||
    (url.startsWith("/uploads/homepage-ads/") && !url.includes(".."))
  );
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

// ─── Delete helpers ───────────────────────────────────────────────────────────

/** Delete a product catalogue image from Vercel Blob (or silently skip old local paths). */
export async function deleteProductLibraryImageFile(url: string): Promise<void> {
  if (!isManagedProductLibraryImageUrl(url)) {
    throw new StorageError("Only product catalogue images can be deleted.", 400);
  }
  if (isVercelBlobUrl(url)) {
    await blobDel(url);
  }
  // Old local-path URLs — the file no longer exists on the server, nothing to delete.
}

/** Delete a homepage ad image from Vercel Blob (or silently skip old local paths). */
export async function deleteHomepageAdLibraryImageFile(url: string): Promise<void> {
  if (!isManagedHomepageAdLibraryImageUrl(url)) {
    throw new StorageError("Only homepage ad images can be deleted.", 400);
  }
  if (isVercelBlobUrl(url)) {
    await blobDel(url);
  }
}
