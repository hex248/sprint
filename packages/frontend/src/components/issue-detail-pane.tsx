import type { IssueResponse, ProjectResponse } from "@issue/shared";
import { X } from "lucide-react";
import SmallUserDisplay from "@/components/small-user-display";
import { Button } from "@/components/ui/button";
import { issueID } from "@/lib/utils";

export function IssueDetailPane({
    project,
    issueData,
    close,
}: {
    project: ProjectResponse;
    issueData: IssueResponse;
    close: () => void;
}) {
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

            <div className="flex flex-col w-full p-2 gap-2">
                <h1 className="text-md">{issueData.Issue.title}</h1>
                <p className="text-sm">{issueData.Issue.description}</p>

                {issueData.User && (
                    <div className="flex items-center gap-2">
                        Assignee:
                        {issueData.User ? <SmallUserDisplay user={issueData.User} /> : "Unassigned"}
                    </div>
                )}
            </div>
        </div>
    );
}
