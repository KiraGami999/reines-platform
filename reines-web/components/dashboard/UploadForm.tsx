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

const NOTE_MAX       = 500;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOC_TYPES   = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FileKind   = "image" | "document";
type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
  uid:     string;
  file:    File;
  kind:    FileKind;
  preview: string | null;
  note:    string;           // per-file description
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
  const formId   = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files,           setFiles]           = useState<FileEntry[]>([]);
  const [textNote,        setTextNote]        = useState("");    // used only for text-only updates
  const [progressPercent, setProgressPercent] = useState(0);
  const [dragging,        setDragging]        = useState(false);
  const [formState,       setFormState]       = useState<FormState>("idle");
  const [globalError,     setGlobalError]     = useState<string | null>(null);
  const [doneCount,       setDoneCount]       = useState(0);

  const isSubmitting = formState === "submitting";
  const hasFiles     = files.length > 0;

  // ── File queue management ────────────────────────────────────────────────────

  async function addFiles(incoming: FileList | File[]) {
    setGlobalError(null);
    const arr: FileEntry[] = [];

    for (const f of Array.from(incoming)) {
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
      arr.push({
        uid:     `${formId}-${Date.now()}-${f.name}`,
        file:    f,
        kind,
        preview,
        note:    "",
        status:  "pending",
      });
    }

    setFiles((prev) => [...prev, ...arr]);
  }

  function removeFile(uid: string) {
    setFiles((prev) => prev.filter((f) => f.uid !== uid));
  }

  function updateNote(uid: string, value: string) {
    setFiles((prev) =>
      prev.map((f) => f.uid === uid ? { ...f, note: value } : f)
    );
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload + save a single file ──────────────────────────────────────────────

  async function uploadOne(entry: FileEntry): Promise<"done" | "error"> {
    setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "uploading" } : f));

    const fd = new FormData();
    fd.append("file", entry.file);

    const uploadRes  = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json().catch(() => ({}));

    if (!uploadRes.ok) {
      const msg = uploadData.error ?? "Upload failed.";
      setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "error", error: msg } : f));
      return "error";
    }

    const isImage = entry.kind === "image";
    const body = {
      note:         entry.note.trim(),
      progressPercent,
      imageUrl:     isImage ? uploadData.url : null,
      documentUrl:  isImage ? null : uploadData.url,
      documentName: isImage ? null : (uploadData.originalName ?? entry.file.name),
      documentType: isImage ? null : (uploadData.mimeType ?? entry.file.type),
    };

    const saveRes = await fetch(`/api/projects/${projectId}/gallery`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    if (!saveRes.ok) {
      const d = await saveRes.json().catch(() => ({}));
      const msg = d.error ?? "Could not save update.";
      setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "error", error: msg } : f));
      return "error";
    }

    setFiles((prev) => prev.map((f) => f.uid === entry.uid ? { ...f, status: "done" } : f));
    setDoneCount((n) => n + 1);
    return "done";
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    // Text-only path
    if (!hasFiles) {
      if (!textNote.trim()) {
        setGlobalError("Please write a progress note.");
        return;
      }
      setFormState("submitting");
      const res = await fetch(`/api/projects/${projectId}/gallery`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ note: textNote.trim(), progressPercent }),
      });
      if (res.ok) {
        router.refresh();
        setFormState("success");
      } else {
        const d = await res.json().catch(() => ({}));
        setGlobalError(d.error ?? "Could not save update.");
        setFormState("error");
      }
      return;
    }

    // Validate every file has a description
    const missing = files.filter((f) => !f.note.trim());
    if (missing.length > 0) {
      setGlobalError(
        missing.length === 1
          ? `Please add a description for "${missing[0].file.name}".`
          : `Please add descriptions for all ${missing.length} files before posting.`
      );
      return;
    }

    setFormState("submitting");
    setDoneCount(0);

    let hadError = false;
    for (const entry of files) {
      const result = await uploadOne(entry);
      if (result === "error") hadError = true;
    }

    router.refresh();
    setFormState(hadError ? "error" : "success");
    if (hadError) {
      setGlobalError("Some files failed. The ones that succeeded have been saved.");
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  function reset() {
    setFiles([]);
    setTextNote("");
    setProgressPercent(0);
    setGlobalError(null);
    setDoneCount(0);
    setFormState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Success screen ───────────────────────────────────────────────────────────

  if (formState === "success") {
    const count = files.filter((f) => f.status === "done").length || (!hasFiles ? 1 : 0);
    return (
      <div className="flex flex-col items-center rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-green-800">
          {count === 1 ? "Update posted!" : `${count} updates posted!`}
        </h3>
        <p className="mt-1.5 max-w-xs text-sm text-green-700">
          {count === 1
            ? "Your client can now see the update in their gallery."
            : `All ${count} files are now visible to your client.`}
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

  const uploadingIdx = files.findIndex((f) => f.status === "uploading");

  // ── Form ─────────────────────────────────────────────────────────────────────

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
            <label htmlFor={`${formId}-progress`} className="text-sm font-medium text-zinc-700">
              Estimated site progress
            </label>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Applies to this entire batch of updates.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#8fb9e8]/10 px-3 py-1 text-sm font-bold text-[#2d4a6b]">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-[#8fb9e8] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            id={`${formId}-progress`}
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
              {dragging ? "Drop files here" : "Drag & drop, or click to browse"}
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
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); }}
          />
        </div>

        {/* ── Per-file cards ── */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-3">
            {files.map((entry, idx) => {
              const isPending   = entry.status === "pending";
              const isUploading = entry.status === "uploading";
              const isDone      = entry.status === "done";
              const isError     = entry.status === "error";
              const noteLeft    = NOTE_MAX - entry.note.length;

              return (
                <li
                  key={entry.uid}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    isDone      && "border-green-200 bg-green-50",
                    isError     && "border-red-200 bg-red-50",
                    isUploading && "border-[#8fb9e8]/50 bg-[#8fb9e8]/5",
                    isPending   && "border-zinc-200 bg-white"
                  )}
                >
                  {/* ── Header row ── */}
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {entry.kind === "image" && entry.preview ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                        <Image src={entry.preview} alt="" fill className="object-cover" sizes="48px" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#8fb9e8]/10 text-[#2d4a6b]">
                        {entry.kind === "image" ? <FileImage size={20} /> : <FileText size={20} />}
                      </div>
                    )}

                    {/* Filename + type */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-800">
                        <span className="mr-1.5 text-xs font-medium text-zinc-400">#{idx + 1}</span>
                        {entry.file.name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {entry.kind === "image" ? "Photo" : docLabel(entry.file.type)}
                        {" · "}{(entry.file.size / 1024).toFixed(0)} KB
                      </p>
                      {isError && entry.error && (
                        <p className="mt-1 text-xs font-medium text-red-500">{entry.error}</p>
                      )}
                    </div>

                    {/* Status / remove */}
                    <div className="shrink-0">
                      {isUploading && <Loader2 size={16} className="animate-spin text-[#2d4a6b]" />}
                      {isDone      && <CheckCircle2 size={16} className="text-green-500" />}
                      {isError     && <AlertCircle  size={16} className="text-red-500" />}
                      {isPending && !isSubmitting && (
                        <button
                          type="button"
                          onClick={() => removeFile(entry.uid)}
                          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                          aria-label="Remove file"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Per-file description ── */}
                  {!isDone && (
                    <div className="mt-3">
                      <label
                        htmlFor={`${formId}-note-${entry.uid}`}
                        className="mb-1 block text-xs font-medium text-zinc-600"
                      >
                        Description{" "}
                        <span className="font-normal text-zinc-400">
                          — what does this {entry.kind === "image" ? "photo" : "document"} show?
                        </span>
                        <span className="ml-1 text-red-400">*</span>
                      </label>
                      <textarea
                        id={`${formId}-note-${entry.uid}`}
                        rows={2}
                        placeholder={
                          entry.kind === "image"
                            ? "e.g. Foundation slab poured and levelled on the east wing."
                            : "e.g. Structural engineer's sign-off report for ground floor."
                        }
                        value={entry.note}
                        onChange={(ev) => { updateNote(entry.uid, ev.target.value); setGlobalError(null); }}
                        disabled={isSubmitting || isUploading}
                        maxLength={NOTE_MAX}
                        className="block w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:opacity-60"
                      />
                      <p className={cn("mt-1 text-right text-[11px]", noteLeft < 80 ? "text-amber-500" : "text-zinc-400")}>
                        {noteLeft} left
                      </p>
                    </div>
                  )}

                  {/* Show the saved description once done */}
                  {isDone && entry.note && (
                    <p className="mt-2 text-xs text-green-700 leading-relaxed">
                      "{entry.note}"
                    </p>
                  )}
                </li>
              );
            })}
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

      {/* ── Text-only note (shown only when no files are queued) ── */}
      {!hasFiles && (
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-textnote`} className="block text-sm font-medium text-zinc-700">
            Progress Note <span className="text-red-400">*</span>
          </label>
          <textarea
            id={`${formId}-textnote`}
            rows={4}
            placeholder="Describe what was completed — e.g. 'Foundation poured. DPC laid. Ready for brickwork Monday.'"
            value={textNote}
            onChange={(e) => { setTextNote(e.target.value); setGlobalError(null); }}
            disabled={isSubmitting}
            className="block w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:opacity-60"
            maxLength={NOTE_MAX}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">Visible to your client in their gallery.</p>
            <p className={cn("text-xs font-medium", NOTE_MAX - textNote.length < 100 ? "text-amber-500" : "text-zinc-400")}>
              {NOTE_MAX - textNote.length} left
            </p>
          </div>
        </div>
      )}

      {/* ── Global error ── */}
      {globalError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* ── Submit ── */}
      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            {files.length > 0 ? `Uploading… (${doneCount}/${files.length})` : "Saving…"}
          </>
        ) : !hasFiles ? (
          "Post text update"
        ) : files.length === 1 ? (
          "Post update with attachment"
        ) : (
          `Post ${files.length} updates`
        )}
      </Button>

      {files.length > 1 && !isSubmitting && (
        <p className="text-center text-xs text-zinc-400">
          <FileIcon size={11} className="inline mr-1" />
          Each file will be uploaded separately with its own description.
        </p>
      )}
    </form>
  );
}
