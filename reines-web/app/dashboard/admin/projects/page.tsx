import { type AdminUser, type AdminProject } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";
import ProjectsTable from "@/components/admin/ProjectsTable";

type DataResult =
  | { ok: true;  projects: AdminProject[]; clients: AdminUser[]; managers: AdminUser[] }
  | { ok: false; error: string };

async function getData(): Promise<DataResult> {
  try {
    const [rawProjects, rawUsers] = await Promise.all([
      prisma.project.findMany({
        include: {
          client:  { select: { id: true, name: true, email: true, role: true, createdAt: true } },
          manager: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    const users: AdminUser[] = rawUsers.map((u) => ({
      id:        u.id,
      name:      u.name  ?? "Unknown",
      email:     u.email ?? "",
      role:      u.role  as AdminUser["role"],
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    }));

    const projects: AdminProject[] = rawProjects.map((p) => ({
      id:          p.id,
      title:       p.title,
      description: p.description ?? "",
      status:      p.status,
      budget:      p.budget ? Number(p.budget) : 0,
      clientId:    p.clientId,
      clientName:  p.client?.name  ?? "Unknown",
      managerId:   p.managerId,
      managerName: p.manager?.name ?? "Unknown",
      managerAccepted:   p.managerAccepted,
      managerAcceptedAt: p.managerAcceptedAt ? (p.managerAcceptedAt instanceof Date ? p.managerAcceptedAt.toISOString() : String(p.managerAcceptedAt)) : null,
      startDate:   p.startDate ? (p.startDate instanceof Date ? p.startDate.toISOString().split("T")[0] : String(p.startDate)) : null,
      endDate:     p.endDate   ? (p.endDate   instanceof Date ? p.endDate.toISOString().split("T")[0]   : String(p.endDate))   : null,
      createdAt:   p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    }));

    return {
      ok:       true,
      projects,
      clients:  users.filter((u) => u.role === "CLIENT"),
      managers: users.filter((u) => ["ADMIN", "PROJECT_MANAGER"].includes(u.role)),
    };
  } catch (err) {
    console.error("[AdminProjectsPage] DB error:", err);
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Failed to load projects from the database.",
    };
  }
}

export const metadata = { title: "Project Management | Reines Admin" };

export default async function AdminProjectsPage() {
  const data = await getData();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2d4a6b]">Project Management</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Create projects, assign clients and managers, and track progress across all active work.
        </p>
      </div>

      {!data.ok ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-800">
          <p className="font-semibold">Could not load projects</p>
          <p className="mt-1 text-xs text-orange-700">{data.error}</p>
        </div>
      ) : (
        <ProjectsTable
          initialProjects={data.projects}
          clients={data.clients}
          managers={data.managers}
          isAdmin={true}
        />
      )}
    </div>
  );
}
