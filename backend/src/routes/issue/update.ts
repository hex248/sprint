import { type IssueRecord, IssueUpdateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    deleteAttachmentsByIds,
    getAttachableAttachments,
    getAttachmentsByIssueId,
    getIssueByID,
    getOrganisationMemberRole,
    getProjectByID,
    getSprintById,
    linkAttachmentsToIssue,
    setIssueAssignees,
    updateIssue,
} from "../../db/queries";
import { listRemoteBranches } from "../../git/list-remote-branches";
import { broadcastIssueChanged } from "../../realtime";
import { deleteFromS3 } from "../../s3";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueUpdate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const {
        id,
        title,
        description,
        type,
        status,
        gitBranch,
        assignees,
        assigneeIds,
        sprintId,
        attachmentIds,
    } = parsed.data;

    // check that at least one field is being updated
    if (
        title === undefined &&
        description === undefined &&
        type === undefined &&
        status === undefined &&
        gitBranch === undefined &&
        assignees === undefined &&
        assigneeIds === undefined &&
        sprintId === undefined &&
        attachmentIds === undefined
    ) {
        return errorResponse("no updates provided", "NO_UPDATES", 400);
    }

    const hasIssueFieldUpdates =
        title !== undefined ||
        description !== undefined ||
        type !== undefined ||
        status !== undefined ||
        sprintId !== undefined ||
        gitBranch !== undefined;

    const existingIssue = await getIssueByID(id);
    if (!existingIssue) {
        return errorResponse(`issue not found: ${id}`, "ISSUE_NOT_FOUND", 404);
    }

    const project = await getProjectByID(existingIssue.projectId);
    if (!project) {
        return errorResponse("project not found", "PROJECT_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(project.organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (sprintId != null) {
        const sprint = await getSprintById(sprintId);
        if (!sprint || sprint.projectId !== project.id) {
            return errorResponse("invalid sprint", "INVALID_SPRINT", 400);
        }
        if (!sprint.open) {
            return errorResponse("cannot assign issue to a closed sprint", "SPRINT_CLOSED", 400);
        }
    }

    let normalizedGitBranch: string | null | undefined;
    if (gitBranch !== undefined) {
        if (gitBranch == null) {
            normalizedGitBranch = null;
        } else {
            const trimmedBranch = gitBranch.trim();
            normalizedGitBranch = trimmedBranch.length > 0 ? trimmedBranch : null;
        }

        if (normalizedGitBranch) {
            const gitRemote = project.gitRemote?.trim();
            if (!gitRemote) {
                return errorResponse("git remote is not set for this project", "GIT_REMOTE_NOT_SET", 400);
            }

            const branchResult = await listRemoteBranches(gitRemote);
            if (!branchResult.ok) {
                return errorResponse(
                    `failed to fetch git branches: ${branchResult.reason}`,
                    "GIT_REMOTE_FETCH_FAILED",
                    400,
                );
            }

            if (!branchResult.branches.includes(normalizedGitBranch)) {
                return errorResponse(`invalid git branch: ${normalizedGitBranch}`, "INVALID_GIT_BRANCH", 400);
            }
        }
    }

    let issue: IssueRecord | undefined = existingIssue;
    if (hasIssueFieldUpdates) {
        [issue] = await updateIssue(id, {
            title,
            description,
            sprintId,
            type,
            status,
            gitBranch: normalizedGitBranch,
        });
    }

    if (assignees !== undefined) {
        await setIssueAssignees(id, assignees ?? []);
    } else if (assigneeIds !== undefined) {
        await setIssueAssignees(
            id,
            (assigneeIds ?? []).map((userId) => ({ userId, note: "" })),
        );
    }

    if (attachmentIds !== undefined) {
        const dedupedAttachmentIds = [...new Set(attachmentIds)];
        const currentAttachments = await getAttachmentsByIssueId(id);
        const currentIds = new Set(currentAttachments.map((attachment) => attachment.id));
        const nextIds = new Set(dedupedAttachmentIds);

        const toLink = dedupedAttachmentIds.filter((attachmentId) => !currentIds.has(attachmentId));
        if (toLink.length > 0) {
            const attachable = await getAttachableAttachments(toLink, project.organisationId, req.userId);
            if (attachable.length !== toLink.length) {
                return errorResponse("one or more attachments are invalid", "INVALID_ATTACHMENTS", 400);
            }

            await linkAttachmentsToIssue(id, toLink);
        }

        const toRemove = currentAttachments.filter((attachment) => !nextIds.has(attachment.id));
        if (toRemove.length > 0) {
            try {
                await Promise.all(toRemove.map((attachment) => deleteFromS3(attachment.s3Key)));
            } catch (error) {
                console.error("failed to delete issue attachments from s3:", error);
                return errorResponse("failed to delete attachments", "ATTACHMENT_DELETE_FAILED", 500);
            }

            await deleteAttachmentsByIds(toRemove.map((attachment) => attachment.id));
        }
    }

    broadcastIssueChanged({
        organisationId: project.organisationId,
        projectId: project.id,
        issueId: id,
        action: "updated",
        actorUserId: req.userId,
    });

    return Response.json(issue);
}
