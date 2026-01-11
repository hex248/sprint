import type { IssueResponse, ProjectResponse, UserRecord } from "@issue/shared";
import { Check, Link, Trash, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/session-provider";
import SmallUserDisplay from "@/components/small-user-display";
import { StatusSelect } from "@/components/status-select";
import StatusTag from "@/components/status-tag";
import { TimerDisplay } from "@/components/timer-display";
import { TimerModal } from "@/components/timer-modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SelectTrigger } from "@/components/ui/select";
import { UserSelect } from "@/components/user-select";
import { issue } from "@/lib/server";
import { issueID } from "@/lib/utils";

export function IssueDetailPane({
    project,
    issueData,
    members,
    statuses,
    close,
    onIssueUpdate,
    onIssueDelete,
}: {
    project: ProjectResponse;
    issueData: IssueResponse;
    members: UserRecord[];
    statuses: Record<string, string>;
    close: () => void;
    onIssueUpdate?: () => void;
    onIssueDelete?: (issueId: number) => void | Promise<void>;
}) {
    const { user } = useSession();
    const [assigneeId, setAssigneeId] = useState<string>(
        issueData.Issue.assigneeId?.toString() ?? "unassigned",
    );
    const [status, setStatus] = useState<string>(issueData.Issue.status);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const copyTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        setAssigneeId(issueData.Issue.assigneeId?.toString() ?? "unassigned");
        setStatus(issueData.Issue.status);
    }, [issueData.Issue.assigneeId, issueData.Issue.status]);

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                window.clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    const handleAssigneeChange = async (value: string) => {
        setAssigneeId(value);
        const newAssigneeId = value === "unassigned" ? null : Number(value);

        await issue.update({
            issueId: issueData.Issue.id,
            assigneeId: newAssigneeId,
            onSuccess: () => {
                onIssueUpdate?.();
            },
            onError: (error) => {
                console.error("error updating assignee:", error);
                setAssigneeId(issueData.Issue.assigneeId?.toString() ?? "unassigned");
            },
        });
    };

    const handleStatusChange = async (value: string) => {
        setStatus(value);

        await issue.update({
            issueId: issueData.Issue.id,
            status: value,
            onSuccess: () => {
                onIssueUpdate?.();
            },
            onError: (error) => {
                console.error("error updating status:", error);
                setStatus(issueData.Issue.status);
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
            },
            onError: (error) => {
                console.error("error deleting issue:", error);
            },
        });
        setDeleteOpen(false);
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-end border-b h-[25px]">
                <span className="w-full">
                    <p className="text-sm w-fit px-1">
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
                    <span className="text-sm">Assignee:</span>
                    <UserSelect
                        users={members}
                        value={assigneeId}
                        onChange={handleAssigneeChange}
                        fallbackUser={issueData.Assignee}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm">Created by:</span>
                    <SmallUserDisplay user={issueData.Creator} className={"text-sm"} />
                </div>

                <div className="flex items-center gap-2">
                    {user?.id === Number(assigneeId) && <TimerModal issueId={issueData.Issue.id} />}
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
