import { IssueCommentCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createIssueComment,
    getAttachableAttachments,
    getIssueByID,
    getIssueOrganisationId,
    getOrganisationMemberRole,
    linkAttachmentsToIssueComment,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueCommentCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueCommentCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { issueId, body, attachmentIds = [] } = parsed.data;

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

    const dedupedAttachmentIds = [...new Set(attachmentIds)];
    if (dedupedAttachmentIds.length > 0) {
        const attachable = await getAttachableAttachments(dedupedAttachmentIds, organisationId, req.userId);
        if (attachable.length !== dedupedAttachmentIds.length) {
            return errorResponse("one or more attachments are invalid", "INVALID_ATTACHMENTS", 400);
        }
    }

    const comment = await createIssueComment(issueId, req.userId, body);
    if (!comment) {
        return errorResponse("failed to create comment", "COMMENT_CREATE_FAILED", 500);
    }

    if (dedupedAttachmentIds.length > 0) {
        await linkAttachmentsToIssueComment(comment.id, dedupedAttachmentIds);
    }

    return Response.json(comment);
}
