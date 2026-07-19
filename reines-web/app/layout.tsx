import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ReinesLoaderProvider } from "@/components/layout/ReinesLoaderProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Reines Property Development",
  description: "Modern client portal and project management platform.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logo-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background font-[family-name:var(--font-montserrat)] text-foreground">
        <SessionProvider>
          <ThemeProvider>
            <ReinesLoaderProvider>{children}</ReinesLoaderProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
