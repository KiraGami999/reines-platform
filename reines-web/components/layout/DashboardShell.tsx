"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

interface DashboardShellProps {
  user: { name: string; email: string; role: string; image?: string | null };
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

  function handleToggleCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar
        role={user.role}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
