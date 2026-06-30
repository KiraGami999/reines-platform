import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { forbidden, ok, serverError } from "@/lib/api-response";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return forbidden();

  const clearedAt = new Date();

  try {
    await prisma.$executeRaw`
      INSERT INTO "AdminOverviewPreference" ("id", "recentActivityClearedAt", "updatedAt")
      VALUES ('global', ${clearedAt}, ${clearedAt})
      ON CONFLICT ("id")
      DO UPDATE SET "recentActivityClearedAt" = ${clearedAt}, "updatedAt" = ${clearedAt}
    `;

    return ok({ recentActivityClearedAt: clearedAt.toISOString() });
  } catch {
    return serverError("Could not clear recent activity. Run the Prisma schema update first, then try again.");
  }
}
