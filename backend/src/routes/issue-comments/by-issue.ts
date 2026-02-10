import { IssueCommentsByIssueQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getIssueByID,
    getIssueCommentsByIssueId,
    getIssueOrganisationId,
    getOrganisationMemberRole,
} from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function issueCommentsByIssue(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, IssueCommentsByIssueQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const issue = await getIssueByID(issueId);
    if (!issue) {
        return errorResponse(`issue not found: ${issueId}`, "ISSUE_NOT_FOUND", 404);
    }

    const organisationId = await getIssueOrganisationId(issueId);
    if (!organisationId) {
        return errorResponse(`organisation not found for issue ${issueId}`, "ORG_NOT_FOUND", 404);
    }

    const member = await getOrganisationMemberRole(organisationId, req.userId);
    if (!member) {
        return errorResponse("forbidden", "FORBIDDEN", 403);
    }

    const comments = await getIssueCommentsByIssueId(issueId);
    return Response.json(comments);
}
