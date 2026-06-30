import { readdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  AVAILABLE_HOMEPAGE_IMAGES,
  type AvailableHomepageImage,
} from "@/lib/homepage-ads";
import { isManagedHomepageAdLibraryImageUrl } from "@/lib/storage";

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

async function scanImageDirectory(publicSubdir: string): Promise<AvailableHomepageImage[]> {
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
          defaultSubtitle: "Add a subtitle for this homepage ad after selecting it.",
        };
      });
  } catch {
    return [];
  }
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

  const fromDisk = mergeImages(
    await scanImageDirectory("homepage-ads"),
    await scanImageDirectory("uploads/homepage-ads")
  );

  const fromPresets = AVAILABLE_HOMEPAGE_IMAGES.filter(
    (image) => !hidden.has(image.imageUrl)
  );

  return mergeImages(fromPresets, fromDisk, fromAds);
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
