import { IssueDeleteRequestSchema } from "@issue/shared";
import type { BunRequest } from "bun";
import { deleteIssue } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueDelete(req: BunRequest) {
    const parsed = await parseJsonBody(req, IssueDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const result = await deleteIssue(id);
    if (result.rowCount === 0) {
        return errorResponse(`no issue with id ${id} found`, "ISSUE_NOT_FOUND", 404);
    }

    return Response.json({ success: true });
}
