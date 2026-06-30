"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function AboutStoryHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#2d4a6b] py-12 lg:py-16"
    >
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#8fb9e8]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div
          className={`order-2 lg:order-1 transition-all duration-700 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <Image
            src="/about/three-years-foundations.png"
            alt="Reines Property Development"
            width={960}
            height={720}
            className="h-auto w-full rounded-3xl shadow-xl shadow-black/20"
            priority
          />
        </div>

        <div
          className={`order-1 lg:order-2 transition-all delay-150 duration-700 ease-out ${
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
