import type {
  IssueByIdQuery,
  IssueCreateRequest,
  IssueRecord,
  IssueResponse,
  IssuesReplaceStatusRequest,
  IssuesReplaceTypeRequest,
  IssueUpdateRequest,
  StatusCountResponse,
  SuccessResponse,
  TypeCountResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export function useIssues(projectId?: number | null) {
  return useQuery<IssueResponse[]>({
    queryKey: queryKeys.issues.byProject(projectId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.issuesByProject({
        query: { projectId: projectId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as IssueResponse[];
    },
    enabled: Boolean(projectId),
  });
}

export function useIssueById(issueId?: IssueByIdQuery["issueId"] | null) {
  return useQuery<IssueResponse>({
    queryKey: queryKeys.issues.byId(issueId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.issueById({
        query: { issueId: issueId ?? 0 },
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("issue not found");
      return data as IssueResponse;
    },
    enabled: Boolean(issueId),
  });
}

export function useIssueStatusCount(organisationId?: number | null, status?: string | null) {
  return useQuery<StatusCountResponse>({
    queryKey: queryKeys.issues.statusCount(organisationId ?? 0, status ?? ""),
    queryFn: async () => {
      const { data, error } = await apiClient.issuesStatusCount({
        query: { organisationId: organisationId ?? 0, status: status ?? "" },
      });
      if (error) throw new Error(error);
      return (data ?? []) as StatusCountResponse;
    },
    enabled: Boolean(organisationId && status),
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation<IssueRecord, Error, IssueCreateRequest>({
    mutationKey: ["issues", "create"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.issueCreate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create issue");
      return data as IssueRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.byProject(variables.projectId),
      });
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation<IssueRecord, Error, IssueUpdateRequest>({
    mutationKey: ["issues", "update"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.issueUpdate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to update issue");
      return data as IssueRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, number>({
    mutationKey: ["issues", "delete"],
    mutationFn: async (issueId) => {
      const { data, error } = await apiClient.issueDelete({ body: { id: issueId } });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to delete issue");
      return data as SuccessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

export function useReplaceIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, IssuesReplaceStatusRequest>({
    mutationKey: ["issues", "replace-status"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.issuesReplaceStatus({ body: input });
      if (error) throw new Error(error);
      return data as unknown;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

export function useIssueTypeCount(organisationId?: number | null, type?: string | null) {
  return useQuery<TypeCountResponse>({
    queryKey: queryKeys.issues.typeCount(organisationId ?? 0, type ?? ""),
    queryFn: async () => {
      const { data, error } = await apiClient.issuesTypeCount({
        query: { organisationId: organisationId ?? 0, type: type ?? "" },
      });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to get type count");
      return data as TypeCountResponse;
    },
    enabled: Boolean(organisationId && type),
  });
}

export function useReplaceIssueType() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, IssuesReplaceTypeRequest>({
    mutationKey: ["issues", "replace-type"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.issuesReplaceType({ body: input });
      if (error) throw new Error(error);
      return data as unknown;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}
