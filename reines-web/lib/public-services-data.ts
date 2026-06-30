import type { ServiceIconKey } from "@/lib/service-icons";

export type PublicServiceItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  iconKey: ServiceIconKey;
  active: boolean;
  sortOrder: number;
};

export const FALLBACK_PUBLIC_SERVICES: PublicServiceItem[] = [
  {
    id: "fallback-property-development",
    title: "Property Development",
    tagline: "Full-cycle residential & commercial development",
    description:
      "We manage the complete development lifecycle — from site acquisition and architectural design, through planning approvals and construction, to interior finishing and property handover.",
    features: [
      "Site selection & acquisition",
      "Architectural design coordination",
      "Planning & regulatory approvals",
      "Project cost management",
      "Contractor supervision",
    ],
    iconKey: "Building2",
    active: true,
    sortOrder: 0,
  },
  {
    id: "fallback-building-contracting",
    title: "Building Contracting",
    tagline: "Structured construction with milestone reporting",
    description:
      "We construct buildings for occupancy, including residential and commercial work, with structured supervision, clear timelines, and practical client communication.",
    features: [
      "Residential new builds",
      "Extensions & renovations",
      "Commercial construction",
      "Structured payment milestones",
      "Progress reporting",
    ],
    iconKey: "House",
    active: true,
    sortOrder: 1,
  },
  {
    id: "fallback-civil-contracting",
    title: "Civil Contracting",
    tagline: "Infrastructure and public works delivery",
    description:
      "We support the construction of infrastructure and public works through practical project planning, site coordination, and dependable execution.",
    features: [
      "Infrastructure works",
      "Public works support",
      "Site coordination",
      "Project supervision",
      "Quality control",
    ],
    iconKey: "Landmark",
    active: true,
    sortOrder: 2,
  },
  {
    id: "fallback-concrete-products",
    title: "Concrete Products",
    tagline: "Quality concrete products delivered to your site",
    description:
      "We manufacture a range of concrete products including blocks and a variety of pavers for building, paving, and construction supply needs.",
    features: [
      "Concrete blocks",
      "Variety of pavers",
      "Durable construction products",
      "Bulk supply support",
      "Site delivery coordination",
    ],
    iconKey: "Blocks",
    active: true,
    sortOrder: 3,
  },
  {
    id: "fallback-stone-products",
    title: "Stone Products",
    tagline: "Stone cladding and finish products",
    description:
      "We manufacture and supply stone products, including a wide range of stone cladding for refined building finishes.",
    features: [
      "Stone cladding",
      "Decorative finishes",
      "Building finish products",
      "Project supply support",
      "Product advice",
    ],
    iconKey: "Layers3",
    active: true,
    sortOrder: 4,
  },
  {
    id: "fallback-binding-materials",
    title: "Binding Materials",
    tagline: "Adhesives and binding materials",
    description:
      "We manufacture adhesives and binding materials, including grey cement-based tile adhesive products designed for ceramic and porcelain tile installation.",
    features: [
      "Industrial adhesives",
      "Binding materials",
      "Grey cement-based tile adhesive",
      "40kg product packaging",
      "Interior and exterior applications",
    ],
    iconKey: "PackageCheck",
    active: true,
    sortOrder: 5,
  },
  {
    id: "fallback-client-portal",
    title: "Client Portal Access",
    tagline: "Your project in your pocket, at all times",
    description:
      "Every Reines client receives access to a private, secure portal for their project — giving live visibility into progress, milestones, photos, costs, and a direct line to their project manager.",
    features: [
      "Live project status dashboard",
      "Progress photo gallery",
      "Milestone & cost tracking",
      "Direct in-app messaging",
      "Complete communication history",
    ],
    iconKey: "Smartphone",
    active: true,
    sortOrder: 6,
  },
];
