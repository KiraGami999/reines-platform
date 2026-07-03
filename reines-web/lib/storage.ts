import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

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
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface StorageResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  originalName: string;
}

export class StorageError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

async function saveFileToPublicDir(
  file: File,
  publicSubdir: string,
  allowedTypes: string[]
): Promise<StorageResult> {
  if (!allowedTypes.includes(file.type)) {
    throw new StorageError(
      `Unsupported file type. Allowed: ${allowedTypes.join(", ")}`
    );
  }

  if (file.size > MAX_BYTES) {
    throw new StorageError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", publicSubdir);

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  return {
    url: `/${publicSubdir.replace(/\\/g, "/")}/${filename}`,
    filename,
    sizeBytes: file.size,
    mimeType: file.type,
    originalName: file.name,
  };
}

/**
 * Save an uploaded File to Cloudinary (production) or /public/uploads/gallery/ (local dev).
 *
 * Cloudinary is used whenever CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are set.
 * In local development without those vars, files are written to the local filesystem.
 */
export async function saveUpload(file: File): Promise<StorageResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new StorageError(
      `Unsupported file type. Allowed: ${ALLOWED_TYPES.join(", ")}`
    );
  }
  if (file.size > MAX_BYTES) {
    throw new StorageError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
  }

  // ── Cloudinary (production) ──────────────────────────────────────────────────
  if (isCloudinaryConfigured()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cloudinary upload_stream wrapped in a promise
    const result = await new Promise<{ secure_url: string; original_filename: string }>((resolve, reject) => {
      const isRaw = !file.type.startsWith("image/");
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:        "reines-gallery",
          resource_type: isRaw ? "raw" : "image",
          use_filename:  false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
          resolve(result as { secure_url: string; original_filename: string });
        }
      );
      stream.end(buffer);
    });

    return {
      url:          result.secure_url,
      filename:     result.secure_url.split("/").pop() ?? file.name,
      sizeBytes:    file.size,
      mimeType:     file.type,
      originalName: file.name,
    };
  }

  // ── Local filesystem (dev only) ──────────────────────────────────────────────
  return saveFileToPublicDir(file, "uploads/gallery", ALLOWED_TYPES);
}

/**
 * Save a product catalogue image to /public/uploads/product-images/.
 */
export async function saveProductImageUpload(file: File): Promise<StorageResult> {
  return saveFileToPublicDir(file, "uploads/product-images", IMAGE_TYPES);
}

/**
 * Save a homepage ad image to /public/uploads/homepage-ads/.
 */
export async function saveHomepageAdImageUpload(file: File): Promise<StorageResult> {
  return saveFileToPublicDir(file, "uploads/homepage-ads", IMAGE_TYPES);
}

/** Validate that a string is a safe gallery upload URL (prevents open redirect).
 *  Accepts Cloudinary CDN URLs and legacy local paths. */
export function isSafeUploadUrl(url: string): boolean {
  if (url.startsWith("/uploads/gallery/") && !url.includes("..")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

/** Validate uploaded product image paths saved by saveProductImageUpload. */
export function isSafeProductImageUrl(url: string): boolean {
  return url.startsWith("/uploads/product-images/") && !url.includes("..");
}

/** Validate static product images shipped under /public/product-images/. */
export function isSafeStaticProductImageUrl(url: string): boolean {
  return url.startsWith("/product-images/") && !url.includes("..");
}

/** Product catalogue images that admins may remove from the library. */
export function isManagedProductLibraryImageUrl(url: string): boolean {
  return isSafeProductImageUrl(url) || isSafeStaticProductImageUrl(url);
}

/** Validate any image URL assignable to a catalogue product. */
export function isAssignableProductImageUrl(url: string): boolean {
  return isManagedProductLibraryImageUrl(url);
}

export async function deleteProductLibraryImageFile(url: string): Promise<void> {
  if (!isManagedProductLibraryImageUrl(url)) {
    throw new StorageError("Only product catalogue images can be deleted.", 400);
  }

  await deletePublicImageFile(url);
}

/** Validate uploaded homepage ad image paths. */
export function isSafeHomepageAdUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/homepage-ads/") && !url.includes("..");
}

/** Validate static homepage ad images under /public/homepage-ads/. */
export function isSafeStaticHomepageAdUrl(url: string): boolean {
  return url.startsWith("/homepage-ads/") && !url.includes("..");
}

/** Homepage ad images that admins may manage in the library. */
export function isManagedHomepageAdLibraryImageUrl(url: string): boolean {
  return isSafeHomepageAdUploadUrl(url) || isSafeStaticHomepageAdUrl(url);
}

/** Validate any image URL assignable to a homepage ad. */
export function isAssignableHomepageAdImageUrl(url: string): boolean {
  return isManagedHomepageAdLibraryImageUrl(url);
}

export async function deleteHomepageAdLibraryImageFile(url: string): Promise<void> {
  if (!isManagedHomepageAdLibraryImageUrl(url)) {
    throw new StorageError("Only homepage ad images can be deleted.", 400);
  }

  await deletePublicImageFile(url);
}

async function deletePublicImageFile(url: string): Promise<void> {
  const relative = url.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", ...relative.split("/"));
  const publicRoot = path.join(process.cwd(), "public");

  if (!filePath.startsWith(publicRoot)) {
    throw new StorageError("Invalid image path.", 400);
  }

  try {
    await unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw new StorageError("Could not delete image file.", 500);
    }
  }
}
