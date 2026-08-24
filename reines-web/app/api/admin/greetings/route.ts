import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getPortalGreetingSettings,
  savePortalGreetingSettings,
} from "@/lib/greetings";
import { forbidden, ok, serverError, validationError } from "@/lib/api-response";

const phraseList = z
  .array(z.string().trim().max(80, "Keep each greeting under 80 characters"))
  .max(3, "Up to 3 language variants per time of day");

const updateSchema = z.object({
  enabled: z.boolean(),
  morning: phraseList.default([]),
  afternoon: phraseList.default([]),
  evening: phraseList.default([]),
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
    const settings = await getPortalGreetingSettings();
    return ok({ settings });
  } catch {
    return serverError("Could not load portal greetings.");
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return forbidden();

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const settings = await savePortalGreetingSettings(parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/admin/greetings");
    return ok({ settings });
  } catch (err) {
    console.error("[api/admin/greetings]", err);
    return serverError("Could not save portal greetings.");
  }
}
