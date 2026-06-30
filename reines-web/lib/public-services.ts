import { prisma } from "@/lib/prisma";
import {
  FALLBACK_PUBLIC_SERVICES,
  type PublicServiceItem,
} from "@/lib/public-services-data";
import type { ServiceIconKey } from "@/lib/service-icons";

export {
  FALLBACK_PUBLIC_SERVICES,
  type PublicServiceItem,
} from "@/lib/public-services-data";

function serializeService(service: {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  iconKey: string;
  active: boolean;
  sortOrder: number;
}): PublicServiceItem {
  return {
    id: service.id,
    title: service.title,
    tagline: service.tagline,
    description: service.description,
    features: service.features,
    iconKey: service.iconKey as ServiceIconKey,
    active: service.active,
    sortOrder: service.sortOrder,
  };
}

export async function getPublicServices(): Promise<PublicServiceItem[]> {
  try {
    const services = await prisma.publicService.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (services.length === 0) return FALLBACK_PUBLIC_SERVICES;
    return services.map(serializeService);
  } catch {
    return FALLBACK_PUBLIC_SERVICES;
  }
}

export async function getAdminPublicServices(): Promise<{
  services: PublicServiceItem[];
  usingFallback: boolean;
}> {
  try {
    const services = await prisma.publicService.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (services.length === 0) {
      return { services: FALLBACK_PUBLIC_SERVICES, usingFallback: true };
    }

    return { services: services.map(serializeService), usingFallback: false };
  } catch {
    return { services: FALLBACK_PUBLIC_SERVICES, usingFallback: true };
  }
}
