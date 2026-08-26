"use client";

import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";
import { ReinesLogo } from "@/components/layout/ReinesLogo";
import { getPortalLogoMark } from "@/lib/portal-branding";
import { useTheme } from "@/components/theme/ThemeProvider";
import { postToNativeApp } from "@/lib/mobileBridge";
import { clearIntroLoaderFlag } from "@/components/layout/ReinesLoaderProvider";
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

// ─── Search bar (quick navigation) ─────────────────────────────────────────────

type QuickLink = { label: string; href: string; keywords: string };

function quickLinksForRole(role: string): QuickLink[] {
  const shared: QuickLink[] = [
    { label: "Settings", href: "/dashboard/settings", keywords: "settings preferences theme password" },
    { label: "My Profile", href: "/dashboard/profile", keywords: "profile account name" },
    { label: "Messages", href: "/dashboard/messages", keywords: "messages chat inbox" },
  ];

  if (role === "ADMIN") {
    return [
      { label: "Projects", href: "/dashboard/admin/projects", keywords: "projects portfolio" },
      { label: "Users", href: "/dashboard/admin/users", keywords: "users accounts staff" },
      { label: "Payments", href: "/dashboard/admin/payments", keywords: "payments receipts cash" },
      { label: "Enquiries", href: "/dashboard/admin/enquiries", keywords: "enquiries contact leads" },
      ...shared,
    ];
  }

  if (role === "PROJECT_MANAGER") {
    return [
      { label: "Assigned projects", href: "/dashboard/manage/projects", keywords: "projects manage assigned" },
      { label: "Milestones", href: "/dashboard/milestones", keywords: "milestones progress" },
      { label: "Gallery", href: "/dashboard/gallery", keywords: "gallery photos progress" },
      ...shared,
    ];
  }

  return [
    { label: "My projects", href: "/dashboard/projects", keywords: "projects jobs sites" },
    { label: "Payments", href: "/dashboard/payments", keywords: "payments receipts" },
    { label: "Loyalty", href: "/dashboard/loyalty", keywords: "loyalty rewards points" },
    ...shared,
  ];
}

function SearchBar({ role }: { role: string }) {
  const router = useRouter();
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const links = quickLinksForRole(role);

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return links.slice(0, 6);
    return links.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.keywords.toLowerCase().includes(q)
    );
  })();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div className="relative hidden sm:block">
      {open ? (
        <div className="absolute right-0 top-0 z-50 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-[var(--surface)]">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-[var(--border)]">
            <Search size={14} className="shrink-0 text-zinc-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered[0]) {
                  e.preventDefault();
                  go(filtered[0].href);
                }
              }}
              placeholder="Jump to…"
              className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-[var(--foreground)]"
            />
            <button
              type="button"
              onClick={() => { setOpen(false); setQuery(""); }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[var(--foreground)]"
            >
              <X size={13} />
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-zinc-400">No matching pages</li>
            ) : (
              filtered.map((item) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-hover)]"
                  >
                    {item.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-[#3d4a5e] dark:hover:text-[var(--foreground)]"
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)]"
        aria-label="Notifications"
      >
        <Bell size={17} />
      </button>

      {open && (
        <div className="fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-[var(--surface)] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-[var(--border)]">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[var(--foreground)]">Notifications</h3>
          </div>

          <div className="px-4 py-6 text-center">
            <Bell size={22} className="mx-auto text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-[var(--foreground)]">
              No new alerts
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Project chats and updates live in Messages. Push alerts are managed in the Project Mate app.
            </p>
          </div>

          <div className="border-t border-zinc-100 px-4 py-2.5 text-center dark:border-[var(--border)]">
            <Link
              href="/dashboard/messages"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-[#8fb9e8] hover:underline"
            >
              Open Messages
            </Link>
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

  function handleSignOut() {
    // Inside the mobile app's WebView, a plain next-auth signOut() redirects
    // to /login, but the app still holds a valid native JWT and immediately
    // re-bridges the session back in — so it looks like the button does
    // nothing. Let the native shell own sign-out there instead (it clears
    // the JWT and swaps to the native login screen); fall back to the normal
    // web sign-out everywhere else.
    // Reset the "intro shown" flag so the loading animation plays again the
    // next time someone signs in, rather than staying suppressed forever.
    clearIntroLoaderFlag();
    if (postToNativeApp({ type: "reines-signout" })) return;
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:hover:border-[#3d4a5e] dark:hover:bg-[var(--surface-hover)] sm:gap-2 sm:px-2.5"
        aria-label="User menu"
        aria-expanded={open}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#35475D] text-[10px] font-bold uppercase text-[#8fb9e8]">
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#35475D] text-sm font-bold text-[#8fb9e8]">
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
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)]"
              >
                <item.icon size={14} className="shrink-0 text-zinc-400" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-zinc-100 p-1 dark:border-[var(--border)]">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-hover)]"
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
  const logoMark = getPortalLogoMark(user.role);
  // Header: light-blue accent on dark theme; brand navy on light theme.
  const logoVariant = resolved === "dark" ? "on-dark-accent" : "on-light";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 dark:border-[var(--border)] dark:bg-[var(--surface)] sm:h-16 sm:px-6 print:hidden">
      {/* Left — mobile logo + hamburger + breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="shrink-0 overflow-hidden lg:hidden">
          <ReinesLogo size="header" variant={logoVariant} mark={logoMark} className="block" />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-[var(--text-muted)] dark:hover:bg-[var(--surface-hover)] dark:hover:text-[var(--foreground)] lg:hidden"
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
        <SearchBar role={user.role} />
        <NotificationBell />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
