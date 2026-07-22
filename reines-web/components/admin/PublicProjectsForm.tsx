"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Star,
  Trash2,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { upload } from "@vercel/blob/client";
import {
  AVAILABLE_PUBLIC_PROJECT_IMAGES,
  MAX_PUBLIC_PROJECT_IMAGES,
  PUBLIC_PROJECT_STATUS_OPTIONS,
  getPublicProjectCoverImage,
  type AvailablePublicProjectImage,
  type PublicProjectItem,
  type PublicProjectStatus,
} from "@/lib/public-projects-data";
import { resolveStorageUrl } from "@/lib/storage";

function mediaSrc(url: string) {
  return resolveStorageUrl(url) ?? url;
}

type Props = {
  initialProjects: PublicProjectItem[];
  availableImages: AvailablePublicProjectImage[];
  usingFallback: boolean;
};

const FIELD = "block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400";

function syncCoverImage(imageUrls: string[]): Pick<PublicProjectItem, "imageUrl" | "imageUrls"> {
  const cover = imageUrls[0] ?? "";
  return { imageUrls, imageUrl: cover };
}

function buildBlankProject(sortOrder: number): PublicProjectItem {
  const image = AVAILABLE_PUBLIC_PROJECT_IMAGES[0];

  return {
    id: `draft-${Date.now()}`,
    title: "New Public Project",
    location: "Blantyre, Malawi",
    type: "Property Development",
    status: "PLANNING",
    description: "Add a public-facing project description before saving.",
    year: String(new Date().getFullYear()),
    imageUrl: image.imageUrl,
    imageUrls: [image.imageUrl],
    active: true,
    sortOrder,
  };
}

