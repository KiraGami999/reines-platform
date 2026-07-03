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
import type { ProjectUpdate, BatchFile } from "@/models/project";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
                        <Image src={u.imageUrl} alt="" fill className="object-cover" sizes="64px" />
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

// ─── Batch card ───────────────────────────────────────────────────────────────
// Renders a single ProjectUpdate that carries multiple files (BatchFile[]).

function SimpleBatchLightbox({
  files,
  startIndex,
  onClose,
}: {
  files:      BatchFile[];
  startIndex: number;
  onClose:    () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const item = files[current];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowLeft")   setCurrent((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")  setCurrent((i) => Math.min(files.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [files.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#2d4a6b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Image */}
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden">
          <Image
            src={item.url}
            alt={item.name}
            fill
            className="object-contain"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>

        {/* Caption */}
        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-sm text-zinc-300 truncate">{item.name}</p>
          {files.length > 1 && (
            <p className="mt-1 text-xs text-zinc-500">{current + 1} / {files.length}</p>
          )}
        </div>

        {/* Prev / Next */}
        {files.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((i) => Math.max(0, i - 1))}
              disabled={current === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrent((i) => Math.min(files.length - 1, i + 1))}
              disabled={current === files.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function BatchCard({
  u,
  projectId,
  canDelete,
  onDeleted,
}: {
  u:          ProjectUpdate;
  projectId?: string;
  canDelete:  boolean;
  onDeleted:  (id: string) => void;
}) {
  const files     = (u.files ?? []) as BatchFile[];
  const images    = files.filter((f) => f.kind === "image");
  const documents = files.filter((f) => f.kind === "document");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Grid column count for the image strip
  const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : images.length <= 4 ? 2 : 3;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
        {/* Note + meta header */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-sm leading-relaxed text-zinc-800">{u.note}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {fmtDate(u.createdAt)}
            </span>
            {u.progressPercent !== null && (
              <span className="font-semibold text-[#2d4a6b]">{u.progressPercent}% complete</span>
            )}
            {files.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                {files.length} file{files.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Image grid */}
        {images.length > 0 && (
          <div
            className={cn(
              "grid gap-0.5",
              cols === 1 && "grid-cols-1",
              cols === 2 && "grid-cols-2",
              cols === 3 && "grid-cols-3"
            )}
          >
            {images.map((img, i) => (
              <button
                key={img.url}
                onClick={() => setLightboxIdx(i)}
                className="group relative aspect-video overflow-hidden bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb9e8]"
              >
                <Image
                  src={img.url}
                  alt={img.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                  <ZoomIn size={20} className="text-white opacity-0 drop-shadow group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Document links */}
        {documents.length > 0 && (
          <div className={cn("space-y-1 px-4 pb-3", images.length > 0 && "pt-3")}>
            {documents.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm font-medium text-[#2d4a6b] hover:bg-[#8fb9e8]/10 transition-colors"
              >
                <FileText size={14} className="shrink-0 text-[#2d4a6b]" />
                <span className="truncate">{doc.name}</span>
              </a>
            ))}
          </div>
        )}

        {/* Delete */}
        {canDelete && projectId && (
          <div className={cn("flex justify-end px-4 pb-3", images.length === 0 && documents.length === 0 && "pt-0")}>
            <button
              onClick={async () => {
                if (!confirm("Delete this batch update? All files in it will be removed.")) return;
                const res = await fetch(`/api/projects/${projectId}/gallery/${u.id}`, { method: "DELETE" });
                if (res.ok) onDeleted(u.id);
              }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              aria-label="Delete batch update"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>

      {lightboxIdx !== null && (
        <SimpleBatchLightbox
          files={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
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

  // ── Classify each update ─────────────────────────────────────────────────────
  // A "batch" update has a non-empty files[] array (new format).
  // "Legacy" updates use the old imageUrl / documentUrl fields.

  const batchUpdates   = updates.filter((u) => u.files && (u.files as BatchFile[]).length > 0);
  const legacyUpdates  = updates.filter((u) => !u.files || (u.files as BatchFile[]).length === 0);

  // For legacy single-image updates (strip lightbox)
  const legacyImages    = legacyUpdates.filter((u) => u.imageUrl);
  const legacyDocuments = legacyUpdates.filter((u) => u.documentUrl);
  const legacyNotes     = legacyUpdates.filter((u) => !u.imageUrl && !u.documentUrl);

  // Tab counts — batches containing images/docs count toward those tabs too
  const batchWithImages    = batchUpdates.filter((u) => (u.files as BatchFile[]).some((f) => f.kind === "image"));
  const batchWithDocuments = batchUpdates.filter((u) => (u.files as BatchFile[]).some((f) => f.kind === "document"));

  const totalPhotoCount = legacyImages.length + batchWithImages.length;
  const totalDocCount   = legacyDocuments.length + batchWithDocuments.length;
  const totalNoteCount  = legacyNotes.length;

  // Derive visible sets per tab
  const showAll  = activeTab === "all";
  const showPhotos    = activeTab === "photos";
  const showDocuments = activeTab === "documents";
  const showNotes     = activeTab === "notes";

  // Which batch updates appear in the current tab?
  const visibleBatches =
    showAll       ? batchUpdates :
    showPhotos    ? batchWithImages :
    showDocuments ? batchWithDocuments :
    [];

  // Which legacy updates appear?
  const visibleLegacyImages    = (showAll || showPhotos)    ? legacyImages    : [];
  const visibleLegacyDocuments = (showAll || showDocuments) ? legacyDocuments : [];
  const visibleLegacyNotes     = (showAll || showNotes)     ? legacyNotes     : [];

  const nothingVisible =
    visibleBatches.length === 0 &&
    visibleLegacyImages.length === 0 &&
    visibleLegacyDocuments.length === 0 &&
    visibleLegacyNotes.length === 0;

  // All updates in chronological order (newest first) for rendering "All" tab
  const allSorted = [...updates].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-5">
      {/* ── Category tabs ── */}
      <TabBar
        tab={activeTab}
        onChange={(t) => { setActiveTab(t); setLightboxIndex(null); }}
        photoCount={totalPhotoCount}
        docCount={totalDocCount}
        noteCount={totalNoteCount}
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

      {/* ── "All" tab — chronological mixed feed ── */}
      {showAll && !nothingVisible && (
        <div className="space-y-4">
          {allSorted.map((u, legacyIdx) => {
            const isBatch = u.files && (u.files as BatchFile[]).length > 0;

            if (isBatch) {
              return (
                <BatchCard
                  key={u.id}
                  u={u}
                  projectId={projectId}
                  canDelete={canDelete}
                  onDeleted={handleDeleted}
                />
              );
            }

            if (u.imageUrl) {
              // Index within legacy images only (for the strip lightbox)
              const stripIdx = legacyImages.findIndex((li) => li.id === u.id);
              return (
                <div key={u.id} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  <GalleryCard update={u} index={stripIdx} onOpen={setLightboxIndex} />
                </div>
              );
            }

            if (u.documentUrl) {
              return (
                <DocumentItem
                  key={u.id}
                  u={u}
                  projectId={projectId}
                  canDelete={canDelete}
                  onDeleted={handleDeleted}
                />
              );
            }

            return (
              <NoteItem
                key={u.id}
                u={u}
                projectId={projectId}
                canDelete={canDelete}
                onDeleted={legacyIdx === 0 ? handleDeleted : handleDeleted}
              />
            );
          })}
        </div>
      )}

      {/* ── "Photos" tab ── */}
      {showPhotos && !nothingVisible && (
        <div className="space-y-4">
          {/* Batch updates that have images */}
          {visibleBatches.map((u) => (
            <BatchCard
              key={u.id}
              u={u}
              projectId={projectId}
              canDelete={canDelete}
              onDeleted={handleDeleted}
            />
          ))}
          {/* Legacy single-image grid */}
          {visibleLegacyImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleLegacyImages.map((u, i) => (
                <GalleryCard key={u.id} update={u} index={i} onOpen={setLightboxIndex} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── "Documents" tab ── */}
      {showDocuments && !nothingVisible && (
        <div className="space-y-4">
          {/* Batch updates that have documents */}
          {visibleBatches.map((u) => (
            <BatchCard
              key={u.id}
              u={u}
              projectId={projectId}
              canDelete={canDelete}
              onDeleted={handleDeleted}
            />
          ))}
          {/* Legacy single-document list */}
          {visibleLegacyDocuments.map((u) => (
            <DocumentItem
              key={u.id}
              u={u}
              projectId={projectId}
              canDelete={canDelete}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* ── "Notes" tab ── */}
      {showNotes && !nothingVisible && (
        <div className="space-y-3">
          {visibleLegacyNotes.map((u) => (
            <NoteItem
              key={u.id}
              u={u}
              projectId={projectId}
              canDelete={canDelete}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {/* ── Lightbox for legacy single-image updates ── */}
      {lightboxIndex !== null && legacyImages.length > 0 && (
        <Lightbox
          updates={legacyImages}
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
