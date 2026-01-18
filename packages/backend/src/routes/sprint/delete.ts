import { SprintDeleteRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { deleteSprint, getOrganisationMemberRole, getProjectByID, getSprintById } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function sprintDelete(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, SprintDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const existingSprint = await getSprintById(id);
    if (!existingSprint) {
        return errorResponse(`sprint with id ${id} does not exist`, "SPRINT_NOT_FOUND", 404);
    }

    const project = await getProjectByID(existingSprint.projectId);
    if (!project) {
        return errorResponse("project not found", "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const isOrgOwner = requesterMember.role === "owner";
    const isAdmin = requesterMember.role === "admin";
    const isProjectCreator = project.creatorId === req.userId;

    if (!isOrgOwner && !isAdmin && !isProjectCreator) {
        return errorResponse(
            "only organisation owners, admins, or project creators can delete sprints",
            "PERMISSION_DENIED",
            403,
        );
    }

    await deleteSprint(id);

    return Response.json({ success: true });
}
