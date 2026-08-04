import "server-only";

import { prisma } from "@/lib/prisma";
import {
  FALLBACK_TESTIMONIALS,
  FALLBACK_TESTIMONIALS_SETTINGS,
  type TestimonialItem,
  type TestimonialsSettings,
} from "@/lib/testimonials-data";

export {
  FALLBACK_TESTIMONIALS,
  FALLBACK_TESTIMONIALS_SETTINGS,
  TESTIMONIAL_ACCENT_OPTIONS,
  getTestimonialInitials,
  type TestimonialItem,
  type TestimonialsSettings,
} from "@/lib/testimonials-data";

const SETTINGS_ID = "global";

function serializeTestimonial(row: {
  id: string;
  clientName: string;
  clientTitle: string;
  quote: string;
  accentColor: string;
  sortOrder: number;
}): TestimonialItem {
  return {
    id: row.id,
    clientName: row.clientName,
    clientTitle: row.clientTitle,
    quote: row.quote,
    accentColor: row.accentColor,
    sortOrder: row.sortOrder,
  };
}

export type TestimonialsPageData = {
  settings: TestimonialsSettings;
  testimonials: TestimonialItem[];
};

/** Public read — used by the homepage "What Our Clients Say" section. */
export async function getTestimonialsPageData(): Promise<TestimonialsPageData> {
  try {
    const [settingsRow, rows] = await Promise.all([
      prisma.testimonialsSetting.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);

    return {
      settings: settingsRow ? { visible: settingsRow.visible } : FALLBACK_TESTIMONIALS_SETTINGS,
      testimonials: rows.length > 0 ? rows.map(serializeTestimonial) : FALLBACK_TESTIMONIALS,
    };
  } catch {
    return {
      settings: FALLBACK_TESTIMONIALS_SETTINGS,
      testimonials: FALLBACK_TESTIMONIALS,
    };
  }
}

/** Lightweight visibility check for the admin overview card. */
export async function isTestimonialsVisible(): Promise<boolean> {
  try {
    const settingsRow = await prisma.testimonialsSetting.findUnique({ where: { id: SETTINGS_ID } });
    return settingsRow ? settingsRow.visible : FALLBACK_TESTIMONIALS_SETTINGS.visible;
  } catch {
    return FALLBACK_TESTIMONIALS_SETTINGS.visible;
  }
}

export type AdminTestimonialsData = TestimonialsPageData & { usingFallback: boolean };

/** Admin read — always resolves, and reports whether it's showing seeded fallback content. */
export async function getAdminTestimonials(): Promise<AdminTestimonialsData> {
  try {
    const [settingsRow, rows] = await Promise.all([
      prisma.testimonialsSetting.findUnique({ where: { id: SETTINGS_ID } }),
      prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    ]);

    return {
      settings: settingsRow ? { visible: settingsRow.visible } : FALLBACK_TESTIMONIALS_SETTINGS,
      testimonials: rows.length > 0 ? rows.map(serializeTestimonial) : FALLBACK_TESTIMONIALS,
      usingFallback: !settingsRow && rows.length === 0,
    };
  } catch {
    return {
      settings: FALLBACK_TESTIMONIALS_SETTINGS,
      testimonials: FALLBACK_TESTIMONIALS,
      usingFallback: true,
    };
  }
}
