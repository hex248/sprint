import type {
  ProjectCreateRequest,
  ProjectRecord,
  ProjectResponse,
  ProjectUpdateRequest,
  SuccessResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export function useProjects(organisationId?: number | null) {
  return useQuery<ProjectResponse[]>({
    queryKey: queryKeys.projects.byOrganisation(organisationId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.projectsByOrganisation({
        query: { organisationId: organisationId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as ProjectResponse[];
    },
    enabled: Boolean(organisationId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectRecord, Error, ProjectCreateRequest>({
    mutationKey: ["projects", "create"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.projectCreate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create project");
      return data as ProjectRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.byOrganisation(variables.organisationId),
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<ProjectRecord, Error, ProjectUpdateRequest>({
    mutationKey: ["projects", "update"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.projectUpdate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to update project");
      return data as ProjectRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, number>({
    mutationKey: ["projects", "delete"],
    mutationFn: async (projectId) => {
      const { data, error } = await apiClient.projectDelete({ body: { id: projectId } });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to delete project");
      return data as SuccessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
