import { SprintCloseRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    CloseSprintError,
    closeSprintWithHandOff,
    getOrganisationMemberRole,
    getProjectByID,
    getSprintById,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function sprintClose(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, SprintCloseRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { sprintId, statusesToHandOff, handOffSprintId } = parsed.data;

    const existingSprint = await getSprintById(sprintId);
    if (!existingSprint) {
        return errorResponse(`sprint with id ${sprintId} does not exist`, "SPRINT_NOT_FOUND", 404);
    }

    const project = await getProjectByID(existingSprint.projectId);
    if (!project) {
        return errorResponse("project not found", "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse(
            "only organisation owners and admins can close sprints",
            "PERMISSION_DENIED",
            403,
        );
    }

    try {
        const result = await closeSprintWithHandOff(sprintId, statusesToHandOff, handOffSprintId);
        return Response.json(result);
    } catch (error) {
        if (error instanceof CloseSprintError) {
            return errorResponse(error.message, error.code, error.status);
        }
        throw error;
    }
}
