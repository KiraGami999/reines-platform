"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BrandLogoAnchorProps = {
  children: ReactNode;
  className?: string;
};

/** Wrapper for brand logo placement in nav, sidebar, and auth layouts. */
export function BrandLogoAnchor({ children, className }: BrandLogoAnchorProps) {
  return <span className={cn("inline-flex shrink-0", className)}>{children}</span>;
}
