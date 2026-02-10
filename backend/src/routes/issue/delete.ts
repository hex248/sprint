import { IssueDeleteRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { deleteIssue, getIssueByID, getOrganisationMemberRole, getProjectByID } from "../../db/queries";
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

    await deleteIssue(id);

    return Response.json({ success: true });
}
