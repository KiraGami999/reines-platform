"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogoAnchor } from "@/components/layout/BrandLogoAnchor";
import { ReinesLogo } from "@/components/layout/ReinesLogo";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCheck,
  MessageSquare,
  ImageIcon,
  FileText,
  CreditCard,
  ClipboardList,
  PackageCheck,
  Settings,
  ShieldCheck,
  Wrench,
  Star,
  X,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  heading?: string;
  items: NavItem[];
}

// ─── Role nav definitions ──────────────────────────────────────────────────────

const adminNav: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Management",
    items: [
      { label: "Project Admin",    href: "/dashboard/admin/projects",  icon: FolderKanban  },
      { label: "Clients",          href: "/dashboard/admin/clients",   icon: UserCheck     },
      { label: "Users",            href: "/dashboard/admin/users",      icon: Users         },
      { label: "Payments",         href: "/dashboard/admin/payments",   icon: CreditCard    },
      { label: "Loyalty",          href: "/dashboard/admin/loyalty",      icon: Star          },
      { label: "Quotations",       href: "/dashboard/admin/quotations",   icon: ClipboardList },
      { label: "Enquiries",        href: "/dashboard/admin/enquiries",    icon: FileText      },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Homepage Ads",     href: "/dashboard/admin/homepage", icon: ImageIcon    },
      { label: "Public Projects",  href: "/dashboard/admin/public-projects", icon: FolderKanban },
      { label: "Public Services",  href: "/dashboard/admin/public-services", icon: Wrench },
      { label: "Products",         href: "/dashboard/admin/products", icon: PackageCheck },
      { label: "Progress Gallery", href: "/dashboard/gallery",  icon: ImageIcon    },
      { label: "Messages",         href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    heading: "System",
    items: [
      { label: "Admin Panel", href: "/dashboard/admin",    icon: ShieldCheck },
      { label: "Settings",    href: "/dashboard/settings", icon: Settings    },
    ],
  },
];

const managerNav: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    heading: "Projects",
    items: [
      { label: "My Projects",      href: "/dashboard/manage/projects", icon: FolderKanban  },
      { label: "Progress Gallery", href: "/dashboard/gallery",          icon: ImageIcon     },
      { label: "Milestones",       href: "/dashboard/milestones",       icon: ClipboardList },
    ],
  },
  {
    heading: "Communication",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const clientNav: NavSection[] = [
  {
    items: [
      { label: "Overview",    href: "/dashboard",          icon: LayoutDashboard },
      { label: "My Projects", href: "/dashboard/projects", icon: FolderKanban    },
    ],
  },
  {
    heading: "Project Details",
    items: [
      { label: "Progress Gallery", href: "/dashboard/gallery",  icon: ImageIcon  },
      { label: "Payments",         href: "/dashboard/payments", icon: CreditCard },
      { label: "Rewards",          href: "/dashboard/loyalty",  icon: Star       },
    ],
  },
  {
    heading: "Communication",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const navByRole: Record<string, NavSection[]> = {
  ADMIN:           adminNav,
  PROJECT_MANAGER: managerNav,
  CLIENT:          clientNav,
};

const roleMeta: Record<string, { label: string; colour: string }> = {
  ADMIN:           { label: "Admin",           colour: "bg-blue-500/15 text-blue-400 border border-blue-500/20"       },
  PROJECT_MANAGER: { label: "Project Manager", colour: "bg-blue-500/15 text-blue-400 border border-blue-500/20"   },
  CLIENT:          { label: "Client",          colour: "bg-blue-500/15 text-blue-400 border border-blue-500/20" },
};

// ─── Tooltip wrapper (shown only in collapsed mode) ────────────────────────────

function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group/tip relative">
      {children}
      <div
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2
                   whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium
                   text-white opacity-0 shadow-lg transition-opacity duration-150
                   group-hover/tip:opacity-100"
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  role?:      string;
  open?:      boolean;
  collapsed?: boolean;
  onClose?:   () => void;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  role = "CLIENT",
  open = true,
  collapsed = false,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const sections = navByRole[role] ?? navByRole.CLIENT;
  const meta     = roleMeta[role] ?? roleMeta.CLIENT;

  function handleLinkClick() {
    if (onClose) onClose();
  }

  const sidebarWidth = collapsed ? "lg:w-[68px]" : "lg:w-64";

  return (
    <>
      {/* Mobile backdrop */}
      {open && onClose && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden print:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-[#2d4a6b] print:hidden",
          "transition-all duration-200 ease-in-out",
          /* Mobile: slides in/out as a full 256px panel */
          "w-64 max-w-[calc(100vw-3.5rem)]",
          open ? "translate-x-0" : "-translate-x-full",
          /* Desktop: always visible, width driven by collapsed state */
          "lg:static lg:translate-x-0",
          sidebarWidth
        )}
      >
        {/* Logo row — keep mark smaller than the bar so it has breathing room */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-3 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center" onClick={handleLinkClick}>
            <BrandLogoAnchor>
              <ReinesLogo size={collapsed ? "xs" : "sidebar"} variant="on-dark" />
            </BrandLogoAnchor>
          </Link>

          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}

          {/* Desktop collapse toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex items-center justify-center rounded-md p-1.5 text-zinc-400",
                "transition-colors hover:bg-white/10 hover:text-white"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Role badge — hidden when collapsed */}
        {!collapsed && (
          <div className="px-4 pb-2 pt-3">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", meta.colour)}>
              {meta.label}
            </span>
          </div>
        )}
        {collapsed && <div className="pb-2 pt-3" />}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
          {sections.map((section, si) => (
            <div key={si} className={cn(si > 0 && "mt-5")}>
              {/* Section heading — hidden when collapsed */}
              {section.heading && !collapsed && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {section.heading}
                </p>
              )}
              {section.heading && collapsed && <div className="my-2 border-t border-white/5" />}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  const linkEl = (
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        isActive
                          ? "bg-[#8fb9e8]/15 text-[#8fb9e8]"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon
                        size={17}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive ? "text-[#8fb9e8]" : "text-zinc-500 group-hover:text-zinc-300"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  return (
                    <li key={item.href}>
                      {collapsed ? (
                        <NavTooltip label={item.label}>{linkEl}</NavTooltip>
                      ) : (
                        linkEl
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {collapsed ? (
            <NavTooltip label="Back to public site">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex items-center justify-center rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
                aria-label="Back to public site"
              >
                <ChevronLeft size={16} />
              </Link>
            </NavTooltip>
          ) : (
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-xs text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
            >
              <ChevronLeft size={13} />
              Back to public site
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
