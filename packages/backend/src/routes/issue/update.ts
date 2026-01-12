import type { BunRequest } from "bun";
import { updateIssue } from "../../db/queries";

// /issue/update?id=1&title=Testing&description=Description&assigneeId=2&status=IN%20PROGRESS
// assigneeId can be "null" to unassign
export default async function issueUpdate(req: BunRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return new Response("missing issue id", { status: 400 });
    }

    const title = url.searchParams.get("title") || undefined;
    const description = url.searchParams.get("description") || undefined;
    const sprintIdParam = url.searchParams.get("sprintId");
    const assigneeIdParam = url.searchParams.get("assigneeId");
    const status = url.searchParams.get("status") || undefined;

    // parse sprintId: "null" means unassign, number means assign, undefined means no change
    let sprintId: number | null | undefined;
    if (sprintIdParam === "null") {
        sprintId = null;
    } else if (sprintIdParam) {
        sprintId = Number(sprintIdParam);
    }
    // same for assigneeId
    let assigneeId: number | null | undefined;
    if (assigneeIdParam === "null") {
        assigneeId = null;
    } else if (assigneeIdParam) {
        assigneeId = Number(assigneeIdParam);
    }

    if (!title && !description && sprintId === undefined && assigneeId === undefined && !status) {
        return new Response("no updates provided", { status: 400 });
    }

    const issue = await updateIssue(Number(id), {
        title,
        description,
        sprintId,
        assigneeId,
        status,
    });

    return Response.json(issue);
}
