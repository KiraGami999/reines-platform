"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2,
  FolderKanban, CheckCircle2, Clock4, AlertCircle, Search, PauseCircle, XCircle,
} from "lucide-react";
import SlidePanel        from "./SlidePanel";
import CreateProjectForm from "./CreateProjectForm";
import ConfirmDialog     from "./ConfirmDialog";
import StatusBadge       from "./StatusBadge";
import StatCard          from "./StatCard";
import { fmtAdmin, fmtMWK, type AdminProject, type AdminUser } from "@/lib/mock-admin";
import Link from "next/link";
import { AcceptProjectButton } from "@/components/dashboard/AcceptProjectButton";

type StatusFilter = "ALL" | "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

const STATUS_TABS: { key: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { key: "ALL",         label: "All",         icon: <FolderKanban size={12} /> },
  { key: "IN_PROGRESS", label: "In Progress", icon: <Clock4       size={12} /> },
  { key: "PLANNING",    label: "Planning",    icon: <AlertCircle  size={12} /> },
  { key: "ON_HOLD",     label: "On Hold",     icon: <PauseCircle  size={12} /> },
  { key: "COMPLETED",   label: "Completed",   icon: <CheckCircle2 size={12} /> },
  { key: "CANCELLED",   label: "Cancelled",   icon: <XCircle      size={12} /> },
];

interface Props {
  initialProjects: AdminProject[];
  clients:         AdminUser[];
  managers:        AdminUser[];
  isAdmin:         boolean;
}

