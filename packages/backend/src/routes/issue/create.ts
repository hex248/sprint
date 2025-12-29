import type { BunRequest } from "bun";
import { createIssue, getProjectByID, getProjectByKey } from "../../db/queries";

// /issue/create?projectId=1&title=Testing&description=Description
// OR
// /issue/create?projectKey=projectKey&title=Testing&description=Description
export default async function issueCreate(req: BunRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const projectKey = url.searchParams.get("projectKey");

    let project = null;
    if (projectId) {
        project = await getProjectByID(Number(projectId));
    } else if (projectKey) {
        project = await getProjectByKey(projectKey);
    } else {
        return new Response("missing project key or project id", { status: 400 });
    }
    if (!project) {
        return new Response(`project not found: provided ${projectId ?? projectKey}`, { status: 404 });
    }

    const title = url.searchParams.get("title") || "Untitled Issue";
    const description = url.searchParams.get("description") || "";

    const issue = await createIssue(project.id, title, description);

    return Response.json(issue);
}
