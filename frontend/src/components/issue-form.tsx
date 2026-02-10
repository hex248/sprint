import {
  ATTACHMENT_ALLOWED_IMAGE_TYPES,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_MAX_FILE_SIZE,
  type AttachmentRecord,
  ISSUE_DESCRIPTION_MAX_LENGTH,
  ISSUE_TITLE_MAX_LENGTH,
} from "@sprint/shared";

import { type ChangeEvent, type ClipboardEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
// import { FreeTierLimit } from "@/components/free-tier-limit";
import { MultiAssigneeSelect } from "@/components/multi-assignee-select";
import { useAuthenticatedSession } from "@/components/session-provider";
import { SprintSelect } from "@/components/sprint-select";
import { StatusSelect } from "@/components/status-select";
import StatusTag from "@/components/status-tag";
import { TypeSelect } from "@/components/type-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import Icon, { type IconName } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateIssue,
  // useIssues,
  useOrganisationMembers,
  useSelectedOrganisation,
  useSelectedProject,
  useSprints,
  useUploadAttachment,
} from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn, issueID } from "@/lib/utils";

// const free_tier_issue_limit = 100;

export function IssueForm({ trigger }: { trigger?: React.ReactNode }) {
  const { user } = useAuthenticatedSession();
  const selectedOrganisation = useSelectedOrganisation();
  const selectedProject = useSelectedProject();
  const { data: sprints = [] } = useSprints(selectedProject?.Project.id);
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisation?.Organisation.id);
  // const { data: issues = [] } = useIssues(selectedProject?.Project.id);
  const createIssue = useCreateIssue();
  const uploadAttachment = useUploadAttachment();

  // const isPro = user.plan === "pro";
  // const issueCount = issues.length;
  // const isAtIssueLimit = !isPro && issueCount >= FREE_TIER_ISSUE_LIMIT;

  const members = useMemo(() => membersData.map((member) => member.User), [membersData]);
  const statuses = selectedOrganisation?.Organisation.statuses ?? {};
  const issueTypes = (selectedOrganisation?.Organisation.issueTypes ?? {}) as Record<
    string,
    { icon: string; color: string }
  >;
  const statusOptions = useMemo(() => Object.keys(statuses), [statuses]);
  const typeOptions = useMemo(() => Object.keys(issueTypes), [issueTypes]);
  const defaultStatus = statusOptions[0] ?? "";
  const defaultType = typeOptions[0] ?? "";

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sprintId, setSprintId] = useState<string>("unassigned");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(["unassigned"]);
  const [status, setStatus] = useState<string>(defaultStatus);
  const [type, setType] = useState<string>(defaultType);

  // set default assignee based on user preference when dialog opens
  useEffect(() => {
    if (open && user.preferences?.assignByDefault) {
      setAssigneeIds([`${user.id}`]);
    }
  }, [open, user]);

  useEffect(() => {
    if (!status && defaultStatus) setStatus(defaultStatus);
    if (!type && defaultType) setType(defaultType);
  }, [defaultStatus, defaultType, status, type]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setSprintId("unassigned");
    setAssigneeIds(["unassigned"]);
    setStatus(defaultStatus);
    setType(defaultType);
    setAttachments([]);
    setUploadingAttachments(false);
    setSubmitAttempted(false);
    setSubmitting(false);
    setError(null);
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) {
      return [] as AttachmentRecord[];
    }

    if (!selectedOrganisation) {
      setError("select an organisation first");
      return [] as AttachmentRecord[];
    }

    const remainingSlots = ATTACHMENT_MAX_COUNT - attachments.length;
    if (remainingSlots <= 0) {
      toast.error(`You can attach up to ${ATTACHMENT_MAX_COUNT} images`, { dismissible: false });
      return [] as AttachmentRecord[];
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingAttachments(true);

    try {
      const uploaded: AttachmentRecord[] = [];
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
          organisationId: selectedOrganisation.Organisation.id,
        });
        uploaded.push(attachment);
      }

      if (uploaded.length > 0) {
        setAttachments((previous) => [...previous, ...uploaded]);
      }
      return uploaded;
    } catch (err) {
      const message = parseError(err as Error);
      toast.error(`Error uploading attachment: ${message}`, { dismissible: false });
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

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (
      title.trim() === "" ||
      description.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH ||
      title.trim().length > ISSUE_TITLE_MAX_LENGTH
    ) {
      return;
    }

    if (!user.id) {
      setError("you must be logged in to create an issue");
      return;
    }

    if (!selectedProject) {
      setError("select a project first");
      return;
    }

    setSubmitting(true);

    try {
      const data = await createIssue.mutateAsync({
        projectId: selectedProject.Project.id,
        title,
        description,
        sprintId: sprintId === "unassigned" ? null : Number(sprintId),
        assigneeIds: assigneeIds.filter((id) => id !== "unassigned").map((id) => Number(id)),
        status: status.trim(),
        type: type.trim(),
        attachmentIds: attachments.map((attachment) => attachment.id),
      });
      setOpen(false);
      reset();
      toast.success(`Created ${issueID(selectedProject.Project.key, data.number)}`, {
        dismissible: false,
      });
    } catch (err) {
      const message = parseError(err as Error);
      setError(message);
      setSubmitting(false);
      toast.error(`Error creating issue: ${message}`, {
        dismissible: false,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            disabled={!selectedProject}
            title={!selectedProject ? "Select a project first" : undefined}
          >
            Create Issue
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className={cn("w-md", error && "border-destructive")}>
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
        </DialogHeader>

        {/* {!isPro && selectedProject && (
          <div className="mb-2">
            <FreeTierLimit
              current={issueCount}
              limit={FREE_TIER_ISSUE_LIMIT}
              itemName="issue"
              isPro={isPro}
              showUpgrade={isAtIssueLimit}
            />
          </div>
        )} */}

        <form onSubmit={handleSubmit}>
          <div className="grid">
            {(typeOptions.length > 0 || statusOptions.length > 0) && (
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {selectedOrganisation?.Organisation.features.issueTypes && typeOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label>Type</Label>
                    <TypeSelect
                      issueTypes={issueTypes}
                      value={type}
                      onChange={(newValue) => {
                        if (newValue.trim() === "") return;
                        setType(newValue);
                      }}
                      trigger={({ isOpen, value }) => {
                        const typeConfig = issueTypes[value];
                        return (
                          <SelectTrigger
                            className="group flex items-center w-min"
                            variant="unstyled"
                            chevronClassName="hidden"
                            isOpen={isOpen}
                          >
                            {typeConfig ? (
                              <Icon icon={typeConfig.icon as IconName} size={20} color={typeConfig.color} />
                            ) : (
                              <span className="text-xs text-muted-foreground">Type</span>
                            )}
                          </SelectTrigger>
                        );
                      }}
                    />
                  </div>
                )}
                {statusOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Label>Status</Label>
                    <StatusSelect
                      statuses={statuses}
                      value={status}
                      onChange={(newValue) => {
                        if (newValue.trim() === "") return;
                        setStatus(newValue);
                      }}
                      trigger={({ isOpen, value }) => (
                        <SelectTrigger
                          className="group flex items-center w-min"
                          variant="unstyled"
                          chevronClassName="hidden"
                          isOpen={isOpen}
                        >
                          <StatusTag status={value} colour={statuses[value]} className="hover:opacity-85" />
                        </SelectTrigger>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            <Field
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              validate={(value) =>
                value.trim() === ""
                  ? "Cannot be empty"
                  : value.trim().length > ISSUE_TITLE_MAX_LENGTH
                    ? `Too long (${ISSUE_TITLE_MAX_LENGTH} character limit)`
                    : undefined
              }
              submitAttempted={submitAttempted}
              placeholder="Demo Issue"
              maxLength={ISSUE_TITLE_MAX_LENGTH}
            />
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-end justify-between w-full">
                <Label htmlFor="issue-description" className="flex items-center text-sm">
                  Description (optional)
                </Label>
              </div>
              <Textarea
                id="issue-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onPaste={(event) => {
                  void handleDescriptionPaste(event);
                }}
                placeholder="Optional details"
                maxLength={ISSUE_DESCRIPTION_MAX_LENGTH}
              />
              <div className="flex items-end justify-end w-full text-xs mb-0 -mt-1">
                {description.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH ? (
                  <Label className="text-destructive text-sm">
                    {`Too long (${ISSUE_DESCRIPTION_MAX_LENGTH} character limit)`}
                  </Label>
                ) : (
                  <Label className="opacity-0 text-sm">a</Label>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <Label className="text-sm">Attachments (images only)</Label>
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
                      <img src={attachment.url} alt="attachment" className="h-20 w-full object-cover" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAttachments((previous) =>
                            previous.filter((existing) => existing.id !== attachment.id),
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sprints.length > 0 && (
              <div className="flex items-center gap-2 mt-0">
                <Label className="text-sm">Sprint</Label>
                <SprintSelect sprints={sprints} value={sprintId} onChange={setSprintId} />
              </div>
            )}

            {members.length > 0 && (
              <div className="flex items-start gap-2 mt-4">
                <Label className="text-sm pt-2">Assignees</Label>
                <MultiAssigneeSelect users={members} assigneeIds={assigneeIds} onChange={setAssigneeIds} />
              </div>
            )}

            <div className="flex items-end justify-end w-full text-xs -mb-2 -mt-2">
              {error ? (
                <Label className="text-destructive text-sm">{error}</Label>
              ) : (
                <Label className="opacity-0 text-sm">a</Label>
              )}
            </div>

            <div className="flex gap-2 w-full justify-end mt-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  uploadingAttachments ||
                  ((title.trim() === "" || title.trim().length > ISSUE_TITLE_MAX_LENGTH) &&
                    submitAttempted) ||
                  (description.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH && submitAttempted)
                }
              >
                {submitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
