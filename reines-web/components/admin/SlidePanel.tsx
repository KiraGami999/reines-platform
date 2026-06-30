"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface SlidePanelProps {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  subtitle?: string;
  children: React.ReactNode;
  width?:   "md" | "lg" | "xl";
}

const WIDTH_MAP = { md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };

export default function SlidePanel({ open, onClose, title, subtitle, children, width = "lg" }: SlidePanelProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full ${WIDTH_MAP[width]} bg-white shadow-2xl
          transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h2 className="text-lg font-semibold text-[#2d4a6b]">{title}</h2>
            {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </>
  );
}
