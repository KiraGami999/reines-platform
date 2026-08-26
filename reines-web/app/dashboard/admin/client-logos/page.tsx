import { Building } from "lucide-react";
import ClientLogosForm from "@/components/admin/ClientLogosForm";
import { getAdminClientLogos } from "@/lib/client-logos";

export const metadata = { title: "Client Logos - Reines Admin" };
export const dynamic = "force-dynamic";

export default async function AdminClientLogosPage() {
  const { settings, logos, usingFallback } = await getAdminClientLogos();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center">
          <Building className="h-5 w-5 text-zinc-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#35475D]">Client Logos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the &quot;Clients We&apos;ve Worked With&quot; logo strip shown on the public homepage.
          </p>
        </div>
      </div>

      <ClientLogosForm
        initialSettings={settings}
        initialLogos={logos}
        usingFallback={usingFallback}
      />
    </div>
  );
}
