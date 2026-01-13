import { IssueCreateRequestSchema } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { createIssue, getProjectByID } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { projectId, title, description = "", status, assigneeId, sprintId } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const issue = await createIssue(
        project.id,
        title,
        description,
        req.userId,
        sprintId ?? undefined,
        assigneeId ?? undefined,
        status,
    );

    return Response.json(issue);
}
