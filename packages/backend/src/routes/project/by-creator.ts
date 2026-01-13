import { ProjectByCreatorQuerySchema } from "@issue/shared";
import type { BunRequest } from "bun";
import { getProjectsByCreatorID, getUserById } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function projectsByCreator(req: BunRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, ProjectByCreatorQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { creatorId } = parsed.data;

    const creator = await getUserById(creatorId);
    if (!creator) {
        return errorResponse(`user with id ${creatorId} not found`, "USER_NOT_FOUND", 404);
    }

    const projects = await getProjectsByCreatorID(creator.id);

    return Response.json(projects);
}
