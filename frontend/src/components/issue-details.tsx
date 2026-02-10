import {
  ATTACHMENT_ALLOWED_IMAGE_TYPES,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_MAX_FILE_SIZE,
  type IssueResponse,
  type SprintRecord,
  type UserResponse,
} from "@sprint/shared";
import { type ClipboardEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { InlineContent } from "@/components/inline-content";
import { IssueComments } from "@/components/issue-comments";
import { MultiAssigneeSelect } from "@/components/multi-assignee-select";
import { useSession } from "@/components/session-provider";
import SmallSprintDisplay from "@/components/small-sprint-display";
import SmallUserDisplay from "@/components/small-user-display";
import { SprintSelect } from "@/components/sprint-select";
import { StatusSelect } from "@/components/status-select";
import StatusTag from "@/components/status-tag";
import { TimerControls } from "@/components/timer-controls";
import { getWorkTimeMs } from "@/components/timer-display";
import { TypeSelect } from "@/components/type-select";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Icon, { type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteIssue,
  useInactiveTimers,
  useSelectedOrganisation,
  useTimerState,
  useUpdateIssue,
  useUploadAttachment,
} from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn, issueID } from "@/lib/utils";

function assigneesToStringArray(assignees: { id: number }[]): string[] {
  if (assignees.length === 0) return ["unassigned"];
  return assignees.map((a) => a.id.toString());
}

function stringArrayToAssigneeIds(assigneeIds: string[]): number[] {
  return assigneeIds.filter((id) => id !== "unassigned").map((id) => Number(id));
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeAttachmentUrlFromDescription(text: string, url: string) {
  const regex = new RegExp(escapeRegex(url), "g");
  const next = text.replace(regex, "");
  return next
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+|[ \t]+$/gm, "");
}

