import { ProjectDeleteRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { deleteProject, getProjectByID } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function projectDelete(req: BunRequest) {
    const parsed = await parseJsonBody(req, ProjectDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const existingProject = await getProjectByID(id);
    if (!existingProject) {
        return errorResponse(`project with id ${id} does not exist`, "PROJECT_NOT_FOUND", 404);
    }

    await deleteProject(id);

    return Response.json({ success: true });
}
