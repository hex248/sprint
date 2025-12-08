import type { BunRequest } from "bun";
import { updateIssue } from "../db/queries.js";

// /issue/update?id=1&title=Testing&description=Description
export default async function issueUpdate(req: BunRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return new Response("missing issue id", { status: 400 });
    }

    const title = url.searchParams.get("title") || undefined;
    const description = url.searchParams.get("description") || undefined;
    if (!title && !description) {
        return new Response("no updates provided", { status: 400 });
    }

    const issue = await updateIssue(Number(id), {
        title,
        description,
    });

    return Response.json(issue);
}
