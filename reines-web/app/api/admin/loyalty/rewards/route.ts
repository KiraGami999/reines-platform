import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, created, forbidden, validationError } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  name:        z.string().min(2, "Name is required"),
  description: z.string().min(5, "Add a description"),
  pointsCost:  z.number().int().min(1),
  category:    z.string().default("DISCOUNT"),
  active:      z.boolean().default(true),
  sortOrder:   z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  try {
    const rewards = await prisma.reward.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return ok(rewards);
  } catch {
    return ok([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const reward = await prisma.reward.create({ data: parsed.data });
  return created(reward);
}
