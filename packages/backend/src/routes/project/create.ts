import type { BunRequest } from "bun";
import { createProject, getProjectByKey, getUserById } from "../../db/queries";

// /project/create?key=KEY&name=Testing&creatorId=1&organisationId=1
export default async function projectCreate(req: BunRequest) {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const name = url.searchParams.get("name");
    const creatorId = url.searchParams.get("creatorId");
    const organisationId = url.searchParams.get("organisationId");

    if (!key || !name || !creatorId || !organisationId) {
        return new Response(
            `missing parameters: ${!key ? "key " : ""}${!name ? "name " : ""}${!creatorId ? "creatorId " : ""}${!organisationId ? "organisationId" : ""}`,
            { status: 400 },
        );
    }

    // check if project with key already exists in the organisation
    const existingProject = await getProjectByKey(key);
    if (existingProject?.organisationId === parseInt(organisationId, 10)) {
        return new Response(`project with key ${key} already exists`, { status: 400 });
    }

    const creator = await getUserById(parseInt(creatorId, 10));
    if (!creator) {
        return new Response(`creator with id ${creatorId} not found`, { status: 404 });
    }

    const project = await createProject(key, name, creator.id, parseInt(organisationId, 10));

    return Response.json(project);
}
