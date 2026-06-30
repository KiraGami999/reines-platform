import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getManagerProjects, type ManagerProject } from "@/lib/projects";
import { STATUS_CONFIG, daysRemaining, fmtDate } from "@/lib/mock-data";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  MessageSquare,
} from "lucide-react";

export const metadata = { title: "Milestones - Reines Portal" };

function getMilestoneState(project: ManagerProject) {
  if (project.status === "COMPLETED") {
    return {
      label: "Complete",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
      action: "Review completion records",
    };
  }

  if (project.status === "ON_HOLD") {
    return {
      label: "On hold",
      tone: "border-zinc-200 bg-zinc-50 text-zinc-600",
      action: "Confirm next client action",
    };
  }

  if (project.updates.length === 0) {
    return {
      label: "Needs first update",
      tone: "border-blue-200 bg-blue-50 text-blue-700",
      action: "Post kickoff or planning update",
    };
  }

  return {
    label: "Update due",
    tone: "border-blue-200 bg-blue-50 text-blue-700",
    action: "Post latest progress note",
  };
}

function MilestoneCard({ project }: { project: ManagerProject }) {
  const status = STATUS_CONFIG[project.status];
  const milestone = getMilestoneState(project);
  const daysLeft = daysRemaining(project.endDate);
  const latestUpdate = project.updates[0];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <h2 className="mt-3 text-base font-bold text-zinc-900">{project.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">Client: {project.client.name}</p>
        </div>

        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${milestone.tone}`}>
          <ClipboardList size={12} />
          {milestone.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Progress</p>
          <p className="mt-1 font-bold text-[#2d4a6b]">{project.completionPercent}%</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Target End</p>
          <p className="mt-1 font-medium text-zinc-700">{fmtDate(project.endDate)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Timeline</p>
          <p className="mt-1 font-medium text-zinc-700">
            {daysLeft === null ? "TBC" : daysLeft >= 0 ? `${daysLeft} estimated days remaining` : "Past estimated target date"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-zinc-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Next manager action</p>
        <p className="mt-1 text-sm font-medium text-zinc-800">{milestone.action}</p>
        {latestUpdate && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
            Last update: {latestUpdate.note}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/dashboard/projects/${project.id}/gallery?tab=upload`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2d4a6b] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a2f4a]">
          <ImageIcon size={14} /> Post update
        </Link>
        <Link href={`/dashboard/messages/${project.id}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
          <MessageSquare size={14} /> Message client
        </Link>
        <Link href={`/dashboard/projects/${project.id}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
          Project <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default async function MilestonesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PROJECT_MANAGER") redirect("/dashboard?error=unauthorized");

  const projects = await getManagerProjects(session.user.id!);
  const activeProjects = projects.filter((project) => project.status !== "COMPLETED" && project.status !== "CANCELLED");
  const completedProjects = projects.filter((project) => project.status === "COMPLETED");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2d4a6b]">Milestones</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Track manager actions, progress updates, and upcoming project checkpoints.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#8fb9e8]/30 bg-[#2d4a6b] p-4">
          <CalendarClock className="h-5 w-5 text-[#8fb9e8]" />
          <p className="mt-3 text-2xl font-extrabold text-white">{activeProjects.length}</p>
          <p className="text-sm font-medium text-zinc-300">Active checkpoints</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <ClipboardList className="h-5 w-5 text-zinc-500" />
          <p className="mt-3 text-2xl font-extrabold text-[#2d4a6b]">{projects.filter((project) => project.updates.length === 0).length}</p>
          <p className="text-sm font-medium text-zinc-500">Need first update</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <CheckCircle2 className="h-5 w-5 text-zinc-500" />
          <p className="mt-3 text-2xl font-extrabold text-[#2d4a6b]">{completedProjects.length}</p>
          <p className="text-sm font-medium text-zinc-500">Completed projects</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
          <ClipboardList size={40} className="mx-auto text-zinc-200" />
          <h2 className="mt-4 text-base font-semibold text-zinc-700">No milestones yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Milestones will appear once projects are assigned to your project manager account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <MilestoneCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
