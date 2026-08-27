import { Globe2, Wrench } from "lucide-react";
import PublicServicesForm from "@/components/admin/PublicServicesForm";
import { getAdminPublicServices } from "@/lib/public-services";

export const metadata = { title: "Public Services - Reines Admin" };

export default async function AdminPublicServicesPage() {
  const { services, usingFallback } = await getAdminPublicServices();

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8 sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center sm:flex">
            <Wrench className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#35475D] sm:text-2xl">Public Services</h1>
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">
              Manage the services, descriptions, feature lists, icons, and ordering shown on the public Services page.
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 md:flex md:items-center md:gap-2">
          <Globe2 size={15} className="text-zinc-500" />
          Public website content
        </div>
      </div>

      <PublicServicesForm initialServices={services} usingFallback={usingFallback} />
    </div>
  );
}
