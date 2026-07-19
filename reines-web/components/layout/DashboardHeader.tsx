"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  UserCircle,
  Settings,
  ExternalLink,
  Search,
  X,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { ReinesLogo } from "@/components/layout/ReinesLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

// ─── Breadcrumb helper ─────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin:     "Admin",
  manage:    "Manage",
  projects:  "Projects",
  messages:  "Messages",
  gallery:   "Gallery",
  payments:  "Payments",
  settings:  "Settings",
  users:     "Users",
  enquiries: "Enquiries",
  milestones:"Milestones",
  profile:   "Profile",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.replace(/^\//, "").split("/");
  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    // Skip dynamic route segments (e.g. UUIDs / IDs)
    const isDynamic = /^[a-f0-9-]{8,}$/i.test(seg) || /^\d+$/.test(seg);
    const label = isDynamic
      ? seg
      : (SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

// ─── Search bar ────────────────────────────────────────────────────────────────

function SearchBar() {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative hidden sm:block">
      {open ? (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 shadow-sm ring-1 ring-[#8fb9e8]/30 dark:border-[var(--border)] dark:bg-[var(--surface)]">
          <Search size={14} className="shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, messages…"
            className="w-52 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-[var(--foreground)]"
          />
          <button
            onClick={() => { setOpen(false); setQuery(""); }}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[var(--foreground)]"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-[#3d4a5e] dark:hover:text-[var(--foreground)]"
        >
          <Search size={14} />
          <span className="hidden lg:block">Search…</span>
          <kbd className="hidden rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:bg-[var(--surface-muted)] lg:block">
            ⌘K
          </kbd>
        </button>
      )}
    </div>
  );
}

// ─── Notification bell ─────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const notifications = [
    {
      icon:  ClipboardList,
      title: "Portal is ready",
      body:  "Your Reines portal has been set up successfully.",
      time:  "Just now",
      unread: true,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-[var(--surface)]" />
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-[var(--surface)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-[var(--border)]">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600 dark:bg-zinc-800 dark:text-zinc-400">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="divide-y divide-zinc-50 dark:divide-[var(--border-subtle)]">
            {notifications.map((n, i) => {
              const Icon = n.icon;
              return (
                <div key={i} className="flex cursor-pointer gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-[var(--surface-hover)]">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm dark:bg-[var(--surface-muted)]">
                  <Icon size={16} strokeWidth={1.8} className="text-zinc-500 dark:text-[var(--text-muted)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-[var(--foreground)]">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-zinc-400">{n.body}</p>
                  <p className="mt-1 text-xs text-zinc-300 dark:text-[#7d8b9c]">{n.time}</p>
                </div>
                {n.unread && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-zinc-100 px-4 py-2.5 text-center dark:border-[var(--border)]">
            <button className="text-xs font-medium text-[#8fb9e8] hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User dropdown ─────────────────────────────────────────────────────────────

interface UserMenuProps {
  user: { name: string; email: string; role: string };
}

function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roleColour: Record<string, string> = {
    ADMIN:           "bg-blue-100 text-blue-700",
    PROJECT_MANAGER: "bg-blue-100 text-blue-700",
    CLIENT:          "bg-blue-100 text-blue-700",
  };
  const roleLabel: Record<string, string> = {
    ADMIN:           "Admin",
    PROJECT_MANAGER: "Project Manager",
    CLIENT:          "Client",
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-[#3d4a5e] dark:hover:bg-[var(--surface-hover)] sm:gap-2 sm:px-2.5"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d4a6b] text-[10px] font-bold uppercase text-[#8fb9e8]">
          {initials}
        </div>
        <span className="hidden max-w-[120px] truncate font-medium text-zinc-700 dark:text-[var(--text-secondary)] sm:block">
          {user.name}
        </span>
        <ChevronDown size={13} className={cn("shrink-0 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-[var(--surface)] sm:w-64">
          {/* User info header */}
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2d4a6b] text-sm font-bold text-[#8fb9e8]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">{user.name}</p>
                <p className="truncate text-xs text-zinc-400">{user.email}</p>
              </div>
            </div>
            <span
              className={cn(
                "mt-2.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                roleColour[user.role] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              )}
            >
              {roleLabel[user.role] ?? user.role}
            </span>
          </div>

          {/* Menu items */}
          <div className="p-1">
            {[
              { href: "/dashboard/profile",  icon: UserCircle,   label: "My Profile"   },
              { href: "/dashboard/settings", icon: Settings,     label: "Settings"     },
              { href: "/",                   icon: ExternalLink, label: "Public Site", target: "_blank" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={(item as { target?: string }).target}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)]"
              >
                <item.icon size={14} className="shrink-0 text-zinc-400" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-zinc-100 p-1 dark:border-[var(--border)]">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-hover)]"
            >
              <LogOut size={14} className="shrink-0 text-zinc-400" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main header ───────────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  user:              { name: string; email: string; role: string; image?: string | null };
  onMenuClick:       () => void;
  sidebarCollapsed?: boolean;
}

export function DashboardHeader({ user, onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const crumbs   = buildBreadcrumbs(pathname);
  const { resolved } = useTheme();
  const logoVariant = resolved === "dark" ? "on-dark" : "on-light";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 dark:border-[var(--border)] dark:bg-[var(--surface)] sm:h-16 sm:px-6 print:hidden">
      {/* Left — mobile logo + hamburger + breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="shrink-0 lg:hidden">
          <ReinesLogo size="header" variant={logoVariant} className="block" />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)] lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Mobile page title */}
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-[var(--foreground)] sm:hidden">
          {crumbs[crumbs.length - 1]?.label}
        </span>

        {/* Breadcrumbs */}
        <nav className="hidden min-w-0 items-center gap-1 text-sm sm:flex" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <span className="select-none text-zinc-300 dark:text-[#3d4a5e]">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="max-w-[200px] truncate font-semibold text-zinc-800 dark:text-[var(--foreground)]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="max-w-[120px] truncate text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-[var(--foreground)]"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right — search + notifications + user */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <SearchBar />
        <NotificationBell />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
