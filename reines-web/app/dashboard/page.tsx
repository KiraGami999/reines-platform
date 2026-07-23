import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ElementType } from "react";
import { prisma } from "@/lib/prisma";
import { getClientProjects, getManagerProjects, type ManagerProject } from "@/lib/projects";
import { getConversations } from "@/lib/messages";
import { STATUS_CONFIG, daysRemaining, fmtDate, fmtMWK } from "@/lib/mock-data";
import { getPortalGreeting } from "@/lib/greetings";
import { MOCK_ADMIN_PROJECTS, MOCK_ENQUIRIES, MOCK_USERS } from "@/lib/mock-admin";
import { AcceptProjectButton } from "@/components/dashboard/AcceptProjectButton";
import { ClearRecentActivityButton } from "@/components/admin/ClearRecentActivityButton";
import type { Project } from "@/models/project";
import type { Conversation } from "@/models/message";
import {
  FolderKanban, Users, MessageSquare, FileText,
  TrendingUp, Clock, CheckCircle2, AlertCircle,
  ImageIcon, ClipboardList, ShieldOff, UserCircle, Wrench,
  ArrowRight, Banknote, CalendarDays, History, Mail,
} from "lucide-react";

// ─── Shared primitives ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  valueClassName?: string;
}) {
  const valueColour = accent ? "text-white" : (valueClassName ?? "text-zinc-900");

  return (
    <div className={`min-w-0 rounded-xl border p-3 sm:p-5 ${accent ? "border-[#8fb9e8]/30 bg-[#2d4a6b]" : "border-zinc-200 bg-white"}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2 ${accent ? "bg-white/10" : "bg-zinc-100"}`}>
          <Icon size={18} className={accent ? "text-zinc-300" : "text-zinc-500"} />
        </div>
      </div>
      <p className={`mt-3 min-w-0 break-words text-xl font-extrabold tabular-nums leading-tight sm:mt-4 sm:text-2xl lg:text-3xl ${valueColour}`}>
        {value}
      </p>
      <p className={`mt-0.5 text-xs font-medium sm:text-sm ${accent ? "text-zinc-300" : "text-zinc-700"}`}>{label}</p>
      <p className={`mt-1 text-[10px] sm:text-xs ${accent ? "text-zinc-500" : "text-zinc-400"}`}>{sub}</p>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#2d4a6b]">{title}</h1>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center">
      <Icon size={32} className="text-zinc-300" />
      <p className="mt-3 text-sm text-zinc-400">{message}</p>
      <p className="mt-1 text-xs text-zinc-300">Data will appear here once the database is connected.</p>
    </div>
  );
}

