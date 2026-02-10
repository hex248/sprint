import type { BunRequest } from "bun";
import { getProjectsWithCreators } from "../../db/queries";

// /projects/all
export default async function projectsAll(_req: BunRequest) {
    const projects = await getProjectsWithCreators();

    return Response.json(projects);
}
