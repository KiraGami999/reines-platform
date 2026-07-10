import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ReinesLoaderProvider } from "@/components/layout/ReinesLoaderProvider";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Reines Property Development",
  description: "Modern client portal and project management platform.",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-[family-name:var(--font-montserrat)] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <SessionProvider>
          <ReinesLoaderProvider>{children}</ReinesLoaderProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
