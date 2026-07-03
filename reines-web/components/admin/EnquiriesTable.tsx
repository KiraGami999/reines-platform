"use client";

import { useState } from "react";
import { Mail, MailOpen, Trash2, Phone, ChevronDown, ChevronUp, MessageSquare, MailCheck, MailX, AlertTriangle } from "lucide-react";
import StatCard from "./StatCard";
import { fmtAdmin, type AdminEnquiry } from "@/lib/mock-admin";

export default function EnquiriesTable({ initialEnquiries }: { initialEnquiries: AdminEnquiry[] }) {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>(initialEnquiries);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,     setToast]     = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  function showError(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  const total  = enquiries.length;
  const unread = enquiries.filter((e) => !e.read).length;
  const read   = enquiries.filter((e) => e.read).length;

  const filtered = enquiries.filter((e) =>
    filter === "all"    ? true :
    filter === "unread" ? !e.read :
    e.read
  );

  async function markRead(id: string) {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(data.error ?? "Failed to mark as read.");
        return;
      }
    } catch { /* DB not connected — update local state anyway */ }
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, read: true } : e));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this enquiry permanently?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(data.error ?? "Failed to delete enquiry.");
        return;
      }
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
    } catch { /* DB not connected — update local state anyway */
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      if (prev === id) return null;
      // Auto-mark as read when opening
      const enq = enquiries.find((e) => e.id === id);
      if (enq && !enq.read) markRead(id);
      return id;
    });
  }

  return (
    <>
      {/* Error toast */}
      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <AlertTriangle size={15} className="shrink-0" />
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6 sm:gap-4">
        <StatCard label="Total Enquiries" value={total}  icon={<MessageSquare className="w-5 h-5" />} />
        <StatCard label="Unread"          value={unread} icon={<MailX className="w-5 h-5" />}          accent="bg-blue-50 text-blue-600" />
        <StatCard label="Read"            value={read}   icon={<MailCheck className="w-5 h-5" />}       accent="bg-blue-50 text-blue-600" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f
                ? "bg-[#2d4a6b] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f} {f === "unread" && unread > 0 && <span className="ml-1 bg-[#8fb9e8] text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 px-6 py-12 text-center text-zinc-400">
            No {filter !== "all" ? filter : ""} enquiries found.
          </div>
        )}

        {filtered.map((enq) => {
          const isExpanded = expanded === enq.id;
          return (
            <div
              key={enq.id}
              className={`bg-white rounded-xl border transition-all ${
                !enq.read ? "border-[#8fb9e8]/60 shadow-sm" : "border-zinc-200"
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-50 rounded-xl transition-colors"
                onClick={() => toggleExpand(enq.id)}
              >
                <div className={`mt-0.5 shrink-0 ${enq.read ? "text-zinc-400" : "text-[#8fb9e8]"}`}>
                  {enq.read ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${enq.read ? "text-zinc-700" : "text-[#2d4a6b]"}`}>
                      {enq.name}
                    </span>
                    {!enq.read && (
                      <span className="text-xs bg-[#8fb9e8] text-white px-2 py-0.5 rounded-full">New</span>
                    )}
                    <span className="text-xs text-zinc-400">·</span>
                    <span className="text-xs text-zinc-400">{fmtAdmin(enq.createdAt)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{enq.email}{enq.phone && ` · ${enq.phone}`}</p>
                  <p className={`text-sm mt-1 truncate ${enq.read ? "text-zinc-500" : "text-zinc-800 font-medium"}`}>
                    {enq.subject}
                  </p>
                  {!isExpanded && (
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{enq.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(enq.id); }}
                    disabled={deleting === enq.id}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-zinc-100">
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-500 py-3">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{enq.email}</span>
                    {enq.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{enq.phone}</span>}
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-zinc-700 mb-2">{enq.subject}</p>
                    <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">{enq.message}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a
                      href={`mailto:${enq.email}?subject=Re: ${encodeURIComponent(enq.subject)}`}
                      className="inline-flex items-center gap-1.5 bg-[#2d4a6b] hover:bg-[#1a2f4a] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Reply by Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
