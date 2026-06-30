import type { UserRole } from "@/models/user";

export interface AdminUser {
  id:        string;
  name:      string;
  email:     string;
  role:      UserRole;
  createdAt: string;
}

export interface AdminProject {
  id:           string;
  title:        string;
  description:  string;
  status:       string;
  budget:       number;
  clientId:     string;
  clientName:   string;
  managerId:    string;
  managerName:  string;
  managerAccepted:   boolean;
  managerAcceptedAt: string | null;
  startDate:    string | null;
  endDate:      string | null;
  createdAt:    string;
}

export interface AdminEnquiry {
  id:        string;
  name:      string;
  email:     string;
  phone:     string | null;
  subject:   string;
  message:   string;
  read:      boolean;
  createdAt: string;
}

// ─── Mock users ───────────────────────────────────────────────────────────────

export const MOCK_USERS: AdminUser[] = [
  { id: "adm_001",    name: "Blessings Mandala",  email: "blessings@reines.co.mw",     role: "ADMIN",           createdAt: "2026-01-01T00:00:00Z" },
  { id: "mgr_001",    name: "Samuel Phiri",        email: "s.phiri@reines.co.mw",       role: "PROJECT_MANAGER", createdAt: "2026-01-05T00:00:00Z" },
  { id: "mgr_002",    name: "Grace Banda",         email: "g.banda@reines.co.mw",       role: "PROJECT_MANAGER", createdAt: "2026-01-10T00:00:00Z" },
  { id: "client_001", name: "Reines Test Client",  email: "client@example.com",          role: "CLIENT",          createdAt: "2026-02-01T00:00:00Z" },
  { id: "client_002", name: "Thandiwe Mwale",      email: "t.mwale@example.com",         role: "CLIENT",          createdAt: "2026-02-14T00:00:00Z" },
  { id: "client_003", name: "James Chirwa",        email: "j.chirwa@example.com",        role: "CLIENT",          createdAt: "2026-03-01T00:00:00Z" },
];

// ─── Mock projects (admin view with names) ────────────────────────────────────

export const MOCK_ADMIN_PROJECTS: AdminProject[] = [
  {
    id: "proj_001", title: "Chichiri Residential Complex",
    description: "Construction of a 4-bedroom residential home with double garage and covered veranda.",
    status: "IN_PROGRESS", budget: 2_600_000,
    clientId: "client_001",  clientName: "Reines Test Client",
    managerId: "mgr_001",    managerName: "Samuel Phiri",
    managerAccepted: true, managerAcceptedAt: "2026-02-20T00:00:00Z",
    startDate: "2026-03-01", endDate: "2026-08-31", createdAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "proj_002", title: "Naperi Office Extension",
    description: "120 m² single-storey office wing addition to existing commercial building.",
    status: "PLANNING", budget: 980_000,
    clientId: "client_001",  clientName: "Reines Test Client",
    managerId: "mgr_002",    managerName: "Grace Banda",
    managerAccepted: false, managerAcceptedAt: null,
    startDate: "2026-06-01", endDate: "2026-09-30", createdAt: "2026-04-10T00:00:00Z",
  },
  {
    id: "proj_003", title: "Chilomoni Villa",
    description: "Premium 5-bedroom double-storey villa with pool and smart home integration.",
    status: "COMPLETED", budget: 4_500_000,
    clientId: "client_002",  clientName: "Thandiwe Mwale",
    managerId: "mgr_001",    managerName: "Samuel Phiri",
    managerAccepted: true, managerAcceptedAt: "2025-05-05T00:00:00Z",
    startDate: "2025-06-01", endDate: "2026-01-31", createdAt: "2025-05-01T00:00:00Z",
  },
  {
    id: "proj_004", title: "Zomba Mixed-Use Development",
    description: "Ground-floor commercial units with residential apartments above.",
    status: "PLANNING", budget: 7_200_000,
    clientId: "client_003",  clientName: "James Chirwa",
    managerId: "mgr_002",    managerName: "Grace Banda",
    managerAccepted: false, managerAcceptedAt: null,
    startDate: null, endDate: null, createdAt: "2026-04-20T00:00:00Z",
  },
];

// ─── Mock enquiries ───────────────────────────────────────────────────────────

export const MOCK_ENQUIRIES: AdminEnquiry[] = [
  {
    id: "enq_001", name: "Michael Tembo",  email: "m.tembo@gmail.com",   phone: "+265 991 000 111",
    subject: "Request a Quotation",
    message: "Good day, I would like a quotation for a 3-bedroom house in Blantyre. Plot is 600 sqm. Please get in touch.",
    read: false, createdAt: "2026-04-28T09:15:00Z",
  },
  {
    id: "enq_002", name: "Charity Nkhata", email: "c.nkhata@company.mw", phone: null,
    subject: "Concrete Products",
    message: "We need a bulk quote for concrete blocks and pavers for our warehouse project in Lilongwe. Approximately 10,000 blocks.",
    read: false, createdAt: "2026-04-27T14:30:00Z",
  },
  {
    id: "enq_003", name: "David Kalua",    email: "d.kalua@example.com", phone: "+265 882 555 777",
    subject: "General Enquiry",
    message: "Hello, I saw your website and I am interested in your property development services. Can we schedule a call?",
    read: true,  createdAt: "2026-04-25T11:00:00Z",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getClients():  AdminUser[] { return MOCK_USERS.filter((u) => u.role === "CLIENT"); }
export function getManagers(): AdminUser[] { return MOCK_USERS.filter((u) => u.role === "PROJECT_MANAGER" || u.role === "ADMIN"); }

export const ROLE_META: Record<string, { label: string; classes: string }> = {
  ADMIN:           { label: "Admin",           classes: "bg-blue-50    text-blue-700    border-blue-200"    },
  PROJECT_MANAGER: { label: "Project Manager", classes: "bg-blue-50   text-blue-700   border-blue-200"   },
  CLIENT:          { label: "Client",          classes: "bg-blue-50 text-blue-700 border-blue-200" },
};

export const STATUS_META: Record<string, { label: string; classes: string }> = {
  PLANNING:    { label: "Planning",    classes: "bg-blue-50  text-blue-700  border-blue-200"  },
  IN_PROGRESS: { label: "In Progress", classes: "bg-blue-50   text-blue-700   border-blue-200"   },
  ON_HOLD:     { label: "On Hold",     classes: "bg-zinc-50   text-zinc-600   border-zinc-200"   },
  COMPLETED:   { label: "Completed",   classes: "bg-blue-50 text-blue-700 border-blue-200" },
  CANCELLED:   { label: "Cancelled",   classes: "bg-blue-50    text-blue-700    border-blue-200"    },
};

export function fmtAdmin(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtMWK(n: number): string {
  return `MK ${n.toLocaleString("en-MW")}`;
}
