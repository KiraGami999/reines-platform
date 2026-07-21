"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

/** Cropped Reines Group rebrand mark — public navbar only (navy bg matches bar). */
const NAV_LOGO_SRC = "/logo-nav-rebrand.png";
const NAV_LOGO_WIDTH = 795;
const NAV_LOGO_HEIGHT = 163;

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

/** Mobile drawer links — same colours as Home / About (readable in dark mode). */
function mobileNavItemClass(active: boolean) {
  return cn(
    "group relative overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300",
    active ? "bg-white/10 text-[#8fb9e8]" : "text-zinc-300 hover:bg-white/5 hover:text-white"
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const userRole = session?.user?.role ? roleLabels[session.user.role] ?? session.user.role : null;
  const isSignedIn = status === "authenticated" && !!session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#2d4a6b] shadow-lg shadow-black/5">
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Logo — rebranded Reines Group mark (navbar only) */}
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center transition-transform duration-300 hover:scale-[1.02]"
          aria-label="Reines Group — Home"
        >
          <Image
            src={NAV_LOGO_SRC}
            alt="Reines Group"
            width={NAV_LOGO_WIDTH}
            height={NAV_LOGO_HEIGHT}
            priority
            className="h-9 w-auto min-h-9 object-contain object-left sm:h-10 lg:h-11"
          />
        </Link>

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

        {/* CTA + mobile toggle */}
        <div className="flex shrink-0 items-center gap-2">
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
                className={mobileNavItemClass(pathname === l.href)}
              >
                <span className="relative z-10">{l.label}</span>
                <span className="absolute bottom-1.5 left-3 h-0.5 w-0 rounded-full bg-[#8fb9e8] transition-all duration-300 group-hover:w-8" />
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-1.5">
              {isSignedIn ? (
                <>
                  <div className={mobileNavItemClass(false)}>
                    <span>Signed in as </span>
                    <span className="text-[#8fb9e8]">{userRole}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className={mobileNavItemClass(pathname.startsWith("/dashboard"))}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className={mobileNavItemClass(false)}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className={mobileNavItemClass(pathname === "/login")}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className={mobileNavItemClass(pathname === "/register")}
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/quote"
                    onClick={() => setOpen(false)}
                    className={mobileNavItemClass(pathname === "/quote")}
                  >
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
