import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProjects, fetchProject, fetchGallery } from "@/services";
import type { MobileProject, MobileProjectDetail, GalleryResponse } from "@/types";

export const PROJECT_KEYS = {
  all:     ["projects"] as const,
  detail:  (id: string) => ["projects", id] as const,
  gallery: (id: string) => ["projects", id, "gallery"] as const,
};

/** Fetches all projects for the signed-in user. */
export function useProjects() {
  return useQuery<MobileProject[]>({
    queryKey:  PROJECT_KEYS.all,
    queryFn:   fetchProjects,
    staleTime: 30_000,
  });
}

/** Fetches a single project's full detail by ID. */
export function useProject(id: string) {
  return useQuery<MobileProjectDetail>({
    queryKey:  PROJECT_KEYS.detail(id),
    queryFn:   () => fetchProject(id),
    enabled:   !!id,
    staleTime: 30_000,
  });
}

/** Fetches the progress gallery (images + text updates) for a project. */
export function useGallery(projectId: string) {
  return useQuery<GalleryResponse>({
    queryKey:  PROJECT_KEYS.gallery(projectId),
    queryFn:   () => fetchGallery(projectId),
    enabled:   !!projectId,
    staleTime: 30_000,
  });
}

/** Invalidates the project list cache (call after a status change). */
export function useInvalidateProjects() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all });
}
