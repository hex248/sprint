import type { BunRequest } from "bun";
import { createProject, getUserById, getProjectByBlob } from "../../db/queries";

// /project/create?blob=BLOB&name=Testing&ownerId=1
export default async function projectCreate(req: BunRequest) {
    const url = new URL(req.url);
    const blob = url.searchParams.get("blob");
    const name = url.searchParams.get("name");
    const ownerId = url.searchParams.get("ownerId");

    if (!blob || !name || !ownerId) {
        return new Response(
            `missing parameters: ${!blob ? "blob " : ""}${!name ? "name " : ""}${!ownerId ? "ownerId" : ""}`,
            { status: 400 },
        );
    }

    // check if project with blob already exists
    const existingProject = await getProjectByBlob(blob);
    if (existingProject) {
        return new Response(`project with blob ${blob} already exists`, { status: 400 });
    }

    const owner = await getUserById(parseInt(ownerId, 10));
    if (!owner) {
        return new Response(`owner with id ${ownerId} not found`, { status: 404 });
    }

    const project = await createProject(blob, name, owner.id);

    return Response.json(project);
}
