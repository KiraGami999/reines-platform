import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
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

function resolveMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_MIME[ext]) return EXT_MIME[ext];
  return file.type || "application/octet-stream";
}

async function saveFileToPublicDir(
  file: File,
  publicSubdir: string,
  allowedTypes: string[]
): Promise<StorageResult> {
  const mimeType = resolveMimeType(file);

  if (!mimeType || !allowedTypes.includes(mimeType)) {
    throw new StorageError(
      `Unsupported file type "${mimeType || "unknown"}". Allowed: images (JPEG, PNG, WEBP, GIF), PDF, and Word documents.`
    );
  }

  if (file.size > MAX_BYTES) {
    throw new StorageError(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", publicSubdir);

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  return {
    url: `/${publicSubdir.replace(/\\/g, "/")}/${filename}`,
    filename,
    sizeBytes: file.size,
    mimeType,
    originalName: file.name,
  };
}

export async function saveUpload(file: File): Promise<StorageResult> {
  return saveFileToPublicDir(file, "uploads/gallery", ALLOWED_TYPES);
}

export async function saveProductImageUpload(file: File): Promise<StorageResult> {
  return saveFileToPublicDir(file, "uploads/product-images", IMAGE_TYPES);
}

export async function saveHomepageAdImageUpload(file: File): Promise<StorageResult> {
  return saveFileToPublicDir(file, "uploads/homepage-ads", IMAGE_TYPES);
}

export function isSafeUploadUrl(url: string): boolean {
  return url.startsWith("/uploads/gallery/") && !url.includes("..");
}

export function isSafeProductImageUrl(url: string): boolean {
  return url.startsWith("/uploads/product-images/") && !url.includes("..");
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
  return url.startsWith("/uploads/homepage-ads/") && !url.includes("..");
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

export async function deleteProductLibraryImageFile(url: string): Promise<void> {
  if (!isManagedProductLibraryImageUrl(url)) {
    throw new StorageError("Only product catalogue images can be deleted.", 400);
  }
  await deletePublicFile(url);
}

export async function deleteHomepageAdLibraryImageFile(url: string): Promise<void> {
  if (!isManagedHomepageAdLibraryImageUrl(url)) {
    throw new StorageError("Only homepage ad images can be deleted.", 400);
  }
  await deletePublicFile(url);
}

async function deletePublicFile(url: string): Promise<void> {
  const relative = url.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", ...relative.split("/"));
  const publicRoot = path.join(process.cwd(), "public");

  if (!filePath.startsWith(publicRoot)) {
    throw new StorageError("Invalid file path.", 400);
  }

  try {
    await unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw new StorageError("Could not delete file.", 500);
    }
  }
}
