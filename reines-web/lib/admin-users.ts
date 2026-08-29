import { prisma } from "@/lib/prisma";
import { MAX_ADMINS } from "@/lib/admin-users-shared";

export { MAX_ADMINS, ADMIN_CAP_MESSAGE } from "@/lib/admin-users-shared";

export async function countAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "ADMIN" } });
}

/** True when creating/promoting an ADMIN would exceed MAX_ADMINS. */
export async function wouldExceedAdminCap(opts: {
  nextRole: string | undefined;
  currentRole?: string;
}): Promise<boolean> {
  if (opts.nextRole !== "ADMIN") return false;
  // Already an admin — edit is not a new seat.
  if (opts.currentRole === "ADMIN") return false;
  const count = await countAdmins();
  return count >= MAX_ADMINS;
}
