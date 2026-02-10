import type { IssueCommentResponse } from "@sprint/shared";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { BREATHING_ROOM } from "@/lib/layout";
import { useCreateIssueComment, useDeleteIssueComment, useIssueComments } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

const formatTimestamp = (value?: string | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export function IssueComments({ issueId, className }: { issueId: number; className?: string }) {
  const { user } = useSession();
  const { data = [], isLoading } = useIssueComments(issueId);
  const createComment = useCreateIssueComment();
  const deleteComment = useDeleteIssueComment();

  const [body, setBody] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const sortedComments = useMemo(() => {
    return [...data].sort((a, b) => {
      const aDate = a.Comment.createdAt ? new Date(a.Comment.createdAt) : new Date(0);
      const bDate = b.Comment.createdAt ? new Date(b.Comment.createdAt) : new Date(0);
      return aDate.getTime() - bDate.getTime();
    });
  }, [data]);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;

    try {
      await createComment.mutateAsync({
        issueId,
        body: trimmed,
      });
      setBody("");
    } catch (error) {
      toast.error(`Error adding comment: ${parseError(error as Error)}`);
    }
  };

  const handleDelete = async (comment: IssueCommentResponse) => {
    setDeletingId(comment.Comment.id);
    try {
      await deleteComment.mutateAsync({ id: comment.Comment.id });
    } catch (error) {
      toast.error(`Error deleting comment: ${parseError(error as Error)}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-600">Comments</span>
        <span className="text-xs text-muted-foreground">{sortedComments.length}</span>
      </div>
      <div className={`flex gap-${BREATHING_ROOM}`}>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="Leave a comment..."
          className="text-sm resize-none !bg-background"
          disabled={createComment.isPending}
        />
        <IconButton
          size="lg"
          onClick={handleSubmit}
          disabled={createComment.isPending || body.trim() === ""}
          className="px-4"
          variant={"outline"}
        >
          <Icon icon="comment" size={24} color="" />
        </IconButton>
      </div>
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading comments...</div>
        ) : sortedComments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No comments yet.</div>
        ) : (
          sortedComments.map((comment) => {
            const isAuthor = user?.id === comment.Comment.userId;
            const timestamp = formatTimestamp(comment.Comment.createdAt);
            return (
              <div key={comment.Comment.id} className="border border-border/60 bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <SmallUserDisplay user={comment.User} className="text-sm" />
                    {timestamp ? (
                      <span className="text-[11px] text-muted-foreground">{timestamp}</span>
                    ) : null}
                  </div>
                  {isAuthor ? (
                    <IconButton
                      onClick={() => handleDelete(comment)}
                      disabled={deletingId === comment.Comment.id}
                      title="Delete comment"
                    >
                      <Icon icon="trash" color="var(--destructive)" />
                    </IconButton>
                  ) : null}
                </div>
                <p className="text-sm whitespace-pre-wrap pt-2">{comment.Comment.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
