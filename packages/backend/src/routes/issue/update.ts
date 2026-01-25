import { type IssueRecord, IssueUpdateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getIssueByID,
    getOrganisationMemberRole,
    getProjectByID,
    setIssueAssignees,
    updateIssue,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issueUpdate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssueUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, title, description, type, status, assigneeIds, sprintId } = parsed.data;

    // check that at least one field is being updated
    if (
        title === undefined &&
        description === undefined &&
        type === undefined &&
        status === undefined &&
        assigneeIds === undefined &&
        sprintId === undefined
    ) {
        return errorResponse("no updates provided", "NO_UPDATES", 400);
    }

    const hasIssueFieldUpdates =
        title !== undefined ||
        description !== undefined ||
        type !== undefined ||
        status !== undefined ||
        sprintId !== undefined;

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
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse("only organisation owners and admins can edit issues", "PERMISSION_DENIED", 403);
    }

    let issue: IssueRecord | undefined = existingIssue;
    if (hasIssueFieldUpdates) {
        [issue] = await updateIssue(id, {
            title,
            description,
            sprintId,
            type,
            status,
        });
    }

    if (assigneeIds !== undefined) {
        await setIssueAssignees(id, assigneeIds ?? []);
    }

    return Response.json(issue);
}
