import type { BunRequest } from "bun";
import { getIssuesByProject, getProjectByBlob } from "../db/queries.js";

export default async function issues(req: BunRequest<"/issues/:projectId">) {
    const { projectId } = req.params;

    const project = await getProjectByBlob(projectId);
    if (!project) {
        return new Response("project not found", { status: 404 });
    }
    const issues = await getIssuesByProject(project.id);

    return Response.json(issues);
}
