import { SprintUpdateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getOrganisationMemberRole,
    getProjectByID,
    getSprintById,
    hasOverlappingSprints,
    updateSprint,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function sprintUpdate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, SprintUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, name, color, startDate, endDate } = parsed.data;

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
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse(
            "only organisation owners and admins can edit sprints",
            "PERMISSION_DENIED",
            403,
        );
    }

    if (!name && !color && !startDate && !endDate) {
        return errorResponse(
            "at least one of name, color, startDate, or endDate must be provided",
            "NO_UPDATES",
            400,
        );
    }

    // validate dates if provided
    const newStartDate = startDate ? new Date(startDate) : existingSprint.startDate;
    const newEndDate = endDate ? new Date(endDate) : existingSprint.endDate;

    if (newStartDate > newEndDate) {
        return errorResponse("End date must be after start date", "INVALID_DATES", 400);
    }

    if (startDate || endDate) {
        const hasOverlap = await hasOverlappingSprints(
            project.id,
            newStartDate,
            newEndDate,
            existingSprint.id,
        );
        if (hasOverlap) {
            return errorResponse("Sprint dates overlap with an existing sprint", "SPRINT_OVERLAP", 400);
        }
    }

    const sprint = await updateSprint(id, {
        name,
        color,
        startDate: startDate ? newStartDate : undefined,
        endDate: endDate ? newEndDate : undefined,
    });

    return Response.json(sprint);
}
