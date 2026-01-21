import { IssueCommentCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createIssueComment,
    getIssueByID,
    getIssueOrganisationId,
    getOrganisationMemberRole,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueCommentCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueCommentCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { issueId, body } = parsed.data;

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

    const comment = await createIssueComment(issueId, req.userId, body);
    return Response.json(comment);
}
