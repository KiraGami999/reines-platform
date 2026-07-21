"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, MapPin, Maximize2, Tag, X } from "lucide-react";
import type { PublicProjectItem, PublicProjectStatus } from "@/lib/public-projects-data";

const statusConfig: Record<PublicProjectStatus, { label: string; classes: string }> = {
  COMPLETED:   { label: "Completed",   classes: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-blue-50 text-blue-700" },
  PLANNING:    { label: "Planning",    classes: "bg-blue-50 text-blue-700" },
};

function isProxyUrl(url: string) {
  return url.startsWith("/api/media");
}

export function PublicProjectsGallery({ projects }: { projects: PublicProjectItem[] }) {
  const [selectedProject, setSelectedProject] = useState<PublicProjectItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const galleryImages = useMemo(
    () => (selectedProject?.imageUrls.length ? selectedProject.imageUrls : selectedProject ? [selectedProject.imageUrl] : []),
    [selectedProject]
  );

  useEffect(() => {
    if (!selectedProject) return;
    setActiveImageIndex(0);
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedProject(null);
      if (event.key === "ArrowLeft") setActiveImageIndex((current) => Math.max(0, current - 1));
      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) => Math.min(galleryImages.length - 1, current + 1));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedProject, galleryImages.length]);

  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? "";

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const badge = statusConfig[project.status];

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => setSelectedProject(project)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb9e8]"
            >
              <div className="relative h-48 overflow-hidden bg-zinc-100">
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  unoptimized={isProxyUrl(project.imageUrl)}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d4a6b]/45 to-transparent" />
                {project.imageUrls.length > 1 && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {project.imageUrls.length} photos
                  </span>
                )}
                <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-[#2d4a6b] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <Maximize2 size={15} />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-400">{project.type} · {project.year}</p>
                    <h3 className="mt-1 font-bold text-[#2d4a6b]">{project.title}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-500">{project.description}</p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin size={13} strokeWidth={1.8} />
                    <span className="truncate">{project.location}</span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#8fb9e8]">
                    View details <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a1525]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedProject.title} project details`}
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#2d4a6b] shadow-sm transition-colors hover:bg-white"
              aria-label="Close project details"
            >
              <X size={18} />
            </button>

            <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1.25fr_0.75fr]">
              <div className="relative min-h-[360px] bg-zinc-100 lg:min-h-[720px]">
                {activeImage ? (
                  <Image
                    key={activeImage}
                    src={activeImage}
                    alt={`${selectedProject.title} — photo ${activeImageIndex + 1}`}
                    fill
                    priority
                    unoptimized={isProxyUrl(activeImage)}
                    className="object-contain lg:object-cover"
                    sizes="(min-width: 1024px) 60vw, 100vw"
                  />
                ) : null}

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((current) => Math.max(0, current - 1))}
                      disabled={activeImageIndex === 0}
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60 disabled:opacity-30"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((current) => Math.min(galleryImages.length - 1, current + 1))}
                      disabled={activeImageIndex === galleryImages.length - 1}
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60 disabled:opacity-30"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={20} />
                    </button>

                    <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center">
                      <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white">
                        {activeImageIndex + 1} / {galleryImages.length}
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {galleryImages.map((imageUrl, index) => (
                          <button
                            key={imageUrl}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                              index === activeImageIndex
                                ? "border-[#8fb9e8] opacity-100"
                                : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                            aria-label={`View photo ${index + 1}`}
                          >
                            <Image
                              src={imageUrl}
                              alt=""
                              fill
                              unoptimized={isProxyUrl(imageUrl)}
                              className="object-cover"
                              sizes="80px"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col p-6 sm:p-8 lg:p-10">
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[selectedProject.status].classes}`}>
                  {statusConfig[selectedProject.status].label}
                </span>

                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#2d4a6b]">
                  {selectedProject.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-500">
                  {selectedProject.description}
                </p>

                <div className="mt-8 grid gap-3">
                  <DetailRow icon={Tag} label="Project Type" value={selectedProject.type} />
                  <DetailRow icon={MapPin} label="Location" value={selectedProject.location} />
                  <DetailRow icon={CalendarDays} label="Year / Timeline" value={selectedProject.year} />
                </div>

                <div className="mt-8 rounded-2xl bg-zinc-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Project Information</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">
                    This information is controlled from the admin portal. Admins can update the pictures, description, status, project type, location, and year/date range as client-approved project details become available.
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d4a6b] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a2f4a]"
                  >
                    Ask about a similar project <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center /10 text-[#8fb9e8]">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-800">{value}</p>
      </div>
    </div>
  );
}
