import type { IssueResponse } from "@issue/shared";
import Avatar from "@/components/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function IssuesTable({
    issuesData,
    columns = {},
    issueSelectAction,
    className,
}: {
    issuesData: IssueResponse[];
    columns?: { id?: boolean; title?: boolean; description?: boolean; assignee?: boolean };
    issueSelectAction?: (issue: IssueResponse) => void;
    className: string;
}) {
    return (
        <Table className={cn(className)}>
            <TableHeader>
                <TableRow hoverEffect={false}>
                    {(columns.id == null || columns.id === true) && (
                        <TableHead className="text-right w-[1px] border-r">ID</TableHead>
                    )}
                    {(columns.title == null || columns.title === true) && <TableHead>Title</TableHead>}
                    {(columns.description == null || columns.description === true) && (
                        <TableHead>Description</TableHead>
                    )}
                    {/* below is kept blank to fill the space, used as the "Assignee" column */}
                    {(columns.assignee == null || columns.assignee === true) && <TableHead></TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {issuesData.map((issueData) => (
                    <TableRow
                        key={issueData.Issue.id}
                        className="cursor-pointer"
                        onClick={() => {
                            issueSelectAction?.(issueData);
                        }}
                    >
                        {(columns.id == null || columns.id === true) && (
                            <TableCell className="font-medium border-r text-right">
                                {issueData.Issue.number.toString().padStart(3, "0")}
                            </TableCell>
                        )}
                        {(columns.title == null || columns.title === true) && (
                            <TableCell>{issueData.Issue.title}</TableCell>
                        )}
                        {(columns.description == null || columns.description === true) && (
                            <TableCell className="overflow-hide">{issueData.Issue.description}</TableCell>
                        )}
                        {(columns.assignee == null || columns.assignee === true) && (
                            <TableCell className={"w-[1px] text-center px-1 py-0"}>
                                {issueData.User ? <Avatar user={issueData.User} size={6} /> : "?"}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
