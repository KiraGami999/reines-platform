import Link from "next/link";
import { ReinesLogo } from "@/components/layout/ReinesLogo";
import { ORGANIZATION, REGISTERED_OFFICE_LINES } from "@/lib/site";

const footerLinks = {
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Our Services", href: "/services" },
    { label: "Projects", href: "/projects" },
    { label: "Get a Quote", href: "/quote" },
    { label: "Contact", href: "/contact" },
  ],
  Portal: [
    { label: "Log In", href: "/login" },
    { label: "Sign Up", href: "/register" },
    { label: "Dashboard", href: "/dashboard" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0a1525] text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <ReinesLogo size="lg" variant="on-dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Redefining homes, one project at a time. Property, construction, concrete, manufacturing for Malawi.
            </p>
            <div className="mt-6 space-y-1 text-sm">
              {REGISTERED_OFFICE_LINES.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <a href={`tel:${ORGANIZATION.telephone}`} className="block hover:text-white">
                +(265) 883 15 72 09
              </a>
              <a href={`mailto:${ORGANIZATION.email}`} className="block hover:text-white">
                {ORGANIZATION.email}
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, items]) => (
            <div key={group}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {group}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm transition-colors hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Reines Property Development Limited. All rights reserved.</p>
          <p>Built with care in Malawi by Kiragami Korp.</p>
        </div>
      </div>
    </footer>
  );
}
