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
 * Pick a greeting variant using a per-login seed so the phrase changes each
 * time the user signs in, but stays stable for the rest of that session.
 */
function pickVariant(variants: string[], seed: number): string | null {
  if (variants.length === 0) return null;
  const index = Math.abs(Math.trunc(seed)) % variants.length;
  return variants[index] ?? variants[0] ?? null;
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
 * Pass `greetingSeed` from the session (set on login) so the phrase rotates
 * per sign-in.
 */
export async function getPortalGreeting(
  name: string,
  options?: { now?: Date; greetingSeed?: number | null }
): Promise<string> {
  const now = options?.now ?? new Date();
  const seed = options?.greetingSeed ?? now.getTime();
  const settings = await getPortalGreetingSettings();
  if (!settings.enabled) {
    return `Welcome ${firstName(name)}`;
  }

  const period = getGreetingPeriod(now);
  const variants = settings[period];
  const phrase = pickVariant(variants, seed);
  if (!phrase) {
    const fallback = pickVariant(DEFAULT_PORTAL_GREETINGS[period], seed) ?? "Welcome";
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
