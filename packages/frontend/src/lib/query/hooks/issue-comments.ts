import type {
  IssueCommentCreateRequest,
  IssueCommentDeleteRequest,
  IssueCommentRecord,
  IssueCommentResponse,
  SuccessResponse,
} from "@sprint/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { issueComment } from "@/lib/server";

export function useIssueComments(issueId?: number | null) {
  return useQuery<IssueCommentResponse[]>({
    queryKey: queryKeys.issueComments.byIssue(issueId ?? 0),
    queryFn: () => issueComment.byIssue(issueId ?? 0),
    enabled: Boolean(issueId),
  });
}

export function useCreateIssueComment() {
  const queryClient = useQueryClient();

  return useMutation<IssueCommentRecord, Error, IssueCommentCreateRequest>({
    mutationKey: ["issue-comments", "create"],
    mutationFn: issueComment.create,
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
    mutationFn: issueComment.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issueComments.all });
    },
  });
}
