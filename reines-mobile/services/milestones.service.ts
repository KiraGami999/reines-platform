import api from "@/lib/api";
import type {
  MilestonesResponse,
  MilestoneResponse,
  CreateMilestoneValues,
  UpdateMilestoneValues,
} from "@/types";

/** Fetch all milestones for a project (client + manager). */
export async function fetchMilestones(projectId: string): Promise<MilestonesResponse> {
  const res = await api.get<MilestonesResponse>(
    `/api/mobile/projects/${projectId}/milestones`
  );
  return res.data;
}

/** Create a new milestone (manager only). */
export async function createMilestone(
  projectId: string,
  values: CreateMilestoneValues
): Promise<MilestoneResponse> {
  const res = await api.post<MilestoneResponse>(
    `/api/mobile/projects/${projectId}/milestones`,
    {
      title:       values.title,
      description: values.description || null,
      dueDate:     values.dueDate || null,
    }
  );
  return res.data;
}

/** Partially update a milestone (manager only). */
export async function updateMilestone(
  projectId:   string,
  milestoneId: string,
  values:      UpdateMilestoneValues
): Promise<MilestoneResponse> {
  const res = await api.patch<MilestoneResponse>(
    `/api/mobile/projects/${projectId}/milestones/${milestoneId}`,
    values
  );
  return res.data;
}

/** Delete a milestone (manager only). */
export async function deleteMilestone(
  projectId:   string,
  milestoneId: string
): Promise<void> {
  await api.delete(
    `/api/mobile/projects/${projectId}/milestones/${milestoneId}`
  );
}
