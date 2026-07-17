import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ReinesChatbot } from "@/components/public/ReinesChatbot";

/**
 * Public marketing layout.
 *
 * `data-portal` opts pages into the dark-mode surface remaps in globals.css so
 * Contact / Quote / etc. don't keep a white canvas while inputs go dark.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-portal
      className="flex min-h-screen flex-col overflow-x-clip bg-background text-foreground"
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ReinesChatbot />
    </div>
  );
}
