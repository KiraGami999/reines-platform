export type PublicProjectStatus = "COMPLETED" | "IN_PROGRESS" | "PLANNING";

/** Maximum gallery images per public project (detail view). */
export const MAX_PUBLIC_PROJECT_IMAGES = 10;

export type PublicProjectItem = {
  id: string;
  title: string;
  location: string;
  type: string;
  status: PublicProjectStatus;
  description: string;
  year: string;
  /** Cover image for cards and listings — always the first gallery image. */
  imageUrl: string;
  /** Full gallery shown when a visitor opens the project. */
  imageUrls: string[];
  active: boolean;
  sortOrder: number;
};

export type AvailablePublicProjectImage = {
  imageUrl: string;
  alt: string;
  defaultTitle: string;
};

export const PUBLIC_PROJECT_STATUS_OPTIONS: { value: PublicProjectStatus; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

export const AVAILABLE_PUBLIC_PROJECT_IMAGES: AvailablePublicProjectImage[] = [
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
];

/** Normalize legacy single-image rows into a gallery array. */
export function normalizePublicProjectImages(project: {
  imageUrl: string;
  imageUrls?: string[];
}): string[] {
  if (project.imageUrls && project.imageUrls.length > 0) return project.imageUrls;
  return project.imageUrl ? [project.imageUrl] : [];
}

export function getPublicProjectCoverImage(project: Pick<PublicProjectItem, "imageUrl" | "imageUrls">): string {
  return normalizePublicProjectImages(project)[0] ?? project.imageUrl;
}

export const FALLBACK_PUBLIC_PROJECTS: PublicProjectItem[] = [
  {
    id: "fallback-chichiri-residential",
    title: "Chichiri Residential Complex",
    location: "Blantyre, Malawi",
    type: "Residential Development",
    status: "COMPLETED",
    description:
      "A residential development example showing how completed projects can appear once admins publish real client-approved data.",
    year: "2024",
    imageUrl: "/homepage-ads/procrete-chileka-front.png",
    imageUrls: ["/homepage-ads/procrete-chileka-front.png"],
    active: true,
    sortOrder: 0,
  },
  {
    id: "fallback-procrete-site",
    title: "ProCrete Product Site",
    location: "Chileka, Blantyre",
    type: "Concrete Products",
    status: "IN_PROGRESS",
    description:
      "A public showcase entry for concrete product manufacturing, blocks, pavers, and related construction supply activity.",
    year: "2025",
    imageUrl: "/homepage-ads/procrete-chileka-yard.png",
    imageUrls: ["/homepage-ads/procrete-chileka-yard.png"],
    active: true,
    sortOrder: 1,
  },
  {
    id: "fallback-binding-materials",
    title: "Binding Materials Rollout",
    location: "Blantyre, Malawi",
    type: "Binding Materials",
    status: "PLANNING",
    description:
      "A planning-stage showcase entry for adhesives and binding material product work that can be replaced with verified project information.",
    year: "2026",
    imageUrl: "/product-images/tile-adhesive-info.png",
    imageUrls: ["/product-images/tile-adhesive-info.png"],
    active: true,
    sortOrder: 2,
  },
];
