import { IssueCommentDeleteRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    deleteIssueComment,
    getIssueCommentById,
    getIssueOrganisationId,
    getOrganisationMemberRole,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueCommentDelete(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueCommentDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const comment = await getIssueCommentById(id);
    if (!comment) {
        return errorResponse(`comment not found: ${id}`, "COMMENT_NOT_FOUND", 404);
    }

    if (comment.userId !== req.userId) {
        return errorResponse("forbidden", "FORBIDDEN", 403);
    }

    const organisationId = await getIssueOrganisationId(comment.issueId);
    if (!organisationId) {
        return errorResponse("organisation not found", "ORG_NOT_FOUND", 404);
    }

    const member = await getOrganisationMemberRole(organisationId, req.userId);
    if (!member) {
        return errorResponse("forbidden", "FORBIDDEN", 403);
    }

    await deleteIssueComment(id);

    return Response.json({ success: true });
}
