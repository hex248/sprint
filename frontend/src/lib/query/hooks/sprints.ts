import type {
  SprintCloseRequest,
  SprintCloseResponse,
  SprintCreateRequest,
  SprintRecord,
  SprintUpdateRequest,
  SuccessResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export function useSprints(projectId?: number | null) {
  return useQuery<SprintRecord[]>({
    queryKey: queryKeys.sprints.byProject(projectId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.sprintsByProject({
        query: { projectId: projectId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as SprintRecord[];
    },
    enabled: Boolean(projectId),
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation<SprintRecord, Error, SprintCreateRequest>({
    mutationKey: ["sprints", "create"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.sprintCreate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create sprint");
      return data as SprintRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byProject(variables.projectId) });
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();

  return useMutation<SprintRecord, Error, SprintUpdateRequest>({
    mutationKey: ["sprints", "update"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.sprintUpdate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to update sprint");
      return data as SprintRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, number>({
    mutationKey: ["sprints", "delete"],
    mutationFn: async (sprintId) => {
      const { data, error } = await apiClient.sprintDelete({ body: { id: sprintId } });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to delete sprint");
      return data as SuccessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.all });
    },
  });
}

export function useCloseSprint() {
  const queryClient = useQueryClient();

  return useMutation<SprintCloseResponse, Error, SprintCloseRequest & { projectId: number }>({
    mutationKey: ["sprints", "close"],
    mutationFn: async ({ projectId: _projectId, ...input }) => {
      const { data, error } = await apiClient.sprintClose({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to close sprint");
      return data as SprintCloseResponse;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprints.byProject(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.byProject(variables.projectId) });
    },
  });
}
