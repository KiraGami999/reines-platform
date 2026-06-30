import Link from "next/link";
import { ArrowRight, FolderKanban, Mail, UserCheck, Users } from "lucide-react";
import { MOCK_ADMIN_PROJECTS, MOCK_USERS, type AdminUser } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";
import { getClientPointTotals } from "@/lib/client-points";
import RoleBadge from "@/components/admin/RoleBadge";

type ClientRow = AdminUser & {
  projectCount: number;
  totalPoints: number;
};

async function getClients(): Promise<ClientRow[]> {
  try {
    const clients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { projectsAsClient: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = clients.map((client) => ({
      id: client.id,
      name: client.name ?? "Unknown",
      email: client.email ?? "-",
      role: client.role as AdminUser["role"],
      createdAt: client.createdAt instanceof Date ? client.createdAt.toISOString() : String(client.createdAt),
      projectCount: client._count.projectsAsClient,
    }));
    const totals = await getClientPointTotals(rows.map((client) => client.id));
    const totalsByClient = new Map(totals.map((total) => [total.clientId, total.totalPoints]));

    return rows.map((client) => ({
      ...client,
      totalPoints: totalsByClient.get(client.id) ?? 0,
    }));
  } catch {
    return MOCK_USERS
      .filter((user) => user.role === "CLIENT")
      .map((client) => ({
        ...client,
        projectCount: MOCK_ADMIN_PROJECTS.filter((project) => project.clientId === client.id).length,
        totalPoints: 0,
      }));
  }
}

export const metadata = { title: "Client Management - Reines Admin" };

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2d4a6b]">Client Management</h1>
              <p className="mt-1 text-sm text-zinc-500">
                View every registered client and open their assigned project work.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a]"
        >
          Manage User Access
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <Users className="h-5 w-5 text-blue-600" />
          <p className="mt-4 text-3xl font-extrabold text-zinc-900">{clients.length}</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">Registered Clients</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <FolderKanban className="h-5 w-5 text-[#8fb9e8]" />
          <p className="mt-4 text-3xl font-extrabold text-zinc-900">
            {clients.reduce((sum, client) => sum + client.projectCount, 0)}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">Linked Projects</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <UserCheck className="h-5 w-5 text-blue-600" />
          <p className="mt-4 text-3xl font-extrabold text-zinc-900">
            {clients.reduce((sum, client) => sum + client.totalPoints, 0).toLocaleString("en-MW")}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">Total Client Points</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Projects</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-400">
                    No client accounts yet. New public registrations will appear here automatically.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-700">
                          {client.name.split(" ").map((name) => name[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-medium text-zinc-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#2d4a6b]">
                        <Mail size={13} />
                        {client.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={client.role} />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{client.projectCount}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {client.totalPoints.toLocaleString("en-MW")} pts
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href="/dashboard/admin/projects" className="text-sm font-medium text-[#8fb9e8] hover:underline">
                        View projects
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
