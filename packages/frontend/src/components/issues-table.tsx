import type { IssueRecord } from "@issue/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function IssuesTable({ issues }: { issues: IssueRecord[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    {/* below is kept blank to fill the space, used as the "Assignee" column */}
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {issues.map((issue) => (
                    <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
                        <TableCell>{issue.description}</TableCell>
                        <TableCell>?</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
