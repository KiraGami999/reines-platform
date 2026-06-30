export type ProductSubsidiary = "procrete" | "probuild" | "prosteel" | "workshop";

export type ProductSubsidiaryFilter = "all" | ProductSubsidiary;

export type ProductCatalogItem = {
  id: string;
  name: string;
  subsidiary: ProductSubsidiary;
  description: string;
  sizes: string[];
  applications: string[];
  imageUrl: string;
  badge: string;
  priceLabel: string;
  promoLabel: string;
  active: boolean;
  sortOrder: number;
};

export type AvailableProductImage = {
  imageUrl: string;
  alt: string;
  defaultTitle: string;
};

export const PRODUCT_SUBSIDIARIES: {
  value: ProductSubsidiaryFilter;
  label: string;
  description: string;
}[] = [
  { value: "all", label: "All subsidiaries", description: "Browse products across all Reines subsidiaries." },
  {
    value: "procrete",
    label: "Reines ProCrete",
    description: "Concrete and concrete products.",
  },
  {
    value: "probuild",
    label: "Reines ProBuild",
    description: "Binding materials and adhesives.",
  },
  {
    value: "prosteel",
    label: "Reines ProSteel",
    description: "Iron sheets, aluminum door and window frames.",
  },
  {
    value: "workshop",
    label: "Reines Workshop",
    description: "Kitchen units, carpentry and joinery.",
  },
];

export const PRODUCT_SUBSIDIARY_OPTIONS = PRODUCT_SUBSIDIARIES.filter(
  (item) => item.value !== "all"
) as { value: ProductSubsidiary; label: string; description: string }[];

export function getSubsidiaryMeta(subsidiary: ProductSubsidiary) {
  return PRODUCT_SUBSIDIARY_OPTIONS.find((item) => item.value === subsidiary);
}

/** Map legacy product category values to subsidiaries for older saved records. */
export function normalizeProductSubsidiary(value: string): ProductSubsidiary {
  const legacyMap: Record<string, ProductSubsidiary> = {
    blocks: "procrete",
    pavers: "procrete",
    kerbs: "procrete",
    stone: "procrete",
    aggregates: "procrete",
    adhesives: "probuild",
    procrete: "procrete",
    probuild: "probuild",
    prosteel: "prosteel",
    workshop: "workshop",
  };

  return legacyMap[value] ?? "procrete";
}

export const AVAILABLE_PRODUCT_IMAGES: AvailableProductImage[] = [
  {
    imageUrl: "/product-images/rectangular-paver-150.png",
    alt: "Reines ProCrete rectangular concrete paver 60 x 150 x 200mm",
    defaultTitle: "Rectangular Paver (60 x 150 x 200mm)",
  },
  {
    imageUrl: "/product-images/curb-stone.png",
    alt: "Reines ProCrete rectangular curb stone",
    defaultTitle: "Curb Stone",
  },
  {
    imageUrl: "/product-images/concrete-block.png",
    alt: "Reines ProCrete hollow concrete block",
    defaultTitle: "Concrete Block",
  },
  {
    imageUrl: "/product-images/rectangular-paver.png",
    alt: "Reines ProCrete rectangular concrete paver",
    defaultTitle: "Rectangular Paver",
  },
  {
    imageUrl: "/homepage-ads/procrete-chileka-front.png",
    alt: "Reines ProCrete front exterior",
    defaultTitle: "ProCrete site exterior",
  },
  {
    imageUrl: "/homepage-ads/procrete-chileka-yard.png",
    alt: "Reines ProCrete product yard",
    defaultTitle: "ProCrete product yard",
  },
  {
    imageUrl: "/homepage-ads/procrete-chileka-showcase.png",
    alt: "Reines ProCrete showcase",
    defaultTitle: "ProCrete showcase",
  },
  {
    imageUrl: "/product-images/tile-adhesive-info.png",
    alt: "Reines tile adhesive product information",
    defaultTitle: "Tile adhesive product information",
  },
  {
    imageUrl: "/product-images/tile-adhesive-bag.png",
    alt: "Reines 40kg tile adhesive bag",
    defaultTitle: "Tile adhesive bag",
  },
];

