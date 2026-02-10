import { IssueDeleteRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    deleteAttachmentsByIds,
    deleteIssue,
    getAttachmentsByIds,
    getAttachmentsByIssueId,
    getIssueByID,
    getIssueCommentAttachmentIdsByIssueId,
    getOrganisationMemberRole,
    getProjectByID,
} from "../../db/queries";
import { deleteFromS3 } from "../../s3";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueDelete(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const issue = await getIssueByID(id);
    if (!issue) {
        return errorResponse(`no issue with id ${id} found`, "ISSUE_NOT_FOUND", 404);
    }

    const project = await getProjectByID(issue.projectId);
    if (!project) {
        return errorResponse("project not found", "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse(
            "only organisation owners and admins can delete issues",
            "PERMISSION_DENIED",
            403,
        );
    }

    const issueAttachments = await getAttachmentsByIssueId(id);
    const issueCommentAttachmentIds = await getIssueCommentAttachmentIdsByIssueId(id);
    const issueCommentAttachments = await getAttachmentsByIds(issueCommentAttachmentIds);

    const allAttachments = [...issueAttachments, ...issueCommentAttachments];
    if (allAttachments.length > 0) {
        try {
            await Promise.all(allAttachments.map((attachment) => deleteFromS3(attachment.s3Key)));
        } catch (error) {
            console.error("failed to delete issue attachments from s3:", error);
            return errorResponse("failed to delete attachments", "ATTACHMENT_DELETE_FAILED", 500);
        }

        await deleteAttachmentsByIds(allAttachments.map((attachment) => attachment.id));
    }

    await deleteIssue(id);

    return Response.json({ success: true });
}
