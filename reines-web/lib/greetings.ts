import "server-only";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PORTAL_GREETINGS,
  MAX_GREETING_VARIANTS,
  type GreetingPeriod,
  type PortalGreetingSettings,
} from "@/lib/greetings-data";

export type { GreetingPeriod, PortalGreetingSettings };
export { DEFAULT_PORTAL_GREETINGS, MAX_GREETING_VARIANTS };

const SETTINGS_ID = "global";
/** Malawi local time for morning / afternoon / evening boundaries. */
const GREETING_TIMEZONE = "Africa/Blantyre";

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function normalizeVariants(values: string[] | null | undefined): string[] {
  return (values ?? [])
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, MAX_GREETING_VARIANTS);
}

export function getGreetingPeriod(now = new Date()): GreetingPeriod {
  const hourStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: GREETING_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).format(now);
  const hour = Number(hourStr);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/**
 * Pick a greeting variant.
 * With a seed: stable pick (legacy login-seed behaviour).
 * Without a seed: random pick each call — used when opening Overview / refreshing the tab.
 * `exclude` skips a previous phrase when other options exist.
 */
function pickVariant(
  variants: string[],
  seed?: number | null,
  exclude?: string | null
): string | null {
  if (variants.length === 0) return null;

  const pool =
    exclude && variants.length > 1
      ? variants.filter((v) => v.trim() !== exclude.trim())
      : variants;
  const list = pool.length > 0 ? pool : variants;

  if (seed == null) {
    const index = Math.floor(Math.random() * list.length);
    return list[index] ?? list[0] ?? null;
  }

  const index = Math.abs(Math.trunc(seed)) % list.length;
  return list[index] ?? list[0] ?? null;
}

function formatGreeting(phrase: string, name: string): string {
  const person = firstName(name);
  const trimmed = phrase.trim();
  if (!trimmed) return `Welcome ${person}`;
  if (trimmed.includes("{name}")) {
    return trimmed.replaceAll("{name}", person);
  }
  // Punctuation lives in the phrase itself (e.g. "Good morning!" / "Muli bwanji?").
  return `${trimmed} ${person}`;
}

export async function getPortalGreetingSettings(): Promise<PortalGreetingSettings> {
  try {
    const row = await prisma.portalGreetingSetting.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (!row) return DEFAULT_PORTAL_GREETINGS;
    return {
      enabled: row.enabled,
      morning: normalizeVariants(row.morning),
      afternoon: normalizeVariants(row.afternoon),
      evening: normalizeVariants(row.evening),
    };
  } catch {
    return DEFAULT_PORTAL_GREETINGS;
  }
}

/**
 * Builds the portal welcome greeting for the given name using admin-managed
 * morning / afternoon / evening phrases (up to 5 variants each).
 * Omit `greetingSeed` for a fresh random phrase (Overview open / tab return).
 * Pass `excludePhrase` to avoid repeating the last shown greeting when possible.
 */
export async function getPortalGreeting(
  name: string,
  options?: {
    now?: Date;
    greetingSeed?: number | null;
    excludePhrase?: string | null;
  }
): Promise<string> {
  const now = options?.now ?? new Date();
  const settings = await getPortalGreetingSettings();
  if (!settings.enabled) {
    return `Welcome ${firstName(name)}`;
  }

  const period = getGreetingPeriod(now);
  const variants = settings[period];
  const seed = options?.greetingSeed;
  const person = firstName(name);
  const excludeBase = options?.excludePhrase
    ? options.excludePhrase
        .replace(
          new RegExp(
            `\\s+${person.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`
          ),
          ""
        )
        .trim()
    : null;
  const phrase = pickVariant(variants, seed, excludeBase);
  if (!phrase) {
    const fallback =
      pickVariant(DEFAULT_PORTAL_GREETINGS[period], seed, excludeBase) ?? "Welcome";
    return formatGreeting(fallback, name);
  }
  return formatGreeting(phrase, name);
}

export async function savePortalGreetingSettings(
  input: PortalGreetingSettings
): Promise<PortalGreetingSettings> {
  const data = {
    enabled: input.enabled,
    morning: normalizeVariants(input.morning),
    afternoon: normalizeVariants(input.afternoon),
    evening: normalizeVariants(input.evening),
  };

  const row = await prisma.portalGreetingSetting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });

  return {
    enabled: row.enabled,
    morning: normalizeVariants(row.morning),
    afternoon: normalizeVariants(row.afternoon),
    evening: normalizeVariants(row.evening),
  };
}
