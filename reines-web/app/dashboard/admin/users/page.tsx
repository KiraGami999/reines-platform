import { prisma } from "@/lib/prisma";
import UsersTable from "@/components/admin/UsersTable";
import type { AdminUser } from "@/lib/mock-admin";

type DataResult =
  | { ok: true;  users: AdminUser[] }
  | { ok: false; error: string };

async function getUsers(): Promise<DataResult> {
  try {
    const rawUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const users: AdminUser[] = rawUsers.map((u) => ({
      id:        u.id,
      name:      u.name  ?? "Unknown",
      email:     u.email ?? "",
      role:      u.role  as AdminUser["role"],
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    }));

    return { ok: true, users };
  } catch (err) {
    console.error("[UsersPage] DB error:", err);
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Failed to load users from the database.",
    };
  }
}

export const metadata = { title: "User Management | Reines Admin" };

export default async function UsersPage() {
  const data = await getUsers();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2d4a6b]">User Management</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Create accounts, assign roles, and manage access for all platform users.
        </p>
      </div>

      {!data.ok ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
          <p className="font-semibold">Could not load users</p>
          <p className="mt-1 text-xs text-orange-700">{data.error}</p>
        </div>
      ) : (
        <UsersTable initialUsers={data.users} />
      )}
    </div>
  );
}
