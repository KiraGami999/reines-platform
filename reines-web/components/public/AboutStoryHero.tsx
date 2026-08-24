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
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#2d4a6b]">
      {/* Full-width rectangular banner — story text stacks below on all viewports */}
      <div
        className={`relative w-full transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <Image
          src="/about/three-years-foundations.png"
          alt="3 years of building strong foundations"
          width={1024}
          height={576}
          className="h-auto w-full object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div
          className={`transition-all delay-150 duration-700 ease-out ${
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
