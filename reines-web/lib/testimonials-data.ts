export type TestimonialItem = {
  id: string;
  clientName: string;
  clientTitle: string;
  quote: string;
  accentColor: string;
  sortOrder: number;
};

export type TestimonialsSettings = {
  visible: boolean;
};

/** Curated accent colors offered in the admin editor for the initials avatar. */
export const TESTIMONIAL_ACCENT_OPTIONS = [
  { label: "Sky Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Emerald", value: "#22c55e" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Reines Blue", value: "#8fb9e8" },
] as const;

export const FALLBACK_TESTIMONIALS_SETTINGS: TestimonialsSettings = {
  visible: true,
};

/** Sample placeholder content — replace via /dashboard/admin/testimonials. */
export const FALLBACK_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "fallback-1",
    clientName: "Chikondi Banda",
    clientTitle: "Director, Nyanja Residences",
    quote:
      "Reines delivered our residential development on schedule with excellent workmanship. Their team kept us updated at every milestone.",
    accentColor: "#3b82f6",
    sortOrder: 0,
  },
  {
    id: "fallback-2",
    clientName: "Thoko Phiri",
    clientTitle: "Operations Manager, Blantyre Business Park",
    quote:
      "From planning to handover, the process was transparent and professional. The progress gallery made it easy to track construction remotely.",
    accentColor: "#8b5cf6",
    sortOrder: 1,
  },
  {
    id: "fallback-3",
    clientName: "Grace Mwale",
    clientTitle: "Homeowner, Chileka Townhouses",
    quote:
      "The build quality exceeded our expectations. Reines' concrete products and finishing work gave our home a premium feel.",
    accentColor: "#22c55e",
    sortOrder: 2,
  },
  {
    id: "fallback-4",
    clientName: "Dr. Andrew Kachingwe",
    clientTitle: "Founder, Lakeview Medical Centre",
    quote:
      "Civil works were handled with real precision. Reines' project managers communicated clearly and solved issues quickly on site.",
    accentColor: "#f59e0b",
    sortOrder: 3,
  },
  {
    id: "fallback-5",
    clientName: "Ellen Chirwa",
    clientTitle: "Procurement Lead, Zomba Trading Co.",
    quote:
      "Sourcing dry-mix construction materials from Reines has been reliable and consistent — always on time and to spec.",
    accentColor: "#f43f5e",
    sortOrder: 4,
  },
  {
    id: "fallback-6",
    clientName: "Patrick Nyirenda",
    clientTitle: "Site Owner, Limbe Commercial Plaza",
    quote:
      "Professional from day one. The milestone-based payment structure made budgeting straightforward and stress-free.",
    accentColor: "#14b8a6",
    sortOrder: 5,
  },
];

/** Builds initials from a client's full name, e.g. "Chikondi Banda" → "CB". */
export function getTestimonialInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