export default function PublicProjectsForm({ initialProjects, availableImages, usingFallback }: Props) {
  const [projects, setProjects] = useState<PublicProjectItem[]>(
    initialProjects.map((project, sortOrder) => ({
      ...project,
      sortOrder,
      imageUrls: project.imageUrls?.length ? project.imageUrls : [project.imageUrl],
      imageUrl: getPublicProjectCoverImage(project),
    }))
  );
  const [selectedId, setSelectedId] = useState(initialProjects[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [projects, selectedId]
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function clearStatus() {
    setMessage("");
    setError("");
  }

  function updateProjectImages(id: string, imageUrls: string[]) {
    updateProject(id, syncCoverImage(imageUrls));
  }

  /** Batch upload — accepts one or many files selected at once and adds them all to the gallery. */
  async function handleImageBatchUpload(files: File[]) {
    if (!selectedProject || files.length === 0) return;

    const remainingSlots = MAX_PUBLIC_PROJECT_IMAGES - selectedProject.imageUrls.length;
    if (remainingSlots <= 0) {
      setError(`Each project can have up to ${MAX_PUBLIC_PROJECT_IMAGES} images.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const skippedCount = files.length - filesToUpload.length;

    setUploading(true);
    clearStatus();

    const uploadedUrls: string[] = [];
    let failedCount = 0;

    for (const file of filesToUpload) {
      try {
        const blob = await upload(
          `uploads/public-projects/${file.name}`,
          file,
          { access: "private", handleUploadUrl: "/api/upload/client" },
        );
        uploadedUrls.push(blob.url);
      } catch {
        failedCount += 1;
      }
    }

    if (uploadedUrls.length > 0) {
      updateProjectImages(selectedProject.id, [...selectedProject.imageUrls, ...uploadedUrls]);
    }

    if (failedCount > 0) {
      setError(
        uploadedUrls.length > 0
          ? `${uploadedUrls.length} image(s) uploaded, but ${failedCount} failed. Try again for the failed ones.`
          : "Image upload failed. Try again."
      );
    } else if (skippedCount > 0) {
      setMessage(
        `${uploadedUrls.length} image(s) uploaded. ${skippedCount} skipped — this project is at the ${MAX_PUBLIC_PROJECT_IMAGES}-image limit.`
      );
    } else if (uploadedUrls.length > 1) {
      setMessage(`${uploadedUrls.length} images uploaded.`);
    }

    setUploading(false);
  }

  function addPresetImage(imageUrl: string) {
    if (!selectedProject) return;
    clearStatus();

    if (selectedProject.imageUrls.includes(imageUrl)) {
      setError("That image is already in this project's gallery.");
      return;
    }

    if (selectedProject.imageUrls.length >= MAX_PUBLIC_PROJECT_IMAGES) {
      setError(`Each project can have up to ${MAX_PUBLIC_PROJECT_IMAGES} images.`);
      return;
    }

    updateProjectImages(selectedProject.id, [...selectedProject.imageUrls, imageUrl]);
  }

  function removeImage(imageUrl: string) {
    if (!selectedProject) return;
    clearStatus();

    if (selectedProject.imageUrls.length <= 1) {
      setError("Each project needs at least one image.");
      return;
    }

    updateProjectImages(
      selectedProject.id,
      selectedProject.imageUrls.filter((url) => url !== imageUrl)
    );
  }

  function setCoverImage(imageUrl: string) {
    if (!selectedProject) return;
    clearStatus();

    const next = [
      imageUrl,
      ...selectedProject.imageUrls.filter((url) => url !== imageUrl),
    ];
    updateProjectImages(selectedProject.id, next);
  }

  function moveImage(imageUrl: string, direction: -1 | 1) {
    if (!selectedProject) return;
    clearStatus();

    const index = selectedProject.imageUrls.indexOf(imageUrl);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= selectedProject.imageUrls.length) return;

    const next = [...selectedProject.imageUrls];
    [next[index], next[target]] = [next[target], next[index]];
    updateProjectImages(selectedProject.id, next);
  }

  function updateProject(id: string, patch: Partial<PublicProjectItem>) {
    clearStatus();
    setProjects((current) =>
      current.map((project) => (project.id === id ? { ...project, ...patch } : project))
    );
  }

  function addProject() {
    clearStatus();
    const project = buildBlankProject(projects.length);
    setProjects((current) => [...current, project]);
    setSelectedId(project.id);
  }

  function duplicateProject(project: PublicProjectItem) {
    clearStatus();
    const copy = {
      ...project,
      id: `draft-copy-${Date.now()}`,
      title: `${project.title} Copy`,
      sortOrder: projects.length,
      imageUrls: [...project.imageUrls],
      imageUrl: project.imageUrl,
    };
    setProjects((current) => [...current, copy]);
    setSelectedId(copy.id);
  }

  function removeProject(id: string) {
    clearStatus();
    setProjects((current) => {
      const next = current.filter((project) => project.id !== id).map((project, sortOrder) => ({ ...project, sortOrder }));
      if (selectedId === id) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function moveProject(id: string, direction: -1 | 1) {
    clearStatus();
    setProjects((current) => {
      const index = current.findIndex((project) => project.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((project, sortOrder) => ({ ...project, sortOrder }));
    });
  }

  async function save() {
    if (projects.length === 0) {
      setError("Add at least one project before saving.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    const payload = {
      projects: projects.map((project, sortOrder) => ({
        title: project.title.trim(),
        location: project.location.trim(),
        type: project.type.trim(),
        status: project.status,
        description: project.description.trim(),
        year: project.year.trim(),
        imageUrls: project.imageUrls,
        active: project.active,
        sortOrder,
      })),
    };

    try {
      const res = await fetch("/api/admin/public-projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not save public projects.");
        return;
      }

      const saved = data.projects ?? projects;
      setProjects(saved);
      setSelectedId(saved[0]?.id ?? "");
      setMessage("Public projects saved successfully.");
    } catch {
      setError("Could not save public projects. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {usingFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing starter project data until the saved public project list is available.
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <CheckCircle2 size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Public Projects</h2>
              <p className="mt-1 text-xs text-zinc-400">Add, reorder, hide, or edit project cards.</p>
            </div>
            <button
              type="button"
              onClick={addProject}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a2f4a]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {projects.map((project, index) => (
              <button
                type="button"
                key={project.id}
                onClick={() => setSelectedId(project.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedProject?.id === project.id
                    ? "border-[#2d4a6b] bg-blue-50"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-14 overflow-hidden rounded-lg bg-zinc-100">
                    <Image src={mediaSrc(project.imageUrl)} alt={project.title} fill unoptimized={mediaSrc(project.imageUrl).startsWith("/api/media")} className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{project.title}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{project.type}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                      <span>#{index + 1}</span>
                      <span>{project.status.replace("_", " ")}</span>
                      <span>{project.imageUrls.length} img</span>
                      {!project.active && <span className="font-semibold text-blue-700">Hidden</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedProject ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-zinc-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2d4a6b]">Edit Project</h2>
                <p className="mt-1 text-sm text-zinc-500">This controls what appears on the public Projects page.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveProject(selectedProject.id, -1)}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
                  aria-label="Move up"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => moveProject(selectedProject.id, 1)}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
                  aria-label="Move down"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateProject(selectedProject)}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
                  aria-label="Duplicate project"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => updateProject(selectedProject.id, { active: !selectedProject.active })}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
                  aria-label={selectedProject.active ? "Hide project" : "Show project"}
                >
                  {selectedProject.active ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => removeProject(selectedProject.id)}
                  className="rounded-lg border border-zinc-200 p-2 text-blue-700 hover:bg-blue-50"
                  aria-label="Remove project"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Project title</label>
                  <input
                    value={selectedProject.title}
                    onChange={(event) => updateProject(selectedProject.id, { title: event.target.value })}
                    className={FIELD}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Location</label>
                    <input
                      value={selectedProject.location}
                      onChange={(event) => updateProject(selectedProject.id, { location: event.target.value })}
                      className={FIELD}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Project type</label>
                    <input
                      value={selectedProject.type}
                      onChange={(event) => updateProject(selectedProject.id, { type: event.target.value })}
                      className={FIELD}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Status</label>
                    <select
                      value={selectedProject.status}
                      onChange={(event) => updateProject(selectedProject.id, { status: event.target.value as PublicProjectStatus })}
                      className={FIELD}
                    >
                      {PUBLIC_PROJECT_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Year / date range</label>
                    <input
                      value={selectedProject.year}
                      onChange={(event) => updateProject(selectedProject.id, { year: event.target.value })}
                      className={FIELD}
                      placeholder="2025 or 2025-2026"
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Description</label>
                  <textarea
                    value={selectedProject.description}
                    onChange={(event) => updateProject(selectedProject.id, { description: event.target.value })}
                    className={`${FIELD} min-h-32 resize-y`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className={LABEL}>Project gallery</label>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {selectedProject.imageUrls.length}/{MAX_PUBLIC_PROJECT_IMAGES}
                    </span>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-zinc-500">
                    The first image is the cover on the Projects page. Visitors can scroll through all images when they open a project.
                  </p>

                  <div className="space-y-3">
                    {selectedProject.imageUrls.map((imageUrl, index) => {
                      const isCover = index === 0;
                      return (
                        <div
                          key={imageUrl}
                          className={`overflow-hidden rounded-xl border ${isCover ? "border-[#2d4a6b] ring-2 ring-blue-100" : "border-zinc-200"}`}
                        >
                          <div className="relative h-28 bg-zinc-100">
                            <Image
                              src={mediaSrc(imageUrl)}
                              alt={`${selectedProject.title} image ${index + 1}`}
                              fill
                              unoptimized={mediaSrc(imageUrl).startsWith("/api/media")}
                              className="object-cover"
                              sizes="320px"
                            />
                            {isCover && (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#2d4a6b] px-2 py-0.5 text-[10px] font-semibold text-white">
                                <Star size={10} /> Cover
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-2 py-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => moveImage(imageUrl, -1)}
                                disabled={index === 0}
                                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 disabled:opacity-30"
                                aria-label="Move image up"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveImage(imageUrl, 1)}
                                disabled={index === selectedProject.imageUrls.length - 1}
                                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 disabled:opacity-30"
                                aria-label="Move image down"
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>
                            <div className="flex gap-1">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => setCoverImage(imageUrl)}
                                  className="rounded-xl border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
                                >
                                  Set cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(imageUrl)}
                                className="rounded-lg border border-zinc-200 p-1.5 text-red-600 hover:bg-red-50"
                                aria-label="Remove image"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Add from library</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableImages.map((image) => {
                      const selected = selectedProject.imageUrls.includes(image.imageUrl);
                      return (
                        <button
                          type="button"
                          key={image.imageUrl}
                          disabled={selected}
                          onClick={() => addPresetImage(image.imageUrl)}
                          className={`overflow-hidden rounded-xl border text-left disabled:opacity-50 ${
                            selected ? "border-zinc-200" : "border-zinc-200 hover:border-[#8fb9e8]"
                          }`}
                        >
                          <div className="relative h-20 bg-zinc-100">
                            <Image src={mediaSrc(image.imageUrl)} alt={image.alt} fill unoptimized={mediaSrc(image.imageUrl).startsWith("/api/media")} className="object-cover" sizes="120px" />
                          </div>
                          <p className="truncate px-2 py-1.5 text-[11px] text-zinc-500">{image.defaultTitle}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) void handleImageBatchUpload(files);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || selectedProject.imageUrls.length >= MAX_PUBLIC_PROJECT_IMAGES}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition-colors hover:border-[#8fb9e8] hover:text-[#2d4a6b] disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadIcon size={16} />}
                  {uploading ? "Uploading…" : "Upload images"}
                </button>
                <p className="text-center text-[11px] text-zinc-400">
                  Select multiple photos at once to batch-upload a project slideshow.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center">
            <p className="text-sm text-zinc-500">Add a project to begin.</p>
          </section>
        )}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2d4a6b] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 hover:bg-[#1a2f4a] disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save public projects
        </button>
      </div>
    </div>
  );
}
