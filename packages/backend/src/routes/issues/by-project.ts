import type { AuthedRequest } from "../../auth/middleware";
import { getIssuesWithUsersByProject, getProjectByID } from "../../db/queries";

export default async function issuesByProject(req: AuthedRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    const project = await getProjectByID(Number(projectId));
    if (!project) {
        return new Response(`project not found: provided ${projectId}`, { status: 404 });
    }
    const issues = await getIssuesWithUsersByProject(project.id);

    return Response.json(issues);
}
