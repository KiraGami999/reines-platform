"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ReinesPageLoader } from "@/components/layout/ReinesPageLoader";

type LoaderPhase = "hidden" | "loading" | "exiting";

type LoaderReason = "intro" | "sign-in";

type ReinesLoaderContextValue = {
  triggerSignInLoader: (destination?: string) => void;
};

const ReinesLoaderContext = createContext<ReinesLoaderContextValue | null>(null);

const INTRO_LOADER_KEY = "reines:intro-loader-shown";
const MIN_LOAD_MS = 900;
const MAX_LOAD_MS = 8000;

export function useReinesLoader() {
  const context = useContext(ReinesLoaderContext);
  if (!context) {
    throw new Error("useReinesLoader must be used within ReinesLoaderProvider");
  }
  return context;
}

export function ReinesLoaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const loadingStartedAt = useRef(0);
  const loaderReasonRef = useRef<LoaderReason | null>(null);
  const signInDestinationRef = useRef("/dashboard");
  const introStartedRef = useRef(false);
  const exitStartedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const [phase, setPhase] = useState<LoaderPhase>("hidden");
  const [progress, setProgress] = useState(0);
  const [pageReady, setPageReady] = useState(false);

  const completeLoader = useCallback(() => {
    if (loaderReasonRef.current === "intro") {
      sessionStorage.setItem(INTRO_LOADER_KEY, "1");
    }
    loaderReasonRef.current = null;
    exitStartedRef.current = false;
    setPageReady(false);
    setProgress(0);
    setPhase("hidden");
  }, []);

  const startLoading = useCallback((reason: LoaderReason) => {
    loaderReasonRef.current = reason;
    exitStartedRef.current = false;
    loadingStartedAt.current = Date.now();
    setProgress(0);
    setPageReady(false);
    setPhase("loading");
  }, []);

  const triggerSignInLoader = useCallback(
    (destination = "/dashboard") => {
      signInDestinationRef.current = destination.split("?")[0] || "/dashboard";
      startLoading("sign-in");
    },
    [startLoading]
  );

  const isLoaderTargetReady = useCallback(() => {
    if (loaderReasonRef.current !== "sign-in") return true;

    const destination = signInDestinationRef.current;
    return pathname === destination || pathname.startsWith(`${destination}/`);
  }, [pathname]);

  const beginExit = useCallback(() => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;
    setPhase("exiting");
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "hidden" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  // First visit intro only (once per browser session)
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (introStartedRef.current || sessionStorage.getItem(INTRO_LOADER_KEY)) return;
    introStartedRef.current = true;
    startLoading("intro");
  }, [startLoading]);

  // Simulate progress while loading
  useEffect(() => {
    if (phase !== "loading") return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const cap = pageReady ? 100 : 90;
        if (current >= cap) return current;
        const step = pageReady ? 10 : Math.random() * 5 + 2;
        return Math.min(current + step, cap);
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [phase, pageReady]);

  // Mark page ready while the loader is active
  useEffect(() => {
    if (phase !== "loading") return;

    const markReady = () => {
      if (!isLoaderTargetReady()) return;
      setPageReady(true);
    };

    if (document.readyState === "complete") {
      markReady();
    } else {
      window.addEventListener("load", markReady, { once: true });
    }

    markReady();

    return () => window.removeEventListener("load", markReady);
  }, [phase, pathname, isLoaderTargetReady]);

  // Jump to 100 once the page is ready
  useEffect(() => {
    if (phase !== "loading" || !pageReady) return;
    setProgress(100);
  }, [phase, pageReady]);

  // Fade out once progress is full and minimum time has passed
  useEffect(() => {
    if (phase !== "loading" || !pageReady || progress < 100) return;

    const elapsed = Date.now() - loadingStartedAt.current;
    const delay = Math.max(0, MIN_LOAD_MS - elapsed);
    const timeout = window.setTimeout(() => {
      if (reducedMotionRef.current) {
        completeLoader();
        return;
      }
      beginExit();
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [phase, pageReady, progress, beginExit, completeLoader]);

  // Hard failsafe so the site never stays blocked
  useEffect(() => {
    if (phase === "hidden") return;

    const timeout = window.setTimeout(() => {
      completeLoader();
    }, MAX_LOAD_MS);

    return () => window.clearTimeout(timeout);
  }, [phase, completeLoader]);

  const contextValue = useMemo(
    () => ({
      triggerSignInLoader,
    }),
    [triggerSignInLoader]
  );

  return (
    <ReinesLoaderContext.Provider value={contextValue}>
      {children}
      <ReinesPageLoader phase={phase} progress={progress} onExitComplete={completeLoader} />
    </ReinesLoaderContext.Provider>
  );
}
