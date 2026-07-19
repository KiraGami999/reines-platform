"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  MessageSquare,
  XCircle,
  ChevronDown,
  Loader2,
  RefreshCw,
  ExternalLink,
  Calendar,
  MapPin,
  Banknote,
  Building2,
  Phone,
  Mail,
} from "lucide-react";

interface QuotationRequest {
  id:                  string;
  name:                string;
  email:               string;
  phone?:              string;
  company?:            string;
  projectType:         string;
  description:         string;
  location:            string;
  budgetRange?:        string;
  timeline?:           string;
  projectSize?:        string;
  specialRequirements?: string;
  howHeardAboutUs?:    string;
  read:                boolean;
  status:              string;
  adminNotes?:         string;
  createdAt:           string;
}

const STATUS_CONFIG = {
  NEW:      { label: "New",      color: "bg-blue-100 text-blue-700",   dot: "bg-blue-500"   },
  REVIEWED: { label: "Reviewed", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  QUOTED:   { label: "Quoted",   color: "bg-green-100 text-green-700",  dot: "bg-green-500"  },
  CLOSED:   { label: "Closed",   color: "bg-zinc-100 text-zinc-500",    dot: "bg-zinc-400"   },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.NEW;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400 truncate">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

export default function AdminQuotationsPage() {
  const [rows,        setRows]        = useState<QuotationRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterStatus, setFilter]     = useState("ALL");
  const [selected,    setSelected]    = useState<QuotationRequest | null>(null);
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [editNotes,   setEditNotes]   = useState("");
  const [editStatus,  setEditStatus]  = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/quotations").catch(() => null);
    if (res?.ok) setRows(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch(`/api/quotations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
  }

  function openDetail(row: QuotationRequest) {
    setSelected(row);
    setEditNotes(row.adminNotes ?? "");
    setEditStatus(row.status);
    if (!row.read) markRead(row.id);
  }

  async function saveChanges() {
    if (!selected) return;
    setSavingId(selected.id);
    const res = await fetch(`/api/quotations/${selected.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: editStatus, adminNotes: editNotes, read: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((r) => r.map((x) => (x.id === updated.id ? updated : x)));
      setSelected(updated);
    }
    setSavingId(null);
  }

  const filtered = rows.filter((r) => {
    const matchSearch = [r.name, r.email, r.projectType, r.location].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    rows.length,
    newCount: rows.filter((r) => r.status === "NEW").length,
    quoted:   rows.filter((r) => r.status === "QUOTED").length,
    closed:   rows.filter((r) => r.status === "CLOSED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Quotation Requests</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Review and manage inbound project quotation requests.</p>
        </div>
        <button onClick={load} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 self-start">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<FileText size={17} className="text-zinc-600" />} label="Total" value={stats.total} color="bg-zinc-100" />
        <StatCard icon={<Clock size={17} className="text-zinc-500" />} label="New" value={stats.newCount} color="bg-blue-100" />
        <StatCard icon={<CheckCircle size={17} className="text-green-600" />} label="Quoted" value={stats.quoted} color="bg-green-100" />
        <StatCard icon={<XCircle size={17} className="text-zinc-400" />} label="Closed" value={stats.closed} color="bg-zinc-100" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">

        {/* ── Table panel ── */}
        <div className="rounded-xl border border-zinc-200 bg-white">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
            <div className="relative flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, email, type, location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/40"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/40"
              >
                <option value="ALL">All statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-zinc-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">No quotation requests found.</div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => openDetail(row)}
                    className={`w-full px-4 py-4 text-left hover:bg-zinc-50 transition-colors ${selected?.id === row.id ? "bg-[#8fb9e8]/5 border-l-4 border-l-[#2d4a6b]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!row.read && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                          <p className="truncate text-sm font-semibold text-zinc-900">{row.name}</p>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">{row.projectType} · {row.location}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-zinc-400">{row.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge status={row.status} />
                        <span className="text-[10px] text-zinc-400">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Detail panel ── */}
        {selected ? (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="border-b border-zinc-100 px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">{selected.name}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Submitted {new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Contact</p>
                <div className="grid gap-2 text-sm">
                  <span className="flex items-center gap-2 text-zinc-700"><Mail size={13} className="text-zinc-400" /> {selected.email}</span>
                  {selected.phone && <span className="flex items-center gap-2 text-zinc-700"><Phone size={13} className="text-zinc-400" /> {selected.phone}</span>}
                  {selected.company && <span className="flex items-center gap-2 text-zinc-700"><Building2 size={13} className="text-zinc-400" /> {selected.company}</span>}
                </div>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Project</p>
                <div className="grid gap-2 text-sm">
                  <span className="flex items-center gap-2 text-zinc-700"><FileText size={13} className="text-zinc-400" /> {selected.projectType}</span>
                  <span className="flex items-center gap-2 text-zinc-700"><MapPin size={13} className="text-zinc-400" /> {selected.location}</span>
                  {selected.budgetRange && <span className="flex items-center gap-2 text-zinc-700"><Banknote size={13} className="text-zinc-400" /> {selected.budgetRange}</span>}
                  {selected.timeline && <span className="flex items-center gap-2 text-zinc-700"><Calendar size={13} className="text-zinc-400" /> {selected.timeline}</span>}
                  {selected.projectSize && <span className="text-xs text-zinc-500">Size: {selected.projectSize}</span>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Project Description</p>
                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{selected.description}</p>
              </div>

              {/* Special Requirements */}
              {selected.specialRequirements && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Special Requirements</p>
                  <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{selected.specialRequirements}</p>
                </div>
              )}

              {/* How heard */}
              {selected.howHeardAboutUs && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <ExternalLink size={11} /> Heard via: {selected.howHeardAboutUs}
                </div>
              )}

              {/* Admin tools */}
              <div className="space-y-3 border-t border-zinc-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Admin Actions</p>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/40"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Internal Notes</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes, follow-up actions, or quote reference…"
                    className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8fb9e8]/40"
                  />
                </div>

                <button
                  onClick={saveChanges}
                  disabled={!!savingId}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2d4a6b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2f4a] transition-colors disabled:opacity-60"
                >
                  {savingId ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Changes"}
                </button>

                <a
                  href={`mailto:${selected.email}?subject=Your%20Quotation%20Request%20-%20Reines%20Property%20Development&body=Dear%20${encodeURIComponent(selected.name)}%2C%0A%0AThank%20you%20for%20your%20quotation%20request%20for%20${encodeURIComponent(selected.projectType)}%20in%20${encodeURIComponent(selected.location)}.%0A%0A`}
                  className="block w-full text-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <MessageSquare size={13} className="inline mr-1.5" />
                  Reply via Email
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-20">
            <div className="text-center">
              <FileText size={28} strokeWidth={1.5} className="mx-auto text-zinc-300" />
              <p className="mt-3 text-sm text-zinc-400">Select a request to view details</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
