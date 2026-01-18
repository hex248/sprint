import type { IssueResponse, ProjectResponse, SprintRecord, UserRecord } from "@sprint/shared";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MultiAssigneeSelect } from "@/components/multi-assignee-select";
import { useSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import { StatusSelect } from "@/components/status-select";
import StatusTag from "@/components/status-tag";
import { TimerDisplay } from "@/components/timer-display";
import { TimerModal } from "@/components/timer-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { issue } from "@/lib/server";
import { issueID } from "@/lib/utils";
import SmallSprintDisplay from "./small-sprint-display";
import { SprintSelect } from "./sprint-select";
import { IconButton } from "./ui/icon-button";

function assigneesToStringArray(assignees: UserRecord[]): string[] {
    if (assignees.length === 0) return ["unassigned"];
    return assignees.map((a) => a.id.toString());
}

function stringArrayToAssigneeIds(assigneeIds: string[]): number[] {
    return assigneeIds.filter((id) => id !== "unassigned").map((id) => Number(id));
}

export function IssueDetailPane({
    project,
    sprints,
    issueData,
    members,
    statuses,
    close,
    onIssueUpdate,
    onIssueDelete,
}: {
    project: ProjectResponse;
    sprints: SprintRecord[];
    issueData: IssueResponse;
    members: UserRecord[];
    statuses: Record<string, string>;
    close: () => void;
    onIssueUpdate?: () => void;
    onIssueDelete?: (issueId: number) => void | Promise<void>;
}) {
    const { user } = useSession();
    const [assigneeIds, setAssigneeIds] = useState<string[]>(assigneesToStringArray(issueData.Assignees));
    const [sprintId, setSprintId] = useState<string>(issueData.Issue.sprintId?.toString() ?? "unassigned");
    const [status, setStatus] = useState<string>(issueData.Issue.status);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const copyTimeoutRef = useRef<number | null>(null);

    const [title, setTitle] = useState(issueData.Issue.title);
    const [originalTitle, setOriginalTitle] = useState(issueData.Issue.title);
    const [isSavingTitle, setIsSavingTitle] = useState(false);

    const [description, setDescription] = useState(issueData.Issue.description);
    const [originalDescription, setOriginalDescription] = useState(issueData.Issue.description);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isSavingDescription, setIsSavingDescription] = useState(false);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
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

    const handleSprintChange = async (value: string) => {
        setSprintId(value);
        const newSprintId = value === "unassigned" ? null : Number(value);

        await issue.update({
            issueId: issueData.Issue.id,
            sprintId: newSprintId,
            onSuccess: () => {
                onIssueUpdate?.();

                toast.success(
                    <>
                        Successfully updated sprint to{" "}
                        {value === "unassigned" ? (
                            "Unassigned"
                        ) : (
                            <SmallSprintDisplay sprint={sprints.find((s) => s.id === newSprintId)} />
                        )}{" "}
                        for {issueID(project.Project.key, issueData.Issue.number)}
                    </>,
                    {
                        dismissible: false,
                    },
                );
            },
            onError: (error) => {
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
                        for {issueID(project.Project.key, issueData.Issue.number)}
                    </>,
                    {
                        dismissible: false,
                    },
                );
            },
        });
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

        await issue.update({
            issueId: issueData.Issue.id,
            assigneeIds: newAssigneeIdNumbers,
            onSuccess: () => {
                const assignedUsers = members.filter((m) => newAssigneeIdNumbers.includes(m.id));
                const displayText =
                    assignedUsers.length === 0
                        ? "Unassigned"
                        : assignedUsers.length === 1
                          ? assignedUsers[0].name
                          : `${assignedUsers.length} assignees`;
                toast.success(
                    <div className={"flex items-center gap-2"}>
                        Updated assignees to {displayText} for{" "}
                        {issueID(project.Project.key, issueData.Issue.number)}
                    </div>,
                    {
                        dismissible: false,
                    },
                );
                onIssueUpdate?.();
            },
            onError: (error) => {
                console.error("error updating assignees:", error);
                setAssigneeIds(previousAssigneeIds);

                toast.error(`Error updating assignees: ${error}`, {
                    dismissible: false,
                });
            },
        });
    };

    const handleStatusChange = async (value: string) => {
        setStatus(value);

        await issue.update({
            issueId: issueData.Issue.id,
            status: value,
            onSuccess: () => {
                toast.success(
                    <>
                        {issueID(project.Project.key, issueData.Issue.number)}'s status updated to{" "}
                        <StatusTag status={value} colour={statuses[value]} />
                    </>,
                    { dismissible: false },
                );
                onIssueUpdate?.();
            },
            onError: (error) => {
                console.error("error updating status:", error);
                setStatus(issueData.Issue.status);

                toast.error(`Error updating status: ${error}`, {
                    dismissible: false,
                });
            },
        });
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
        await issue.update({
            issueId: issueData.Issue.id,
            title: trimmedTitle,
            onSuccess: () => {
                setOriginalTitle(trimmedTitle);
                toast.success(`${issueID(project.Project.key, issueData.Issue.number)} Title updated`);
                onIssueUpdate?.();
                setIsSavingTitle(false);
            },
            onError: (error) => {
                console.error("error updating title:", error);
                setTitle(originalTitle);
                setIsSavingTitle(false);
            },
        });
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
        await issue.update({
            issueId: issueData.Issue.id,
            description: trimmedDescription,
            onSuccess: () => {
                setOriginalDescription(trimmedDescription);
                setDescription(trimmedDescription);
                toast.success(`${issueID(project.Project.key, issueData.Issue.number)} Description updated`);
                onIssueUpdate?.();
                setIsSavingDescription(false);
                if (trimmedDescription === "") {
                    setIsEditingDescription(false);
                }
            },
            onError: (error) => {
                console.error("error updating description:", error);
                setDescription(originalDescription);
                setIsSavingDescription(false);
            },
        });
    };

    const handleConfirmDelete = async () => {
        await issue.delete({
            issueId: issueData.Issue.id,
            onSuccess: async () => {
                await onIssueDelete?.(issueData.Issue.id);

                toast.success(`Deleted issue ${issueID(project.Project.key, issueData.Issue.number)}`, {
                    dismissible: false,
                });
            },
            onError: (error) => {
                console.error(
                    `error deleting issue ${issueID(project.Project.key, issueData.Issue.number)}`,
                    error,
                );

                toast.error(
                    `Error deleting issue ${issueID(project.Project.key, issueData.Issue.number)}: ${error}`,
                    {
                        dismissible: false,
                    },
                );
            },
        });
        setDeleteOpen(false);
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-end border-b h-[25px]">
                <span className="w-full">
                    <p className="text-sm w-fit px-1 font-700">
                        {issueID(project.Project.key, issueData.Issue.number)}
                    </p>
                </span>
                <div className="flex items-center">
                    <IconButton onClick={handleCopyLink} title={linkCopied ? "Copied" : "Copy link"}>
                        {linkCopied ? <Icon icon="check" /> : <Icon icon="link" />}
                    </IconButton>
                    <IconButton variant="destructive" onClick={handleDelete} title={"Delete issue"}>
                        <Icon icon="trash" />
                    </IconButton>
                    <IconButton onClick={close} title={"Close"}>
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
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                    setTitle(originalTitle);
                                    e.currentTarget.blur();
                                }
                            }}
                            disabled={isSavingTitle}
                            className="w-full border-transparent hover:border-input focus:border-input h-auto py-0.5"
                        />
                    </div>
                </div>
                {description || isEditingDescription ? (
                    <Textarea
                        ref={descriptionRef}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleDescriptionSave}
                        onKeyDown={(e) => {
                            if (e.key === "Escape" || (e.ctrlKey && e.key === "Enter")) {
                                setDescription(originalDescription);
                                if (originalDescription === "") {
                                    setIsEditingDescription(false);
                                }
                                e.currentTarget.blur();
                            }
                        }}
                        placeholder="Add a description..."
                        disabled={isSavingDescription}
                        className="text-sm border-transparent hover:border-input focus:border-input resize-none min-h-[60px]"
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

                <div className="flex items-center gap-2">
                    {assigneeIds.some((id) => user?.id === Number(id)) && (
                        <TimerModal issueId={issueData.Issue.id} />
                    )}
                    <TimerDisplay issueId={issueData.Issue.id} />
                </div>
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
