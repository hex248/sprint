import { IssuesReplaceStatusRequestSchema } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationMemberRole, replaceIssueStatus } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issuesReplaceStatus(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssuesReplaceStatusRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, oldStatus, newStatus } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
        return errorResponse("only admins and owners can replace statuses", "PERMISSION_DENIED", 403);
    }

    const result = await replaceIssueStatus(organisationId, oldStatus, newStatus);

    return Response.json(result);
}
