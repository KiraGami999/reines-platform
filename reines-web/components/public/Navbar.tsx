"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ReinesLogo } from "@/components/layout/ReinesLogo";
import { ThemeIconButton } from "@/components/theme/ThemeIconButton";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Products", href: "/products" },
  { label: "Market Insights", href: "/market-insights" },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
  { label: "Get a Quote", href: "/quote" },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  CLIENT: "Client",
};

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const userRole = session?.user?.role ? roleLabels[session.user.role] ?? session.user.role : null;
  const isSignedIn = status === "authenticated" && !!session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#2d4a6b]/95 shadow-lg shadow-black/5 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <ReinesLogo size="nav" linked priority className="shrink-0" />

        {/* Desktop nav */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onMouseEnter={() => setHoveredHref(l.href)}
              onMouseLeave={() => setHoveredHref(null)}
              className={cn(
                "group relative overflow-hidden whitespace-nowrap rounded-xl px-2.5 py-2 text-[12px] font-semibold transition-all duration-300 2xl:px-3.5 2xl:text-[13px]",
                pathname === l.href
                  ? "text-[#8fb9e8]"
                  : "text-zinc-300 hover:-translate-y-0.5 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "absolute inset-0 rounded-xl bg-white/0 transition-all duration-300",
                  hoveredHref === l.href && "bg-white/10"
                )}
              />
              <span className="relative z-10">{l.label}</span>
              <span
                className={cn(
                  "absolute bottom-1.5 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-[#8fb9e8] transition-all duration-300",
                  (pathname === l.href || hoveredHref === l.href) && "w-8"
                )}
              />
            </Link>
          ))}
        </nav>

        {/* Theme toggle + CTA + mobile toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeIconButton variant="on-dark" />

          {isSignedIn ? (
            <div className="hidden items-center gap-2 xl:flex">
              <span className="hidden items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 2xl:flex">
                <span>Signed in as</span>
                <span className="text-[#8fb9e8]">{userRole}</span>
              </span>
              <Link
                href="/dashboard"
                className="rounded-xl bg-[#8fb9e8] px-3.5 py-2 text-sm font-semibold text-[#2d4a6b] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8d4f2] hover:shadow-lg hover:shadow-[#8fb9e8]/20"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-xl border border-white/10 px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/5 hover:text-white xl:block"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="hidden rounded-xl border border-[#8fb9e8]/40 px-3 py-2 text-sm font-medium text-[#8fb9e8] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8fb9e8]/10 xl:block"
              >
                Sign Up
              </Link>
              <Link
                href="/quote"
                className="hidden rounded-xl bg-[#8fb9e8] px-3.5 py-2 text-sm font-semibold text-[#2d4a6b] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8d4f2] hover:shadow-lg hover:shadow-[#8fb9e8]/20 xl:block"
              >
                Get a Quote
              </Link>
            </>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-white/10 xl:hidden"
            aria-label="Toggle menu"
          >
            <span className={cn("h-0.5 w-5 bg-white transition-all", open && "translate-y-2 rotate-45")} />
            <span className={cn("h-0.5 w-5 bg-white transition-all", open && "opacity-0")} />
            <span className={cn("h-0.5 w-5 bg-white transition-all", open && "-translate-y-2 -rotate-45")} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-[#2d4a6b] px-4 pb-5 xl:hidden">
          <nav className="flex flex-col gap-1.5 pt-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                  pathname === l.href ? "bg-white/10 text-[#8fb9e8]" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="relative z-10">{l.label}</span>
                <span className="absolute bottom-1.5 left-3 h-0.5 w-0 rounded-full bg-[#8fb9e8] transition-all duration-300 group-hover:w-8" />
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isSignedIn ? (
                <>
                  <div className="flex items-center justify-center gap-1 rounded-md border border-white/10 px-4 py-2 text-center text-xs font-medium text-zinc-300">
                    <span>Signed in as</span>
                    <span className="text-[#8fb9e8]">{userRole}</span>
                  </div>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-md bg-[#8fb9e8] px-4 py-2 text-center text-sm font-semibold text-[#2d4a6b]">
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="rounded-md border border-white/10 px-4 py-2 text-center text-sm font-medium text-zinc-300"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-md border border-white/15 px-4 py-2 text-center text-sm font-medium text-zinc-200">
                    Log In
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="rounded-md border border-[#8fb9e8]/40 px-4 py-2 text-center text-sm font-medium text-[#8fb9e8]">
                    Sign Up
                  </Link>
                  <Link href="/quote" onClick={() => setOpen(false)} className="rounded-md bg-[#8fb9e8] px-4 py-2 text-center text-sm font-semibold text-[#2d4a6b]">
                    Get a Quote
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
