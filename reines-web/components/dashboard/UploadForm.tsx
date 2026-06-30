"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  FileImage,
  FileText,
  Loader2,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NOTE_MAX = 1000;
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface UploadFormProps {
  projectId:    string;
  projectTitle: string;
  /** Where to redirect after a successful post (e.g. gallery tab URL). */
  galleryHref?: string;
}

type UploadState = "idle" | "uploading-file" | "saving" | "success" | "error";

export function UploadForm({ projectId, projectTitle, galleryHref }: UploadFormProps) {
  const router = useRouter();

  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"image" | "document" | null>(null);
  const [note,     setNote]     = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [state,    setState]    = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── File helpers ────────────────────────────────────────────────────────────

  function handleFile(selected: File) {
    const isImage = selected.type.startsWith("image/");
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(selected.type);

    if (!isImage && !isDocument) {
      setErrorMsg("Only images, PDF, and Word documents are accepted.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setErrorMsg("File too large. Maximum size is 15 MB.");
      return;
    }
    setFile(selected);
    setFileKind(isImage ? "image" : "document");
    setErrorMsg(null);
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
    setFileKind(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMsg("Please add a note describing this update.");
      return;
    }
    if (note.length > NOTE_MAX) {
      setErrorMsg(`Note must be ${NOTE_MAX} characters or fewer.`);
      return;
    }
    setErrorMsg(null);

    let imageUrl: string | null = null;
    let documentUrl: string | null = null;
    let documentName: string | null = null;
    let documentType: string | null = null;

    // Step 1 — upload the attachment if one was selected
    if (file) {
      setState("uploading-file");
      const fd = new FormData();
      fd.append("file", file);

      const uploadRes  = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        setErrorMsg(uploadData.error ?? "File upload failed. Please try again.");
        setState("error");
        return;
      }
      if (fileKind === "image") {
        imageUrl = uploadData.url;
      } else {
        documentUrl = uploadData.url;
        documentName = uploadData.originalName ?? file.name;
        documentType = uploadData.mimeType ?? file.type;
      }
    }

    // Step 2 — save the gallery update record
    setState("saving");
    const saveRes  = await fetch(`/api/projects/${projectId}/gallery`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ note: note.trim(), imageUrl, documentUrl, documentName, documentType, progressPercent }),
    });
    const saveData = await saveRes.json().catch(() => ({}));

    if (!saveRes.ok) {
      setErrorMsg(saveData.error ?? "Could not save update. Please try again.");
      setState("error");
      return;
    }

    setState("success");

    // Refresh server component data so gallery re-renders with the new update
    router.refresh();
    if (galleryHref) {
      router.push(galleryHref);
    }
  }

  // ── Success view ────────────────────────────────────────────────────────────

  if (state === "success") {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <CheckCircle2 size={32} className="text-blue-500" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-blue-800">Update posted!</h3>
        <p className="mt-1.5 max-w-xs text-sm text-blue-600">
          The progress update is now visible to your client in the gallery.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {galleryHref && (
            <a
              href={galleryHref}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Images size={14} /> View Gallery
            </a>
          )}
          <button
            onClick={() => { setState("idle"); clearFile(); setNote(""); setProgressPercent(0); }}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Post another update
          </button>
        </div>
      </div>
    );
  }

  const isLoading    = state === "uploading-file" || state === "saving";
  const noteLeft     = NOTE_MAX - note.length;
  const noteWarning  = noteLeft < 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project label */}
      <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-4 py-2.5">
        <span className="text-xs font-medium text-zinc-500">Project:</span>
        <span className="text-xs font-semibold text-zinc-900">{projectTitle}</span>
      </div>

      {/* ── Estimated progress ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <label htmlFor="progressPercent" className="text-sm font-medium text-zinc-700">
              Estimated progress
            </label>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Use your site judgement. This estimate can be updated again as work changes.
            </p>
          </div>
          <span className="rounded-full bg-[#8fb9e8]/10 px-3 py-1 text-sm font-bold text-[#2d4a6b]">
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
            id="progressPercent"
            type="range"
            min={0}
            max={100}
            step={1}
            value={progressPercent}
            onChange={(event) => setProgressPercent(Number(event.target.value))}
            className="w-full accent-[#2d4a6b]"
          />
          <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Drop zone ── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Attachment <span className="font-normal text-zinc-400">(optional photo, PDF, or Word document)</span>
        </label>
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !preview && inputRef.current?.click()}
          className={cn(
            "relative overflow-hidden rounded-xl border-2 border-dashed transition-colors",
            dragging
              ? "border-[#8fb9e8] bg-[#8fb9e8]/5"
              : preview
              ? "border-zinc-200 bg-zinc-50"
              : "cursor-pointer border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
          )}
        >
          {preview ? (
            <div className="relative">
              <Image
                src={preview}
                alt="Preview"
                width={800}
                height={450}
                className="max-h-64 w-full object-contain"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
              <div className="border-t border-zinc-100 bg-white px-4 py-2">
                <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <FileImage size={12} />
                  {file?.name}
                  <span className="text-zinc-300">·</span>
                  {((file?.size ?? 0) / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
          ) : file && fileKind === "document" ? (
            <div className="relative flex items-center gap-3 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8fb9e8]/10 text-[#2d4a6b]">
                <FileText size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-800">{file.name}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {file.type.includes("pdf") ? "PDF document" : "Word document"} · {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
                aria-label="Remove document"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 py-10">
              <UploadCloud
                size={36}
                className={dragging ? "text-[#8fb9e8]" : "text-zinc-300"}
              />
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-600">
                  {dragging ? "Drop it here" : "Drag & drop a photo/document, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  JPEG · PNG · WEBP · GIF · PDF · DOC · DOCX · Max 15 MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      </div>

      {/* ── Note ── */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Progress Note <span className="text-blue-500">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Describe what was completed — e.g. 'Foundation poured and cured. DPC laid. Ready for brickwork to commence Monday.'"
          value={note}
          onChange={(e) => { setNote(e.target.value); setErrorMsg(null); }}
          className="block w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          maxLength={NOTE_MAX}
          required
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            This note will be visible to your client alongside the photo.
          </p>
          <p className={cn("text-xs font-medium", noteWarning ? "text-blue-600" : "text-zinc-400")}>
            {noteLeft} left
          </p>
        </div>
      </div>

      {/* ── Error ── */}
      {(state === "error" || errorMsg) && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{errorMsg ?? "Something went wrong. Please try again."}</span>
        </div>
      )}

      {/* ── Submit ── */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {state === "uploading-file" && (
          <><Loader2 size={16} className="mr-2 animate-spin" /> Uploading file…</>
        )}
        {state === "saving" && (
          <><Loader2 size={16} className="mr-2 animate-spin" /> Saving update…</>
        )}
        {(state === "idle" || state === "error") && (
          file ? "Post update with attachment" : "Post text update"
        )}
      </Button>
    </form>
  );
}
