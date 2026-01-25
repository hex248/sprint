import type {
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
import { issue } from "@/lib/server";

export function useIssues(projectId?: number | null) {
  return useQuery<IssueResponse[]>({
    queryKey: queryKeys.issues.byProject(projectId ?? 0),
    queryFn: () => issue.byProject(projectId ?? 0),
    enabled: Boolean(projectId),
  });
}

export function useIssueStatusCount(organisationId?: number | null, status?: string | null) {
  return useQuery<StatusCountResponse>({
    queryKey: queryKeys.issues.statusCount(organisationId ?? 0, status ?? ""),
    queryFn: () => issue.statusCount(organisationId ?? 0, status ?? ""),
    enabled: Boolean(organisationId && status),
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation<IssueRecord, Error, IssueCreateRequest>({
    mutationKey: ["issues", "create"],
    mutationFn: issue.create,
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
    mutationFn: issue.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, number>({
    mutationKey: ["issues", "delete"],
    mutationFn: issue.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

export function useReplaceIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, IssuesReplaceStatusRequest>({
    mutationKey: ["issues", "replace-status"],
    mutationFn: issue.replaceStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

export function useIssueTypeCount(organisationId?: number | null, type?: string | null) {
  return useQuery<TypeCountResponse>({
    queryKey: queryKeys.issues.typeCount(organisationId ?? 0, type ?? ""),
    queryFn: () => issue.typeCount(organisationId ?? 0, type ?? ""),
    enabled: Boolean(organisationId && type),
  });
}

export function useReplaceIssueType() {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, IssuesReplaceTypeRequest>({
    mutationKey: ["issues", "replace-type"],
    mutationFn: issue.replaceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}
