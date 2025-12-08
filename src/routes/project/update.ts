import type { BunRequest } from "bun";
import { getProjectByBlob, getProjectByID, getUserById, updateProject } from "../../db/queries";

// /project/update?id=1&blob=NEW&name=new%20name&ownerId=1
export default async function projectUpdate(req: BunRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const blob = url.searchParams.get("blob") || undefined;
    const name = url.searchParams.get("name") || undefined;
    const ownerId = url.searchParams.get("ownerId") || undefined;

    if (!id) {
        return new Response(`project id is required`, { status: 400 });
    }

    const existingProject = await getProjectByID(Number(id));
    if (!existingProject) {
        return new Response(`project with id ${id} does not exist`, { status: 404 });
    }

    if (!blob && !name && !ownerId) {
        return new Response(`at least one of blob, name, or ownerId must be provided`, {
            status: 400,
        });
    }

    const projectWithBlob = blob ? await getProjectByBlob(blob) : null;
    if (projectWithBlob && projectWithBlob.id !== Number(id)) {
        return new Response(`a project with blob "${blob}" already exists`, { status: 400 });
    }

    const newOwner = ownerId ? await getUserById(Number(ownerId)) : null;
    if (ownerId && !newOwner) {
        return new Response(`user with id ${ownerId} does not exist`, { status: 400 });
    }

    const project = await updateProject(Number(id), {
        blob: blob,
        name: name,
        ownerId: newOwner?.id,
    });

    return Response.json(project);
}
