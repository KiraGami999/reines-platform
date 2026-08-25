"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Shows the portal welcome greeting and refreshes it whenever the user
 * lands on Overview again — on mount, when this route is revisited,
 * when the browser tab becomes visible, and when the window regains focus.
 */
export function PortalGreetingTitle({ initial }: { initial: string }) {
  const [greeting, setGreeting] = useState(initial);
  const greetingRef = useRef(initial);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (greetingRef.current) {
        params.set("exclude", greetingRef.current);
      }
      const qs = params.toString();
      const res = await fetch(`/api/portal/greeting${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { greeting?: string };
      if (data.greeting) {
        greetingRef.current = data.greeting;
        setGreeting(data.greeting);
      }
    } catch {
      // Keep the last greeting if the request fails.
    }
  }, []);

  useEffect(() => {
    void refresh();

    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    function onFocus() {
      void refresh();
    }
    function onManualRefresh() {
      void refresh();
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("reines:refresh-greeting", onManualRefresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("reines:refresh-greeting", onManualRefresh);
    };
  }, [refresh, pathname]);

  return <>{greeting}</>;
}
