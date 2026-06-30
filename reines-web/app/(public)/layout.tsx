import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ReinesChatbot } from "@/components/public/ReinesChatbot";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white text-zinc-900">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ReinesChatbot />
    </div>
  );
}
