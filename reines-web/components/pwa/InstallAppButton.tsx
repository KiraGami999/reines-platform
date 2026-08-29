"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUTTON_RADIUS } from "@/lib/ui-classes";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface InstallAppButtonProps {
  /** Match ThemeIconButton chrome on the navy public navbar vs light portal. */
  variant?: "on-dark" | "on-light";
  className?: string;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari when launched from the home screen
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

/**
 * In-page install control driven by Chrome's beforeinstallprompt.
 * Hidden when already installed, unsupported, or the event never fires
 * (e.g. iOS — users still use Share → Add to Home Screen).
 */
export function InstallAppButton({
  variant = "on-dark",
  className,
}: InstallAppButtonProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      return;
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setDeferred(null);
      setInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  return (
    <button
      type="button"
      onClick={() => void handleInstall()}
      aria-label="Install Reines app"
      title="Install app"
      className={cn(
        BUTTON_RADIUS,
        "flex h-10 w-10 items-center justify-center bg-transparent transition-colors",
        variant === "on-dark"
          ? "border border-white/20 text-white hover:bg-white/10 hover:text-white"
          : "border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:text-zinc-900 dark:border-[var(--border)] dark:text-[var(--foreground)] dark:hover:bg-[var(--surface-hover)]",
        className
      )}
    >
      <Download size={18} strokeWidth={1.9} />
    </button>
  );
}
