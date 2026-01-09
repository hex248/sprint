import type { IssueResponse, ProjectResponse, UserRecord } from "@issue/shared";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import SmallUserDisplay from "@/components/small-user-display";
import { TimerModal } from "@/components/timer-modal";
import { Button } from "@/components/ui/button";
import { UserSelect } from "@/components/user-select";
import { issue } from "@/lib/server";
import { issueID } from "@/lib/utils";

export function IssueDetailPane({
    project,
    issueData,
    members,
    close,
    onIssueUpdate,
}: {
    project: ProjectResponse;
    issueData: IssueResponse;
    members: UserRecord[];
    close: () => void;
    onIssueUpdate?: () => void;
}) {
    const [assigneeId, setAssigneeId] = useState<string>(
        issueData.Issue.assigneeId?.toString() ?? "unassigned",
    );

    useEffect(() => {
        setAssigneeId(issueData.Issue.assigneeId?.toString() ?? "unassigned");
    }, [issueData.Issue.assigneeId]);

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

    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-end border-b h-[25px]">
                <span className="w-full">
                    <p className="text-sm w-fit px-1">
                        {issueID(project.Project.key, issueData.Issue.number)}
                    </p>
                </span>

                <Button variant={"dummy"} onClick={close} className="px-0 py-0 w-6 h-6">
                    <X />
                </Button>
            </div>

            <div className="flex flex-col w-full p-2 py-2 gap-2">
                <h1 className="text-md">{issueData.Issue.title}</h1>
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

                <div>
                    <TimerModal issueId={issueData.Issue.id} />
                </div>
            </div>
        </div>
    );
}
