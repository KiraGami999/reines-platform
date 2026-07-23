"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ReinesPageLoaderProps = {
  phase: "hidden" | "loading" | "exiting";
  progress: number;
  onExitComplete: () => void;
};

const EXIT_MS = 480;

export function ReinesPageLoader({ phase, progress, onExitComplete }: ReinesPageLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const onExitCompleteRef = useRef(onExitComplete);

  useEffect(() => {
    onExitCompleteRef.current = onExitComplete;
  }, [onExitComplete]);

  useEffect(() => {
    if (phase === "hidden") {
      setMounted(false);
      return;
    }

    setMounted(true);

    if (phase !== "exiting") return;

    const timer = window.setTimeout(() => {
      onExitCompleteRef.current();
    }, EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!mounted) return null;

  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d4a6b] transition-opacity duration-500 ease-out",
        phase === "exiting" ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      aria-hidden={phase === "hidden"}
      aria-live="polite"
      aria-busy={phase === "loading"}
    >
      <div className="relative flex flex-col items-center gap-6 px-6">
        <div className="flex h-10 items-end justify-center gap-2" aria-hidden>
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              className="reines-loader-bar w-1.5 rounded-full bg-[#8fb9e8]"
              style={{ animationDelay: `${index * 0.12}s` }}
            />
          ))}
        </div>

        <div className="w-56 space-y-2.5">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6a9bc4] to-[#8fb9e8] transition-[width] duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-400">
            Loading {clampedProgress}%
          </p>
        </div>
      </div>
    </div>
  );
}
