"use client";

import { useEffect } from "react";

/**
 * Registers the site service worker once per page load.
 * Chrome requires an active SW with a fetch handler before it fires
 * beforeinstallprompt / shows the install affordance.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Avoid fighting Next.js / Vercel preview tooling in local HTTP weirdness —
    // still register on localhost so install can be tested over https tunnels.
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("[pwa] Service worker registration failed:", err);
    });
  }, []);

  return null;
}
