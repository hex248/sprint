import { ProjectByIdQuerySchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { getProjectWithCreatorByID } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function projectWithCreatorByID(req: BunRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, ProjectByIdQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const projectWithCreator = await getProjectWithCreatorByID(id);
    if (!projectWithCreator || !projectWithCreator.Project) {
        return errorResponse(`project with id ${id} not found`, "PROJECT_NOT_FOUND", 404);
    }

    return Response.json(projectWithCreator);
}
