import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/*",
        "/api/",
        "/login",
        "/register",
        "/forgot-password",
        "/verify-email",
        "/mobile-bridge",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
