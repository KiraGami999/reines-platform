import { ORGANIZATION, SITE_NAME, SITE_URL, getPublicNavPages } from "@/lib/site";

type Props = {
  /** Whether Market Insights is currently visible (mirrors the admin toggle). */
  includeMarketInsights: boolean;
};

/**
 * JSON-LD structured data for the public marketing site.
 *
 * This is one of the technical prerequisites for Google to consider showing
 * "sitelinks" (the extra jump-links under a search result) — in particular,
 * `SiteNavigationElement` explicitly tells Google which pages are the site's
 * main sections. It doesn't guarantee sitelinks (Google decides that
 * algorithmically, and it also depends on domain trust built up over time),
 * but it removes the technical guesswork for it.
 */
export function StructuredData({ includeMarketInsights }: Props) {
  const navPages = getPublicNavPages({ includeMarketInsights });

  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: ORGANIZATION.name,
    alternateName: [...ORGANIZATION.alternateName],
    url: SITE_URL,
    logo: `${SITE_URL}${ORGANIZATION.logoPath}`,
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: ORGANIZATION.streetAddress,
      postOfficeBoxNumber: ORGANIZATION.postOfficeBox,
      addressLocality: ORGANIZATION.addressLocality,
      addressCountry: ORGANIZATION.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: ORGANIZATION.telephone,
      email: ORGANIZATION.email,
      areaServed: "MW",
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: [...ORGANIZATION.alternateName],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  const siteNavigation = navPages.map((page) => ({
    "@type": "SiteNavigationElement",
    name: page.label,
    url: `${SITE_URL}${page.path}`,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [organization, website, ...siteNavigation],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static, server-generated JSON, no user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
