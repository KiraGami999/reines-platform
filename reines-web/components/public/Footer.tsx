import Link from "next/link";
import { ReinesLogo } from "@/components/layout/ReinesLogo";

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
              Redefining Homes, One Project at a Time. Property development, construction, concrete products, adhesives, and building materials for Malawi.
            </p>
            <div className="mt-6 space-y-1 text-sm">
              <p>Old Highway, Chichiri</p>
              <p>P.O. Box 3494, Blantyre, Malawi</p>
              <a href="tel:+265883157209" className="block hover:text-white">+(265) 883 15 72 09</a>
              <a href="mailto:contact@reines.co.mw" className="block hover:text-white">contact@reines.co.mw</a>
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
          <p>Built with care in Malawi.</p>
        </div>
      </div>
    </footer>
  );
}
