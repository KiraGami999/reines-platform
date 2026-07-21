"use client";

import { ReinesLogo } from "@/components/layout/ReinesLogo";
import { useTheme } from "@/components/theme/ThemeProvider";

/** Desktop branding panel is always the fixed navy brand panel, so the logo stays "on-dark". */
export function AuthDesktopBrandLogo() {
  return <ReinesLogo size="lg" variant="on-dark" mark="project-mate" linked priority />;
}

/**
 * Mobile brand mark sits on the form panel, which follows light/dark mode
 * (zinc-50 in light, near-black in dark) rather than the fixed navy panel.
 * The logo must flip with it — "on-light" (forced black) was invisible
 * against the dark panel, so pick the variant from the resolved theme.
 */
export function AuthMobileBrandLogo() {
  const { resolved } = useTheme();

  return (
    <div className="mb-8 lg:hidden">
      <ReinesLogo
        size="lg"
        variant={resolved === "dark" ? "on-dark" : "on-light"}
        mark="project-mate"
        linked
      />
    </div>
  );
}
