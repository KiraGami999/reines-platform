import { auth } from "@/lib/auth";
import { MOCK_ADMIN_PROJECTS, getClients, getManagers, type AdminUser, type AdminProject } from "@/lib/mock-admin";
import { prisma } from "@/lib/prisma";
import ProjectsTable from "@/components/admin/ProjectsTable";

async function getData(userId: string, role: string): Promise<{ projects: AdminProject[]; clients: AdminUser[]; managers: AdminUser[] }> {
  try {
    const whereClause = role === "ADMIN" ? {} : { managerId: userId };

    const [rawProjects, rawUsers] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
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
      email:     u.email ?? "unknown@example.com",
      role:      u.role  as AdminUser["role"],
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    }));
    const currentManager = users.find((u) => u.id === userId);

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
      projects,
      clients:  users.filter((u) => u.role === "CLIENT"),
      managers: role === "ADMIN"
        ? users.filter((u) => ["ADMIN", "PROJECT_MANAGER"].includes(u.role))
        : currentManager
          ? [currentManager]
          : users.filter((u) => u.id === userId),
    };
  } catch {
    const mockProjects = role === "ADMIN"
      ? MOCK_ADMIN_PROJECTS
      : MOCK_ADMIN_PROJECTS.filter((p) => p.managerId === userId || p.managerId.startsWith("mgr_"));

    return {
      projects: mockProjects,
      clients:  getClients(),
      managers: role === "ADMIN" ? getManagers() : getManagers().filter((manager) => manager.id === userId),
    };
  }
}

export const metadata = { title: "Manage Projects - Reines" };

export default async function ManageProjectsPage() {
  const session = await auth();
  const user    = session!.user;
  const isAdmin = user.role === "ADMIN";

  const { projects, clients, managers: rawManagers } = await getData(user.id!, user.role!);
  const managers = !isAdmin && rawManagers.length === 0
    ? [{
        id:        user.id!,
        name:      user.name  ?? "Project Manager",
        email:     user.email ?? "manager@example.com",
        role:      "PROJECT_MANAGER" as const,
        createdAt: new Date().toISOString(),
      }]
    : rawManagers;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2d4a6b]">
          {isAdmin ? "Manage All Projects" : "My Projects"}
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {isAdmin
            ? "Create and manage all projects across the platform."
            : "View and update projects assigned to you by an administrator."}
        </p>
      </div>

      <ProjectsTable
        initialProjects={projects}
        clients={clients}
        managers={managers}
        isAdmin={isAdmin}
      />
    </div>
  );
}

