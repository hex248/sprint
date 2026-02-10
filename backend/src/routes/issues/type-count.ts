import { IssuesTypeCountQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getIssueTypeCountByOrganisation, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function issuesTypeCount(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, IssuesTypeCountQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, type } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    const result = await getIssueTypeCountByOrganisation(organisationId, type);

    return Response.json(result);
}
