import { ProjectDeleteRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { deleteProject, getOrganisationMemberRole, getProjectByID } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function projectDelete(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, ProjectDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const existingProject = await getProjectByID(id);
    if (!existingProject) {
        return errorResponse(`project with id ${id} does not exist`, "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(existingProject.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const isOrgOwner = requesterMember.role === "owner";
    const isProjectCreator = existingProject.creatorId === req.userId;

    if (!isOrgOwner && !isProjectCreator) {
        return errorResponse(
            "only organisation owners or the project creator can delete projects",
            "PERMISSION_DENIED",
            403,
        );
    }

    await deleteProject(id);

    return Response.json({ success: true });
}
