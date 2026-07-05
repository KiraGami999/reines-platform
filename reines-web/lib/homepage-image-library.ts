import { list } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  AVAILABLE_HOMEPAGE_IMAGES,
  type AvailableHomepageImage,
} from "@/lib/homepage-ads-shared";
import { isManagedHomepageAdLibraryImageUrl, resolveStorageUrl } from "@/lib/storage";

const SETTING_ID = "global";
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

async function getHiddenImageUrls(): Promise<Set<string>> {
  try {
    const setting = await prisma.homepageAdSetting.findUnique({
      where: { id: SETTING_ID },
    });
    return new Set(setting?.hiddenImageUrls ?? []);
  } catch {
    return new Set();
  }
}

async function scanBlobFolder(prefix: string): Promise<AvailableHomepageImage[]> {
  const results: AvailableHomepageImage[] = [];

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
          defaultSubtitle: "Add a subtitle for this homepage ad after selecting it.",
        });
      }
      cursor = listing.hasMore ? listing.cursor : undefined;
    } while (cursor);
  } catch {
    // Blob store may not have this folder yet — that's fine
  }

  return results;
}

function mergeImages(...groups: AvailableHomepageImage[][]): AvailableHomepageImage[] {
  const merged: AvailableHomepageImage[] = [];

  for (const group of groups) {
    for (const image of group) {
      if (!merged.some((item) => item.imageUrl === image.imageUrl)) {
        merged.push(image);
      }
    }
  }

  return merged;
}

export async function getHomepageImageLibrary(): Promise<AvailableHomepageImage[]> {
  const hidden = await getHiddenImageUrls();

  const fromAds = await prisma.homepageAd
    .findMany({ select: { imageUrl: true, title: true, subtitle: true } })
    .then((rows) =>
      rows
        .filter((row) => isManagedHomepageAdLibraryImageUrl(row.imageUrl) && !hidden.has(row.imageUrl))
        .map((row) => ({
          imageUrl: row.imageUrl,
          alt: row.title,
          defaultTitle: row.title,
          defaultSubtitle: row.subtitle ?? "",
        }))
    )
    .catch(() => [] as AvailableHomepageImage[]);

  const fromBlob = await scanBlobFolder("uploads/homepage-ads/");

  const fromPresets = AVAILABLE_HOMEPAGE_IMAGES.filter(
    (image) => !hidden.has(image.imageUrl)
  );

  // Resolve blob URLs to /api/media proxy URLs for display
  const all = mergeImages(fromPresets, fromBlob, fromAds);
  return all.map((img) => ({
    ...img,
    imageUrl: resolveStorageUrl(img.imageUrl) ?? img.imageUrl,
  }));
}

export async function hideHomepageLibraryImage(imageUrl: string): Promise<void> {
  const existing = await prisma.homepageAdSetting.findUnique({
    where: { id: SETTING_ID },
  });

  if (existing?.hiddenImageUrls.includes(imageUrl)) return;

  if (!existing) {
    await prisma.homepageAdSetting.create({
      data: { id: SETTING_ID, hiddenImageUrls: [imageUrl] },
    });
    return;
  }

  await prisma.homepageAdSetting.update({
    where: { id: SETTING_ID },
    data: { hiddenImageUrls: [...existing.hiddenImageUrls, imageUrl] },
  });
}

export async function getHomepageAdsUsingImage(imageUrl: string): Promise<string[]> {
  const ads = await prisma.homepageAd.findMany({
    where: { imageUrl },
    select: { title: true },
    orderBy: { title: "asc" },
  });

  return ads.map((ad) => ad.title);
}
