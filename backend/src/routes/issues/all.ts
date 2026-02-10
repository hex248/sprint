import type { BunRequest } from "bun";
import { getIssues } from "../../db/queries";

export default async function issuesAll(_req: BunRequest) {
    const issues = await getIssues();

    return Response.json(issues);
}
