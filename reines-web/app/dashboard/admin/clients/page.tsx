import Link from "next/link";
import { ArrowRight, FolderKanban, Mail, UserCheck, Users } from "lucide-react";
import { MOCK_ADMIN_PROJECTS, MOCK_USERS, type AdminUser } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";
import { getClientPointTotals } from "@/lib/client-points";
import AdminClientsTable, { ClientRow } from "@/components/admin/AdminClientsTable";

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
        verificationStatus: true,
        verificationFullName: true,
        verificationPhone: true,
        verificationAddress: true,
        verificationOccupation: true,
        verificationIdType: true,
        verificationIdNumber: true,
        verificationDocumentUrl: true,
        verificationAdminNotes: true,
        verificationSubmittedAt: true,
        _count: { select: { projectsAsClient: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = clients.map((client) => ({
      id: client.id,
      name: client.name ?? "Unknown",
      email: client.email ?? "-",
      role: client.role as string,
      createdAt: client.createdAt instanceof Date ? client.createdAt.toISOString() : String(client.createdAt),
      verificationStatus: client.verificationStatus as any,
      verificationFullName: client.verificationFullName,
      verificationPhone: client.verificationPhone,
      verificationAddress: client.verificationAddress,
      verificationOccupation: client.verificationOccupation,
      verificationIdType: client.verificationIdType,
      verificationIdNumber: client.verificationIdNumber,
      verificationDocumentUrl: client.verificationDocumentUrl,
      verificationAdminNotes: client.verificationAdminNotes,
      verificationSubmittedAt: client.verificationSubmittedAt instanceof Date ? client.verificationSubmittedAt.toISOString() : null,
      projectCount: client._count.projectsAsClient,
      totalPoints: 0,
    }));
    const totals = await getClientPointTotals(rows.map((client) => client.id));
    const totalsByClient = new Map(totals.map((total) => [total.clientId, total.totalPoints]));

    return rows.map((client) => ({
      ...client,
      totalPoints: totalsByClient.get(client.id) ?? 0,
    }));
  } catch {
    // Fallback if Prisma is not connected
    return MOCK_USERS
      .filter((user) => user.role === "CLIENT")
      .map((client) => ({
        ...client,
        verificationStatus: "UNVERIFIED" as any,
        verificationFullName: null,
        verificationPhone: null,
        verificationAddress: null,
        verificationOccupation: null,
        verificationIdType: null,
        verificationIdNumber: null,
        verificationDocumentUrl: null,
        verificationAdminNotes: null,
        verificationSubmittedAt: null,
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#35475D]">Client Management</h1>
              <p className="mt-1 text-sm text-zinc-500">
                View every registered client and open their assigned project work.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#35475D] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#283546]"
        >
          Manage User Access
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <Users className="h-5 w-5 text-zinc-500" />
          <p className="mt-4 text-3xl font-extrabold text-zinc-900">{clients.length}</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">Registered Clients</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <FolderKanban className="h-5 w-5 text-zinc-500" />
          <p className="mt-4 text-3xl font-extrabold text-zinc-900">
            {clients.reduce((sum, client) => sum + client.projectCount, 0)}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">Linked Projects</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <UserCheck className="h-5 w-5 text-zinc-500" />
          <p className="mt-4 text-3xl font-extrabold text-zinc-900">
            {clients.reduce((sum, client) => sum + client.totalPoints, 0).toLocaleString("en-MW")}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">Total Client Points</p>
        </div>
      </div>

      <AdminClientsTable initialClients={clients} />
    </div>
  );
}
