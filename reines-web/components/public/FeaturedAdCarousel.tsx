"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import type { HomepageAd } from "@/lib/homepage-ads-shared";

const AUTO_SCROLL_MS = 5500;
/** Minimum horizontal drag distance (px) before a release counts as a swipe. */
const SWIPE_THRESHOLD = 50;
/** Matches About Story hero tilt depth. */
const MAX_TILT = 10;

/** Display slot is ~md (448px); 560 covers 2× DPR without over-fetching. */
const AD_IMAGE_SIZES = "(max-width: 640px) 92vw, (max-width: 1024px) 448px, 560px";

type FeaturedAdCarouselProps = {
  ads: HomepageAd[];
  variant?: "panel";
};

function circularDistance(a: number, b: number, length: number) {
  const raw = Math.abs(a - b);
  return Math.min(raw, length - raw);
}

export function FeaturedAdCarousel({ ads, variant = "panel" }: FeaturedAdCarouselProps) {
  const visibleAds = useMemo(() => ads.filter((ad) => ad.active), [ads]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  /** Once a slide enters the nearby window, keep it mounted so revisits are instant. */
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [hovering, setHovering] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dragStartX = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRafRef = useRef<number | null>(null);

  const safeActiveIndex = visibleAds.length > 0 ? activeIndex % visibleAds.length : 0;
  const activeAd = visibleAds[safeActiveIndex];

  // Mount current + neighbors only (and remember them) so off-slide multi‑MB
  // images do not compete with the first paint.
  useEffect(() => {
    if (visibleAds.length === 0) return;
    setLoadedIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (let i = 0; i < visibleAds.length; i++) {
        const dist = circularDistance(i, safeActiveIndex, visibleAds.length);
        if (dist <= 1) {
          const id = visibleAds[i].id;
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [safeActiveIndex, visibleAds]);

  // Auto-advance, but every manual drag resets the countdown so an ad someone
  // just swiped to is never yanked away mid-read. Pauses entirely while dragging.
  useEffect(() => {
    if (dragging) return;
    if (visibleAds.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % visibleAds.length);
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(timer);
  }, [visibleAds.length, activeIndex, dragging]);

  useEffect(() => {
    return () => {
      if (tiltRafRef.current != null) cancelAnimationFrame(tiltRafRef.current);
    };
  }, []);

  function goTo(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + visibleAds.length) % visibleAds.length);
  }

  function updateTilt(event: ReactPointerEvent<HTMLDivElement>) {
    // Skip tilt while swiping, and on touch (swipe UX takes priority).
    if (dragging || event.pointerType !== "mouse") return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const nextX = (0.5 - py) * MAX_TILT * 2;
    const nextY = (px - 0.5) * MAX_TILT * 2;

    if (tiltRafRef.current != null) cancelAnimationFrame(tiltRafRef.current);
    tiltRafRef.current = requestAnimationFrame(() => {
      setTilt({ x: nextX, y: nextY });
    });
  }

  function resetTilt() {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (visibleAds.length <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX.current = event.clientX;
    pointerId.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragging && dragStartX.current !== null) {
      setDragOffset(event.clientX - dragStartX.current);
      return;
    }
    updateTilt(event);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    if (pointerId.current !== null) {
      try {
        event.currentTarget.releasePointerCapture(pointerId.current);
      } catch {
        // Pointer capture may already be released — safe to ignore.
      }
    }
    const finalOffset = dragOffset;
    setDragging(false);
    setDragOffset(0);
    dragStartX.current = null;
    pointerId.current = null;

    if (Math.abs(finalOffset) > SWIPE_THRESHOLD) {
      goTo(finalOffset < 0 ? 1 : -1);
    }
  }

  if (variant !== "panel") return null;

  if (!activeAd) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex aspect-square w-full items-center justify-center rounded-3xl border border-white/10 bg-[#283546] p-8 text-center text-sm text-zinc-400 shadow-2xl shadow-black/35">
          Advertisement Space
        </div>
        <div className="flex min-h-[44px] items-center rounded-full bg-[#35475D] px-5 py-3 sm:px-7">
          <span className="inline-flex shrink-0 rounded-full border border-white/15 px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
            Featured Now
          </span>
          <p className="ml-3 truncate text-sm text-zinc-500">Featured ads will appear here once published.</p>
        </div>
      </div>
    );
  }

  const hoverScale = hovering && !dragging ? 1.03 : 1;

  return (
    <div className="flex flex-col gap-4">
      <div style={{ perspective: "1000px" }}>
        <div
          ref={cardRef}
          className="relative aspect-square w-full touch-pan-y select-none overflow-hidden rounded-3xl border border-white/10 bg-[#283546] shadow-2xl shadow-black/35 will-change-transform"
          style={{
            cursor: visibleAds.length > 1 ? (dragging ? "grabbing" : "grab") : undefined,
            transform: `rotateX(${dragging ? 0 : tilt.x}deg) rotateY(${dragging ? 0 : tilt.y}deg) scale(${hoverScale})`,
            transition: dragging
              ? "none"
              : hovering
                ? "transform 80ms ease-out"
                : "transform 400ms ease-out",
            transformStyle: "preserve-3d",
          }}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setHovering(true);
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(event) => {
            if (dragging) endDrag(event);
            resetTilt();
          }}
        >
          {visibleAds.map((ad, index) => {
            const dist = circularDistance(index, safeActiveIndex, visibleAds.length);
            const nearby = dist <= 1;
            if (!nearby && !loadedIds.has(ad.id)) return null;

            const isActive = index === safeActiveIndex;
            const isProxy = ad.imageUrl.startsWith("/api/media");

            return (
              <Image
                key={ad.id}
                src={ad.imageUrl}
                alt={ad.title}
                fill
                draggable={false}
                // Blob proxy responses skip the optimizer today; local /homepage-ads
                // paths still get WebP/AVIF resizing from Next.
                unoptimized={isProxy}
                priority={index === 0}
                quality={isProxy ? undefined : 75}
                sizes={AD_IMAGE_SIZES}
                className="pointer-events-none object-cover object-center"
                style={{
                  transform: `translateX(calc(${(index - safeActiveIndex) * 100}% + ${dragging ? dragOffset : 0}px))`,
                  transition: dragging ? "none" : "transform 450ms ease",
                  // Keep non-active slides out of the paint path until needed.
                  visibility: nearby || isActive ? "visible" : "hidden",
                }}
              />
            );
          })}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              opacity: hovering && !dragging ? 1 : 0.55,
              background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255,255,255,0.22), transparent 55%)`,
              transition: "opacity 200ms ease-out",
            }}
          />
        </div>
      </div>

      <div className="flex min-h-[44px] items-center gap-3 rounded-full bg-[#35475D] px-5 py-3 sm:gap-4 sm:px-7">
        <span className="inline-flex shrink-0 rounded-full border border-white/15 px-3 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Featured Now
        </span>

        <Link
          href={activeAd.ctaHref}
          className="min-w-0 flex-1 truncate text-sm font-semibold text-white transition-colors hover:text-[#b8c9dc]"
        >
          {activeAd.ctaLabel}
        </Link>

        {visibleAds.length > 1 && (
          <div className="flex max-w-[6.5rem] shrink-0 items-center gap-1.5 overflow-x-auto sm:max-w-[10rem]">
            {visibleAds.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Show featured ad ${index + 1}`}
                aria-current={index === safeActiveIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === safeActiveIndex ? "w-5 bg-[#8fb9e8]" : "w-1.5 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
