"use client";

import { useState, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadCloud, X, CheckCircle2, AlertCircle,
  FileImage, FileText, Loader2, Images, File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_MAX = 1000;
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOC_TYPES   = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

// ─── Types ────────────────────────────────────────────────────────────────────

type FileKind   = "image" | "document";
type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
  uid:     string;
  file:    File;
  kind:    FileKind;
  preview: string | null;  // data-URL for images
  status:  FileStatus;
  error?:  string;
}

interface UploadFormProps {
  projectId:    string;
  projectTitle: string;
  galleryHref?: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileKind(file: File): FileKind | null {
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
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("wordprocessing")) return "Word";
  return "Document";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadForm({ projectId, projectTitle, galleryHref }: UploadFormProps) {
  const router    = useRouter();
  const uid       = useId();
  const inputRef  = useRef<HTMLInputElement>(null);

  const [files,           setFiles]           = useState<FileEntry[]>([]);
  const [note,            setNote]            = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [dragging,        setDragging]        = useState(false);
  const [formState,       setFormState]       = useState<FormState>("idle");
  const [globalError,     setGlobalError]     = useState<string | null>(null);
  const [doneCount,       setDoneCount]       = useState(0);

  // ── File management ─────────────────────────────────────────────────────────

  async function addFiles(incoming: FileList | File[]) {
    setGlobalError(null);
    const arr = Array.from(incoming);
    const entries: FileEntry[] = [];

    for (const f of arr) {
      const kind = fileKind(f);
      if (!kind) {
        setGlobalError("Some files were skipped — only images, PDF, and Word documents are accepted.");
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setGlobalError(`"${f.name}" is too large (max 15 MB) and was skipped.`);
        continue;
      }
      const preview = kind === "image" ? await readPreview(f) : null;
      entries.push({ uid: `${uid}-${Date.now()}-${f.name}`, file: f, kind, preview, status: "pending" });
    }

    setFiles((prev) => [...prev, ...entries]);
  }

  function removeFile(uid: string) {
    setFiles((prev) => prev.filter((f) => f.uid !== uid));
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload a single file and save its gallery record ─────────────────────────

  async function uploadOne(entry: FileEntry): Promise<"done" | "error"> {
    // Mark as uploading
    setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "uploading" } : f));

    // Step 1 — upload the file
    const fd = new FormData();
    fd.append("file", entry.file);

