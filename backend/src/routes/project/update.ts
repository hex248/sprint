import { ProjectUpdateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getOrganisationMemberRole,
    getProjectByID,
    getProjectByKey,
    getSprintById,
    getUserById,
    updateProject,
} from "../../db/queries";
import { validateGitRemote } from "../../git/validate-remote";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function projectUpdate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, ProjectUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, key, name, creatorId, organisationId, defaultSprintAssignment, gitRemote } = parsed.data;

    const existingProject = await getProjectByID(id);
    if (!existingProject) {
        return errorResponse(`project with id ${id} does not exist`, "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(existingProject.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse(
            "only organisation owners and admins can edit projects",
            "PERMISSION_DENIED",
            403,
        );
    }

    if (defaultSprintAssignment?.mode === "specific") {
        const sprint = await getSprintById(defaultSprintAssignment.sprintId);
        if (!sprint || sprint.projectId !== existingProject.id) {
            return errorResponse("default sprint must belong to this project", "INVALID_DEFAULT_SPRINT", 400);
        }

        if (!sprint.open) {
            return errorResponse("cannot set a closed sprint as default", "SPRINT_CLOSED", 400);
        }
    }

    const hasUpdates =
        key !== undefined ||
        name !== undefined ||
        creatorId !== undefined ||
        organisationId !== undefined ||
        defaultSprintAssignment !== undefined ||
        gitRemote !== undefined;

    if (!hasUpdates) {
        return errorResponse(
            "at least one of key, name, creatorId, organisationId, defaultSprintAssignment, or gitRemote must be provided",
            "NO_UPDATES",
            400,
        );
    }

    if (key && key !== existingProject.key) {
        const projectWithKey = await getProjectByKey(key);
        if (projectWithKey && projectWithKey.id !== id) {
            return errorResponse(`a project with key "${key}" already exists`, "KEY_TAKEN", 400);
        }
    }

    if (creatorId) {
        const newCreator = await getUserById(creatorId);
        if (!newCreator) {
            return errorResponse(`user with id ${creatorId} does not exist`, "USER_NOT_FOUND", 400);
        }
    }

    let normalizedGitRemote: string | null | undefined;
    if (gitRemote !== undefined) {
        if (gitRemote == null) {
            normalizedGitRemote = null;
        } else {
            const trimmedRemote = gitRemote.trim();
            normalizedGitRemote = trimmedRemote.length > 0 ? trimmedRemote : null;
        }

        if (normalizedGitRemote) {
            const validation = await validateGitRemote(normalizedGitRemote);
            if (!validation.ok) {
                return errorResponse(`invalid git remote: ${validation.reason}`, "INVALID_GIT_REMOTE", 400);
            }
        }
    }

    const project = await updateProject(id, {
        key,
        name,
        creatorId,
        organisationId,
        defaultSprintAssignment,
        gitRemote: normalizedGitRemote,
    });

    return Response.json(project);
}
