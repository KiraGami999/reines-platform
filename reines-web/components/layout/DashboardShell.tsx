"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { usePathname, useRouter } from "next/navigation";

interface DashboardShellProps {
  user: { name: string; email: string; role: string; image?: string | null; verificationStatus?: string };
  children: React.ReactNode;
}

const COLLAPSE_KEY = "reines:sidebar-collapsed";

/**
 * Client wrapper that owns sidebar open/close and collapse state.
 * Auth stays server-side in the parent layout; interactivity lives here.
 */
export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COLLAPSE_KEY) === "true";
  });

  const pathname = usePathname();
  const router = useRouter();

  const isClient = user.role === "CLIENT";
  const isUnverified = isClient && user.verificationStatus !== "APPROVED";
  const isAllowedPath =
    pathname === "/dashboard/verification" ||
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/profile");
  const shouldBlock = isUnverified && !isAllowedPath;

  useEffect(() => {
    if (shouldBlock) {
      router.replace("/dashboard/verification");
    }
  }, [shouldBlock, router]);

  function handleToggleCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  }

  return (
    <div
      data-portal
      className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-[var(--surface-shell)] print:block print:h-auto print:overflow-visible print:bg-white"
    >
      <Sidebar
        role={user.role}
        verificationStatus={user.verificationStatus}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main column — shrinks/grows with sidebar width on desktop */}
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-200"
      >
        <DashboardHeader
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 print:overflow-visible print:p-0">
          {shouldBlock ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <p className="text-sm text-zinc-500">Redirecting to verification page...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