    const uploadRes  = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      const msg = uploadData.error ?? "Upload failed.";
      setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "error", error: msg } : f));
      return "error";
    }

    // Step 2 — create the gallery record
    const isImage = entry.kind === "image";
    const body = {
      note:            note.trim(),
      progressPercent,
      imageUrl:        isImage ? uploadData.url  : null,
      documentUrl:     isImage ? null            : uploadData.url,
      documentName:    isImage ? null            : (uploadData.originalName ?? entry.file.name),
      documentType:    isImage ? null            : (uploadData.mimeType ?? entry.file.type),
    };

    const saveRes  = await fetch(`/api/projects/${projectId}/gallery`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!saveRes.ok) {
      const saveData = await saveRes.json().catch(() => ({}));
      const msg = saveData.error ?? "Could not save update.";
      setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "error", error: msg } : f));
      return "error";
    }

    setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "done" } : f));
    setDoneCount((n) => n + 1);
    return "done";
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    if (!note.trim()) {
      setGlobalError("Please add a progress note — it applies to all uploaded files.");
      return;
    }

    // Allow submitting with no files (text-only update)
    if (files.length === 0) {
      setFormState("submitting");
      const res  = await fetch(`/api/projects/${projectId}/gallery`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ note: note.trim(), progressPercent }),
      });
      setFormState(res.ok ? "success" : "error");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setGlobalError(d.error ?? "Could not save update.");
      } else {
        router.refresh();
      }
      return;
    }

    setFormState("submitting");
    setDoneCount(0);

    // Upload all files — sequentially to avoid hammering the server
    let hadError = false;
    for (const entry of files) {
      const result = await uploadOne(entry);
      if (result === "error") hadError = true;
    }

    router.refresh();
    setFormState(hadError ? "error" : "success");
    if (hadError) {
      setGlobalError("Some files failed to upload. Successful ones have been saved.");
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  function reset() {
    setFiles([]);
    setNote("");
    setProgressPercent(0);
    setGlobalError(null);
    setDoneCount(0);
    setFormState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Success view ─────────────────────────────────────────────────────────────

  if (formState === "success") {
    const count = files.filter((f) => f.status === "done").length || (files.length === 0 ? 1 : 0);
    return (
      <div className="flex flex-col items-center rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-green-800">
          {count === 1 ? "Update posted!" : `${count} update${count !== 1 ? "s" : ""} posted!`}
        </h3>
        <p className="mt-1.5 max-w-xs text-sm text-green-700">
          {count === 1
            ? "The progress update is now visible to your client in the gallery."
            : `All ${count} files are now visible to your client in the gallery.`}
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

  const isSubmitting = formState === "submitting";
  const noteLeft     = NOTE_MAX - note.length;
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingIdx = files.findIndex((f) => f.status === "uploading");

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
              Applied to all files in this batch. You can update it again later.
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
          <span className="font-normal text-zinc-400">(optional — photos, PDFs, Word docs)</span>
        </label>

        {/* Drop target */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-dashed py-8 transition-colors",
            dragging
              ? "border-[#8fb9e8] bg-[#8fb9e8]/5"
              : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
          )}
        >
          <UploadCloud size={32} className={dragging ? "text-[#8fb9e8]" : "text-zinc-300"} />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600">
              {dragging ? "Drop files here" : "Drag & drop files, or click to browse"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              JPEG · PNG · WEBP · GIF · PDF · DOC · DOCX · Max 15 MB each · Multiple files supported
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); }}
          />
        </div>

        {/* File queue */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((entry) => (
              <li
                key={entry.uid}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  entry.status === "done"      && "border-green-200 bg-green-50",
                  entry.status === "error"     && "border-red-200 bg-red-50",
                  entry.status === "uploading" && "border-[#8fb9e8]/40 bg-[#8fb9e8]/5",
                  entry.status === "pending"   && "border-zinc-200 bg-white"
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
                {entry.status === "pending" && !isSubmitting && (
                  <button
                    type="button"
                    onClick={() => removeFile(entry.uid)}
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
        {isSubmitting && files.length > 0 && (
          <p className="mt-2 text-center text-xs text-zinc-500">
            {uploadingIdx >= 0
              ? `Uploading file ${uploadingIdx + 1} of ${files.length}…`
              : `Saving ${doneCount} of ${files.length} update${files.length !== 1 ? "s" : ""}…`}
          </p>
        )}
      </div>

      {/* ── Note ── */}
      <div className="space-y-1.5">
        <label htmlFor={`${uid}-note`} className="block text-sm font-medium text-zinc-700">
          Progress Note <span className="text-red-400">*</span>
          {files.length > 1 && (
            <span className="ml-1 font-normal text-zinc-400">(shared across all {files.length} files)</span>
          )}
        </label>
        <textarea
          id={`${uid}-note`}
          rows={4}
          placeholder="Describe what was completed — e.g. 'Foundation poured. DPC laid. Ready for brickwork Monday.'"
          value={note}
          onChange={(e) => { setNote(e.target.value); setGlobalError(null); }}
          disabled={isSubmitting}
          className="block w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:opacity-60"
          maxLength={NOTE_MAX}
          required
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">Visible to your client alongside each file.</p>
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
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 size={16} className="mr-2 animate-spin" />
            {files.length > 0 ? `Uploading… (${doneCount}/${files.length})` : "Saving…"}
          </>
        ) : files.length === 0 ? (
          "Post text update"
        ) : files.length === 1 ? (
          "Post update with attachment"
        ) : (
          `Post update with ${files.length} files`
        )}
      </Button>

      {files.length > 1 && !isSubmitting && (
        <p className="text-center text-xs text-zinc-400">
          <FileIcon size={11} className="inline mr-1" />
          Files upload one by one so every attachment is saved correctly.
        </p>
      )}
    </form>
  );
}
