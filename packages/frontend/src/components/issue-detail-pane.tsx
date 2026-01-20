import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MultiAssigneeSelect } from "@/components/multi-assignee-select";
import { useSelection } from "@/components/selection-provider";
import { useSession } from "@/components/session-provider";
import SmallSprintDisplay from "@/components/small-sprint-display";
import SmallUserDisplay from "@/components/small-user-display";
import { SprintSelect } from "@/components/sprint-select";
import { StatusSelect } from "@/components/status-select";
import StatusTag from "@/components/status-tag";
import { TimerDisplay } from "@/components/timer-display";
import { TimerModal } from "@/components/timer-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    useDeleteIssue,
    useOrganisationMembers,
    useSelectedIssue,
    useSelectedOrganisation,
    useSelectedProject,
    useSprints,
    useUpdateIssue,
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

export function IssueDetailPane() {
    const { user } = useSession();
    const { selectIssue } = useSelection();
    const selectedOrganisation = useSelectedOrganisation();
    const selectedProject = useSelectedProject();
    const issueData = useSelectedIssue();
    const { data: sprints = [] } = useSprints(selectedProject?.Project.id);
    const { data: membersData = [] } = useOrganisationMembers(selectedOrganisation?.Organisation.id);
    const updateIssue = useUpdateIssue();
    const deleteIssue = useDeleteIssue();

    const members = useMemo(() => membersData.map((member) => member.User), [membersData]);
    const statuses = selectedOrganisation?.Organisation.statuses ?? {};

    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [sprintId, setSprintId] = useState<string>("unassigned");
    const [status, setStatus] = useState<string>("");
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
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    const isAssignee = assigneeIds.some((id) => user?.id === Number(id));
    const actualAssigneeIds = assigneeIds.filter((id) => id !== "unassigned");
    const hasMultipleAssignees = actualAssigneeIds.length > 1;

    useEffect(() => {
        if (!issueData) return;
        setSprintId(issueData.Issue.sprintId?.toString() ?? "unassigned");
        setAssigneeIds(assigneesToStringArray(issueData.Assignees));
        setStatus(issueData.Issue.status);
        setTitle(issueData.Issue.title);
        setOriginalTitle(issueData.Issue.title);
        setDescription(issueData.Issue.description);
        setOriginalDescription(issueData.Issue.description);
        setIsEditingDescription(false);
    }, [issueData]);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    if (!issueData || !selectedProject || !selectedOrganisation) {
        return null;
    }

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
                    for {issueID(selectedProject.Project.key, issueData.Issue.number)}
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
                    for {issueID(selectedProject.Project.key, issueData.Issue.number)}
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
                    Updated assignees to {displayText} for{" "}
                    {issueID(selectedProject.Project.key, issueData.Issue.number)}
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
                    {issueID(selectedProject.Project.key, issueData.Issue.number)}'s status updated to{" "}
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

    const handleDelete = () => {
        setDeleteOpen(true);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
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
            toast.success(`${issueID(selectedProject.Project.key, issueData.Issue.number)} Title updated`);
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
            if (trimmedDescription === "") {
                setIsEditingDescription(false);
            }
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
            toast.success(
                `${issueID(selectedProject.Project.key, issueData.Issue.number)} Description updated`,
            );
            if (trimmedDescription === "") {
                setIsEditingDescription(false);
            }
        } catch (error) {
            console.error("error updating description:", error);
            setDescription(originalDescription);
        } finally {
            setIsSavingDescription(false);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteIssue.mutateAsync(issueData.Issue.id);
            selectIssue(null);
            toast.success(`Deleted issue ${issueID(selectedProject.Project.key, issueData.Issue.number)}`, {
                dismissible: false,
            });
        } catch (error) {
            console.error(
                `error deleting issue ${issueID(selectedProject.Project.key, issueData.Issue.number)}`,
                error,
            );
            toast.error(
                `Error deleting issue ${issueID(selectedProject.Project.key, issueData.Issue.number)}: ${parseError(
                    error as Error,
                )}`,
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
            <div className="flex flex-row items-center justify-end border-b h-[25px]">
                <span className="w-full">
                    <p className="text-sm w-fit px-1 font-700">
                        {issueID(selectedProject.Project.key, issueData.Issue.number)}
                    </p>
                </span>
                <div className="flex items-center">
                    <IconButton onClick={handleCopyLink} title={linkCopied ? "Copied" : "Copy link"}>
                        {linkCopied ? <Icon icon="check" /> : <Icon icon="link" />}
                    </IconButton>
                    <IconButton variant="destructive" onClick={handleDelete} title={"Delete issue"}>
                        <Icon icon="trash" />
                    </IconButton>
                    <IconButton onClick={() => selectIssue(null)} title={"Close"}>
                        <Icon icon="x" />
                    </IconButton>
                </div>
            </div>

            <div className="flex flex-col w-full p-2 py-2 gap-2">
                <div className="flex gap-2">
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
                                <StatusTag
                                    status={value}
                                    colour={statuses[value]}
                                    className="hover:opacity-85"
                                />
                            </SelectTrigger>
                        )}
                    />
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
                {description || isEditingDescription ? (
                    <Textarea
                        ref={descriptionRef}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        onBlur={handleDescriptionSave}
                        onKeyDown={(event) => {
                            if (event.key === "Escape" || (event.ctrlKey && event.key === "Enter")) {
                                setDescription(originalDescription);
                                if (originalDescription === "") {
                                    setIsEditingDescription(false);
                                }
                                event.currentTarget.blur();
                            }
                        }}
                        placeholder="Add a description..."
                        disabled={isSavingDescription}
                        className="text-sm border-input/50 hover:border-input focus:border-input resize-none !bg-background"
                    />
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
                )}

                <div className="flex items-center gap-2">
                    <span className="text-sm">Sprint:</span>
                    <SprintSelect sprints={sprints} value={sprintId} onChange={handleSprintChange} />
                </div>

                <div className="flex items-start gap-2">
                    <span className="text-sm pt-2">Assignees:</span>
                    <MultiAssigneeSelect
                        users={members}
                        assigneeIds={assigneeIds}
                        onChange={handleAssigneeChange}
                        fallbackUsers={issueData.Assignees}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm">Created by:</span>
                    <SmallUserDisplay user={issueData.Creator} className={"text-sm"} />
                </div>

                {isAssignee && (
                    <div className={cn("flex flex-col gap-2", hasMultipleAssignees && "cursor-not-allowed")}>
                        <div className="flex items-center gap-2">
                            <TimerModal issueId={issueData.Issue.id} disabled={hasMultipleAssignees} />
                            <TimerDisplay issueId={issueData.Issue.id} />
                        </div>
                        {hasMultipleAssignees && (
                            <span className="text-xs text-destructive/85 font-600">
                                Timers cannot be used on issues with multiple assignees
                            </span>
                        )}
                    </div>
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
