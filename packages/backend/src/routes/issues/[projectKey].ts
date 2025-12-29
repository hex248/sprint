import type { BunRequest } from "bun";
import { getIssuesWithAssigneeByProject, getProjectByKey } from "../../db/queries";

export default async function issuesInProject(req: BunRequest<"/issues/:projectKey">) {
    const { projectKey } = req.params;

    const project = await getProjectByKey(projectKey);
    if (!project) {
        return new Response(`project not found: provided ${projectKey}`, { status: 404 });
    }
    const issues = await getIssuesWithAssigneeByProject(project.id);

    return Response.json(issues);
}
