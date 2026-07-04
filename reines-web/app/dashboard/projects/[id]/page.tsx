import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardProject } from "@/lib/projects";
import { getClientPointSummary } from "@/lib/client-points";
import { STATUS_CONFIG, PHASE_CONFIG, fmtMWK, fmtDate, daysRemaining } from "@/lib/mock-data";
import type { Project, ProjectPhase, BudgetBreakdown, ProjectUpdate } from "@/models/project";
import {
  ArrowLeft,
  CalendarDays,
  Banknote,
  User2,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  ImageIcon,
  MessageSquare,
  Receipt,
  TrendingUp,
  FileText,
} from "lucide-react";
import PaymentButton from "@/components/dashboard/PaymentButton";
import { AcceptProjectButton } from "@/components/dashboard/AcceptProjectButton";
import { ClientPointsCard } from "@/components/dashboard/ClientPointsCard";

// Force fresh DB reads on every request so payment data (budget balance) is
// always up to date after a Paychangu callback.
export const dynamic = "force-dynamic";

export const metadata = { title: "Project Details – Reines Portal" };

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
  children:  React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

// ─── Hero status bar ───────────────────────────────────────────────────────────

function HeroBar({ project }: { project: Project }) {
  const status = STATUS_CONFIG[project.status];
  const days   = daysRemaining(project.endDate);

  return (
    <div className="overflow-hidden rounded-2xl bg-[#2d4a6b]">
      {/* Top accent */}
      <div
        className={`h-1 w-full ${
          project.status === "IN_PROGRESS" ? "bg-blue-400"
          : project.status === "COMPLETED"  ? "bg-blue-400"
          : project.status === "ON_HOLD"    ? "bg-zinc-500"
          : project.status === "CANCELLED"  ? "bg-blue-500"
          : "bg-blue-400"
        }`}
      />

      <div className="p-4 text-white sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Left — title + dates */}
          <div className="min-w-0 flex-1">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight leading-snug">
              {project.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                {fmtDate(project.startDate)} → {fmtDate(project.endDate)}
              </span>
              {days !== null && (
                <span className={`font-semibold ${days < 0 ? "text-blue-400" : "text-[#8fb9e8]"}`}>
                  {days < 0
                    ? `${Math.abs(days)}d overdue`
                    : days === 0
                    ? "Due today"
                    : `${days}d remaining`}
                </span>
              )}
            </p>
          </div>

          {/* Right — circular progress */}
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="33"
                  fill="none"
                  stroke="#8fb9e8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 33}`}
                  strokeDashoffset={`${2 * Math.PI * 33 * (1 - project.completionPercent / 100)}`}
                />
              </svg>
              <span className="relative z-10 text-xl font-extrabold text-white">
                {project.completionPercent}%
              </span>
            </div>
            <p className="text-xs text-zinc-500">Complete</p>
          </div>
        </div>

        {/* Manager strip */}
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8fb9e8]/20 text-sm font-bold text-[#8fb9e8]">
              {project.manager.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">Your Project Manager</p>
              <p className="truncate text-sm font-semibold text-white">{project.manager.name}</p>
            </div>
          </div>
          <Link
            href="/dashboard/messages"
            className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#8fb9e8]/15 px-3 py-2 text-xs font-medium text-[#8fb9e8] transition-colors hover:bg-[#8fb9e8]/25 sm:w-auto sm:py-1.5"
          >
            <MessageSquare size={12} />
            Message
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Project Scope ─────────────────────────────────────────────────────────────

function ScopeSection({ project }: { project: Project }) {
  const infoRows = [
    { icon: CalendarDays, label: "Start Date",  value: fmtDate(project.startDate) },
    { icon: CalendarDays, label: "End Date",    value: fmtDate(project.endDate)   },
    { icon: User2,        label: "Manager",     value: project.manager.name       },
    { icon: Mail,         label: "Contact",     value: project.manager.email      },
  ];

  return (
    <Section title="Project Scope" subtitle="Agreed scope and key project details">
      {project.description && (
        <p className="text-sm leading-relaxed text-zinc-600">{project.description}</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {infoRows.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl bg-zinc-50 p-4">
              <Icon size={14} className="text-zinc-400" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-zinc-800">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-5 rounded-xl bg-zinc-50 p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-500">Overall Completion</span>
          <span className="font-bold text-zinc-800">{project.completionPercent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-[#8fb9e8] transition-all"
            style={{ width: `${project.completionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[10px] text-zinc-400">
          Based on project updates and confirmed milestones
        </p>
      </div>
    </Section>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineSection({ phases }: { phases: ProjectPhase[] }) {
  if (phases.length === 0) {
    return (
      <Section title="Project Timeline" subtitle="Construction phases and milestones">
        <div className="flex flex-col items-center py-8 text-center">
          <Clock size={32} className="text-zinc-200" />
          <p className="mt-3 text-sm text-zinc-400">
            Timeline phases will be published by your project manager.
          </p>
        </div>
      </Section>
    );
  }

  const doneCount   = phases.filter((p) => p.status === "DONE").length;
  const activeCount = phases.filter((p) => p.status === "ACTIVE").length;

  return (
    <Section
      title="Project Timeline"
      subtitle={`${doneCount} of ${phases.length} phases complete${activeCount > 0 ? " · 1 active" : ""}`}
    >
      <ol className="relative ml-3.5 border-l border-zinc-200">
        {phases.map((phase, i) => {
          const cfg = PHASE_CONFIG[phase.status];
          const Icon =
            phase.status === "DONE"   ? CheckCircle2
            : phase.status === "ACTIVE" ? Clock
            : AlertCircle;

          return (
            <li key={i} className={`mb-7 ml-6 last:mb-0`}>
              {/* Timeline node */}
              <span
                className={`absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${cfg.ring}`}
              >
                <Icon
                  size={13}
                  className={phase.status === "UPCOMING" ? "text-zinc-400" : "text-white"}
                />
              </span>

              <div
                className={`rounded-xl border p-4 ${
                  phase.status === "ACTIVE"
                    ? "border-[#8fb9e8]/30 bg-[#8fb9e8]/5"
                    : phase.status === "DONE"
                    ? "border-blue-100 bg-blue-50/50"
                    : "border-zinc-100 bg-zinc-50"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border border-current/20 bg-white px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs text-zinc-400">{phase.weeks}</span>
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-zinc-900">{phase.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{phase.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

// ─── Budget ───────────────────────────────────────────────────────────────────

function BudgetSection({ project, role }: { project: Project; role: string }) {
  const totalPaid  = project.budgetBreakdown.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
  const remaining  = project.budget - totalPaid;
  const paidPct    = project.budget > 0 ? Math.round((totalPaid / project.budget) * 100) : 0;

  return (
    <Section title="Budget & Payments" subtitle="Project cost breakdown and payment history">
      {/* Stat grid — stacks to 1 col on mobile, 3 from sm up */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Budget",  value: fmtMWK(project.budget), note: "Agreed contract value", colour: "text-zinc-900"    },
          { label: "Paid to Date",  value: fmtMWK(totalPaid),       note: `${paidPct}% of total`,    colour: "text-blue-600" },
          { label: "Outstanding",   value: fmtMWK(remaining),        note: `${100 - paidPct}% left`,  colour: "text-zinc-700"   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-zinc-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {s.label}
            </p>
            <p className={`mt-1.5 text-lg font-extrabold leading-tight ${s.colour}`}>
              {s.value}
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-400">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Payment progress bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
          <span>Payment progress</span>
          <span className="font-semibold text-zinc-700">{paidPct}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>

      {/* Milestone breakdown */}
      {project.budgetBreakdown.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Payment Milestones
          </p>
          {project.budgetBreakdown.map((b: BudgetBreakdown, i: number) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                b.paid
                  ? "border-blue-100 bg-blue-50"
                  : "border-zinc-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    b.paid ? "bg-blue-500 text-white" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {b.paid ? "✓" : i + 1}
                </div>
                <span className="text-sm font-medium text-zinc-700">{b.label}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-zinc-900">{fmtMWK(b.amount)}</p>
                <p className={`text-[10px] font-semibold ${b.paid ? "text-blue-600" : "text-zinc-400"}`}>
                  {b.paid ? "Paid" : "Outstanding"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pay now button for clients with outstanding balance */}
      {role === "CLIENT" && remaining > 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-5">
          <PaymentButton
            projectId={project.id}
            projectTitle={project.title}
            amount={remaining}
            description={`Payment for ${project.title}`}
            className="w-full justify-center"
          />
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Secured by Paychangu · Mobile Money · Bank Transfer · Card
          </p>
        </div>
      )}
    </Section>
  );
}

// ─── Progress Updates ──────────────────────────────────────────────────────────

function UpdateImage({ url }: { url: string }) {
  // Mock placeholder format: "__placeholder__:from-X to-Y"
  if (url.startsWith("__placeholder__:")) {
    const gradient = url.replace("__placeholder__:", "");
    return (
      <div
        className={`mt-3 h-36 w-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
      >
        <ImageIcon size={28} className="text-white/40" />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#8fb9e8] hover:underline"
    >
      <ImageIcon size={12} /> View photo
    </a>
  );
}

function UpdateDocument({
  url,
  name,
}: {
  url: string;
  name: string | null;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-[#2d4a6b] transition-colors hover:bg-zinc-50"
    >
      <FileText size={14} className="shrink-0 text-[#8fb9e8]" />
      <span className="truncate">{name ?? "Project document"}</span>
    </a>
  );
}

function UpdatesSection({ updates }: { updates: ProjectUpdate[] }) {
  if (updates.length === 0) {
    return (
      <Section title="Progress Updates" subtitle="Photos and notes from site">
        <div className="flex flex-col items-center py-8 text-center">
          <ImageIcon size={32} className="text-zinc-200" />
          <p className="mt-3 text-sm text-zinc-400">
            No updates yet. Your project manager will post progress notes and photos here.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title={`Progress Updates`}
      subtitle={`${updates.length} update${updates.length !== 1 ? "s" : ""} from site`}
    >
      <ol className="space-y-4">
        {updates.map((u, i) => (
          <li
            key={u.id}
            className="rounded-xl border border-zinc-100 bg-zinc-50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2d4a6b] text-xs font-bold text-[#8fb9e8]">
                {updates.length - i}
              </div>
              <div className="min-w-0 flex-1">
                {u.progressPercent !== null && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-500">Estimated progress</span>
                      <span className="font-bold text-[#2d4a6b]">{u.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div className="h-full rounded-full bg-[#8fb9e8]" style={{ width: `${u.progressPercent}%` }} />
                    </div>
                  </div>
                )}
                <p className="text-sm leading-relaxed text-zinc-700">{u.note}</p>
                <p className="mt-1.5 text-xs text-zinc-400">
                  {new Date(u.createdAt).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day:     "numeric",
                    month:   "long",
                    year:    "numeric",
                  })}
                </p>
                {u.imageUrl && <UpdateImage url={u.imageUrl} />}
                {u.documentUrl && <UpdateDocument url={u.documentUrl} name={u.documentName} />}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ─── Quick actions sidebar card ────────────────────────────────────────────────

function QuickActions({ project, role }: { project: Project; role: string }) {
  if (role === "PROJECT_MANAGER" && !project.managerAccepted) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
        <h2 className="text-sm font-semibold text-[#2d4a6b]">Pending Assignment</h2>
        <p className="mt-2 text-sm leading-relaxed text-blue-700">
          Accept this project to activate your connection with the client and unlock messaging and progress updates.
        </p>
        <AcceptProjectButton projectId={project.id} className="mt-4" />
      </div>
    );
  }

  const projectId = project.id;
  const actions = [
    {
      href:  `/dashboard/messages/${projectId}`,
      icon:  MessageSquare,
      label: role === "PROJECT_MANAGER" ? "Message client" : "Message my manager",
      desc:  role === "PROJECT_MANAGER" ? "Coordinate directly with the client" : "Ask questions or get updates",
    },
    {
      href:  role === "PROJECT_MANAGER" ? `/dashboard/projects/${projectId}/gallery?tab=upload` : `/dashboard/projects/${projectId}/gallery`,
      icon:  ImageIcon,
      label: role === "PROJECT_MANAGER" ? "Post progress update" : "Progress gallery",
      desc:  role === "PROJECT_MANAGER" ? "Add site notes and photos" : "View all site photos",
    },
    ...(role === "CLIENT" ? [{
      href:  `/dashboard/payments`,
      icon:  Receipt,
      label: "Payment history",
      desc:  "View all transactions",
    }] : []),
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900">Quick Actions</h2>
      <div className="space-y-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-3 rounded-xl border border-zinc-100 px-4 py-3 transition-colors hover:border-zinc-200 hover:bg-zinc-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <Icon size={15} className="text-zinc-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-700">{a.label}</p>
                <p className="text-xs text-zinc-400">{a.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Project info card (sidebar) ──────────────────────────────────────────────

function ProjectInfoCard({ project }: { project: Project }) {
  const rows = [
    { icon: FileText,     label: "Project ID",  value: project.id.slice(0, 12) + "…" },
    { icon: TrendingUp,   label: "Status",      value: STATUS_CONFIG[project.status]?.label ?? project.status },
    { icon: CalendarDays, label: "Created",     value: fmtDate(project.createdAt)        },
    { icon: Banknote,     label: "Contract",    value: fmtMWK(project.budget)            },
    { icon: User2,        label: "Manager",     value: project.manager.name              },
    { icon: Mail,         label: "Email",       value: project.manager.email             },
    { icon: Phone,        label: "Reference",   value: project.managerId.slice(0, 8) + "…" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-900">Project Info</h2>
      </div>
      <div className="divide-y divide-zinc-50 px-5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-3 py-3">
              <Icon size={13} className="shrink-0 text-zinc-400" />
              <span className="w-20 shrink-0 text-xs text-zinc-400">{row.label}</span>
              <span className="min-w-0 truncate text-xs font-medium text-zinc-700">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const role    = session.user.role!;

  // Role-scoped fetch — 404 if the project does not belong to this viewer.
  const project = await getDashboardProject(id, session.user.id!, role);
  if (!project) notFound();
  const clientPointSummary = ["ADMIN", "PROJECT_MANAGER"].includes(role)
    ? await getClientPointSummary(project.clientId)
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Back */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <ArrowLeft size={14} /> Back to My Projects
      </Link>

      {/* Hero */}
      <HeroBar project={project} />

      {/* Main layout: 2/3 left + 1/3 right */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Left column */}
        <div className="space-y-5 xl:col-span-2">
          <ScopeSection    project={project} />
          <TimelineSection phases={project.phases} />
          <UpdatesSection  updates={project.updates} />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <BudgetSection    project={project} role={role} />
          <QuickActions     project={project} role={role} />
          {clientPointSummary && (
            <ClientPointsCard
              clientId={project.clientId}
              projectId={project.id}
              summary={clientPointSummary}
              canAward={["ADMIN", "PROJECT_MANAGER"].includes(role)}
            />
          )}
          <ProjectInfoCard  project={project} />
        </div>
      </div>
    </div>
  );
}
