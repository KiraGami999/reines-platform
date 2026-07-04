"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Calendar,
  ZoomIn,
  Trash2,
  Loader2,
  AlertCircle,
  ClipboardList,
  FileText,
} from "lucide-react";
import type { ProjectUpdate } from "@/models/project";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isProxyUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/api/media");
}

function isPlaceholder(url: string | null): url is string {
  return typeof url === "string" && url.startsWith("__placeholder__:");
}

function getGradientClasses(url: string): string {
  return url.replace("__placeholder__:", "");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Delete update?</p>
              <p className="text-xs text-zinc-500">This cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
              : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  updates:   ProjectUpdate[];
  index:     number;
  projectId?: string;
  canDelete: boolean;
  onClose:   () => void;
  onDeleted: (id: string) => void;
}

function Lightbox({ updates, index, projectId, canDelete, onClose, onDeleted }: LightboxProps) {
  const [current,      setCurrent]      = useState(index);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const item = updates[current];

  const prev = useCallback(() => setCurrent((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setCurrent((i) => Math.min(updates.length - 1, i + 1)), [updates.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !showConfirm) onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, showConfirm]);

  async function handleDelete() {
    if (!projectId || !item) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/gallery/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted(item.id);
        setShowConfirm(false);
        // Move to adjacent item or close if none left
        if (updates.length <= 1) {
          onClose();
        } else {
          setCurrent((i) => Math.min(i, updates.length - 2));
        }
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#2d4a6b] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Action row */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
            {canDelete && projectId && (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/80 text-white hover:bg-blue-600 transition-colors"
                aria-label="Delete update"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Image area */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden">
            {item.imageUrl && !isPlaceholder(item.imageUrl) ? (
              <Image
                src={item.imageUrl}
                alt={item.note}
                fill
                unoptimized={isProxyUrl(item.imageUrl)}
                className="object-contain"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            ) : item.imageUrl && isPlaceholder(item.imageUrl) ? (
              <div
                className={`h-full w-full bg-gradient-to-br ${getGradientClasses(item.imageUrl)} flex flex-col items-center justify-center gap-3`}
              >
                <ImageIcon size={48} className="text-white/30" />
                <p className="text-xs text-white/40">Site photo · {fmtDate(item.createdAt)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16">
                <ImageIcon size={40} className="text-zinc-600" />
                <p className="text-sm text-zinc-500">No image for this update</p>
              </div>
            )}
          </div>

          {/* Note + meta + thumbnail strip */}
          <div className="border-t border-white/10 px-6 py-5">
            <div className="flex items-center gap-2 text-xs text-[#8fb9e8]">
              <Calendar size={12} />
              {fmtDate(item.createdAt)}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.note}</p>
            {item.documentUrl && (
              <a
                href={item.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#8fb9e8] transition-colors hover:bg-white/10"
              >
                <FileText size={14} className="shrink-0" />
                <span className="truncate">{item.documentName ?? "Project document"}</span>
              </a>
            )}

            {/* Thumbnail strip */}
            {updates.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {updates.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => setCurrent(i)}
                    className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === current
                        ? "border-[#8fb9e8]"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    {u.imageUrl && isPlaceholder(u.imageUrl) ? (
                      <div className={`h-12 w-16 bg-gradient-to-br ${getGradientClasses(u.imageUrl)}`} />
                    ) : u.imageUrl ? (
                      <div className="relative h-12 w-16">
                        <Image src={u.imageUrl} alt="" fill unoptimized={isProxyUrl(u.imageUrl)} className="object-cover" sizes="64px" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center bg-zinc-800">
                        <ImageIcon size={14} className="text-zinc-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prev / Next */}
          {updates.length > 1 && (
            <>
              <button
                onClick={prev}
                disabled={current === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                disabled={current === updates.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-[8.5rem] left-0 right-0 flex justify-center">
            <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs text-white/70">
              {current + 1} / {updates.length}
            </span>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <DeleteDialog
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ─── Gallery card ─────────────────────────────────────────────────────────────

function GalleryCard({
  update,
  index,
  onOpen,
}: {
  update: ProjectUpdate;
  index:  number;
  onOpen: (i: number) => void;
}) {
  return (
    <button
      onClick={() => onOpen(index)}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb9e8]"
    >
      {update.imageUrl && isPlaceholder(update.imageUrl) ? (
        <div
          className={`h-full w-full bg-gradient-to-br ${getGradientClasses(update.imageUrl)} transition-transform duration-300 group-hover:scale-105`}
        />
      ) : update.imageUrl ? (
        <Image
          src={update.imageUrl}
          alt={update.note}
          fill
          unoptimized={isProxyUrl(update.imageUrl)}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100">
          <ImageIcon size={28} className="text-zinc-300" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <ZoomIn size={16} className="absolute right-3 top-3 text-white" />
        <p className="line-clamp-2 text-xs leading-relaxed text-white">{update.note}</p>
        {update.progressPercent !== null && (
          <p className="mt-1 text-[10px] font-semibold text-white/80">{update.progressPercent}% estimated</p>
        )}
        <p className="mt-1 text-[10px] text-white/60">{fmtDate(update.createdAt)}</p>
      </div>

      {/* Date chip */}
      <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
        {new Date(update.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </div>
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GalleryTab = "all" | "photos" | "documents" | "notes";

// ─── Category tab bar ─────────────────────────────────────────────────────────

function TabBar({
  tab, onChange,
  photoCount, docCount, noteCount,
}: {
  tab:        GalleryTab;
  onChange:   (t: GalleryTab) => void;
  photoCount: number;
  docCount:   number;
  noteCount:  number;
}) {
  const total = photoCount + docCount + noteCount;
  const tabs: { id: GalleryTab; label: string; count: number }[] = [
    { id: "all",       label: "All",       count: total      },
    { id: "photos",    label: "Photos",    count: photoCount },
    { id: "documents", label: "Documents", count: docCount   },
    { id: "notes",     label: "Notes",     count: noteCount  },
  ];

  return (
    <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
      {tabs.map((t) => {
        const active = tab === t.id;
        const hidden = t.count === 0 && t.id !== "all";
        if (hidden) return null;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                active ? "bg-[#8fb9e8]/20 text-[#2d4a6b]" : "bg-zinc-200 text-zinc-500"
              )}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Document list item ────────────────────────────────────────────────────────

function DocumentItem({
  u,
  projectId,
  canDelete,
  onDeleted,
}: {
  u:         ProjectUpdate;
  projectId?: string;
  canDelete: boolean;
  onDeleted: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8]/10">
        <FileText size={18} strokeWidth={1.8} className="text-[#2d4a6b]" />
      </div>
      <div className="min-w-0 flex-1">
        <a
          href={u.documentUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#2d4a6b] hover:underline"
        >
          {u.documentName ?? "Project document"}
        </a>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700">{u.note}</p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span>{fmtDate(u.createdAt)}</span>
          {u.progressPercent !== null && (
            <span className="font-medium text-[#2d4a6b]">{u.progressPercent}% complete</span>
          )}
        </div>
      </div>
      {canDelete && projectId && (
        <button
          onClick={async () => {
            if (!confirm("Delete this update?")) return;
            const res = await fetch(`/api/projects/${projectId}/gallery/${u.id}`, { method: "DELETE" });
            if (res.ok) onDeleted(u.id);
          }}
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Delete update"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Note list item ────────────────────────────────────────────────────────────

function NoteItem({
  u,
  projectId,
  canDelete,
  onDeleted,
}: {
  u:         ProjectUpdate;
  projectId?: string;
  canDelete: boolean;
  onDeleted: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100">
        <ClipboardList size={14} strokeWidth={1.8} className="text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-zinc-700">{u.note}</p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span>{fmtDate(u.createdAt)}</span>
          {u.progressPercent !== null && (
            <span className="font-medium text-[#2d4a6b]">{u.progressPercent}% complete</span>
          )}
        </div>
      </div>
      {canDelete && projectId && (
        <button
          onClick={async () => {
            if (!confirm("Delete this update?")) return;
            const res = await fetch(`/api/projects/${projectId}/gallery/${u.id}`, { method: "DELETE" });
            if (res.ok) onDeleted(u.id);
          }}
          className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Delete update"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface GalleryGridProps {
  updates:       ProjectUpdate[];
  projectTitle?: string;
  projectId?:    string;
  canDelete?:    boolean;
}

export function GalleryGrid({
  updates: initialUpdates,
  projectTitle,
  projectId,
  canDelete = false,
}: GalleryGridProps) {
  const router = useRouter();
  const [deletedIds,    setDeletedIds]    = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeTab,     setActiveTab]     = useState<GalleryTab>("all");

  const updates = initialUpdates.filter((u) => !deletedIds.includes(u.id));

  function handleDeleted(id: string) {
    setDeletedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    router.refresh();
  }

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
        <ImageIcon size={40} className="text-zinc-200" />
        <h3 className="mt-4 text-sm font-semibold text-zinc-600">No updates yet</h3>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-zinc-400">
          {projectTitle
            ? `Progress updates for "${projectTitle}" will appear here.`
            : "Progress photos, documents, and notes will appear here as your project manager posts updates."}
        </p>
      </div>
    );
  }

  const withImages    = updates.filter((u) => u.imageUrl);
  const withDocuments = updates.filter((u) => u.documentUrl);
  const textOnly      = updates.filter((u) => !u.imageUrl && !u.documentUrl);

  // Derive which items to show based on active tab
  const showPhotos    = activeTab === "all" || activeTab === "photos";
  const showDocuments = activeTab === "all" || activeTab === "documents";
  const showNotes     = activeTab === "all" || activeTab === "notes";

  const visiblePhotos    = showPhotos    ? withImages    : [];
  const visibleDocuments = showDocuments ? withDocuments : [];
  const visibleNotes     = showNotes     ? textOnly      : [];

  const nothingVisible =
    visiblePhotos.length === 0 && visibleDocuments.length === 0 && visibleNotes.length === 0;

  return (
    <div className="space-y-5">
      {/* ── Category tabs ── */}
      <TabBar
        tab={activeTab}
        onChange={(t) => { setActiveTab(t); setLightboxIndex(null); }}
        photoCount={withImages.length}
        docCount={withDocuments.length}
        noteCount={textOnly.length}
      />

      {/* ── Empty state for active tab ── */}
      {nothingVisible && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
          <ImageIcon size={32} className="text-zinc-200" />
          <p className="mt-3 text-sm text-zinc-400">
            No {activeTab === "photos" ? "photos" : activeTab === "documents" ? "documents" : "text notes"} yet.
          </p>
        </div>
      )}

      {/* ── Photo grid ── */}
      {visiblePhotos.length > 0 && (
        <section>
          {activeTab === "all" && (
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Photos
            </h3>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visiblePhotos.map((u, i) => (
              <GalleryCard key={u.id} update={u} index={i} onOpen={setLightboxIndex} />
            ))}
          </div>
        </section>
      )}

      {/* ── Document list ── */}
      {visibleDocuments.length > 0 && (
        <section>
          {activeTab === "all" && (
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Documents
            </h3>
          )}
          <div className="space-y-3">
            {visibleDocuments.map((u) => (
              <DocumentItem
                key={u.id}
                u={u}
                projectId={projectId}
                canDelete={canDelete}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Notes list ── */}
      {visibleNotes.length > 0 && (
        <section>
          {activeTab === "all" && (
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Text Updates
            </h3>
          )}
          <div className="space-y-3">
            {visibleNotes.map((u) => (
              <NoteItem
                key={u.id}
                u={u}
                projectId={projectId}
                canDelete={canDelete}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Lightbox (always based on full photo list so indices stay valid) ── */}
      {lightboxIndex !== null && withImages.length > 0 && (
        <Lightbox
          updates={withImages}
          index={lightboxIndex}
          projectId={projectId}
          canDelete={canDelete}
          onClose={() => setLightboxIndex(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
