import { Globe2, Wrench } from "lucide-react";
import PublicServicesForm from "@/components/admin/PublicServicesForm";
import { getAdminPublicServices } from "@/lib/public-services";

export const metadata = { title: "Public Services - Reines Admin" };

export default async function AdminPublicServicesPage() {
  const { services, usingFallback } = await getAdminPublicServices();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4a6b]">
            <Wrench className="h-5 w-5 text-zinc-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2d4a6b]">Public Services</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage the services, descriptions, feature lists, icons, and ordering shown on the public Services page.
            </p>
          </div>
        </div>

        <div className="hidden rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <Globe2 size={15} className="text-zinc-500" />
          Public website content
        </div>
      </div>

      <PublicServicesForm initialServices={services} usingFallback={usingFallback} />
    </div>
  );
}
