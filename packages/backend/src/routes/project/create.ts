import { ProjectCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { createProject, getProjectByKey, getUserById } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function projectCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, ProjectCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { key, name, organisationId } = parsed.data;

    const existingProject = await getProjectByKey(key);
    if (existingProject?.organisationId === organisationId) {
        return errorResponse(`project with key ${key} already exists in this organisation`, "KEY_TAKEN", 400);
    }

    const creator = await getUserById(req.userId);
    if (!creator) {
        return errorResponse(`creator not found`, "CREATOR_NOT_FOUND", 404);
    }

    const project = await createProject(key, name, creator.id, organisationId);

    return Response.json(project);
}
