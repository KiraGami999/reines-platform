/**
 * URL helpers for stored files (no server-only imports — safe for client components).
 */

export type BlobAccessMode = "public" | "private";

export function getBlobAccessMode(): BlobAccessMode {
  const mode = process.env.BLOB_ACCESS?.trim().toLowerCase();
  return mode === "public" ? "public" : "private";
}

export function isStoredBlobUrl(url: string): boolean {
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

export function parseBlobPathname(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export function resolveStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.includes("..")) return url;
  if (isStoredBlobUrl(url)) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function isPublicBlobPath(pathname: string): boolean {
  return (
    pathname.startsWith("uploads/homepage-ads/") ||
    pathname.startsWith("uploads/product-images/")
  );
}

export function isSafeUploadUrl(url: string): boolean {
  return isStoredBlobUrl(url) || (url.startsWith("/uploads/gallery/") && !url.includes(".."));
}

export function isSafeProductImageUrl(url: string): boolean {
  return (
    isStoredBlobUrl(url) ||
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
    isStoredBlobUrl(url) ||
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
