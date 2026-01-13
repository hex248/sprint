import { SprintsByProjectQuerySchema } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationMemberRole, getProjectByID, getSprintsByProject } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function sprintsByProject(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, SprintsByProjectQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { projectId } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const membership = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    const sprints = await getSprintsByProject(project.id);

    return Response.json(sprints);
}
