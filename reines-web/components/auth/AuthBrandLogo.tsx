"use client";

import { ReinesLogo } from "@/components/layout/ReinesLogo";

export function AuthDesktopBrandLogo() {
  return <ReinesLogo size="lg" variant="on-dark" linked priority />;
}

export function AuthMobileBrandLogo() {
  return (
    <div className="mb-8 lg:hidden">
      <ReinesLogo size="lg" variant="on-light" linked />
    </div>
  );
}
