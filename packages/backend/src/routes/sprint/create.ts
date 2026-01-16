import { SprintCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { createSprint, getOrganisationMemberRole, getProjectByID } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function sprintCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, SprintCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { projectId, name, color, startDate, endDate } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const membership = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
        return errorResponse("only owners and admins can create sprints", "PERMISSION_DENIED", 403);
    }

    const sprint = await createSprint(project.id, name, color, new Date(startDate), new Date(endDate));

    return Response.json(sprint);
}
