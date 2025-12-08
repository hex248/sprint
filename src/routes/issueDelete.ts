import type { BunRequest } from "bun";
import { deleteIssue } from "../db/queries.js";

// /issue/delete?id=1
export default async function issueDelete(req: BunRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return new Response("missing issue id", { status: 400 });
    }

    const result = await deleteIssue(Number(id));
    if (result.rowCount === 0) {
        return new Response(`no issue with id ${id} found`, { status: 404 });
    }

    return new Response(`issue with id ${id} deleted`, { status: 200 });
}
