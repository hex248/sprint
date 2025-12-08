import type { BunRequest } from "bun";
import { getProjectByID, deleteProject } from "../../db/queries";

// /project/delete?id=1
export default async function projectDelete(req: BunRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return new Response(`project id is required`, { status: 400 });
    }

    const existingProject = await getProjectByID(Number(id));
    if (!existingProject) {
        return new Response(`project with id ${id} does not exist`, { status: 404 });
    }

    await deleteProject(Number(id));

    return new Response(`project with id ${id} deleted successfully`, { status: 200 });
}
