import { readdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  AVAILABLE_PRODUCT_IMAGES,
  type AvailableProductImage,
} from "@/lib/product-catalog-data";
import { isManagedProductLibraryImageUrl } from "@/lib/storage";

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

async function scanImageDirectory(publicSubdir: string): Promise<AvailableProductImage[]> {
  const dir = path.join(process.cwd(), "public", publicSubdir);
  const urlPrefix = `/${publicSubdir.replace(/\\/g, "/")}`;

  try {
    const files = await readdir(dir);
    return files
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .map((file) => {
        const base = file.replace(/\.[^.]+$/, "");
        const title = base
          .split(/[-_]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

        return {
          imageUrl: `${urlPrefix}/${file}`,
          alt: title,
          defaultTitle: title,
        };
      });
  } catch {
    return [];
  }
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

  const fromDisk = mergeImages(
    await scanImageDirectory("product-images"),
    await scanImageDirectory("uploads/product-images")
  );

  const fromPresets = AVAILABLE_PRODUCT_IMAGES.filter(
    (image) =>
      isManagedProductLibraryImageUrl(image.imageUrl) && !hidden.has(image.imageUrl)
  );

  return mergeImages(fromPresets, fromDisk, fromProducts);
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
