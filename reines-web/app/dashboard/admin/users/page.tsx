import { MOCK_USERS } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";
import UsersTable from "@/components/admin/UsersTable";

async function getUsers() {
  try {
    return await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return MOCK_USERS;
  }
}

export const metadata = { title: "User Management � Reines Admin" };

export default async function UsersPage() {
  const rawUsers = await getUsers();

  const users = rawUsers.map((u) => ({
    id:        u.id,
    name:      u.name  ?? "Unknown",
    email:     u.email ?? "�",
    role:      u.role  as "ADMIN" | "PROJECT_MANAGER" | "CLIENT",
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  }));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2d4a6b]">User Management</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Create accounts, assign roles, and manage access for all platform users.
        </p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
