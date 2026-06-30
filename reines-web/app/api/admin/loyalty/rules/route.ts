import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden, validationError } from "@/lib/api-response";
import { getPointRule } from "@/lib/loyalty";
import { z } from "zod";

const schema = z.object({
  pointsPerUnit:  z.number().int().min(1).max(1000),
  unitAmount:     z.number().int().min(1000),
  minSpendToEarn: z.number().int().min(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();
  return ok(await getPointRule());
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const rule = await prisma.pointRule.upsert({
    where: { id: "global" },
    update: parsed.data,
    create: { id: "global", ...parsed.data },
  });

  return ok(rule);
}
