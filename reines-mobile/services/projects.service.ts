import api from "@/lib/api";
import type { MobileProject, MobileProjectDetail } from "@/types";

/** Fetches all projects for the authenticated user (scoped by role on the server). */
export async function fetchProjects(): Promise<MobileProject[]> {
  const { data } = await api.get<{ projects: MobileProject[] }>("/api/mobile/projects");
  return data.projects;
}

/** Fetches a single project's full detail (includes updates, payments). */
export async function fetchProject(id: string): Promise<MobileProjectDetail> {
  const { data } = await api.get<{ project: MobileProjectDetail }>(`/api/mobile/projects/${id}`);
  return data.project;
}

/** Accept a project assignment (project manager only). */
export async function acceptProject(projectId: string): Promise<void> {
  await api.patch(`/api/mobile/projects/${projectId}/accept`);
}
