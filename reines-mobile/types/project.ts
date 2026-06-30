export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

import type { PaymentStatus, PaymentMethod } from "./payment";

export interface ProjectUser {
  id:    string;
  name:  string;
  email: string;
  image: string | null;
}

/** Progress update / milestone entry posted by the project manager. */
export interface ProjectUpdate {
  id:              string;
  note:            string;
  imageUrl:        string | null;
  documentUrl:     string | null;
  documentName:    string | null;
  documentType:    string | null;
  progressPercent: number | null;
  createdAt:       string;
  projectId:       string;
}

/** Payment attached to a project. */
export interface ProjectPayment {
  id:          string;
  txRef:       string;
  amount:      string;
  currency:    string;
  status:      PaymentStatus;
  method:      PaymentMethod;
  description: string | null;
  paidAt:      string | null;
  createdAt:   string;
}

/** Project summary as returned by GET /api/mobile/projects (list). */
export interface MobileProject {
  id:              string;
  title:           string;
  description:     string | null;
  status:          ProjectStatus;
  budget:          string | null;
  startDate:       string | null;
  endDate:         string | null;
  managerAccepted: boolean;
  createdAt:       string;
  updatedAt:       string;
  manager:         ProjectUser;
  client:          ProjectUser;
  updates: {
    id:              string;
    progressPercent: number | null;
    createdAt:       string;
    note:            string;
  }[];
  _count: {
    updates:  number;
    payments: number;
    messages: number;
  };
}

/** Payment summary totals embedded in project detail. */
export interface PaymentSummary {
  totalBudget:  string | null;
  paidTotal:    string;
  pendingTotal: string;
  paymentCount: number;
}

/** Full project detail as returned by GET /api/mobile/projects/:id. */
export interface MobileProjectDetail extends Omit<MobileProject, "updates" | "_count"> {
  updates:        ProjectUpdate[];
  payments:       ProjectPayment[];
  paymentSummary: PaymentSummary;
  latestProgress: number | null;
}

/** A ProjectUpdate that carries an image (returned by the gallery endpoint). */
export interface GalleryImage {
  id:              string;
  imageUrl:        string;        // guaranteed non-null in gallery responses
  note:            string;
  progressPercent: number | null;
  documentUrl:     string | null;
  documentName:    string | null;
  documentType:    string | null;
  projectId:       string;
  createdAt:       string;
}

/** Full gallery response returned by GET /api/mobile/projects/:id/gallery */
export interface GalleryResponse {
  projectTitle: string;
  withImages:   GalleryImage[];
  textOnly:     ProjectUpdate[];
  totalCount:   number;
}

// Legacy alias kept so existing imports don't break
/** @deprecated Use MobileProject */
export type Project = MobileProject;
