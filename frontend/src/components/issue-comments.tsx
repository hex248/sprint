import {
  ATTACHMENT_ALLOWED_IMAGE_TYPES,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_MAX_FILE_SIZE,
  type AttachmentRecord,
  type IssueCommentResponse,
} from "@sprint/shared";
import { type ChangeEvent, type ClipboardEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { extractImageUrls, InlineContent } from "@/components/inline-content";
import { useSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { BREATHING_ROOM } from "@/lib/layout";
import {
  useCreateIssueComment,
  useDeleteIssueComment,
  useIssueComments,
  useSelectedOrganisation,
  useUploadAttachment,
} from "@/lib/query/hooks";
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
  const selectedOrganisation = useSelectedOrganisation();
  const { data = [], isLoading } = useIssueComments(issueId);
  const createComment = useCreateIssueComment();
  const deleteComment = useDeleteIssueComment();
  const uploadAttachment = useUploadAttachment();

  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return [] as AttachmentRecord[];
    }

    if (!selectedOrganisation) {
      toast.error("Select an organisation first");
      return [] as AttachmentRecord[];
    }

    const remainingSlots = ATTACHMENT_MAX_COUNT - attachments.length;
    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${ATTACHMENT_MAX_COUNT} images`);
      return [] as AttachmentRecord[];
    }

    setUploadingAttachments(true);
    try {
      const uploaded: AttachmentRecord[] = [];
      for (const file of files.slice(0, remainingSlots)) {
        if (
          !ATTACHMENT_ALLOWED_IMAGE_TYPES.includes(
            file.type as (typeof ATTACHMENT_ALLOWED_IMAGE_TYPES)[number],
          )
        ) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (file.size > ATTACHMENT_MAX_FILE_SIZE) {
          toast.error(`File exceeds 5MB: ${file.name}`);
          continue;
        }

        const attachment = await uploadAttachment.mutateAsync({
          file,
          organisationId: selectedOrganisation.Organisation.id,
        });
        uploaded.push(attachment);
      }

      if (uploaded.length > 0) {
        setAttachments((previous) => [...previous, ...uploaded]);
      }
      return uploaded;
    } catch (error) {
      toast.error(`Error uploading attachment: ${parseError(error as Error)}`);
      return [] as AttachmentRecord[];
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleAttachmentSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await uploadFiles(files);
  };

  const handleCommentPaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file != null);

    if (imageFiles.length === 0) {
      return;
    }

    event.preventDefault();
    const uploaded = await uploadFiles(imageFiles);
    if (uploaded.length === 0) {
      return;
    }

    const urlsText = uploaded.map((attachment) => attachment.url).join("\n");
    setBody((previous) => {
      const prefix = previous.slice(0, selectionStart);
      const suffix = previous.slice(selectionEnd);
      const separator = prefix.length > 0 && !prefix.endsWith("\n") ? "\n" : "";
      const trailingSeparator = suffix.length > 0 && !suffix.startsWith("\n") ? "\n" : "";
      return `${prefix}${separator}${urlsText}${trailingSeparator}${suffix}`;
    });
  };

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
        attachmentIds: attachments.map((attachment) => attachment.id),
      });
      setBody("");
      setAttachments([]);
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
          onPaste={(event) => {
            void handleCommentPaste(event);
          }}
          placeholder="Leave a comment..."
          className="text-sm resize-none !bg-background"
          disabled={createComment.isPending}
        />
        <IconButton
          size="lg"
          onClick={handleSubmit}
          disabled={createComment.isPending || uploadingAttachments || body.trim() === ""}
          className="px-4"
          variant={"outline"}
        >
          <Icon icon="comment" size={24} color="" />
        </IconButton>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={handleAttachmentSelect}
          disabled={uploadingAttachments || attachments.length >= ATTACHMENT_MAX_COUNT}
          className="text-sm"
        />
        {attachments.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="border p-1 flex flex-col gap-1">
                <img src={attachment.url} alt="comment attachment" className="h-20 w-full object-cover" />
                <IconButton
                  onClick={() => {
                    setAttachments((previous) =>
                      previous.filter((existing) => existing.id !== attachment.id),
                    );
                  }}
                  title="Remove attachment"
                >
                  <Icon icon="x" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
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
            const inlineImageUrls = new Set(extractImageUrls(comment.Comment.body));
            const orphanAttachments = comment.Attachments.filter(
              (attachment) => !inlineImageUrls.has(attachment.url),
            );
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
                <InlineContent text={comment.Comment.body} className="pt-2" />
                {orphanAttachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {orphanAttachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-border/60 block"
                      >
                        <img
                          src={attachment.url}
                          alt="comment attachment"
                          className="h-20 w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
