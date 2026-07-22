"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Section } from "@/components/dashboard/Section";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { MILESTONE_STATUS_CONFIG, fmtDate } from "@/lib/mock-data";
import type { Milestone, MilestoneStatus } from "@/models/project";

interface ProjectTimelineManagerProps {
  projectId:         string;
  initialMilestones: Milestone[];
}

const STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
  { value: "PENDING",     label: "Upcoming" },
  { value: "IN_PROGRESS", label: "Active" },
  { value: "COMPLETED",   label: "Complete" },
  { value: "CANCELLED",   label: "Cancelled" },
];

function statusIcon(status: MilestoneStatus) {
  if (status === "COMPLETED")   return CheckCircle2;
  if (status === "IN_PROGRESS") return Clock;
  if (status === "CANCELLED")   return XCircle;
  return AlertCircle;
}

/**
 * Project Manager / Admin control panel for the project timeline.
 * Lets the PM add, edit, reorder, and remove checkpoints — the client sees
 * the resulting list as a read-only timeline on the same page.
 */
export function ProjectTimelineManager({ projectId, initialMilestones }: ProjectTimelineManagerProps) {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [formOpen, setFormOpen]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate]         = useState("");
  const [status, setStatus]           = useState<MilestoneStatus>("PENDING");

  function resetForm() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("PENDING");
    setEditingId(null);
    setError("");
  }

  function openAddForm() {
    resetForm();
    setFormOpen(true);
  }

  function openEditForm(m: Milestone) {
    setTitle(m.title);
    setDescription(m.description ?? "");
    setDueDate(m.dueDate ? m.dueDate.slice(0, 10) : "");
    setStatus(m.status);
    setEditingId(m.id);
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetForm();
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      title:       title.trim(),
      description: description.trim() || null,
      status,
      dueDate:     dueDate ? new Date(dueDate).toISOString() : null,
    };

    try {
      const res = editingId
        ? await fetch(`/api/projects/${projectId}/milestones/${editingId}`, {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
          })
        : await fetch(`/api/projects/${projectId}/milestones`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save this checkpoint.");
        return;
      }

      const saved: Milestone = data.milestone;
      setMilestones((prev) =>
        editingId ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved]
      );
      closeForm();
      router.refresh();
    } catch {
      setError("Could not save this checkpoint. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function quickSetStatus(m: Milestone, next: MilestoneStatus) {
    if (next === m.status) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/projects/${projectId}/milestones/${m.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMilestones((prev) => prev.map((item) => (item.id === m.id ? data.milestone : item)));
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function moveMilestone(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const current = milestones[index];
    const target  = milestones[targetIndex];

    setSaving(true);
    try {
      await Promise.all([
        fetch(`/api/projects/${projectId}/milestones/${current.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ sortOrder: target.sortOrder }),
        }),
        fetch(`/api/projects/${projectId}/milestones/${target.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);

      setMilestones((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        map.set(current.id, { ...current, sortOrder: target.sortOrder });
        map.set(target.id,  { ...target,  sortOrder: current.sortOrder });
        return Array.from(map.values()).sort(
          (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
        );
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        setMilestones((prev) => prev.filter((m) => m.id !== deletingId));
        router.refresh();
      }
    } finally {
      setSaving(false);
      setDeletingId(null);
    }
  }

  const doneCount   = milestones.filter((m) => m.status === "COMPLETED").length;
  const activeCount = milestones.filter((m) => m.status === "IN_PROGRESS").length;

  return (
    <>
      <Section
        title="Project Timeline"
        subtitle={
          milestones.length === 0
            ? "Add checkpoints to show your client the construction phases"
            : `${doneCount} of ${milestones.length} phases complete${activeCount > 0 ? ` · ${activeCount} active` : ""}`
        }
        action={
          !formOpen && (
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a2f4a]"
            >
              <Plus size={13} /> Add checkpoint
            </button>
          )
        }
      >
        {formOpen && (
          <form onSubmit={submitForm} className="mb-5 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {editingId ? "Edit checkpoint" : "New checkpoint"}
              </p>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X size={15} />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Phase title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Foundation & Substructure"
                maxLength={200}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#8fb9e8]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this phase cover?"
                maxLength={1000}
                rows={2}
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#8fb9e8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Target date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#8fb9e8]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-[#8fb9e8]"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2d4a6b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {editingId ? "Save changes" : "Add checkpoint"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {milestones.length === 0 && !formOpen ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Clock size={32} className="text-zinc-200" />
            <p className="mt-3 text-sm text-zinc-400">
              No checkpoints yet. Add the first phase of this project&apos;s timeline for your client to see.
            </p>
          </div>
        ) : (
          <ol className="relative ml-3.5 border-l border-zinc-200">
            {milestones.map((m, i) => {
              const cfg  = MILESTONE_STATUS_CONFIG[m.status];
              const Icon = statusIcon(m.status);

              return (
                <li key={m.id} className="mb-4 ml-6 last:mb-0">
                  <span className={`absolute -left-[14px] flex h-7 w-7 items-center justify-center rounded-full border-2 ${cfg.ring}`}>
                    <Icon size={13} className={m.status === "PENDING" ? "text-zinc-400" : "text-white"} />
                  </span>

                  <div className={`rounded-xl border p-4 ${cfg.card}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border border-current/20 bg-white px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        {m.dueDate && <span className="text-xs text-zinc-400">Target: {fmtDate(m.dueDate)}</span>}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveMilestone(i, -1)}
                          disabled={i === 0 || saving}
                          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-600 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMilestone(i, 1)}
                          disabled={i === milestones.length - 1 || saving}
                          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-600 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(m)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white hover:text-[#2d4a6b]"
                          aria-label="Edit checkpoint"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(m.id)}
                          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white hover:text-red-600"
                          aria-label="Delete checkpoint"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="mt-1.5 text-sm font-semibold text-zinc-900">{m.title}</h3>
                    {m.description && (
                      <p className="mt-1 text-sm leading-relaxed text-zinc-500">{m.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.filter((opt) => opt.value !== m.status).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => quickSetStatus(m, opt.value)}
                          disabled={saving}
                          className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:border-[#8fb9e8] hover:text-[#2d4a6b] disabled:opacity-50"
                        >
                          Mark {opt.label.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete this checkpoint?"
        message="This removes the phase from the client's timeline. This cannot be undone."
        confirmLabel="Delete"
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  );
}
