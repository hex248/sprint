import { ProjectCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createProject,
    FREE_TIER_LIMITS,
    getOrganisationMemberRole,
    getOrganisationProjectCount,
    getProjectByKey,
    getUserById,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function projectCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, ProjectCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { key, name, organisationId } = parsed.data;

    const existingProject = await getProjectByKey(key);
    if (existingProject?.organisationId === organisationId) {
        return errorResponse(`project with key ${key} already exists in this organisation`, "KEY_TAKEN", 400);
    }

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (membership.role !== "owner" && membership.role !== "admin") {
        return errorResponse("only owners and admins can create projects", "PERMISSION_DENIED", 403);
    }

    // check free tier limit
    const creator = await getUserById(req.userId);
    if (creator && creator.plan !== "pro") {
        const projectCount = await getOrganisationProjectCount(organisationId);
        if (projectCount >= FREE_TIER_LIMITS.projectsPerOrganisation) {
            return errorResponse(
                `free tier is limited to ${FREE_TIER_LIMITS.projectsPerOrganisation} project per organisation. upgrade to pro for unlimited projects.`,
                "FREE_TIER_PROJECT_LIMIT",
                403,
            );
        }
    }

    if (!creator) {
        return errorResponse(`creator not found`, "CREATOR_NOT_FOUND", 404);
    }

    const project = await createProject(key, name, creator.id, organisationId);

    return Response.json(project);
}
