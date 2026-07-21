import type { NextConfig } from "next";
import path from "path";

// ─── Security headers ─────────────────────────────────────────────────────────
// Applied globally to every route via the `headers` async function.
// CSP uses 'unsafe-inline' / 'unsafe-eval' because Next.js (Turbopack dev mode)
// requires them. For a hardened production setup you would generate per-request
// nonces and tighten these to 'nonce-<token>' only.

const isDev = process.env.NODE_ENV === "development";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Scripts: Next.js inlines hydration snippets; Turbopack also needs eval in dev.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  // Styles: Tailwind uses inline styles; Google Fonts stylesheet is external.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self (woff2 in /public) + Google Fonts CDN.
  "font-src 'self' https://fonts.gstatic.com data:",
  // Images: self, data URIs (base64 previews), blob (canvas exports), any https source.
  "img-src 'self' data: blob: https:",
  // Fetch / XHR: self for API routes + PayChangu HTTPS endpoints.
  "connect-src 'self' https:",
  // Media — no audio/video used.
  "media-src 'none'",
  // Frames — Google Maps embed on the Contact page; still disallow embedding us.
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  // Forms only submit to same origin.
  "form-action 'self'",
  // Block mixed content in production.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  {
    key:   "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    // Prevents browsers from MIME-sniffing the response away from the declared content-type.
    key:   "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Stops clickjacking (belt-and-suspenders alongside frame-ancestors in CSP).
    key:   "X-Frame-Options",
    value: "DENY",
  },
  {
    // Strict referrer policy — only send origin on same-origin, nothing cross-origin.
    key:   "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Disable access to browser features we don't use.
    key:   "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
  },
  {
    // Force HTTPS for 1 year (including sub-domains) once you're on a real domain.
    // Safe to include — browsers only honour it over HTTPS; ignored on HTTP (local dev).
    key:   "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

// In dev the mobile app opens the portal inside a WebView via the PC's LAN IP
// (e.g. http://192.168.1.134:3000). Next.js 15.2+ blocks cross-origin access to
// dev resources (/_next/*, HMR) by default, which breaks client-side hydration
// and image loads in the WebView. Allow the LAN host(s) during development only.
// Override / extend via DEV_LAN_ORIGINS="192.168.1.50,10.0.0.5".
const devLanOrigins = (process.env.DEV_LAN_ORIGINS ?? "192.168.1.134")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(isDev ? { allowedDevOrigins: devLanOrigins } : {}),

  async headers() {
    return [
      {
        // Apply to every route.
        source:  "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  turbopack: {
    root: path.resolve(__dirname),
  },

  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/logo.png" },
      { pathname: "/logo-project-mate.png" },
      { pathname: "/reines-logo.png" },
      { pathname: "/logo-icon.png" },
      { pathname: "/logo-loader.png" },
      { pathname: "/logo-full.png" },
      { pathname: "/logo-icon2.png" },
      { pathname: "/logo-procrete.png" },
      { pathname: "/logo-nav-rebrand.png" },
      { pathname: "/apple-touch-icon.png" },
      { pathname: "/favicon.ico" },
      { pathname: "/homepage-ads/**" },
      { pathname: "/product-images/**" },
      { pathname: "/about/**" },
      { pathname: "/api/media" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.private.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
