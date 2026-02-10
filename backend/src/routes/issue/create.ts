import { IssueCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createIssue,
    getAttachableAttachments,
    // FREE_TIER_LIMITS,
    // getOrganisationIssueCount,
    getOrganisationMemberRole,
    getProjectByID,
    // getUserById,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const {
        projectId,
        title,
        description = "",
        status,
        assigneeIds,
        sprintId,
        type,
        attachmentIds = [],
    } = parsed.data;

    const project = await getProjectByID(projectId);
    if (!project) {
        return errorResponse(`project not found: ${projectId}`, "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse(
            "only organisation owners and admins can create issues",
            "PERMISSION_DENIED",
            403,
        );
    }

    // check free tier limit
    // const user = await getUserById(req.userId);
    // if (user && user.plan !== "pro") {
    //     const issueCount = await getOrganisationIssueCount(project.organisationId);
    //     if (issueCount >= FREE_TIER_LIMITS.issuesPerOrganisation) {
    //         return errorResponse(
    //             `free tier is limited to ${FREE_TIER_LIMITS.issuesPerOrganisation} issues per organisation. upgrade to pro for unlimited issues.`,
    //             "FREE_TIER_ISSUE_LIMIT",
    //             403,
    //         );
    //     }
    // }

    const dedupedAttachmentIds = [...new Set(attachmentIds)];
    if (dedupedAttachmentIds.length > 0) {
        const attachable = await getAttachableAttachments(
            dedupedAttachmentIds,
            project.organisationId,
            req.userId,
        );
        if (attachable.length !== dedupedAttachmentIds.length) {
            return errorResponse("one or more attachments are invalid", "INVALID_ATTACHMENTS", 400);
        }
    }

    const issue = await createIssue(
        project.id,
        title,
        description,
        req.userId,
        status,
        type,
        sprintId ?? undefined,
        assigneeIds,
        dedupedAttachmentIds,
    );

    return Response.json(issue);
}
