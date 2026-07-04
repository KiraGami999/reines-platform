"use client";

import { useEffect, useRef, useState } from "react";

type Project = {
  id: string;
  title: string;
  location: string;
  type: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNING";
  year: string;
};

const statusConfig = {
  IN_PROGRESS: { dot: "bg-blue-400",   pulse: true,  label: "In Progress" },
  PLANNING:    { dot: "bg-blue-400",  pulse: false, label: "Planning"    },
  COMPLETED:   { dot: "bg-blue-400",pulse: false, label: "Completed"   },
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl sm:text-4xl font-extrabold text-[#2d4a6b]">{count}+</p>
      <p className="mt-1 text-xs sm:text-sm text-zinc-500">{label}</p>
    </div>
  );
}

export function CurrentProjectsBanner({ projects }: { projects: Project[] }) {
  const active = projects.filter(p => p.status === "IN_PROGRESS" || p.status === "PLANNING");
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (active.length === 0) return;
    const id = setInterval(() => setVisible(v => (v + 1) % active.length), 3500);
    return () => clearInterval(id);
  }, [active.length]);

  return (
    <section className="border-b border-zinc-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
          </span>
          <span className="text-sm font-semibold uppercase tracking-widest text-[#2d4a6b]">
            Current Projects
          </span>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          {/* Animated ticker of active projects */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-4 lg:max-w-lg w-full">
            {active.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">No active projects at this time.</p>
            ) : (
              active.map((p, i) => {
                const cfg = statusConfig[p.status];
                return (
                  <div
                    key={p.id}
                    className={`transition-all duration-500 ${i === visible ? "opacity-100 translate-y-0" : "absolute opacity-0 translate-y-4 pointer-events-none"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="relative flex h-2.5 w-2.5">
                        {cfg.pulse && (
                          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-75`} />
                        )}
                        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                      </span>
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{cfg.label}</span>
                      <span className="ml-auto text-xs text-zinc-400">{i + 1} / {active.length}</span>
                    </div>
                    <p className="text-base font-bold text-[#2d4a6b]">{p.title}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{p.type} · {p.location} · {p.year}</p>

                    {/* Progress dots */}
                    <div className="mt-3 flex gap-1.5">
                      {active.map((_, di) => (
                        <button
                          key={di}
                          onClick={() => setVisible(di)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${di === visible ? "w-6 bg-[#2d4a6b]" : "w-1.5 bg-zinc-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Animated counters */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <AnimatedStat value={15} label="Projects Completed" />
            <AnimatedStat value={3}  label="Years Experience" />
            <AnimatedStat value={95} label="% Client Satisfaction" />
          </div>
        </div>
      </div>
    </section>
  );
}
