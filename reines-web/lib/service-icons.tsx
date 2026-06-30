import type { ElementType } from "react";
import { Blocks, Building2, House, Landmark, Layers3, PackageCheck, Smartphone } from "lucide-react";

export const SERVICE_ICON_MAP = {
  Building2,
  House,
  Landmark,
  Blocks,
  Layers3,
  PackageCheck,
  Smartphone,
} as const satisfies Record<string, ElementType>;

export type ServiceIconKey = keyof typeof SERVICE_ICON_MAP;

export const SERVICE_ICON_OPTIONS: { value: ServiceIconKey; label: string }[] = [
  { value: "Building2", label: "Property / Building" },
  { value: "House", label: "Residential" },
  { value: "Landmark", label: "Civil / Infrastructure" },
  { value: "Blocks", label: "Concrete Products" },
  { value: "Layers3", label: "Stone Products" },
  { value: "PackageCheck", label: "Materials / Supply" },
  { value: "Smartphone", label: "Digital / Portal" },
];

export function getServiceIcon(iconKey: string): ElementType {
  return SERVICE_ICON_MAP[iconKey as ServiceIconKey] ?? Building2;
}