export function IssueDetails({
  issueData,
  projectKey,
  sprints,
  members,
  statuses,
  onClose,
  onDelete,
  showHeader = true,
}: {
  issueData: IssueResponse;
  projectKey: string;
  sprints: SprintRecord[];
  members: UserResponse[];
  statuses: Record<string, string>;
  onClose: () => void;
  onDelete?: () => void;
  showHeader?: boolean;
}) {
  const { user } = useSession();
  const organisation = useSelectedOrganisation();
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const uploadAttachment = useUploadAttachment();
  const { data: timerState } = useTimerState(issueData.Issue.id, { refetchInterval: 10000 });
  const { data: inactiveTimers = [] } = useInactiveTimers(issueData.Issue.id, { refetchInterval: 10000 });
  const [timerTick, setTimerTick] = useState(0);

  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [sprintId, setSprintId] = useState<string>("unassigned");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const [description, setDescription] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [attachments, setAttachments] = useState<IssueResponse["Attachments"]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const previousIssueIdRef = useRef<number | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const issueTypes = (organisation?.Organisation.issueTypes ?? {}) as Record<
    string,
    { icon: string; color: string }
  >;

  const isAssignee = assigneeIds.some((id) => user?.id === Number(id));
  const actualAssigneeIds = assigneeIds.filter((id) => id !== "unassigned");
  const hasMultipleAssignees = actualAssigneeIds.length > 1;

  useEffect(() => {
    const issueChanged = previousIssueIdRef.current !== issueData.Issue.id;
    previousIssueIdRef.current = issueData.Issue.id;

    setSprintId(issueData.Issue.sprintId?.toString() ?? "unassigned");
    setAssigneeIds(assigneesToStringArray(issueData.Assignees));
    setStatus(issueData.Issue.status);
    setType(issueData.Issue.type);
    setTitle(issueData.Issue.title);
    setOriginalTitle(issueData.Issue.title);
    setAttachments(issueData.Attachments);

    if (issueChanged) {
      setDescription(issueData.Issue.description);
      setOriginalDescription(issueData.Issue.description);
      setIsEditingDescription(false);
      return;
    }

    if (!isEditingDescription && !isSavingDescription && !uploadingAttachments) {
      setDescription(issueData.Issue.description);
      setOriginalDescription(issueData.Issue.description);
    }
  }, [issueData, isEditingDescription, isSavingDescription, uploadingAttachments]);

  useEffect(() => {
    if (!timerState?.isRunning) return;

    const interval = window.setInterval(() => {
      setTimerTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerState?.isRunning]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  void timerTick;

  const inactiveWorkTimeMs = inactiveTimers.reduce(
    (total, session) => total + getWorkTimeMs(session?.timestamps),
    0,
  );
  const currentWorkTimeMs = getWorkTimeMs(timerState?.timestamps);
  const totalWorkTimeMs = inactiveWorkTimeMs + currentWorkTimeMs;

  const handleSprintChange = async (value: string) => {
    setSprintId(value);
    const newSprintId = value === "unassigned" ? null : Number(value);

    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        sprintId: newSprintId,
      });
      toast.success(
        <>
          Successfully updated sprint to{" "}
          {value === "unassigned" ? (
            "Unassigned"
          ) : (
            <SmallSprintDisplay sprint={sprints.find((s) => s.id === newSprintId)} />
          )}{" "}
          for {issueID(projectKey, issueData.Issue.number)}
        </>,
        {
          dismissible: false,
        },
      );
    } catch (error) {
      console.error("error updating sprint:", error);
      setSprintId(issueData.Issue.sprintId?.toString() ?? "unassigned");
      toast.error(
        <>
          Error updating sprint to{" "}
          {value === "unassigned" ? (
            "Unassigned"
          ) : (
            <SmallSprintDisplay sprint={sprints.find((s) => s.id === newSprintId)} />
          )}{" "}
          for {issueID(projectKey, issueData.Issue.number)}
        </>,
        {
          dismissible: false,
        },
      );
    }
  };

  const handleAssigneeChange = async (newAssigneeIds: string[]) => {
    const previousAssigneeIds = assigneeIds;
    setAssigneeIds(newAssigneeIds);

    const newAssigneeIdNumbers = stringArrayToAssigneeIds(newAssigneeIds);
    const previousAssigneeIdNumbers = stringArrayToAssigneeIds(previousAssigneeIds);

    const hasChanged =
      newAssigneeIdNumbers.length !== previousAssigneeIdNumbers.length ||
      !newAssigneeIdNumbers.every((id) => previousAssigneeIdNumbers.includes(id));

    if (!hasChanged) {
      return;
    }

    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        assigneeIds: newAssigneeIdNumbers,
      });
      const assignedUsers = members.filter((member) => newAssigneeIdNumbers.includes(member.id));
      const displayText =
        assignedUsers.length === 0
          ? "Unassigned"
          : assignedUsers.length === 1
            ? assignedUsers[0].name
            : `${assignedUsers.length} assignees`;
      toast.success(
        <div className={"flex items-center gap-2"}>
          Updated assignees to {displayText} for {issueID(projectKey, issueData.Issue.number)}
        </div>,
        {
          dismissible: false,
        },
      );
    } catch (error) {
      console.error("error updating assignees:", error);
      setAssigneeIds(previousAssigneeIds);
      toast.error(`Error updating assignees: ${parseError(error as Error)}`, {
        dismissible: false,
      });
    }
  };

  const handleStatusChange = async (value: string) => {
    setStatus(value);

    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        status: value,
      });
      toast.success(
        <>
          {issueID(projectKey, issueData.Issue.number)}'s status updated to{" "}
          <StatusTag status={value} colour={statuses[value]} />
        </>,
        { dismissible: false },
      );
    } catch (error) {
      console.error("error updating status:", error);
      setStatus(issueData.Issue.status);
      toast.error(`Error updating status: ${parseError(error as Error)}`, {
        dismissible: false,
      });
    }
  };

  const handleTypeChange = async (value: string) => {
    setType(value);
    const typeConfig = issueTypes[value];

    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        type: value,
      });
      toast.success(
        <span className="inline-flex items-center gap-1.5">
          {issueID(projectKey, issueData.Issue.number)}'s type updated to{" "}
          {typeConfig ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon={typeConfig.icon as IconName} size={16} color={typeConfig.color} />
              {value}
            </span>
          ) : (
            value
          )}
        </span>,
        { dismissible: false },
      );
    } catch (error) {
      console.error("error updating type:", error);
      setType(issueData.Issue.type);
      toast.error(`Error updating type: ${parseError(error as Error)}`, {
        dismissible: false,
      });
    }
  };

  const handleDelete = () => {
    setDeleteOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("modal", "true");
      await navigator.clipboard.writeText(url.toString());
      setLinkCopied(true);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setLinkCopied(false);
        copyTimeoutRef.current = null;
      }, 1500);
    } catch (error) {
      console.error("error copying issue link:", error);
    }
  };

  const handleTitleSave = async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "" || trimmedTitle === originalTitle) {
      setTitle(originalTitle);
      return;
    }

    setIsSavingTitle(true);
    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        title: trimmedTitle,
      });
      setOriginalTitle(trimmedTitle);
      toast.success(`${issueID(projectKey, issueData.Issue.number)} Title updated`);
    } catch (error) {
      console.error("error updating title:", error);
      setTitle(originalTitle);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDescriptionSave = async () => {
    const trimmedDescription = description.trim();
    if (trimmedDescription === originalDescription) {
      setIsEditingDescription(false);
      return;
    }

    setIsSavingDescription(true);
    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        description: trimmedDescription,
      });
      setOriginalDescription(trimmedDescription);
      setDescription(trimmedDescription);
      toast.success(`${issueID(projectKey, issueData.Issue.number)} Description updated`);
      setIsEditingDescription(false);
    } catch (error) {
      console.error("error updating description:", error);
      setDescription(originalDescription);
    } finally {
      setIsSavingDescription(false);
    }
  };

  const persistAttachmentIds = async (nextAttachments: IssueResponse["Attachments"]) => {
    await updateIssue.mutateAsync({
      id: issueData.Issue.id,
      attachmentIds: nextAttachments.map((attachment) => attachment.id),
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return [] as IssueResponse["Attachments"];
    }

    if (!organisation) {
      toast.error("Select an organisation first", { dismissible: false });
      return [] as IssueResponse["Attachments"];
    }

    const remainingSlots = ATTACHMENT_MAX_COUNT - attachments.length;
    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${ATTACHMENT_MAX_COUNT} images`, { dismissible: false });
      return [] as IssueResponse["Attachments"];
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingAttachments(true);
    try {
      const uploaded: IssueResponse["Attachments"] = [];
      for (const file of filesToUpload) {
        if (
          !ATTACHMENT_ALLOWED_IMAGE_TYPES.includes(
            file.type as (typeof ATTACHMENT_ALLOWED_IMAGE_TYPES)[number],
          )
        ) {
          toast.error(`Unsupported file type: ${file.name}`, { dismissible: false });
          continue;
        }
        if (file.size > ATTACHMENT_MAX_FILE_SIZE) {
          toast.error(`File exceeds 5MB: ${file.name}`, { dismissible: false });
          continue;
        }

        const attachment = await uploadAttachment.mutateAsync({
          file,
          organisationId: organisation.Organisation.id,
        });
        uploaded.push(attachment as IssueResponse["Attachments"][number]);
      }

      if (uploaded.length > 0) {
        const nextAttachments = [...attachments, ...uploaded];
        setAttachments(nextAttachments);
        await persistAttachmentIds(nextAttachments);
      }
      return uploaded;
    } catch (error) {
      toast.error(`Error uploading attachment: ${parseError(error as Error)}`, {
        dismissible: false,
      });
      return [] as IssueResponse["Attachments"];
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleDescriptionPaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
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
    setDescription((previous) => {
      const prefix = previous.slice(0, selectionStart);
      const suffix = previous.slice(selectionEnd);
      const separator = prefix.length > 0 && !prefix.endsWith("\n") ? "\n" : "";
      const trailingSeparator = suffix.length > 0 && !suffix.startsWith("\n") ? "\n" : "";
      return `${prefix}${separator}${urlsText}${trailingSeparator}${suffix}`;
    });
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    const previous = attachments;
    const next = previous.filter((attachment) => attachment.id !== attachmentId);
    const removed = previous.find((attachment) => attachment.id === attachmentId);
    const previousDescription = description;
    const nextDescription = removed
      ? removeAttachmentUrlFromDescription(previousDescription, removed.url)
      : previousDescription;

    setAttachments(next);
    setDescription(nextDescription);

    try {
      await updateIssue.mutateAsync({
        id: issueData.Issue.id,
        attachmentIds: next.map((attachment) => attachment.id),
        description: nextDescription,
      });
      setOriginalDescription(nextDescription);
    } catch (error) {
      setAttachments(previous);
      setDescription(previousDescription);
      toast.error(`Error removing attachment: ${parseError(error as Error)}`, {
        dismissible: false,
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteIssue.mutateAsync(issueData.Issue.id);
      onDelete?.();
      toast.success(`Deleted issue ${issueID(projectKey, issueData.Issue.number)}`, {
        dismissible: false,
      });
    } catch (error) {
      console.error(`error deleting issue ${issueID(projectKey, issueData.Issue.number)}`, error);
      toast.error(
        `Error deleting issue ${issueID(projectKey, issueData.Issue.number)}: ${parseError(error as Error)}`,
        {
          dismissible: false,
        },
      );
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <div className="flex flex-col">
      {showHeader && (
        <div className="flex flex-row items-center justify-end border-b h-[25px]">
          <span className="w-full">
            <p className="text-sm w-fit px-1 font-700">{issueID(projectKey, issueData.Issue.number)}</p>
          </span>
          <div className="flex items-center">
            <IconButton onClick={handleCopyLink} title={linkCopied ? "Copied" : "Copy link"}>
              {linkCopied ? <Icon icon="check" /> : <Icon icon="link" />}
            </IconButton>
            <IconButton variant="destructive" onClick={handleDelete} title={"Delete issue"}>
              <Icon icon="trash" color="var(--destructive)" />
            </IconButton>
            <IconButton onClick={onClose} title={"Close"}>
              <Icon icon="x" />
            </IconButton>
          </div>
        </div>
      )}

      <div className="flex flex-col w-full p-2 py-2 gap-2 max-h-[75vh] overflow-y-auto">
        <div className="flex gap-2">
          {organisation?.Organisation.features.issueTypes && Object.keys(issueTypes).length > 0 && (
            <TypeSelect
              issueTypes={issueTypes}
              value={type}
              onChange={handleTypeChange}
              trigger={({ isOpen, value }) => {
                const typeConfig = issueTypes[value];
                return (
                  <SelectTrigger
                    className="group w-auto flex items-center"
                    variant="unstyled"
                    chevronClassName="hidden"
                    isOpen={isOpen}
                  >
                    {typeConfig ? (
                      <Icon icon={typeConfig.icon as IconName} size={18} color={typeConfig.color} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Type</span>
                    )}
                  </SelectTrigger>
                );
              }}
            />
          )}
          {organisation?.Organisation.features.issueStatus && (
            <StatusSelect
              statuses={statuses}
              value={status}
              onChange={handleStatusChange}
              trigger={({ isOpen, value }) => (
                <SelectTrigger
                  className="group w-auto flex items-center"
                  variant="unstyled"
                  chevronClassName="hidden"
                  isOpen={isOpen}
                >
                  <StatusTag status={value} colour={statuses[value]} className="hover:opacity-85" />
                </SelectTrigger>
              )}
            />
          )}
          <div className="flex w-full items-center min-w-0">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                } else if (event.key === "Escape") {
                  setTitle(originalTitle);
                  event.currentTarget.blur();
                }
              }}
              disabled={isSavingTitle}
              className={cn(
                "w-full border-0 border-b-1 border-b-input/50",
                "hover:border-b-input focus:border-b-input h-auto",
              )}
              inputClassName={cn("bg-background px-1.5 font-600")}
            />
          </div>
        </div>
        {organisation?.Organisation.features.issueDescriptions &&
          (isEditingDescription ? (
            <div className="flex flex-col gap-2">
              <Textarea
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onBlur={handleDescriptionSave}
                onPaste={(event) => {
                  void handleDescriptionPaste(event);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" || (event.ctrlKey && event.key === "Enter")) {
                    setDescription(originalDescription);
                    setIsEditingDescription(false);
                    event.currentTarget.blur();
                  }
                }}
                placeholder="Add a description..."
                disabled={isSavingDescription}
                className="text-sm border-input/50 hover:border-input focus:border-input resize-none !bg-background min-h-fit"
              />
            </div>
          ) : description ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="border border-border/60 p-2 cursor-text text-left"
                onClick={() => {
                  setIsEditingDescription(true);
                  setTimeout(() => descriptionRef.current?.focus(), 0);
                }}
              >
                <InlineContent text={description} linkify={false} />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground justify-start px-2"
              onClick={() => {
                setIsEditingDescription(true);
                setTimeout(() => descriptionRef.current?.focus(), 0);
              }}
            >
              Add description
            </Button>
          ))}

        <div className="flex flex-col gap-2">
          <span className="text-sm">Attachments</span>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="border border-border/60 p-1 flex flex-col gap-1">
                  <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
                    <img src={attachment.url} alt="issue attachment" className="h-24 w-full object-cover" />
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleRemoveAttachment(attachment.id);
                    }}
                    disabled={uploadingAttachments || updateIssue.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {organisation?.Organisation.features.sprints && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Sprint:</span>
            <SprintSelect sprints={sprints} value={sprintId} onChange={handleSprintChange} />
          </div>
        )}

        {organisation?.Organisation.features.issueAssignees && (
          <div className="flex items-start gap-2">
            <span className="text-sm pt-2">Assignees:</span>
            <MultiAssigneeSelect
              users={members}
              assigneeIds={assigneeIds}
              onChange={handleAssigneeChange}
              fallbackUsers={issueData.Assignees}
            />
          </div>
        )}

        {organisation?.Organisation.features.issueCreator && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Created by:</span>
            <SmallUserDisplay user={issueData.Creator} className={"text-sm"} />
          </div>
        )}

        {organisation?.Organisation.features.issueTimeTracking && isAssignee && (
          <div className={cn("flex flex-col gap-2", hasMultipleAssignees && "cursor-not-allowed")}>
            <TimerControls
              issueId={issueData.Issue.id}
              // biome-ignore lint/complexity/noUselessFragments: <needed to represent absence>
              issueKey={<></>}
              timestamps={timerState?.timestamps}
              isRunning={timerState?.isRunning}
              totalTimeMs={totalWorkTimeMs}
              disabled={hasMultipleAssignees}
              size="sm"
              className="self-start w-fit border bg-background/95 pl-0 pr-1 py-1"
            />
            {hasMultipleAssignees && (
              <span className="text-xs text-destructive/85 font-600">
                Timers cannot be used on issues with multiple assignees
              </span>
            )}
          </div>
        )}

        {organisation?.Organisation.features.issueComments && (
          <IssueComments issueId={issueData.Issue.id} className="pt-2" />
        )}

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={handleConfirmDelete}
          title="Delete issue"
          message="This will permanently delete the issue."
          processingText="Deleting..."
          confirmText="Delete"
          variant="destructive"
        />
      </div>
    </div>
  );
}
