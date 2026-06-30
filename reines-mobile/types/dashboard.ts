import type { ProjectStatus } from "./project";
import type { PaymentStatus, PaymentMethod } from "./payment";

export interface DashboardManager {
  id:    string;
  name:  string;
  email: string;
  image: string | null;
}

export interface DashboardProject {
  id:              string;
  title:           string;
  description:     string | null;
  status:          ProjectStatus;
  budget:          string | null;
  startDate:       string | null;
  endDate:         string | null;
  updatedAt:       string;
  manager:         DashboardManager;
  updates:         { id: string; note: string; progressPercent: number | null; createdAt: string }[];
}

export interface DashboardPayment {
  id:          string;
  txRef:       string;
  amount:      string;
  currency:    string;
  status:      PaymentStatus;
  method:      PaymentMethod;
  description: string | null;
  paidAt:      string | null;
  createdAt:   string;
  project:     { id: string; title: string };
}

export interface DashboardUpdate {
  id:              string;
  note:            string;
  imageUrl:        string | null;
  progressPercent: number | null;
  createdAt:       string;
  project:         { id: string; title: string };
}

export interface DashboardConversation {
  projectId:    string;
  projectTitle: string;
  manager:      { id: string; name: string; image: string | null };
  lastMessage:  {
    id:        string;
    message:   string;
    createdAt: string;
    sender:    { id: string; name: string; role: string };
  };
}

export interface ClientDashboardData {
  projects: {
    active:     DashboardProject[];
    totalCount: number;
  };
  payments: {
    pendingCount:  number;
    pendingAmount: string;
    recent:        DashboardPayment[];
  };
  loyalty: {
    balance:       number;
    lifetimeSpend: string;
    tier:          string;
  };
  updates:  DashboardUpdate[];
  messages: {
    recentCount:   number;
    conversations: DashboardConversation[];
  };
}
