import { IssueUpdateRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { updateIssue } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueUpdate(req: BunRequest) {
    const parsed = await parseJsonBody(req, IssueUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, title, description, status, assigneeId, sprintId } = parsed.data;

    // check that at least one field is being updated
    if (
        title === undefined &&
        description === undefined &&
        status === undefined &&
        assigneeId === undefined &&
        sprintId === undefined
    ) {
        return errorResponse("no updates provided", "NO_UPDATES", 400);
    }

    const issue = await updateIssue(id, {
        title,
        description,
        sprintId,
        assigneeId,
        status,
    });

    return Response.json(issue);
}
