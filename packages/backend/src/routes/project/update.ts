import type { BunRequest } from "bun";
import { getProjectByID, getProjectByKey, getUserById, updateProject } from "../../db/queries";

// /project/update?id=1&key=NEW&name=new%20name&creatorId=1&organisationId=1
export default async function projectUpdate(req: BunRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const key = url.searchParams.get("key") || undefined;
    const name = url.searchParams.get("name") || undefined;
    const creatorId = url.searchParams.get("creatorId") || undefined;
    const organisationId = url.searchParams.get("organisationId") || undefined;

    if (!id) {
        return new Response(`project id is required`, { status: 400 });
    }

    const existingProject = await getProjectByID(Number(id));
    if (!existingProject) {
        return new Response(`project with id ${id} does not exist`, { status: 404 });
    }

    if (!key && !name && !creatorId && !organisationId) {
        return new Response(`at least one of key, name, creatorId, or organisationId must be provided`, {
            status: 400,
        });
    }

    const projectWithKey = key ? await getProjectByKey(key) : null;
    if (projectWithKey && projectWithKey.id !== Number(id)) {
        return new Response(`a project with key "${key}" already exists`, { status: 400 });
    }

    const newCreator = creatorId ? await getUserById(Number(creatorId)) : null;
    if (creatorId && !newCreator) {
        return new Response(`user with id ${creatorId} does not exist`, { status: 400 });
    }

    const project = await updateProject(Number(id), {
        key,
        name,
        creatorId: newCreator?.id,
        organisationId: organisationId ? Number(organisationId) : undefined,
    });

    return Response.json(project);
}
