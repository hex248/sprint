import type { IssueRecord } from "@issue/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function IssuesTable({
    issues,
    columns = {},
}: {
    issues: IssueRecord[];
    columns?: { id?: boolean; title?: boolean; description?: boolean; assignee?: boolean };
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow hoverEffect={false}>
                    {(columns.id == null || columns.id === true) && (
                        <TableHead className="w-[1px] border-r">ID</TableHead>
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
                {issues.map((issue) => (
                    <TableRow key={issue.id} className="cursor-pointer">
                        {(columns.id == null || columns.id === true) && (
                            <TableCell className="font-medium border-r">
                                {String(issue.id).padStart(3, "0")}
                            </TableCell>
                        )}
                        {(columns.title == null || columns.title === true) && (
                            <TableCell>{issue.title}</TableCell>
                        )}
                        {(columns.description == null || columns.description === true) && (
                            <TableCell className="overflow-hide">{issue.description}</TableCell>
                        )}
                        {(columns.assignee == null || columns.assignee === true) && (
                            <TableCell className={"text-right"}>?</TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
