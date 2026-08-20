/**
 * Canonical site-wide constants for SEO (sitemap, robots, structured data,
 * metadataBase). Centralised here so the domain only has to be updated in
 * one place if it ever changes.
 */

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const SITE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://reines.co.mw"
);

/** Brand name shown in search / social (Google site name, og:site_name, page titles). */
export const SITE_NAME = "Reines Group";

export const SITE_DESCRIPTION =
  "Property development, construction, concrete products, and manufacturing in Malawi. Client portal for live project tracking, milestones, and progress galleries.";

/** Display lines for footer, contact page, etc. */
export const REGISTERED_OFFICE_LINES = [
  "Kamuzu Highway",
  "The Boulevard, Kristwick Mandala",
  "P.O Box 3494, Blantyre",
] as const;

/** Single-line registered office (about page, chatbot, SEO files). */
export const REGISTERED_OFFICE_FULL =
  "Kamuzu Highway, The Boulevard, Kristwick Mandala, P.O. Box 3494, Blantyre, Malawi";

export const ORGANIZATION = {
  /** Public brand used for Google site-name / Knowledge Panel signals. */
  name: "Reines Group",
  /** Legal / trading names Google can treat as alternate labels. */
  alternateName: [
    "Reines Property Development",
    "Reines Property Development Limited",
  ] as const,
  logoPath: "/logo-icon.png",
  telephone: "+265883157209",
  email: "contact@reines.co.mw",
  streetAddress: "Kamuzu Highway, The Boulevard, Kristwick Mandala",
  postOfficeBox: "P.O. Box 3494",
  addressLocality: "Blantyre",
  addressCountry: "MW",
};

/** Main public navigation, used for the sitemap and SiteNavigationElement structured data. */
export function getPublicNavPages(options: { includeMarketInsights: boolean }) {
  const pages: { path: string; label: string; priority: number }[] = [
    { path: "/", label: "Home", priority: 1 },
    { path: "/about", label: "About", priority: 0.8 },
    { path: "/services", label: "Services", priority: 0.8 },
    { path: "/products", label: "Products", priority: 0.7 },
    ...(options.includeMarketInsights
      ? [{ path: "/market-insights", label: "Market Insights", priority: 0.6 }]
      : []),
    { path: "/projects", label: "Projects", priority: 0.8 },
    { path: "/project-mate", label: "Project Mate", priority: 0.7 },
    { path: "/contact", label: "Contact", priority: 0.7 },
    { path: "/quote", label: "Get a Quote", priority: 0.7 },
  ];
  return pages;
}
