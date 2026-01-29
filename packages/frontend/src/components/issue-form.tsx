import { ISSUE_DESCRIPTION_MAX_LENGTH, ISSUE_TITLE_MAX_LENGTH } from "@sprint/shared";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FreeTierLimit } from "@/components/free-tier-limit";
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
import {
  useCreateIssue,
  useIssues,
  useOrganisationMembers,
  useSelectedOrganisation,
  useSelectedProject,
  useSprints,
} from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn, issueID } from "@/lib/utils";

const FREE_TIER_ISSUE_LIMIT = 100;

export function IssueForm({ trigger }: { trigger?: React.ReactNode }) {
  const { user } = useAuthenticatedSession();
  const selectedOrganisation = useSelectedOrganisation();
  const selectedProject = useSelectedProject();
  const { data: sprints = [] } = useSprints(selectedProject?.Project.id);
  const { data: membersData = [] } = useOrganisationMembers(selectedOrganisation?.Organisation.id);
  const { data: issues = [] } = useIssues(selectedProject?.Project.id);
  const createIssue = useCreateIssue();

  const isPro = user.plan === "pro";
  const issueCount = issues.length;
  const isAtIssueLimit = !isPro && issueCount >= FREE_TIER_ISSUE_LIMIT;

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
  useEffect(() => {
    if (!status && defaultStatus) setStatus(defaultStatus);
    if (!type && defaultType) setType(defaultType);
  }, [defaultStatus, defaultType, status, type]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setSprintId("unassigned");
    setAssigneeIds(["unassigned"]);
    setStatus(defaultStatus);
    setType(defaultType);
    setSubmitAttempted(false);
    setSubmitting(false);
    setError(null);
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
        status: status.trim() === "" ? undefined : status,
        type: type.trim() === "" ? undefined : type,
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
            disabled={!selectedProject || isAtIssueLimit}
            title={
              isAtIssueLimit
                ? "Free tier limited to 100 issues per organisation. Upgrade to Pro for unlimited."
                : !selectedProject
                  ? "Select a project first"
                  : undefined
            }
          >
            Create Issue
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className={cn("w-md", error && "border-destructive")}>
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
        </DialogHeader>

        {!isPro && selectedProject && (
          <div className="mb-2">
            <FreeTierLimit
              current={issueCount}
              limit={FREE_TIER_ISSUE_LIMIT}
              itemName="issue"
              isPro={isPro}
              showUpgrade={isAtIssueLimit}
            />
          </div>
        )}

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
            <Field
              label="Description (optional)"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              validate={(value) =>
                value.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH
                  ? `Too long (${ISSUE_DESCRIPTION_MAX_LENGTH} character limit)`
                  : undefined
              }
              submitAttempted={submitAttempted}
              placeholder="Optional details"
              maxLength={ISSUE_DESCRIPTION_MAX_LENGTH}
            />

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
                  isAtIssueLimit ||
                  ((title.trim() === "" || title.trim().length > ISSUE_TITLE_MAX_LENGTH) &&
                    submitAttempted) ||
                  (description.trim().length > ISSUE_DESCRIPTION_MAX_LENGTH && submitAttempted)
                }
                title={
                  isAtIssueLimit
                    ? "Free tier limited to 100 issues per organisation. Upgrade to Pro for unlimited."
                    : undefined
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
