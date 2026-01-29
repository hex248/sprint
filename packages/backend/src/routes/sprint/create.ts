import { SprintCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createSprint,
    FREE_TIER_LIMITS,
    getOrganisationMemberRole,
    getProjectByID,
    getProjectSprintCount,
    getSubscriptionByUserId,
    hasOverlappingSprints,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function sprintCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, SprintCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { projectId, name, color, startDate, endDate } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`Project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const membership = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!membership) {
        return errorResponse("Not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
        return errorResponse("Only owners and admins can create sprints", "PERMISSION_DENIED", 403);
    }

    // check free tier sprint limit
    const subscription = await getSubscriptionByUserId(req.userId);
    const isPro = subscription?.status === "active";
    if (!isPro) {
        const sprintCount = await getProjectSprintCount(projectId);
        if (sprintCount >= FREE_TIER_LIMITS.sprintsPerProject) {
            return errorResponse(
                `Free tier limited to ${FREE_TIER_LIMITS.sprintsPerProject} sprints per project. Upgrade to Pro for unlimited sprints.`,
                "SPRINT_LIMIT_REACHED",
                403,
            );
        }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const hasOverlap = await hasOverlappingSprints(project.id, start, end);
    if (hasOverlap) {
        return errorResponse("Sprint dates overlap with an existing sprint", "SPRINT_OVERLAP", 400);
    }

    const sprint = await createSprint(project.id, name, color, start, end);

    return Response.json(sprint);
}
