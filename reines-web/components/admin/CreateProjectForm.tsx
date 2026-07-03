"use client";

import { useState } from "react";
import { Loader2, CalendarDays, DollarSign, Users } from "lucide-react";
import type { AdminProject, AdminUser } from "@/lib/mock-admin";

interface Props {
  clients:      AdminUser[];
  managers:     AdminUser[];
  editProject?: AdminProject | null;
  onSuccess:    (project: AdminProject) => void;
  onCancel:     () => void;
}

const STATUSES = [
  { value: "PLANNING",    label: "Planning"    },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD",     label: "On Hold"     },
  { value: "COMPLETED",   label: "Completed"   },
  { value: "CANCELLED",   label: "Cancelled"   },
] as const;

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-sm font-medium text-zinc-700";

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-2">
      <span className="text-zinc-400">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{title}</span>
    </div>
  );
}

function fmtBudgetPreview(raw: string): string {
  const n = Number(raw.replace(/,/g, ""));
  if (!raw.trim() || isNaN(n) || n === 0) return "";
  return `MK ${n.toLocaleString("en-MW")}`;
}

export default function CreateProjectForm({
  clients,
  managers,
  editProject,
  onSuccess,
  onCancel,
}: Props) {
  const isEdit = Boolean(editProject);

  const [form, setForm] = useState({
    title:       editProject?.title       ?? "",
    description: editProject?.description ?? "",
    clientId:    editProject?.clientId    ?? (clients[0]?.id  ?? ""),
    managerId:   editProject?.managerId   ?? (managers[0]?.id ?? ""),
    status:      editProject?.status      ?? "PLANNING",
    budget:      editProject?.budget ? String(editProject.budget) : "",
    startDate:   editProject?.startDate ?? "",
    endDate:     editProject?.endDate   ?? "",
  });
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
    setServerError("");
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim() || form.title.trim().length < 3)
      e.title = "Title must be at least 3 characters.";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = "Please provide a brief description (min. 10 characters).";
    if (!form.clientId)
      e.clientId = "Select a client.";
    if (!form.managerId)
      e.managerId = "Select a project manager.";
    if (form.budget && isNaN(Number(form.budget.replace(/,/g, ""))))
      e.budget = "Budget must be a valid number.";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = "End date must be on or after start date.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");

    const rawBudget = form.budget.replace(/,/g, "");
    const url    = isEdit ? `/api/admin/projects/${editProject!.id}` : "/api/admin/projects";
    const method = isEdit ? "PATCH" : "POST";

    const body = {
      title:       form.title.trim(),
      description: form.description.trim(),
      clientId:    form.clientId,
      managerId:   form.managerId,
      status:      form.status,
      budget:      rawBudget ? Number(rawBudget) : undefined,
      startDate:   form.startDate ? `${form.startDate}T00:00:00Z` : null,
      endDate:     form.endDate   ? `${form.endDate}T00:00:00Z`   : null,
    };

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Something went wrong."); return; }

      // The API returns Prisma's shape (nested `client` / `manager` relations).
      // Normalise into the flat AdminProject shape the table expects.
      const project: AdminProject = {
        id:          data.id,
        title:       data.title,
        description: data.description ?? "",
        status:      data.status,
        budget:      data.budget ? Number(data.budget) : 0,
        clientId:    data.clientId,
        clientName:  data.client?.name  ?? form.clientId,
        managerId:   data.managerId,
        managerName: data.manager?.name ?? form.managerId,
        managerAccepted:   data.managerAccepted   ?? false,
        managerAcceptedAt: data.managerAcceptedAt ?? null,
        startDate:   data.startDate
          ? new Date(data.startDate).toISOString().split("T")[0]
          : null,
        endDate: data.endDate
          ? new Date(data.endDate).toISOString().split("T")[0]
          : null,
        createdAt: data.createdAt ?? new Date().toISOString(),
      };
      onSuccess(project);
    } catch (err) {
      console.error("[CreateProjectForm] network error:", err);
      setServerError("A network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const budgetPreview = fmtBudgetPreview(form.budget);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Server error */}
      {serverError && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {serverError}
        </div>
      )}

      {/* ── Project Details ─────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
        <SectionHeading icon={<DollarSign size={13} />} title="Project Details" />

        <div>
          <label className={LABEL}>Project Title <span className="text-blue-500">*</span></label>
          <input
            className={`${FIELD} ${errors.title ? "border-blue-300" : ""}`}
            type="text"
            placeholder="e.g. Chichiri Residential Complex"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors.title && <p className="mt-1 text-xs text-blue-600">{errors.title}</p>}
        </div>

        <div>
          <label className={LABEL}>Description <span className="text-blue-500">*</span></label>
          <textarea
            className={`${FIELD} min-h-[88px] resize-y ${errors.description ? "border-blue-300" : ""}`}
            placeholder="Brief description of the project scope…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          {errors.description && <p className="mt-1 text-xs text-blue-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Status</label>
            <select
              className={FIELD}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>
              Budget (MK)
              {budgetPreview && (
                <span className="ml-2 font-normal text-[#8fb9e8]">= {budgetPreview}</span>
              )}
            </label>
            <input
              className={`${FIELD} ${errors.budget ? "border-blue-300" : ""}`}
              type="text"
              inputMode="numeric"
              placeholder="e.g. 2500000"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
            />
            {errors.budget && <p className="mt-1 text-xs text-blue-600">{errors.budget}</p>}
          </div>
        </div>
      </div>

      {/* ── People ──────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
        <SectionHeading icon={<Users size={13} />} title="Assign People" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Client <span className="text-blue-500">*</span></label>
            {clients.length === 0 ? (
              <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                No clients found. Create a Client user first.
              </p>
            ) : (
              <>
                <select
                  className={`${FIELD} ${errors.clientId ? "border-blue-300" : ""}`}
                  value={form.clientId}
                  onChange={(e) => set("clientId", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.clientId && <p className="mt-1 text-xs text-blue-600">{errors.clientId}</p>}
              </>
            )}
          </div>
          <div>
            <label className={LABEL}>Project Manager <span className="text-blue-500">*</span></label>
            {managers.length === 0 ? (
              <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                No managers found. Create a Project Manager first.
              </p>
            ) : (
              <>
                <select
                  className={`${FIELD} ${errors.managerId ? "border-blue-300" : ""}`}
                  value={form.managerId}
                  onChange={(e) => set("managerId", e.target.value)}
                >
                  <option value="">— Select —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {errors.managerId && <p className="mt-1 text-xs text-blue-600">{errors.managerId}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Timeline ────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4">
        <SectionHeading icon={<CalendarDays size={13} />} title="Timeline" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Start Date</label>
            <input
              className={FIELD}
              type="date"
              value={form.startDate ?? ""}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className={LABEL}>End Date</label>
            <input
              className={`${FIELD} ${errors.endDate ? "border-blue-300" : ""}`}
              type="date"
              min={form.startDate || undefined}
              value={form.endDate ?? ""}
              onChange={(e) => set("endDate", e.target.value)}
            />
            {errors.endDate && <p className="mt-1 text-xs text-blue-600">{errors.endDate}</p>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2d4a6b] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a2f4a] disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> {isEdit ? "Saving…" : "Creating…"}</>
            : isEdit ? "Save Changes" : "Create Project"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
