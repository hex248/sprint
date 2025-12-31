import type { BunRequest } from "bun";
import { getProjectsWithCreators } from "../../db/queries";

// /projects/with-creators
export default async function projectsWithCreators(_req: BunRequest) {
    const projects = await getProjectsWithCreators();

    return Response.json(projects);
}
