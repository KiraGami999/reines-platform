import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getClientProjects, getManagerProjects } from "@/lib/projects";
import { STATUS_CONFIG, fmtMWK, fmtDate } from "@/lib/mock-data";
import type { Project, ProjectStatus } from "@/models/project";
import {
  FolderOpen,
  ArrowRight,
  CalendarDays,
  Banknote,
  User2,
  MessageSquare,
} from "lucide-react";
import { AcceptProjectButton } from "@/components/dashboard/AcceptProjectButton";

export const metadata = { title: "My Projects – Reines Portal" };

// ─── Status filter (server-driven via searchParam) ────────────────────────────

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "ALL",         label: "All"         },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PLANNING",    label: "Planning"    },
  { key: "ON_HOLD",     label: "On Hold"     },
  { key: "COMPLETED",   label: "Completed"   },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ percent, colour = "bg-[#8fb9e8]" }: { percent: number; colour?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className={`h-full rounded-full transition-all ${colour}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const status    = STATUS_CONFIG[project.status];
  const totalPaid = project.budgetBreakdown
    .filter((b) => b.paid)
    .reduce((s, b) => s + b.amount, 0);
  const paidPct = project.budget > 0
    ? Math.round((totalPaid / project.budget) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
    >
      {/* Coloured top accent strip */}
      <div
        className={`h-1 w-full rounded-t-2xl ${
          project.status === "IN_PROGRESS" ? "bg-blue-400"
          : project.status === "COMPLETED"  ? "bg-blue-400"
          : project.status === "ON_HOLD"    ? "bg-zinc-400"
          : project.status === "CANCELLED"  ? "bg-blue-400"
          : "bg-blue-400"
        }`}
      />

      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <h2 className="mt-2 truncate text-base font-bold text-zinc-900 group-hover:text-[#2d4a6b]">
              {project.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">
              {project.description}
            </p>
          </div>
          <ArrowRight
            size={16}
            className="mt-1 shrink-0 text-zinc-300 transition-colors group-hover:text-[#8fb9e8]"
          />
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500">Project progress</span>
            <span className="font-bold text-zinc-800">{project.completionPercent}%</span>
          </div>
          <ProgressBar percent={project.completionPercent} />
        </div>

        {/* Meta grid — stacks to 2 cols on small phones, 3 cols from sm up */}
        <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-xs sm:grid-cols-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <Banknote size={10} /> Budget
            </div>
            <p className="mt-0.5 break-words font-semibold tabular-nums text-zinc-800">{fmtMWK(project.budget)}</p>
            <p className="text-[10px] text-[#2d4a6b]">{paidPct}% paid</p>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <CalendarDays size={10} /> Timeline
            </div>
            <p className="mt-0.5 font-semibold text-zinc-800">{fmtDate(project.startDate)}</p>
            <p className="text-[10px] text-zinc-400">End: {fmtDate(project.endDate)}</p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <User2 size={10} /> Manager
            </div>
            <p className="mt-0.5 truncate font-semibold text-zinc-800">{project.manager.name}</p>
            <p className="truncate text-[10px] text-zinc-400">{project.manager.email}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PendingProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            Pending acceptance
          </span>
          <h2 className="mt-3 truncate text-base font-bold text-zinc-900">{project.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">{project.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-xs">
        <div className="min-w-0">
          <p className="font-semibold uppercase tracking-wider text-zinc-400">Budget</p>
          <p className="mt-1 break-words font-semibold tabular-nums text-zinc-800">{fmtMWK(project.budget)}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wider text-zinc-400">Timeline</p>
          <p className="mt-1 font-semibold text-zinc-800">{fmtDate(project.startDate)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <AcceptProjectButton projectId={project.id} className="flex-1" />
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Review details <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered, role }: { filtered: boolean; role: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20 text-center">
      <FolderOpen size={40} className="text-zinc-200" />
      <h3 className="mt-4 text-base font-semibold text-zinc-700">
        {filtered ? "No projects match that filter" : "No projects yet"}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">
        {filtered
          ? "Try a different status tab to view your other projects."
          : role === "PROJECT_MANAGER"
            ? "Projects assigned to you for delivery and client updates will appear here."
            : "Your assigned projects will appear here once your project manager sets them up."}
      </p>
      {!filtered && (
        <Link
          href="/dashboard/messages"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <MessageSquare size={14} />
          {role === "PROJECT_MANAGER" ? "Open messages" : "Message your manager"}
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params   = await searchParams;
  const filter   = (params.status ?? "ALL").toUpperCase();
  const role     = session.user.role!;
  const projects = role === "PROJECT_MANAGER"
    ? await getManagerProjects(session.user.id!)
    : await getClientProjects(session.user.id!);
  const pendingAssignments = role === "PROJECT_MANAGER"
    ? projects.filter((project) => !project.managerAccepted)
    : [];
  const acceptedProjects = role === "PROJECT_MANAGER"
    ? projects.filter((project) => project.managerAccepted)
    : projects;

  const counts: Record<string, number> = {
    ALL:         acceptedProjects.length,
    IN_PROGRESS: acceptedProjects.filter((p) => p.status === "IN_PROGRESS").length,
    PLANNING:    acceptedProjects.filter((p) => p.status === "PLANNING").length,
    ON_HOLD:     acceptedProjects.filter((p) => p.status === "ON_HOLD").length,
    COMPLETED:   acceptedProjects.filter((p) => p.status === "COMPLETED").length,
  };

  const visible = filter === "ALL"
    ? acceptedProjects
    : acceptedProjects.filter((p) => p.status === (filter as ProjectStatus));

  const totalBudget = acceptedProjects.reduce((s, p) => s + p.budget, 0);
  const totalPaid   = acceptedProjects.reduce(
    (s, p) => s + p.budgetBreakdown.filter((b) => b.paid).reduce((x, b) => x + b.amount, 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2d4a6b]">My Projects</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {counts.ALL} project{counts.ALL !== 1 ? "s" : ""} assigned
            {counts.IN_PROGRESS > 0 && ` · ${counts.IN_PROGRESS} active`}
            {counts.COMPLETED   > 0 && ` · ${counts.COMPLETED} completed`}
            {pendingAssignments.length > 0 && ` · ${pendingAssignments.length} pending acceptance`}
          </p>
        </div>
      </div>

      {pendingAssignments.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#2d4a6b]">Pending Projects Assigned To You</h2>
            <p className="mt-1 text-xs text-blue-700">
              Accept a project to activate the manager-client connection and begin collaboration.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingAssignments.map((project) => (
              <PendingProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* ── Summary strip ── */}
      {acceptedProjects.length > 0 && (
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-4">
          {[
            { label: "Total Projects",  value: String(counts.ALL),                           accent: true  },
            { label: "In Progress",     value: String(counts.IN_PROGRESS)                                  },
            { label: "Total Budget",    value: fmtMWK(totalBudget)                                         },
            { label: "Paid to Date",    value: fmtMWK(totalPaid),                      paid: true           },
          ].map((s) => (
            <div
              key={s.label}
              className={`min-w-0 rounded-xl border p-3 text-center sm:p-4 ${
                s.accent
                  ? "border-[#8fb9e8]/30 bg-[#2d4a6b]"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <p
                className={`min-w-0 break-words text-base font-extrabold tabular-nums leading-snug min-[400px]:text-lg sm:text-xl lg:text-2xl ${
                  s.accent ? "text-white" : s.paid ? "text-[#2d4a6b]" : "text-[#2d4a6b]"
                }`}
              >
                {s.value}
              </p>
              <p className={`mt-1 text-[10px] font-medium sm:text-xs ${s.accent ? "text-zinc-400" : "text-zinc-500"}`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Status filter tabs ── */}
      {acceptedProjects.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1.5">
          {STATUS_TABS.map((tab) => {
            const isActive = filter === tab.key;
            const count    = counts[tab.key] ?? 0;
            return (
              <Link
                key={tab.key}
                href={tab.key === "ALL" ? "/dashboard/projects" : `/dashboard/projects?status=${tab.key}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#2d4a6b] text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Project grid ── */}
      {visible.length === 0 && pendingAssignments.length === 0 ? (
        <EmptyState filtered={filter !== "ALL"} role={role} />
      ) : visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
