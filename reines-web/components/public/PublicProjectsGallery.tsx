"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
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

/** Minimum horizontal drag distance (px) before a touch gesture counts as a swipe. */
const SWIPE_THRESHOLD = 40;

/** Tracks a touch drag and reports back the horizontal distance once it ends. */
function useSwipe(onSwipe: (direction: -1 | 1) => void) {
  const startX = useRef<number | null>(null);

  function onTouchStart(event: ReactTouchEvent) {
    startX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (startX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startX.current;
    const delta = endX - startX.current;
    startX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    onSwipe(delta < 0 ? 1 : -1);
  }

  return { onTouchStart, onTouchEnd };
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

  const modalSwipe = useSwipe((direction) => {
    setActiveImageIndex((current) => {
      const next = current + direction;
      return Math.min(Math.max(next, 0), galleryImages.length - 1);
    });
  });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onOpen={() => setSelectedProject(project)} />
        ))}
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
              <div
                className="relative min-h-[360px] touch-pan-y bg-zinc-100 lg:min-h-[720px]"
                onTouchStart={modalSwipe.onTouchStart}
                onTouchEnd={modalSwipe.onTouchEnd}
              >
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

function ProjectCard({ project, onOpen }: { project: PublicProjectItem; onOpen: () => void }) {
  const images = project.imageUrls.length ? project.imageUrls : [project.imageUrl];
  const [index, setIndex] = useState(0);
  const badge = statusConfig[project.status];
  const hasMultiple = images.length > 1;

  function goTo(direction: -1 | 1) {
    setIndex((current) => {
      const next = current + direction;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  }

  const cardSwipe = useSwipe(goTo);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div
        className="relative h-48 touch-pan-y overflow-hidden bg-zinc-100"
        onTouchStart={cardSwipe.onTouchStart}
        onTouchEnd={cardSwipe.onTouchEnd}
      >
        <button
          type="button"
          onClick={onOpen}
          className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8fb9e8]"
          aria-label={`View ${project.title} details`}
        />

        {images.map((imageUrl, i) => (
          <Image
            key={imageUrl}
            src={imageUrl}
            alt={`${project.title} — photo ${i + 1}`}
            fill
            unoptimized={isProxyUrl(imageUrl)}
            className={`pointer-events-none object-cover transition-opacity duration-300 ${
              i === index ? "opacity-100" : "opacity-0"
            } ${i === index ? "group-hover:scale-105" : ""} transition-transform duration-500`}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            priority={i === 0}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2d4a6b]/45 to-transparent" />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); goTo(-1); }}
              className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#2d4a6b] shadow-sm transition-colors hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); goTo(1); }}
              className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#2d4a6b] shadow-sm transition-colors hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight size={16} />
            </button>

            <div className="absolute bottom-3 right-3 z-10 flex gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>

            <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
              {images.length} photos
            </span>
          </>
        )}

        <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-[#2d4a6b] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <Maximize2 size={15} />
        </div>
      </div>

      <button type="button" onClick={onOpen} className="flex flex-1 flex-col p-6 text-left focus:outline-none">
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
      </button>
    </div>
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
