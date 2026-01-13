import { IssuesStatusCountQuerySchema } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getIssueStatusCountByOrganisation, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function issuesStatusCount(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, IssuesStatusCountQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, status } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    const result = await getIssueStatusCountByOrganisation(organisationId, status);

    return Response.json(result);
}
