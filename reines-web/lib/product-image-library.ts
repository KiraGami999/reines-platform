import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  AVAILABLE_PRODUCT_IMAGES,
  type AvailableProductImage,
} from "@/lib/product-catalog-data";
import { isManagedProductLibraryImageUrl, resolveStorageUrl } from "@/lib/storage";

const CATALOG_SETTING_ID = "global";
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

async function getHiddenImageUrls(): Promise<Set<string>> {
  try {
    const setting = await prisma.productCatalogSetting.findUnique({
      where: { id: CATALOG_SETTING_ID },
    });
    return new Set(setting?.hiddenImageUrls ?? []);
  } catch {
    return new Set();
  }
}

async function scanBlobFolder(prefix: string): Promise<AvailableProductImage[]> {
  const results: AvailableProductImage[] = [];

  try {
    let cursor: string | undefined;
    do {
      const listing = await list({ prefix, cursor, limit: 100 });
      for (const blob of listing.blobs) {
        const ext = blob.pathname.split(".").pop()?.toLowerCase() ?? "";
        if (!IMAGE_EXTENSIONS.has(`.${ext}`)) continue;

        const filename = blob.pathname.split("/").pop() ?? blob.pathname;
        const base = filename.replace(/\.[^.]+$/, "");
        const title = base
          .split(/[-_]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

        results.push({
          imageUrl: blob.url,
          alt: title,
          defaultTitle: title,
        });
      }
      cursor = listing.hasMore ? listing.cursor : undefined;
    } while (cursor);
  } catch {
    // Blob store may not have this folder yet
  }

  return results;
}

function mergeImages(...groups: AvailableProductImage[][]): AvailableProductImage[] {
  const merged: AvailableProductImage[] = [];

  for (const group of groups) {
    for (const image of group) {
      if (!merged.some((item) => item.imageUrl === image.imageUrl)) {
        merged.push(image);
      }
    }
  }

  return merged;
}

export async function getProductImageLibrary(): Promise<AvailableProductImage[]> {
  const hidden = await getHiddenImageUrls();

  const fromProducts = await prisma.product
    .findMany({ select: { imageUrl: true, name: true } })
    .then((rows) =>
      rows
        .filter((row) => isManagedProductLibraryImageUrl(row.imageUrl) && !hidden.has(row.imageUrl))
        .map((row) => ({
          imageUrl: row.imageUrl,
          alt: row.name,
          defaultTitle: row.name,
        }))
    )
    .catch(() => [] as AvailableProductImage[]);

  const fromBlob = await scanBlobFolder("uploads/product-images/");

  const fromPresets = AVAILABLE_PRODUCT_IMAGES.filter(
    (image) =>
      isManagedProductLibraryImageUrl(image.imageUrl) && !hidden.has(image.imageUrl)
  );

  const all = mergeImages(fromPresets, fromBlob, fromProducts);
  return all.map((img) => ({
    ...img,
    imageUrl: resolveStorageUrl(img.imageUrl) ?? img.imageUrl,
  }));
}

export async function hideProductLibraryImage(imageUrl: string): Promise<void> {
  const existing = await prisma.productCatalogSetting.findUnique({
    where: { id: CATALOG_SETTING_ID },
  });

  if (existing?.hiddenImageUrls.includes(imageUrl)) return;

  if (!existing) {
    await prisma.productCatalogSetting.create({
      data: { id: CATALOG_SETTING_ID, hiddenImageUrls: [imageUrl] },
    });
    return;
  }

  await prisma.productCatalogSetting.update({
    where: { id: CATALOG_SETTING_ID },
    data: { hiddenImageUrls: [...existing.hiddenImageUrls, imageUrl] },
  });
}

export async function getProductsUsingImage(imageUrl: string): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { imageUrl },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return products.map((product) => product.name);
}
