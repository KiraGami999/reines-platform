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

/** Updates a project's status (project manager / admin only). */
export async function updateProjectStatus(projectId: string, status: string): Promise<void> {
  await api.patch(`/api/projects/${projectId}`, { status });
}
