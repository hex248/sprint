import { ProjectUpdateRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { getProjectByID, getProjectByKey, getUserById, updateProject } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function projectUpdate(req: BunRequest) {
    const parsed = await parseJsonBody(req, ProjectUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, key, name, creatorId, organisationId } = parsed.data;

    const existingProject = await getProjectByID(id);
    if (!existingProject) {
        return errorResponse(`project with id ${id} does not exist`, "PROJECT_NOT_FOUND", 404);
    }

    if (!key && !name && !creatorId && !organisationId) {
        return errorResponse(
            "at least one of key, name, creatorId, or organisationId must be provided",
            "NO_UPDATES",
            400,
        );
    }

    if (key) {
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

    const project = await updateProject(id, {
        key,
        name,
        creatorId,
        organisationId,
    });

    return Response.json(project);
}
