import type { IssueResponse, ProjectResponse, SprintRecord, UserRecord } from "@sprint/shared";
import { Check, Link, Trash, X } from "lucide-react";
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
import { SelectTrigger } from "@/components/ui/select";
import { issue } from "@/lib/server";
import { issueID } from "@/lib/utils";
import SmallSprintDisplay from "./small-sprint-display";
import { SprintSelect } from "./sprint-select";

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

    useEffect(() => {
        setSprintId(issueData.Issue.sprintId?.toString() ?? "unassigned");
        setAssigneeIds(assigneesToStringArray(issueData.Assignees));
        setStatus(issueData.Issue.status);
    }, [issueData.Issue.sprintId, issueData.Assignees, issueData.Issue.status]);

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
                    <Button
                        variant="dummy"
                        onClick={handleCopyLink}
                        className="px-0 py-0 w-6 h-6 hover:text-foreground/70"
                        title={linkCopied ? "Copied" : "Copy link"}
                    >
                        {linkCopied ? <Check /> : <Link />}
                    </Button>
                    <Button
                        variant="dummy"
                        onClick={handleDelete}
                        className="px-0 py-0 w-6 h-6 text-destructive hover:text-destructive/70"
                    >
                        <Trash />
                    </Button>
                    <Button variant={"dummy"} onClick={close} className="px-0 py-0 w-6 h-6">
                        <X />
                    </Button>
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
                        <span className="block w-full truncate">{issueData.Issue.title}</span>
                    </div>
                </div>
                {issueData.Issue.description !== "" && (
                    <p className="text-sm">{issueData.Issue.description}</p>
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
