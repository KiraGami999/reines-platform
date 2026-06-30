import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, forbidden, notFound, validationError } from "@/lib/api-response";
import { z } from "zod";

const schema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  pointsCost:  z.number().int().min(1).optional(),
  category:    z.string().optional(),
  active:      z.boolean().optional(),
  sortOrder:   z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const reward = await prisma.reward.update({ where: { id }, data: parsed.data });
    return ok(reward);
  } catch {
    return notFound("Reward");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  try {
    await prisma.reward.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return notFound("Reward");
  }
}