export default function ProjectsTable({ initialProjects, clients, managers, isAdmin }: Props) {
  const [projects,      setProjects]      = useState<AdminProject[]>(initialProjects);
  const [panelOpen,     setPanelOpen]     = useState(false);
  const [editProject,   setEditProject]   = useState<AdminProject | null>(null);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("ALL");

  const counts: Record<StatusFilter, number> = {
    ALL:         projects.length,
    IN_PROGRESS: projects.filter((p) => p.status === "IN_PROGRESS").length,
    PLANNING:    projects.filter((p) => p.status === "PLANNING").length,
    ON_HOLD:     projects.filter((p) => p.status === "ON_HOLD").length,
    COMPLETED:   projects.filter((p) => p.status === "COMPLETED").length,
    CANCELLED:   projects.filter((p) => p.status === "CANCELLED").length,
  };

  const filtered = projects.filter((p) => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const query         = search.trim().toLowerCase();
    const matchesSearch = !query ||
      p.title.toLowerCase().includes(query) ||
      p.clientName.toLowerCase().includes(query) ||
      p.managerName.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });
  const pendingAssignments = !isAdmin ? projects.filter((project) => !project.managerAccepted) : [];

  function openCreate() { setEditProject(null); setPanelOpen(true); }
  function openEdit(p: AdminProject) { setEditProject(p); setPanelOpen(true); }

  function onSuccess(project: AdminProject) {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      return idx >= 0
        ? prev.map((p) => (p.id === project.id ? project : p))
        : [project, ...prev];
    });
    setPanelOpen(false);
  }

  function markAccepted(projectId: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, managerAccepted: true, managerAcceptedAt: new Date().toISOString() }
          : project
      )
    );
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/projects/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete project.");
      }
    } catch {
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const deleteTarget = projects.find((p) => p.id === deleteId);

  return (
    <>
      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Total Projects" value={counts.ALL}         icon={<FolderKanban className="w-5 h-5" />} accent="text-zinc-500" />
        <StatCard label="In Progress"    value={counts.IN_PROGRESS} icon={<Clock4       className="w-5 h-5" />} accent="text-zinc-500" />
        <StatCard label="Completed"      value={counts.COMPLETED}   icon={<CheckCircle2 className="w-5 h-5" />} accent="text-zinc-500" />
        <StatCard label="Planning"       value={counts.PLANNING}    icon={<AlertCircle  className="w-5 h-5" />} accent="text-zinc-500" />
      </div>

      {/* Toolbar */}
      {pendingAssignments.length > 0 && (
        <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#2d4a6b]">Pending Projects Assigned To You</h2>
            <p className="mt-1 text-xs text-blue-700">
              These projects were assigned by an admin. Accept a project to activate your manager-client connection.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {pendingAssignments.map((project) => (
              <div key={project.id} className="rounded-xl border border-blue-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900">{project.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">Client: {project.clientName}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">{project.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Pending
                  </span>
                </div>
                <div className="mt-4">
                  <AcceptProjectButton projectId={project.id} onAccepted={() => markAccepted(project.id)} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title, client or manager…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a]"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-[#2d4a6b] text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-2.5 py-2 sm:px-4 sm:py-3">Project</th>
                <th className="px-2.5 py-2 sm:px-4 sm:py-3">Client</th>
                <th className="hidden px-2.5 py-2 md:table-cell sm:px-4 sm:py-3">Manager</th>
                <th className="px-2.5 py-2 sm:px-4 sm:py-3">Status</th>
                <th className="hidden px-2.5 py-2 lg:table-cell sm:px-4 sm:py-3">Budget</th>
                <th className="hidden px-2.5 py-2 lg:table-cell sm:px-4 sm:py-3">Timeline</th>
                <th className="px-2.5 py-2 text-right sm:px-4 sm:py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-400">
                    {search || statusFilter !== "ALL"
                      ? "No projects match your filters."
                      : isAdmin
                        ? "No projects yet. Click 'New Project' to create the first one."
                        : "No projects have been assigned to you yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr key={project.id} className="group transition-colors hover:bg-zinc-50">
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                      <div className="max-w-[200px]">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="font-medium text-zinc-900 hover:text-[#8fb9e8] hover:underline truncate block"
                        >
                          {project.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{project.description}</p>
                      </div>
                    </td>
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {project.clientName.charAt(0)}
                        </div>
                        <span className="truncate text-zinc-700">{project.clientName}</span>
                      </div>
                    </td>
                    <td className="hidden px-2.5 py-2 md:table-cell sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {project.managerName.charAt(0)}
                        </div>
                        <span className="truncate text-zinc-700">{project.managerName}</span>
                      </div>
                    </td>
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="hidden px-2.5 py-2 font-medium text-zinc-700 lg:table-cell sm:px-4 sm:py-3">
                      {project.budget
                        ? fmtMWK(project.budget)
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="hidden px-2.5 py-2 text-xs text-zinc-500 lg:table-cell sm:px-4 sm:py-3">
                      {project.startDate ? (
                        <span>
                          {fmtAdmin(project.startDate)}
                          <span className="mx-1 text-zinc-300">→</span>
                          {project.endDate ? fmtAdmin(project.endDate) : "TBD"}
                        </span>
                      ) : (
                        <span className="text-zinc-300">Not set</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center justify-end gap-1">
                        {(isAdmin || project.managerAccepted) && (
                          <button
                            onClick={() => openEdit(project)}
                            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#2d4a6b]"
                            title="Edit project"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteId(project.id)}
                            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600"
                            title="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-400">
          Showing {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
          {statusFilter !== "ALL" && ` · ${statusFilter.replace("_", " ").toLowerCase()}`}
        </div>
      </div>

      {/* Slide panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editProject ? "Edit Project" : "Create New Project"}
        subtitle={
          editProject
            ? `Editing: ${editProject.title}`
            : "Fill in the project details and assign a client and manager."
        }
        width="xl"
      >
        <CreateProjectForm
          key={editProject?.id ?? "new"}
          clients={clients}
          managers={managers}
          editProject={editProject}
          onSuccess={onSuccess}
          onCancel={() => setPanelOpen(false)}
        />
      </SlidePanel>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Project"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" and all its data (updates, messages, payments) will be permanently deleted.`
            : "This project and all its data will be permanently deleted."
        }
        confirmLabel="Delete Project"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
