import type { BunRequest } from "bun";
import { createIssue, getProjectByID, getProjectByBlob } from "../db/queries.js";

// /issue/create?projectId=1&title=Testing&description=Description
// OR
// /issue/create?projectBlob=projectBlob&title=Testing&description=Description
export default async function issueCreate(req: BunRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const projectBlob = url.searchParams.get("projectBlob");

    let project = null;
    if (projectId) {
        project = await getProjectByID(Number(projectId));
    } else if (projectBlob) {
        project = await getProjectByBlob(projectBlob);
    } else {
        return new Response("missing project blob or project id", { status: 400 });
    }
    if (!project) {
        return new Response(`project not found: provided ${projectId ?? projectBlob}`, { status: 404 });
    }

    const title = url.searchParams.get("title") || "Untitled Issue";
    const description = url.searchParams.get("description") || "";

    const issue = await createIssue(project.id, title, description);

    return Response.json(issue);
}
 