function ActivityFeed({
  items,
  clearedAt,
}: {
  items: { icon: ElementType; text: string; time: string }[];
  clearedAt: string | null;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Recent Activity</h2>
          {clearedAt && (
            <p className="mt-1 text-xs text-zinc-400">Cleared on {fmtDate(clearedAt)}</p>
          )}
        </div>
        <ClearRecentActivityButton />
      </div>
      <ul className="divide-y divide-zinc-50">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <li key={i} className="flex items-start gap-3 px-5 py-3.5">
              <Icon size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-zinc-400" />
              <div className="flex-1">
                <p className="text-sm text-zinc-700">{item.text}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{item.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
      <div
        className="h-full rounded-full bg-[#8fb9e8]"
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
      />
    </div>
  );
}

// ─── Admin View ───────────────────────────────────────────────────────────────

type AdminOverviewStats = {
  totalProjects: number;
  acceptedProjects: number;
  pendingAssignments: number;
  completedProjects: number;
  inProgressProjects: number;
  planningProjects: number;
  onHoldProjects: number;
  registeredUsers: number;
  clients: number;
  managers: number;
  admins: number;
  messages: number;
  newEnquiries: number;
  payments: number;
  publicProjects: number;
  products: number;
};

type AdminActivity = { icon: ElementType; text: string; time: string };

type AdminOverviewData = {
  stats: AdminOverviewStats;
  activity: AdminActivity[];
  recentActivityClearedAt: string | null;
};

async function getAdminOverviewData(): Promise<AdminOverviewData> {
  try {
    const clearRows = await prisma.$queryRaw<{ recentActivityClearedAt: Date | null }[]>`
      SELECT "recentActivityClearedAt"
      FROM "AdminOverviewPreference"
      WHERE "id" = 'global'
      LIMIT 1
    `;
    const clearedAt = clearRows[0]?.recentActivityClearedAt ?? null;
    const updatedAfterClear = clearedAt ? { updatedAt: { gt: clearedAt } } : {};
    const createdAfterClear = clearedAt ? { createdAt: { gt: clearedAt } } : {};

    const [
      totalProjects,
      acceptedProjectRows,
      pendingAssignmentRows,
      completedProjects,
      inProgressProjects,
      planningProjects,
      onHoldProjects,
      registeredUsers,
      clients,
      managers,
      admins,
      messages,
      newEnquiries,
      payments,
      publicProjectRows,
      productRows,
      latestProjects,
      latestUsers,
      latestEnquiries,
      latestMessages,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Project" WHERE "managerAccepted" = true`,
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Project" WHERE "managerAccepted" = false`,
      prisma.project.count({ where: { status: "COMPLETED" } }),
      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { status: "PLANNING" } }),
      prisma.project.count({ where: { status: "ON_HOLD" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.user.count({ where: { role: "PROJECT_MANAGER" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.message.count(),
      prisma.enquiry.count({ where: { read: false } }),
      prisma.payment.count(),
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "PublicProject"`,
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint AS count FROM "Product"`,
      prisma.project.findMany({
        take: 3,
        where: updatedAfterClear,
        orderBy: { updatedAt: "desc" },
        select: { title: true, status: true, updatedAt: true },
      }),
      prisma.user.findMany({
        take: 3,
        where: createdAfterClear,
        orderBy: { createdAt: "desc" },
        select: { name: true, role: true, createdAt: true },
      }),
      prisma.enquiry.findMany({
        take: 3,
        where: createdAfterClear,
        orderBy: { createdAt: "desc" },
        select: { name: true, subject: true, read: true, createdAt: true },
      }),
      prisma.message.findMany({
        take: 3,
        where: createdAfterClear,
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          project: { select: { title: true } },
          sender: { select: { name: true } },
        },
      }),
    ]);

    const acceptedProjects = Number(acceptedProjectRows[0]?.count ?? 0);
    const pendingAssignments = Number(pendingAssignmentRows[0]?.count ?? 0);
    const publicProjects = Number(publicProjectRows[0]?.count ?? 0);
    const products = Number(productRows[0]?.count ?? 0);

    const activity: AdminActivity[] = [
      ...latestProjects.map((project) => ({
        icon: FolderKanban,
        text: `${project.title} is ${STATUS_CONFIG[project.status]?.label ?? project.status}.`,
        time: fmtDate(project.updatedAt.toISOString()),
      })),
      ...latestUsers.map((user) => ({
        icon: UserCircle,
        text: `${user.name} registered as ${String(user.role).replace("_", " ").toLowerCase()}.`,
        time: fmtDate(user.createdAt.toISOString()),
      })),
      ...latestEnquiries.map((enquiry) => ({
        icon: FileText,
        text: `${enquiry.read ? "Read" : "New"} enquiry from ${enquiry.name}: ${enquiry.subject}.`,
        time: fmtDate(enquiry.createdAt.toISOString()),
      })),
      ...latestMessages.map((message) => ({
        icon: MessageSquare,
        text: `${message.sender.name} sent a project message on ${message.project.title}.`,
        time: fmtDate(message.createdAt.toISOString()),
      })),
    ].slice(0, 6);

    return {
      stats: {
        totalProjects,
        acceptedProjects,
        pendingAssignments,
        completedProjects,
        inProgressProjects,
        planningProjects,
        onHoldProjects,
        registeredUsers,
        clients,
        managers,
        admins,
        messages,
        newEnquiries,
        payments,
        publicProjects,
        products,
      },
      activity,
      recentActivityClearedAt: clearedAt ? clearedAt.toISOString() : null,
    };
  } catch {
    const completedProjects = MOCK_ADMIN_PROJECTS.filter((project) => project.status === "COMPLETED").length;
    const inProgressProjects = MOCK_ADMIN_PROJECTS.filter((project) => project.status === "IN_PROGRESS").length;
    const planningProjects = MOCK_ADMIN_PROJECTS.filter((project) => project.status === "PLANNING").length;
    const onHoldProjects = MOCK_ADMIN_PROJECTS.filter((project) => project.status === "ON_HOLD").length;
    const pendingAssignments = MOCK_ADMIN_PROJECTS.filter((project) => !project.managerAccepted).length;

    return {
      stats: {
        totalProjects: MOCK_ADMIN_PROJECTS.length,
        acceptedProjects: MOCK_ADMIN_PROJECTS.length - pendingAssignments,
        pendingAssignments,
        completedProjects,
        inProgressProjects,
        planningProjects,
        onHoldProjects,
        registeredUsers: MOCK_USERS.length,
        clients: MOCK_USERS.filter((user) => user.role === "CLIENT").length,
        managers: MOCK_USERS.filter((user) => user.role === "PROJECT_MANAGER").length,
        admins: MOCK_USERS.filter((user) => user.role === "ADMIN").length,
        messages: 0,
        newEnquiries: MOCK_ENQUIRIES.filter((enquiry) => !enquiry.read).length,
        payments: 0,
        publicProjects: MOCK_ADMIN_PROJECTS.length,
        products: 0,
      },
      activity: [
        ...MOCK_ADMIN_PROJECTS.slice(0, 3).map((project) => ({
          icon: FolderKanban,
          text: `${project.title} is ${STATUS_CONFIG[project.status]?.label ?? project.status}.`,
          time: fmtDate(project.createdAt),
        })),
        ...MOCK_ENQUIRIES.slice(0, 3).map((enquiry) => ({
          icon: FileText,
          text: `${enquiry.read ? "Read" : "New"} enquiry from ${enquiry.name}: ${enquiry.subject}.`,
          time: fmtDate(enquiry.createdAt),
        })),
      ],
      recentActivityClearedAt: null,
    };
  }
}

function AdminDashboard({ name, data }: { name: string; data: AdminOverviewData }) {
  const { stats, activity } = data;

  return (
    <div className="space-y-6">
      <SectionHeader
        title={getPortalGreeting(name)}
        description="Here is a live system overview connected to users, clients, managers, projects, messages, payments, and public content."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total Projects"   value={String(stats.totalProjects)} sub={`${stats.acceptedProjects} accepted · ${stats.pendingAssignments} pending`} accent />
        <StatCard icon={Users}        label="Registered Users"  value={String(stats.registeredUsers)} sub={`${stats.clients} clients · ${stats.managers} managers · ${stats.admins} admins`} />
        <StatCard icon={MessageSquare} label="Project Messages" value={String(stats.messages)} sub="Across all project chats" />
        <StatCard icon={FileText}     label="New Enquiries"     value={String(stats.newEnquiries)} sub="Unread contact enquiries" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Completed Projects" value={String(stats.completedProjects)} sub="Successfully delivered" />
        <StatCard icon={Clock}        label="In Progress"         value={String(stats.inProgressProjects)} sub="Active builds" />
        <StatCard icon={ClipboardList} label="Planning"           value={String(stats.planningProjects)} sub="Projects being prepared" />
        <StatCard icon={AlertCircle}  label="On Hold"             value={String(stats.onHoldProjects)} sub="Awaiting action" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Banknote} label="Payment Records" value={String(stats.payments)} sub="All client payment attempts" />
        <StatCard icon={ImageIcon} label="Public Projects" value={String(stats.publicProjects)} sub="Website portfolio entries" />
        <StatCard icon={ClipboardList} label="Product Catalogue" value={String(stats.products)} sub="Admin-managed products" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {activity.length > 0 ? (
          <ActivityFeed items={activity} clearedAt={data.recentActivityClearedAt} />
        ) : (
          <EmptyState icon={Wrench} message="No recent platform activity yet." />
        )}

        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">Quick Actions</h2>
          </div>
          <div className="space-y-2 p-4">
            {[
              { label: "Project admin",        href: "/dashboard/admin/projects",  icon: FolderKanban },
              { label: "View clients",         href: "/dashboard/admin/clients",   icon: Users },
              { label: "Manage user access",   href: "/dashboard/admin/users",     icon: Users },
              { label: "Read enquiries",       href: "/dashboard/admin/enquiries", icon: FileText },
              { label: "View payments",        href: "/dashboard/admin/payments",  icon: TrendingUp },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                  <Icon size={15} className="text-zinc-400" />
                  {a.label}
                  <span className="ml-auto text-zinc-300">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Project Manager View ─────────────────────────────────────────────────────

function ManagerProjectCard({ project }: { project: ManagerProject }) {
  const status = STATUS_CONFIG[project.status];
  const daysLeft = daysRemaining(project.endDate);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {!project.managerAccepted && (
            <span className="ml-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Pending acceptance
            </span>
          )}
          <h3 className="mt-3 truncate text-base font-bold text-zinc-900">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">{project.description}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-500">Delivery progress</span>
          <span className="font-bold text-zinc-900">{project.completionPercent}%</span>
        </div>
        <ProgressBar percent={project.completionPercent} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-xs">
        <div>
          <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-zinc-400">
            <UserCircle size={11} /> Client
          </p>
          <p className="mt-1 truncate font-semibold text-zinc-800">{project.client.name}</p>
        </div>
        <div>
          <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-zinc-400">
            <CalendarDays size={11} /> Timeline
          </p>
          <p className="mt-1 font-semibold text-zinc-800">
            {daysLeft === null ? "End TBC" : daysLeft >= 0 ? `${daysLeft} estimated days left` : "Past estimated date"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {!project.managerAccepted ? (
          <AcceptProjectButton projectId={project.id} className="flex-1" />
        ) : (
          <>
            <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a]">
              View project <ArrowRight size={14} />
            </Link>
            <Link href={`/dashboard/projects/${project.id}/gallery?tab=upload`} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
              Add update <ImageIcon size={14} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function ManagerDashboard({
  name,
  projects,
  conversations,
}: {
  name: string;
  projects: ManagerProject[];
  conversations: Conversation[];
}) {
  const pendingAssignments = projects.filter((project) => !project.managerAccepted);
  const acceptedProjects = projects.filter((project) => project.managerAccepted);
  const activeProjects = acceptedProjects.filter((project) => ["PLANNING", "IN_PROGRESS", "ON_HOLD"].includes(project.status));
  const completedProjects = acceptedProjects.filter((project) => project.status === "COMPLETED");
  const pendingUpdates = activeProjects.filter((project) => project.updates.length === 0 || project.status === "IN_PROGRESS");
  const unreadMessages = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const recentUpdates = acceptedProjects
    .flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title, projectId: project.id })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="space-y-6">
      <SectionHeader
        title={getPortalGreeting(name)}
        description="Manage your assigned projects and keep your clients updated."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={FolderKanban}  label="My Projects"      value={String(acceptedProjects.length)} sub="Accepted assignments" accent />
        <StatCard icon={ClipboardList} label="Pending Assignments"  value={String(pendingAssignments.length)} sub="Assigned by admin" />
        <StatCard icon={MessageSquare} label="Unread Messages"  value={String(unreadMessages)} sub="Client messages" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Updates Pending" value={String(pendingUpdates.length)} sub="Projects needing attention" />
        <StatCard icon={Clock} label="Active Work" value={String(activeProjects.length)} sub="Planning, active or on hold" />
        <StatCard icon={CheckCircle2} label="Completed" value={String(completedProjects.length)} sub="Delivered projects" />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
          <FolderKanban size={40} className="mx-auto text-zinc-200" />
          <h2 className="mt-4 text-base font-semibold text-zinc-700">No assigned projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Once an admin assigns projects to your account, they will appear here with client messages and progress actions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingAssignments.length > 0 && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[#2d4a6b]">Pending Projects Assigned To You</h2>
                <p className="mt-1 text-xs text-blue-700">
                  Accept a project to activate your project manager connection with the client and begin updates.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {pendingAssignments.map((project) => (
                  <ManagerProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Assigned Projects</h2>
              <Link href="/dashboard/manage/projects" className="text-sm font-medium text-[#8fb9e8] hover:underline">
                Manage all
              </Link>
            </div>

            {acceptedProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
                <FolderKanban size={32} className="mx-auto text-zinc-200" />
                <p className="mt-3 text-sm font-medium text-zinc-600">
                  Accept a pending assignment to activate it here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {(activeProjects.length ? activeProjects : acceptedProjects).slice(0, 4).map((project) => (
                  <ManagerProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Recent Updates</h2>
              </div>
              {recentUpdates.length === 0 ? (
                <EmptyState icon={ImageIcon} message="No progress updates posted yet." />
              ) : (
                <div className="divide-y divide-zinc-50 px-5">
                  {recentUpdates.map((update) => (
                    <Link key={update.id} href={`/dashboard/projects/${update.projectId}/gallery`} className="block py-4 hover:bg-zinc-50">
                      <p className="text-xs font-semibold text-[#2d4a6b]">{update.projectTitle}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600">{update.note}</p>
                      <p className="mt-1 text-xs text-zinc-400">{fmtDate(update.createdAt)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Client Messages</h2>
              </div>
              {recentConversations.length === 0 ? (
                <EmptyState icon={MessageSquare} message="No client conversations yet." />
              ) : (
                <div className="divide-y divide-zinc-50 px-5">
                  {recentConversations.map((conversation) => (
                    <Link key={conversation.projectId} href={`/dashboard/messages/${conversation.projectId}`} className="flex items-start gap-3 py-4 hover:bg-zinc-50">
                      <Mail size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-800">{conversation.projectTitle}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
                          {conversation.lastMessage?.message ?? "Open the conversation with your client."}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Manage projects", href: "/dashboard/manage/projects", icon: FolderKanban },
          { label: "Post gallery update", href: "/dashboard/gallery", icon: ImageIcon },
          { label: "Open messages", href: "/dashboard/messages", icon: MessageSquare },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50">
              <Icon size={16} className="text-zinc-400" />
              {action.label}
              <ArrowRight size={14} className="ml-auto text-zinc-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Client View ──────────────────────────────────────────────────────────────

function ClientProjectCard({ project }: { project: Project }) {
  const status = STATUS_CONFIG[project.status];
  const daysLeft = daysRemaining(project.endDate);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <h3 className="mt-3 truncate text-base font-bold text-zinc-900">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">{project.description}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-500">Project progress</span>
          <span className="font-bold text-zinc-900">{project.completionPercent}%</span>
        </div>
        <ProgressBar percent={project.completionPercent} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-xs">
        <div>
          <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-zinc-400">
            <CalendarDays size={11} /> Timeline
          </p>
          <p className="mt-1 font-semibold text-zinc-800">
            {daysLeft === null ? "End TBC" : daysLeft >= 0 ? `${daysLeft} estimated days left` : "Completed timeline"}
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 font-semibold uppercase tracking-wider text-zinc-400">
            <UserCircle size={11} /> Manager
          </p>
          <p className="mt-1 truncate font-semibold text-zinc-800">{project.manager.name}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a]">
          View project <ArrowRight size={14} />
        </Link>
        <Link href={`/dashboard/messages/${project.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
          Chat <MessageSquare size={14} />
        </Link>
      </div>
    </div>
  );
}

function ClientDashboard({
  name,
  projects,
  conversations,
}: {
  name: string;
  projects: Project[];
  conversations: Conversation[];
}) {
  const activeProjects = projects.filter((project) => ["PLANNING", "IN_PROGRESS", "ON_HOLD"].includes(project.status));
  const completedProjects = projects.filter((project) => project.status === "COMPLETED");
  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const paidToDate = projects.reduce(
    (sum, project) => sum + project.budgetBreakdown.filter((item) => item.paid).reduce((inner, item) => inner + item.amount, 0),
    0
  );
  const averageProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.completionPercent, 0) / projects.length)
    : 0;
  const recentUpdates = projects
    .flatMap((project) => project.updates.map((update) => ({ ...update, projectTitle: project.title, projectId: project.id })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const recentConversations = conversations.slice(0, 4);

  return (
    <div className="space-y-6">
      <SectionHeader
        title={getPortalGreeting(name)}
        description="Track assigned projects, review progress history, and communicate with your project managers."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={String(activeProjects.length)} sub="Planning, active or on hold" accent />
        <StatCard icon={TrendingUp} label="Overall Progress" value={`${averageProgress}%`} sub="Average across all projects" />
        <StatCard icon={CheckCircle2} label="Completed" value={String(completedProjects.length)} sub="Previous Reines work" />
        <StatCard icon={MessageSquare} label="Conversations" value={String(conversations.length)} sub="One chat per project" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Banknote} label="Total Contract Value" value={fmtMWK(totalBudget)} sub="All assigned projects" />
        <StatCard icon={CheckCircle2} label="Paid To Date" value={fmtMWK(paidToDate)} sub="Confirmed project payments" valueClassName="text-[#2d4a6b]" />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
          <FolderKanban size={40} className="mx-auto text-zinc-200" />
          <h2 className="mt-4 text-base font-semibold text-zinc-700">No assigned projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Once an admin links a project to your client account, it will appear here with progress, updates, payments, and chat.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Current Projects</h2>
              <Link href="/dashboard/projects" className="text-sm font-medium text-[#8fb9e8] hover:underline">
                View all
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {(activeProjects.length ? activeProjects : projects.slice(0, 2)).slice(0, 4).map((project) => (
                <ClientProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Recent Progress</h2>
              </div>
              {recentUpdates.length === 0 ? (
                <EmptyState icon={ImageIcon} message="No progress updates yet." />
              ) : (
                <div className="divide-y divide-zinc-50 px-5">
                  {recentUpdates.map((update) => (
                    <Link key={update.id} href={`/dashboard/projects/${update.projectId}`} className="block py-4 hover:bg-zinc-50">
                      <p className="text-xs font-semibold text-[#2d4a6b]">{update.projectTitle}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600">{update.note}</p>
                      <p className="mt-1 text-xs text-zinc-400">{fmtDate(update.createdAt)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-zinc-900">Messages</h2>
              </div>
              {recentConversations.length === 0 ? (
                <EmptyState icon={MessageSquare} message="No conversations yet." />
              ) : (
                <div className="divide-y divide-zinc-50 px-5">
                  {recentConversations.map((conversation) => (
                    <Link key={conversation.projectId} href={`/dashboard/messages/${conversation.projectId}`} className="flex items-start gap-3 py-4 hover:bg-zinc-50">
                      <Mail size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-800">{conversation.projectTitle}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
                          {conversation.lastMessage?.message ?? "Start the conversation with your project manager."}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <History size={15} className="text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-900">Project History</h2>
            </div>
            <span className="text-xs text-zinc-400">All work linked to your account</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Manager</th>
                  <th className="px-5 py-3">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {projects.map((project) => {
                  const status = STATUS_CONFIG[project.status];
                  return (
                    <tr key={project.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <Link href={`/dashboard/projects/${project.id}`} className="font-medium text-zinc-900 hover:text-[#8fb9e8]">
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="min-w-28">
                          <div className="mb-1 flex justify-between text-xs text-zinc-400">
                            <span>{project.completionPercent}%</span>
                          </div>
                          <ProgressBar percent={project.completionPercent} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{project.manager.name}</td>
                      <td className="px-5 py-3 text-zinc-400">{fmtDate(project.startDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Unauthorized Banner ──────────────────────────────────────────────────────

function UnauthorizedBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
      <ShieldOff size={18} className="mt-0.5 shrink-0 text-zinc-500" />
      <div>
        <p className="text-sm font-semibold text-blue-800">Access Restricted</p>
        <p className="mt-0.5 text-xs text-blue-600">
          You don&apos;t have permission to view that page. You have been redirected to your dashboard.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, role } = session.user;
  const params = await searchParams;
  const showUnauthorized = params.error === "unauthorized" && role !== "ADMIN";
  const [clientProjects, clientConversations] = role === "CLIENT"
    ? await Promise.all([
        getClientProjects(session.user.id!),
        getConversations(session.user.id, role),
      ])
    : [[], []];
  const [managerProjects, managerConversations] = role === "PROJECT_MANAGER"
    ? await Promise.all([
        getManagerProjects(session.user.id!),
        getConversations(session.user.id!, role),
      ])
    : [[], []];
  const adminOverviewData = role === "ADMIN"
    ? await getAdminOverviewData()
    : null;

  return (
    <div className="max-w-7xl mx-auto">
      {showUnauthorized && <UnauthorizedBanner />}
      {role === "ADMIN" && adminOverviewData && <AdminDashboard name={name} data={adminOverviewData} />}
      {role === "PROJECT_MANAGER" && <ManagerDashboard name={name} projects={managerProjects} conversations={managerConversations} />}
      {role === "CLIENT"          && <ClientDashboard  name={name} projects={clientProjects} conversations={clientConversations} />}
    </div>
  );
}
