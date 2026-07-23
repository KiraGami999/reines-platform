"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { PublicProjectItem, PublicProjectStatus } from "@/lib/public-projects-data";

const AUTO_SCROLL_MS = 6000;
/** Minimum horizontal drag distance (px) before a touch gesture counts as a swipe. */
const SWIPE_THRESHOLD = 40;

const statusConfig: Record<PublicProjectStatus, { label: string; classes: string }> = {
  COMPLETED:   { label: "Completed",   classes: "bg-white/15 text-white" },
  IN_PROGRESS: { label: "In Progress", classes: "bg-[#8fb9e8]/25 text-[#e4f0fb]" },
  PLANNING:    { label: "Planning",    classes: "bg-white/10 text-zinc-200" },
};

function isProxyUrl(url: string) {
  return url.startsWith("/api/media");
}

/**
 * Admin-curated homepage slideshow — separate from the full /projects page.
 * Only projects the admin has explicitly marked "Feature on homepage" in
 * the Public Projects admin form appear here (see MAX_FEATURED_PUBLIC_PROJECTS).
 */
export function FeaturedProjectsSlideshow({ projects }: { projects: PublicProjectItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (projects.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % projects.length);
    }, AUTO_SCROLL_MS);
    return () => window.clearInterval(timer);
  }, [projects.length]);

  // Nothing to show until an admin features at least one project.
  if (projects.length === 0) return null;

  const safeIndex = activeIndex % projects.length;
  const activeProject = projects[safeIndex];

  function goTo(direction: -1 | 1) {
    setActiveIndex((current) => {
      const next = (current + direction + projects.length) % projects.length;
      return next;
    });
  }

  function onTouchStart(event: ReactTouchEvent) {
    startX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: ReactTouchEvent) {
    if (startX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startX.current;
    const delta = endX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    goTo(delta < 0 ? 1 : -1);
  }

  return (
    <section className="bg-[#1c2836] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Portfolio Highlights</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Featured Projects</h2>
            <p className="mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
              A closer look at the developments our team is proud to stand behind.
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#8fb9e8] hover:underline"
          >
            View all projects <ArrowRight size={14} />
          </Link>
        </div>

        <div
          className="relative mt-10 touch-pan-y overflow-hidden rounded-3xl"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative h-[420px] w-full sm:h-[460px] lg:h-[520px]">
            {projects.map((project, index) => (
              <Image
                key={project.id}
                src={project.imageUrl}
                alt={project.title}
                fill
                priority={index === 0}
                unoptimized={isProxyUrl(project.imageUrl)}
                sizes="100vw"
                className={`object-cover transition-opacity duration-700 ease-out ${
                  index === safeIndex ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            {/* Readability gradient for the overlaid copy */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1018]/90 via-[#0a1018]/20 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a1018]/60 via-transparent to-transparent" />

            {/* Slide content */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:max-w-2xl">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[activeProject.status].classes}`}>
                {statusConfig[activeProject.status].label}
              </span>

              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {activeProject.title}
              </h3>

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-300 sm:text-base">
                {activeProject.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} strokeWidth={1.8} />
                  {activeProject.location}
                </span>
                <span>{activeProject.type} · {activeProject.year}</span>
              </div>

              <Link
                href="/projects"
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-[#8fb9e8] px-5 py-2.5 text-sm font-semibold text-[#2d4a6b] transition-colors hover:bg-[#b8d4f2]"
              >
                View Project <ArrowRight size={14} />
              </Link>
            </div>

            {/* Prev / next arrows */}
            {projects.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(-1)}
                  className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 sm:left-5"
                  aria-label="Previous featured project"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(1)}
                  className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 sm:right-5"
                  aria-label="Next featured project"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dot indicators + thumbnail strip */}
        {projects.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {projects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${project.title}`}
                aria-current={index === safeIndex ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  index === safeIndex ? "w-8 bg-[#8fb9e8]" : "w-1.5 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
