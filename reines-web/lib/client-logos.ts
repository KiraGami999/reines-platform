import "server-only";

import { prisma } from "@/lib/prisma";
import { resolveStorageUrl } from "@/lib/storage";
import {
  FALLBACK_CLIENT_LOGOS,
  FALLBACK_CLIENT_LOGOS_SETTINGS,
  type ClientLogoItem,
  type ClientLogosSettings,
} from "@/lib/client-logos-data";

export {
  FALLBACK_CLIENT_LOGOS,
  FALLBACK_CLIENT_LOGOS_SETTINGS,
  type ClientLogoItem,
  type ClientLogosSettings,
} from "@/lib/client-logos-data";

const SETTINGS_ID = "global";

function serializeLogo(row: {
  id: string;
  name: string;
  lightLogoUrl: string;
  darkLogoUrl: string | null;
  websiteUrl: string | null;
  sortOrder: number;
}): ClientLogoItem {
  return {
    id: row.id,
    name: row.name,
    lightLogoUrl: resolveStorageUrl(row.lightLogoUrl) ?? row.lightLogoUrl,
    darkLogoUrl: row.darkLogoUrl ? resolveStorageUrl(row.darkLogoUrl) ?? row.darkLogoUrl : "",
    websiteUrl: row.websiteUrl ?? "",
    sortOrder: row.sortOrder,
  };
}

export type ClientLogosPageData = {
  settings: ClientLogosSettings;
  logos: ClientLogoItem[];
};

/** Public read — used by the homepage "Clients We've Worked With" section. */
export async function getClientLogosPageData(): Promise<ClientLogosPageData> {
  try {
    const [settingsRow, rows] = await Promise.all([
      prisma.clientLogoSetting.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.clientLogo.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);

    return {
      settings: settingsRow ? { visible: settingsRow.visible } : FALLBACK_CLIENT_LOGOS_SETTINGS,
      logos: rows.length > 0 ? rows.map(serializeLogo) : FALLBACK_CLIENT_LOGOS,
    };
  } catch {
    return {
      settings: FALLBACK_CLIENT_LOGOS_SETTINGS,
      logos: FALLBACK_CLIENT_LOGOS,
    };
  }
}

/** Lightweight visibility check for the admin overview card. */
export async function isClientLogosVisible(): Promise<boolean> {
  try {
    const settingsRow = await prisma.clientLogoSetting.findUnique({ where: { id: SETTINGS_ID } });
    return settingsRow ? settingsRow.visible : FALLBACK_CLIENT_LOGOS_SETTINGS.visible;
  } catch {
    return FALLBACK_CLIENT_LOGOS_SETTINGS.visible;
  }
}

export type AdminClientLogosData = ClientLogosPageData & { usingFallback: boolean };

/** Admin read — always resolves, and reports whether it's showing seeded fallback content. */
export async function getAdminClientLogos(): Promise<AdminClientLogosData> {
  try {
    const [settingsRow, rows] = await Promise.all([
      prisma.clientLogoSetting.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.clientLogo.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);

    return {
      settings: settingsRow ? { visible: settingsRow.visible } : FALLBACK_CLIENT_LOGOS_SETTINGS,
      logos: rows.length > 0 ? rows.map(serializeLogo) : FALLBACK_CLIENT_LOGOS,
      usingFallback: !settingsRow && rows.length === 0,
    };
  } catch {
    return {
      settings: FALLBACK_CLIENT_LOGOS_SETTINGS,
      logos: FALLBACK_CLIENT_LOGOS,
      usingFallback: true,
    };
  }
}
