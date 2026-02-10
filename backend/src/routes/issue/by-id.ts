import { IssueByIdQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getIssueOrganisationId, getIssueWithUsersById, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function issueById(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, IssueByIdQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const organisationId = await getIssueOrganisationId(issueId);
    if (!organisationId) {
        return errorResponse(`organisation not found for issue ${issueId}`, "ORG_NOT_FOUND", 404);
    }

    const member = await getOrganisationMemberRole(organisationId, req.userId);
    if (!member) {
        return errorResponse("forbidden", "FORBIDDEN", 403);
    }

    const issue = await getIssueWithUsersById(issueId);
    if (!issue) {
        return errorResponse(`issue not found: ${issueId}`, "ISSUE_NOT_FOUND", 404);
    }

    return Response.json(issue);
}
