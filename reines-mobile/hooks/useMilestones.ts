import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/services/milestones.service";
import type {
  MilestonesResponse,
  CreateMilestoneValues,
  UpdateMilestoneValues,
  MilestoneStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Cache keys
// ---------------------------------------------------------------------------

export const MILESTONE_KEYS = {
  list: (projectId: string) => ["milestones", projectId] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useMilestones(projectId: string) {
  return useQuery<MilestonesResponse, Error>({
    queryKey: MILESTONE_KEYS.list(projectId),
    queryFn:  () => fetchMilestones(projectId),
    enabled:  !!projectId,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new milestone. Invalidates the list on success. */
export function useCreateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateMilestoneValues) =>
      createMilestone(projectId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
    },
  });
}

/** Update a milestone's fields (title, description, dueDate, status). */
export function useUpdateMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      values,
    }: {
      milestoneId: string;
      values: UpdateMilestoneValues;
    }) => updateMilestone(projectId, milestoneId, values),
    onMutate: async ({ milestoneId, values }) => {
      await qc.cancelQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
      const previous = qc.getQueryData<MilestonesResponse>(MILESTONE_KEYS.list(projectId));
      qc.setQueryData<MilestonesResponse>(
        MILESTONE_KEYS.list(projectId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            milestones: old.milestones.map((m) =>
              m.id === milestoneId ? { ...m, ...values } : m
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(MILESTONE_KEYS.list(projectId), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
    },
  });
}

/** Quick-toggle helper: marks a milestone COMPLETED or back to IN_PROGRESS. */
export function useToggleMilestone(projectId: string) {
  const updateMut = useUpdateMilestone(projectId);
  return {
    ...updateMut,
    toggle: (milestoneId: string, currentStatus: MilestoneStatus) => {
      const next: MilestoneStatus =
        currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
      return updateMut.mutateAsync({ milestoneId, values: { status: next } });
    },
  };
}

/** Delete a milestone with optimistic removal from the list. */
export function useDeleteMilestone(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      deleteMilestone(projectId, milestoneId),
    onMutate: async (milestoneId) => {
      await qc.cancelQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
      const previous = qc.getQueryData<MilestonesResponse>(MILESTONE_KEYS.list(projectId));
      qc.setQueryData<MilestonesResponse>(
        MILESTONE_KEYS.list(projectId),
        (old) => {
          if (!old) return old;
          const filtered = old.milestones.filter((m) => m.id !== milestoneId);
          const total     = filtered.length;
          const completed = filtered.filter((m) => m.status === "COMPLETED").length;
          const inProgress= filtered.filter((m) => m.status === "IN_PROGRESS").length;
          return {
            ...old,
            milestones: filtered,
            summary: {
              total,
              completed,
              inProgress,
              progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
            },
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(MILESTONE_KEYS.list(projectId), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: MILESTONE_KEYS.list(projectId) });
    },
  });
}
