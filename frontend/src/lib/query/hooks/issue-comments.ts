import type {
  IssueCommentCreateRequest,
  IssueCommentDeleteRequest,
  IssueCommentRecord,
  IssueCommentResponse,
  SuccessResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { apiClient } from "@/lib/server";

export function useIssueComments(issueId?: number | null) {
  return useQuery<IssueCommentResponse[]>({
    queryKey: queryKeys.issueComments.byIssue(issueId ?? 0),
    queryFn: async () => {
      const { data, error } = await apiClient.issueCommentsByIssue({
        query: { issueId: issueId ?? 0 },
      });
      if (error) throw new Error(error);
      return (data ?? []) as IssueCommentResponse[];
    },
    enabled: Boolean(issueId),
  });
}

export function useCreateIssueComment() {
  const queryClient = useQueryClient();

  return useMutation<IssueCommentRecord, Error, IssueCommentCreateRequest>({
    mutationKey: ["issue-comments", "create"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.issueCommentCreate({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to create comment");
      return data as IssueCommentRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issueComments.byIssue(variables.issueId),
      });
    },
  });
}

export function useDeleteIssueComment() {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, Error, IssueCommentDeleteRequest>({
    mutationKey: ["issue-comments", "delete"],
    mutationFn: async (input) => {
      const { data, error } = await apiClient.issueCommentDelete({ body: input });
      if (error) throw new Error(error);
      if (!data) throw new Error("failed to delete comment");
      return data as SuccessResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issueComments.all });
    },
  });
}