export const FALLBACK_PRODUCTS: ProductCatalogItem[] = [
  {
    id: "fallback-solid-concrete-block",
    name: "Solid Concrete Blocks",
    subsidiary: "procrete",
    description:
      "Dense, durable blocks for load-bearing walling, foundations, boundary walls, and commercial site work.",
    sizes: ["150 mm", "200 mm", "Custom batches"],
    applications: ["Foundations", "Boundary walls", "Structural walling"],
    imageUrl: "/homepage-ads/procrete-chileka-front.png",
    badge: "High demand",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 0,
  },
  {
    id: "fallback-hollow-concrete-block",
    name: "Hollow Concrete Blocks",
    subsidiary: "procrete",
    description:
      "Lightweight block option for faster walling, better material efficiency, and practical building projects.",
    sizes: ["150 mm", "200 mm", "Project orders"],
    applications: ["Residential builds", "Partition walls", "Commercial projects"],
    imageUrl: "/homepage-ads/procrete-chileka-yard.png",
    badge: "Available",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 1,
  },
  {
    id: "fallback-interlocking-pavers",
    name: "Interlocking Pavers",
    subsidiary: "procrete",
    description:
      "Neat interlocking paving products for driveways, walkways, courtyards, and commercial outdoor areas.",
    sizes: ["60 mm", "80 mm", "Multiple finishes"],
    applications: ["Driveways", "Walkways", "Parking areas"],
    imageUrl: "/homepage-ads/procrete-chileka-showcase.png",
    badge: "Popular",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 2,
  },
  {
    id: "fallback-road-kerbs",
    name: "Road & Garden Kerbs",
    subsidiary: "procrete",
    description:
      "Precast kerbing for road edges, landscaped spaces, drainage guidance, and clean project finishing.",
    sizes: ["Road kerbs", "Garden kerbs", "Bulk supply"],
    applications: ["Road works", "Landscaping", "Drainage edges"],
    imageUrl: "/homepage-ads/procrete-chileka-front.png",
    badge: "Bulk orders",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 3,
  },
  {
    id: "fallback-stone-cladding",
    name: "Stone Cladding",
    subsidiary: "procrete",
    description:
      "Stone products for decorative and durable wall finishes, including cladding for residential and commercial projects.",
    sizes: ["Project-based", "Multiple finishes", "Bulk supply"],
    applications: ["Feature walls", "External finishes", "Commercial facades"],
    imageUrl: "/homepage-ads/procrete-chileka-showcase.png",
    badge: "Stone products",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 4,
  },
  {
    id: "fallback-tile-adhesive",
    name: "Cement-Based Tile Adhesive",
    subsidiary: "probuild",
    description:
      "Grey cement-based tile adhesive with additives to enhance durability and performance for ceramic and porcelain tile installation.",
    sizes: ["40kg bag", "Grey cement based", "Bulk/project supply"],
    applications: ["Ceramic tiles", "Porcelain tiles", "Interior & exterior walls and floors"],
    imageUrl: "/product-images/tile-adhesive-info.png",
    badge: "Coming soon",
    priceLabel: "Price TBC",
    promoLabel: "New product",
    active: true,
    sortOrder: 5,
  },
  {
    id: "fallback-binding-materials",
    name: "Binding Materials",
    subsidiary: "probuild",
    description:
      "Industrial adhesives and binding materials for construction, finishing, and installation work.",
    sizes: ["Project supply", "Bulk orders", "Custom packaging"],
    applications: ["Tile installation", "Finishing work", "Site supply"],
    imageUrl: "/product-images/tile-adhesive-bag.png",
    badge: "ProBuild",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 6,
  },
  {
    id: "fallback-iron-sheets",
    name: "Iron Sheets",
    subsidiary: "prosteel",
    description:
      "Iron sheet products for roofing, cladding, and structural finishing requirements on residential and commercial projects.",
    sizes: ["Standard gauges", "Project supply", "Bulk orders"],
    applications: ["Roofing", "Cladding", "Structural finishing"],
    imageUrl: "/homepage-ads/procrete-chileka-yard.png",
    badge: "ProSteel",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 7,
  },
  {
    id: "fallback-aluminum-frames",
    name: "Aluminum Door & Window Frames",
    subsidiary: "prosteel",
    description:
      "Aluminum door and window frame solutions for durable openings, clean finishes, and project-specific sizing.",
    sizes: ["Custom sizing", "Standard openings", "Project fabrication"],
    applications: ["Doors", "Windows", "Commercial openings"],
    imageUrl: "/homepage-ads/procrete-chileka-front.png",
    badge: "ProSteel",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 8,
  },
  {
    id: "fallback-kitchen-units",
    name: "Kitchen Units",
    subsidiary: "workshop",
    description:
      "Custom and project-based kitchen unit solutions designed for residential and commercial fit-out work.",
    sizes: ["Custom layouts", "Standard modules", "Project fabrication"],
    applications: ["Residential kitchens", "Commercial fit-outs", "Renovations"],
    imageUrl: "/homepage-ads/procrete-chileka-showcase.png",
    badge: "Workshop",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 9,
  },
  {
    id: "fallback-carpentry-joinery",
    name: "Carpentry & Joinery",
    subsidiary: "workshop",
    description:
      "Carpentry and joinery services and products for doors, fittings, cabinetry, and bespoke interior elements.",
    sizes: ["Bespoke work", "Project orders", "Site installation"],
    applications: ["Cabinetry", "Doors", "Interior fittings"],
    imageUrl: "/homepage-ads/procrete-chileka-yard.png",
    badge: "Workshop",
    priceLabel: "Request quote",
    promoLabel: "",
    active: true,
    sortOrder: 10,
  },
];
