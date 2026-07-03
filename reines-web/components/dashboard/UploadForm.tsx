"use client";

import { useState, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadCloud, X, CheckCircle2, AlertCircle,
  FileImage, FileText, Loader2, Images,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { BatchFile } from "@/models/project";

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_MAX        = 1000;
const MAX_FILE_BYTES  = 15 * 1024 * 1024; // 15 MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOC_TYPES   = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FileKind   = "image" | "document";
type FileStatus = "pending" | "uploading" | "done" | "error";

interface QueueEntry {
  uid:     string;
  file:    File;
  kind:    FileKind;
  preview: string | null;
  status:  FileStatus;
  error?:  string;
}

interface UploadFormProps {
  projectId:    string;
  projectTitle: string;
  galleryHref?: string;
}

type FormState = "idle" | "uploading" | "saving" | "success" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectKind(file: File): FileKind | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_DOC_TYPES.includes(file.type))   return "document";
  return null;
}

function readPreview(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

function docLabel(mimeType: string): string {
  if (mimeType.includes("pdf"))  return "PDF";
  if (mimeType.includes("word") || mimeType.includes("wordprocessing")) return "Word";
  return "Document";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadForm({ projectId, projectTitle, galleryHref }: UploadFormProps) {
  const router   = useRouter();
  const uid      = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [queue,           setQueue]           = useState<QueueEntry[]>([]);
  const [note,            setNote]            = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [dragging,        setDragging]        = useState(false);
  const [formState,       setFormState]       = useState<FormState>("idle");
  const [globalError,     setGlobalError]     = useState<string | null>(null);
  const [uploadedCount,   setUploadedCount]   = useState(0);

  // ── File queue management ────────────────────────────────────────────────────

  async function enqueueFiles(incoming: FileList | File[]) {
    setGlobalError(null);
    const arr     = Array.from(incoming);
    const entries: QueueEntry[] = [];

    for (const f of arr) {
      const kind = detectKind(f);
      if (!kind) {
        setGlobalError("Some files were skipped — only images, PDF, and Word documents are accepted.");
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setGlobalError(`"${f.name}" exceeds the 15 MB limit and was skipped.`);
        continue;
      }
      const preview = kind === "image" ? await readPreview(f) : null;
      entries.push({
        uid:     `${uid}-${Date.now()}-${f.name}`,
        file:    f,
        kind,
        preview,
        status:  "pending",
      });
    }

    setQueue((prev) => [...prev, ...entries]);
  }

  function removeFromQueue(uid: string) {
    setQueue((prev) => prev.filter((e) => e.uid !== uid));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) enqueueFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    if (!note.trim()) {
      setGlobalError("Please add a progress note for this update.");
      return;
    }

    // ── Text-only update (no files) ──────────────────────────────────────────
    if (queue.length === 0) {
      setFormState("saving");
      const res = await fetch(`/api/projects/${projectId}/gallery`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ note: note.trim(), progressPercent }),
      });
      if (res.ok) {
        router.refresh();
        setFormState("success");
      } else {
        const d = await res.json().catch(() => ({}));
        setGlobalError(d.error ?? "Could not save update. Please try again.");
        setFormState("error");
      }
      return;
    }

    // ── Step 1: Upload all files in parallel ─────────────────────────────────
    setFormState("uploading");
    setUploadedCount(0);

    // Mark all as uploading
    setQueue((prev) => prev.map((e) => ({ ...e, status: "uploading" as FileStatus })));

    const uploadResults = await Promise.all(
      queue.map(async (entry): Promise<{ entry: QueueEntry; result: BatchFile | null; err: string | null }> => {
        const fd = new FormData();
        fd.append("file", entry.file);

        try {
          const res  = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            return { entry, result: null, err: data.error ?? "Upload failed." };
          }

          setUploadedCount((n) => n + 1);

          return {
            entry,
            result: {
              url:  data.url,
              name: data.originalName ?? entry.file.name,
              type: data.mimeType ?? entry.file.type,
              kind: entry.kind,
            },
            err: null,
          };
        } catch {
          return { entry, result: null, err: "Network error — upload failed." };
        }
      })
    );

    // Update queue status per result
    setQueue((prev) =>
      prev.map((e) => {
        const r = uploadResults.find((r) => r.entry.uid === e.uid);
        if (!r) return e;
        return { ...e, status: r.err ? ("error" as FileStatus) : ("done" as FileStatus), error: r.err ?? undefined };
      })
    );

    const succeeded = uploadResults.filter((r) => r.result !== null);
    const failed    = uploadResults.filter((r) => r.result === null);

    if (succeeded.length === 0) {
      setGlobalError("All file uploads failed. Please check your connection and try again.");
      setFormState("error");
      return;
    }
    if (failed.length > 0) {
      setGlobalError(`${failed.length} file(s) failed to upload and were excluded from the batch.`);
    }

    // ── Step 2: Save ONE gallery record with all uploaded files ──────────────
    setFormState("saving");

    const batchFiles: BatchFile[] = succeeded.map((r) => r.result!);

    const saveRes  = await fetch(`/api/projects/${projectId}/gallery`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        note:            note.trim(),
        progressPercent,
        files:           batchFiles,
      }),
    });

    if (!saveRes.ok) {
      const d = await saveRes.json().catch(() => ({}));
      setGlobalError((prev) =>
        [prev, d.error ?? "Could not save the batch update."].filter(Boolean).join(" · ")
      );
      setFormState("error");
      return;
    }

    router.refresh();
    setFormState("success");
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  function reset() {
    setQueue([]);
    setNote("");
    setProgressPercent(0);
    setGlobalError(null);
    setUploadedCount(0);
    setFormState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Success view ─────────────────────────────────────────────────────────────

  if (formState === "success") {
    const count = queue.filter((e) => e.status === "done").length || (queue.length === 0 ? 0 : 1);
    return (
      <div className="flex flex-col items-center rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-green-800">
          {count === 0 ? "Note posted!" : count === 1 ? "Update posted!" : `Batch update posted (${count} files)!`}
        </h3>
        <p className="mt-1.5 max-w-xs text-sm text-green-700">
          {count <= 1
            ? "The progress update is now visible to your client in the gallery."
            : `All ${count} files appear as a single update in the client's gallery.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {galleryHref && (
            <a
              href={galleryHref}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2d4a6b] px-4 py-2 text-sm font-medium text-white hover:bg-[#243d5a] transition-colors"
            >
              <Images size={14} /> View Gallery
            </a>
          )}
          <button
            onClick={reset}
            className="rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
          >
            Post another update
          </button>
        </div>
      </div>
    );
  }

  const isBusy      = formState === "uploading" || formState === "saving";
  const noteLeft    = NOTE_MAX - note.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project label */}
      <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5">
        <span className="text-xs font-medium text-zinc-500">Project:</span>
        <span className="text-xs font-semibold text-zinc-900">{projectTitle}</span>
      </div>

      {/* ── Progress slider ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <label htmlFor={`${uid}-progress`} className="text-sm font-medium text-zinc-700">
              Estimated site progress
            </label>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Applies to this entire update batch.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#8fb9e8]/10 px-3 py-1 text-sm font-bold text-[#2d4a6b]">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-[#8fb9e8] transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <input
            id={`${uid}-progress`}
            type="range" min={0} max={100} step={1}
            value={progressPercent}
            onChange={(ev) => setProgressPercent(Number(ev.target.value))}
            className="w-full accent-[#2d4a6b]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Drop zone ── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Attachments{" "}
          <span className="font-normal text-zinc-400">(optional — add multiple photos and/or documents)</span>
        </label>

        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !isBusy && inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-dashed py-8 transition-colors",
            dragging
              ? "border-[#8fb9e8] bg-[#8fb9e8]/5"
              : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50",
            isBusy && "pointer-events-none opacity-50"
          )}
        >
          <UploadCloud size={32} className={dragging ? "text-[#8fb9e8]" : "text-zinc-300"} />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600">
              {dragging ? "Drop files here" : "Drag & drop files, or click to browse"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              JPEG · PNG · WEBP · GIF · PDF · DOC · DOCX · Max 15 MB each · Multiple files OK
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) enqueueFiles(e.target.files); }}
          />
        </div>

        {/* File queue */}
        {queue.length > 0 && (
          <ul className="mt-3 space-y-2">
            {queue.map((entry) => (
              <li
                key={entry.uid}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  entry.status === "done"      && "border-green-200 bg-green-50",
                  entry.status === "error"     && "border-red-200   bg-red-50",
                  entry.status === "uploading" && "border-[#8fb9e8]/40 bg-[#8fb9e8]/5",
                  entry.status === "pending"   && "border-zinc-200  bg-white"
                )}
              >
                {/* Thumbnail / icon */}
                {entry.kind === "image" && entry.preview ? (
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <Image src={entry.preview} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#8fb9e8]/10 text-[#2d4a6b]">
                    {entry.kind === "image" ? <FileImage size={18} /> : <FileText size={18} />}
                  </div>
                )}

                {/* Name + meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-800">{entry.file.name}</p>
                  <p className="text-xs text-zinc-400">
                    {entry.kind === "image" ? "Photo" : docLabel(entry.file.type)}
                    {" · "}{(entry.file.size / 1024).toFixed(0)} KB
                    {entry.status === "error" && (
                      <span className="ml-1 text-red-500"> · {entry.error}</span>
                    )}
                  </p>
                </div>

                {/* Status indicator */}
                {entry.status === "uploading" && (
                  <Loader2 size={16} className="shrink-0 animate-spin text-[#2d4a6b]" />
                )}
                {entry.status === "done" && (
                  <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                )}
                {entry.status === "error" && (
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                )}
                {entry.status === "pending" && !isBusy && (
                  <button
                    type="button"
                    onClick={() => removeFromQueue(entry.uid)}
                    className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Upload progress summary */}
        {formState === "uploading" && (
          <p className="mt-2 text-center text-xs text-zinc-500">
            Uploading {uploadedCount} of {queue.length} file{queue.length !== 1 ? "s" : ""}…
          </p>
        )}
        {formState === "saving" && (
          <p className="mt-2 text-center text-xs text-zinc-500">
            Saving batch update…
          </p>
        )}
      </div>

      {/* ── Note ── */}
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-note`} className="block text-sm font-medium text-zinc-700">
          Progress Note <span className="text-red-400">*</span>
          {queue.length > 0 && (
            <span className="ml-1 font-normal text-zinc-400">
              — one description for all {queue.length} file{queue.length !== 1 ? "s" : ""}
            </span>
          )}
        </label>
        <textarea
          id={`${uid}-note`}
          rows={4}
          placeholder="Describe what was completed — e.g. 'Foundation poured. DPC laid. Ready for brickwork Monday.'"
          value={note}
          onChange={(e) => { setNote(e.target.value); setGlobalError(null); }}
          disabled={isBusy}
          className="block w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:opacity-60"
          maxLength={NOTE_MAX}
          required
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {queue.length > 1
              ? "This single note will be shown above all files in the batch."
              : "Visible to your client alongside the update."}
          </p>
          <p className={cn("text-xs font-medium", noteLeft < 100 ? "text-amber-500" : "text-zinc-400")}>
            {noteLeft} left
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {globalError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* ── Submit ── */}
      <Button type="submit" className="w-full" size="lg" disabled={isBusy}>
        {formState === "uploading" && (
          <><Loader2 size={16} className="mr-2 animate-spin" /> Uploading {uploadedCount}/{queue.length}…</>
        )}
        {formState === "saving" && (
          <><Loader2 size={16} className="mr-2 animate-spin" /> Saving batch update…</>
        )}
        {!isBusy && (
          queue.length === 0
            ? "Post text update"
            : queue.length === 1
            ? "Post update with attachment"
            : `Post batch update (${queue.length} files)`
        )}
      </Button>
    </form>
  );
}
