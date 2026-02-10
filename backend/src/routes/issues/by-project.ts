import { IssuesByProjectQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getIssuesWithUsersByProject, getProjectByID } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function issuesByProject(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, IssuesByProjectQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { projectId } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const issues = await getIssuesWithUsersByProject(project.id);

    return Response.json(issues);
}
