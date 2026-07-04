/**
 * Typed mock data — matches the Prisma schema exactly.
 * Replace the `getMockProjects` / `getMockProjectById` calls with real
 * Prisma queries once DATABASE_URL is set and `prisma migrate dev` has run.
 */

import type { Project } from "@/models/project";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_001",
    title: "Chichiri Residential Complex",
    description:
      "Construction of a 4-bedroom residential home featuring an open-plan living and dining area, double garage, covered veranda, and landscaped garden. The build will use face-brick exterior finishing with aluminium windows and a trussed timber roof.",
    status: "IN_PROGRESS",
    clientId: "client_001",
    managerId: "mgr_001",
    manager: { id: "mgr_001", name: "Samuel Phiri", email: "s.phiri@reines.co.mw" },
    managerAccepted: true,
    managerAcceptedAt: "2026-02-20T00:00:00Z",
    budget: 2_600_000,
    budgetBreakdown: [
      { label: "30% Commencement Deposit", amount: 780_000,   paid: true  },
      { label: "40% Mid-Phase Milestone",  amount: 1_040_000, paid: false },
      { label: "30% Final Completion",     amount: 780_000,   paid: false },
    ],
    startDate:  "2026-03-01",
    endDate:    "2026-08-31",
    completionPercent: 42,
    phases: [
      { label: "Design & Technical Setup",    weeks: "Weeks 1–2",  description: "Architectural drawings approved, soil test completed, materials procurement plan finalised.", status: "DONE"     },
      { label: "Foundation & Substructure",   weeks: "Weeks 3–5",  description: "Strip footings excavated and cast, damp-proof membrane laid, brick-to-DPC complete.",                   status: "DONE"     },
      { label: "Superstructure",              weeks: "Weeks 6–9",  description: "Walling to wall plate, ring beam cast, window and door frames positioned.",                              status: "ACTIVE"   },
      { label: "Roof & External Finishes",    weeks: "Weeks 10–13",description: "Roof truss erection, roofing sheets fixed, external plaster and face-brick pointing.",                  status: "UPCOMING" },
      { label: "Internal Finishes & MEP",     weeks: "Weeks 14–17",description: "Internal plaster, floor screeds, plumbing, electrical first fix, tiling.",                             status: "UPCOMING" },
      { label: "Handover & Snagging",         weeks: "Weeks 18–20",description: "Painting, joinery, landscaping, snagging list resolved, keys handed over.",                            status: "UPCOMING" },
    ],
    updates: [
      {
        id: "upd_004",
        note: "Ring beam concrete poured and cured. Scaffolding in place for second-floor block-work. Progress on schedule.",
        imageUrl: "__placeholder__:from-blue-900 to-blue-700",
        documentUrl: null,
        documentName: null,
        documentType: null,
        progressPercent: 42,
        batchId: null,
        createdAt: "2026-04-28T10:00:00Z",
      },
      {
        id: "upd_003",
        note: "Walling to first-floor sill level complete. Window frames positioned and braced. Electrical conduit first-fix sleeves placed in walls.",
        imageUrl: "__placeholder__:from-stone-700 to-stone-500",
        documentUrl: null,
        documentName: null,
        documentType: null,
        progressPercent: 34,
        batchId: null,
        createdAt: "2026-04-14T08:30:00Z",
      },
      {
        id: "upd_002",
        note: "Foundation complete and damp-proof course laid. Brickwork to DPC started. Site is well secured and materials are on site.",
        imageUrl: "__placeholder__:from-blue-800 to-blue-600",
        documentUrl: null,
        documentName: null,
        documentType: null,
        progressPercent: 18,
        batchId: null,
        createdAt: "2026-04-01T08:30:00Z",
      },
      {
        id: "upd_001",
        note: "Project kicked off. Design drawings signed off by client. Pegging complete and excavation for strip footings underway.",
        imageUrl: "__placeholder__:from-blue-900 to-blue-700",
        documentUrl: null,
        documentName: null,
        documentType: null,
        progressPercent: 5,
        batchId: null,
        createdAt: "2026-03-01T09:00:00Z",
      },
    ],
    createdAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "proj_002",
    title: "Naperi Office Extension",
    description:
      "Addition of a 120 m² single-storey office wing to an existing commercial building, including two private offices, an open-plan workstation area, a kitchenette, and accessible ablutions. Work is to be carried out with minimal disruption to ongoing operations.",
    status: "PLANNING",
    clientId: "client_001",
    managerId: "mgr_002",
    manager: { id: "mgr_002", name: "Grace Banda", email: "g.banda@reines.co.mw" },
    managerAccepted: false,
    managerAcceptedAt: null,
    budget: 980_000,
    budgetBreakdown: [
      { label: "30% Commencement Deposit", amount: 294_000, paid: false },
      { label: "40% Mid-Phase Milestone",  amount: 392_000, paid: false },
      { label: "30% Final Completion",     amount: 294_000, paid: false },
    ],
    startDate:  "2026-06-01",
    endDate:    "2026-09-30",
    completionPercent: 0,
    phases: [
      { label: "Design & Approvals",   weeks: "Weeks 1–2",  description: "Structural drawings, planning submission, client sign-off on materials schedule.",          status: "UPCOMING" },
      { label: "Groundworks",          weeks: "Weeks 3–5",  description: "Excavation, foundations, and tie-in to existing structure.",                               status: "UPCOMING" },
      { label: "Superstructure",       weeks: "Weeks 6–9",  description: "Block-work walls, door/window frames, ring beam.",                                         status: "UPCOMING" },
      { label: "Roof & Weatherproofing",weeks: "Weeks 10–12",description: "Roof structure and sheeting, gutters, fascia, and waterproofing.",                       status: "UPCOMING" },
      { label: "Finishes & Services",  weeks: "Weeks 13–16",description: "Internal plaster, electrical, plumbing, tiling, painting, furniture installation.",       status: "UPCOMING" },
    ],
    updates: [],
    createdAt: "2026-04-10T00:00:00Z",
  },
];

