import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminMarketInsights, formatMetricLine } from "@/lib/market-insights";
import { MARKET_INSIGHT_ICON_OPTIONS } from "@/lib/market-insight-icons";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";

const iconValues = MARKET_INSIGHT_ICON_OPTIONS.map((icon) => icon.value) as [string, ...string[]];

const highlightSchema = z.object({
  label: z.string().trim().min(1, "Add a label").max(60),
  value: z.string().trim().min(1, "Add a value").max(30),
  note: z.string().trim().min(1, "Add a short note").max(140),
  sortOrder: z.number().int().min(0).max(200),
});

const metricSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(40),
});

const cardSchema = z.object({
  iconKey: z.enum(iconValues),
  title: z.string().trim().min(2, "Add a title").max(100),
  subtitle: z.string().trim().max(80).default(""),
  body: z.string().trim().min(10, "Description must be at least 10 characters").max(900),
  metrics: z.array(metricSchema).max(6).default([]),
  sortOrder: z.number().int().min(0).max(200),
});

const settingsSchema = z.object({
  visible: z.boolean().default(true),
  heroTag: z.string().trim().min(1).max(60),
  heroTitle: z.string().trim().min(5).max(160),
  heroDescription: z.string().trim().min(10).max(600),
  snapshotTitle: z.string().trim().min(2).max(100),
  snapshotDescription: z.string().trim().min(10).max(500),
  planningTag: z.string().trim().min(1).max(60),
  planningTitle: z.string().trim().min(5).max(160),
  planningDescription: z.string().trim().min(10).max(600),
  planningNotes: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
  ctaLabel: z.string().trim().min(1).max(60),
  ctaHref: z.string().trim().min(1).max(200),
});

const updateSchema = z.object({
  settings: settingsSchema,
  highlights: z.array(highlightSchema).max(12).default([]),
  cards: z.array(cardSchema).max(24).default([]),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return forbidden();

  try {
    const data = await getAdminMarketInsights();
    return ok(data);
  } catch {
    return serverError("Could not load market insights content.");
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { settings, highlights, cards } = parsed.data;

  try {
    await prisma.$transaction([
      prisma.marketInsightsSetting.upsert({
        where: { id: "global" },
        create: { id: "global", ...settings },
        update: { ...settings },
      }),
      prisma.marketInsightHighlight.deleteMany(),
      prisma.marketInsightHighlight.createMany({
        data: highlights.map((highlight, sortOrder) => ({ ...highlight, sortOrder })),
      }),
      prisma.marketInsightCard.deleteMany(),
      prisma.marketInsightCard.createMany({
        data: cards.map((card, sortOrder) => ({
          iconKey: card.iconKey,
          title: card.title,
          subtitle: card.subtitle || null,
          body: card.body,
          metrics: card.metrics.map(formatMetricLine),
          sortOrder,
        })),
      }),
    ]);

    revalidatePath("/market-insights");
    revalidatePath("/", "layout");
    revalidatePath("/dashboard/admin/market-insights");

    const saved = await getAdminMarketInsights();
    return ok(saved);
  } catch {
    return serverError("Could not save market insights. Run the Prisma schema update first, then try again.");
  }
}
