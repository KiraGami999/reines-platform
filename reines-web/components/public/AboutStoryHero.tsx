"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MAX_TILT = 10;

export function AboutStoryHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const nextX = (0.5 - py) * MAX_TILT * 2;
    const nextY = (px - 0.5) * MAX_TILT * 2;

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTilt({ x: nextX, y: nextY });
    });
  }

  function resetTilt() {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#2d4a6b]">
      <div className="relative mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
        <div
          className={`flex justify-center transition-all duration-700 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ perspective: "1000px" }}
        >
          <div
            ref={cardRef}
            onPointerEnter={() => setHovering(true)}
            onPointerMove={handlePointerMove}
            onPointerLeave={resetTilt}
            className="relative aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#1a2f4a] shadow-2xl shadow-black/35 will-change-transform"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovering ? 1.03 : 1})`,
              transition: hovering
                ? "transform 80ms ease-out"
                : "transform 400ms ease-out",
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src="/about/three-years-foundations.png"
              alt="3 years of building strong foundations"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/15 via-transparent to-black/25"
              style={{
                opacity: hovering ? 1 : 0.55,
                background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255,255,255,0.22), transparent 55%)`,
                transition: "opacity 200ms ease-out",
              }}
            />
          </div>
        </div>

        <div
          className={`py-10 sm:py-14 lg:py-16 transition-all delay-150 duration-700 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">
            Our Story
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Building strong foundations for Malawi.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
            Reines Property Development Limited is a company founded and headquartered in Blantyre,
            Malawi. Operating for over three years now, we have interests in property, construction,
            and manufacturing, with ambitions to expand into mining and steel.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            We offer an expansive range of products and services to support our clients&apos;
            infrastructure developments — from property and construction to concrete and manufacturing.
          </p>
        </div>
      </div>
    </section>
  );
}