/** Returns all projects for a given clientId. */
export function getMockProjects(clientId: string): Project[] {
  return MOCK_PROJECTS.filter((p) => p.clientId === clientId && p.managerAccepted);
}

/** Returns a single project by id, scoped to a clientId for security. */
export function getMockProjectById(id: string, clientId: string): Project | null {
  return MOCK_PROJECTS.find((p) => p.id === id && p.clientId === clientId && p.managerAccepted) ?? null;
}

// Status display helpers
export const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  PLANNING:    { label: "Planning",    classes: "bg-blue-50  text-blue-700  border-blue-200",  dot: "bg-blue-400"  },
  IN_PROGRESS: { label: "In Progress", classes: "bg-blue-50   text-blue-700   border-blue-200",   dot: "bg-blue-400"   },
  ON_HOLD:     { label: "On Hold",     classes: "bg-zinc-50   text-zinc-600   border-zinc-200",   dot: "bg-zinc-400"   },
  COMPLETED:   { label: "Completed",   classes: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  CANCELLED:   { label: "Cancelled",   classes: "bg-blue-50    text-blue-700    border-blue-200",    dot: "bg-blue-400"    },
};

export const PHASE_CONFIG = {
  DONE:     { label: "Complete", bar: "bg-blue-500", ring: "border-blue-500 bg-blue-500", text: "text-blue-700" },
  ACTIVE:   { label: "Active",   bar: "bg-[#8fb9e8]",   ring: "border-[#8fb9e8]   bg-[#8fb9e8]",   text: "text-[#8fb9e8]"   },
  UPCOMING: { label: "Upcoming", bar: "bg-zinc-200",    ring: "border-zinc-300    bg-white",        text: "text-zinc-400"    },
};

/** Format MWK currency. */
export function fmtMWK(amount: number): string {
  return `MK ${amount.toLocaleString("en-MW")}`;
}

/** Format ISO date string to readable form. */
export function fmtDate(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Days between two ISO date strings (positive = days remaining). */
export function daysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
